import { ResearchGraphState } from '../research-graph.state';
import {
  PriceBand,
  DemandSignal,
  TieredPricingAnalysis,
  PricingConfidenceTier,
  PRICING_CONFIDENCE_THRESHOLDS,
  PRICING_CONFIDENCE_LABELS,
  CompMatchType,
  COMP_MATCH_TYPE_WEIGHTS,
} from '@listforge/core-types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { withTimeout, LLM_CALL_TIMEOUT_MS } from '../../../utils/timeout';

/**
 * Tools interface for price calculation
 */
export interface PriceCalculationTools {
  llm: BaseChatModel;
}

const PRICING_PROMPT = `You are a pricing expert. Based on the comparable sales data provided, determine optimal price bands for selling this item.

Consider:
- Recent sale prices (weight more recent higher)
- Condition differences between comps and our item
- Market velocity (how fast similar items sell)
- Seasonal factors if applicable
- Platform fees and shipping considerations

Provide three price bands:
1. **Floor**: Minimum viable price (quick sale, still profitable)
2. **Target**: Optimal price balancing speed and margin
3. **Ceiling**: Maximum realistic price (patient seller, best condition)

For each band, include:
- Amount in USD
- Confidence score (0-1)
- Reasoning (1-2 sentences)

Respond in JSON:
{
  "priceBands": [
    { "label": "floor", "amount": number, "currency": "USD", "confidence": number, "reasoning": string },
    { "label": "target", "amount": number, "currency": "USD", "confidence": number, "reasoning": string },
    { "label": "ceiling", "amount": number, "currency": "USD", "confidence": number, "reasoning": string }
  ]
}`;

/**
 * Calculate price statistics from comps
 */
function calculatePriceStats(prices: number[]): {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
} {
  if (prices.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0, count: 0 };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return { min, max, avg, median, count: prices.length };
}

/**
 * Calculate demand signals from comps
 */
function calculateDemandSignals(comps: ResearchGraphState['comps']): DemandSignal[] {
  const signals: DemandSignal[] = [];

  // Count active vs sold
  const soldComps = comps.filter((c) => c.type === 'sold_listing');
  const activeComps = comps.filter((c) => c.type === 'active_listing');

  if (soldComps.length > 0) {
    // Calculate sell-through rate (sold / (sold + active))
    const total = soldComps.length + activeComps.length;
    const sellThroughRate = total > 0 ? soldComps.length / total : 0;

    signals.push({
      metric: 'sell_through_rate',
      value: sellThroughRate,
      unit: 'ratio',
      period: '30d',
      source: 'ebay',
    });
  }

  // Active competition
  signals.push({
    metric: 'active_competition',
    value: activeComps.length,
    unit: 'listings',
    source: 'ebay',
  });

  return signals;
}

/**
 * Slice 5: Determine pricing confidence tier based on validated comp count
 * Thresholds: 0-2 = insufficient, 3-4 = low, 5-9 = recommended, 10+ = high
 */
function determinePricingConfidenceTier(validatedCompCount: number): PricingConfidenceTier {
  if (validatedCompCount >= PRICING_CONFIDENCE_THRESHOLDS.high) {
    return 'high';
  } else if (validatedCompCount >= PRICING_CONFIDENCE_THRESHOLDS.recommended) {
    return 'recommended';
  } else if (validatedCompCount >= PRICING_CONFIDENCE_THRESHOLDS.low) {
    return 'low';
  }
  return 'insufficient';
}

/**
 * Calculate overall confidence from validated comps and their match types
 * Slice 5: Weighted by comp quality (match type) and count
 */
function calculateOverallConfidence(
  validatedComps: ResearchGraphState['comps'],
  priceBands: PriceBand[],
): number {
  if (validatedComps.length === 0) {
    return 0.1;
  }

  // Calculate average weighted confidence based on match types
  let weightedSum = 0;
  let totalWeight = 0;

  for (const comp of validatedComps) {
    const matchType = comp.matchType || 'GENERIC_KEYWORD';
    const baseWeight = COMP_MATCH_TYPE_WEIGHTS[matchType] || 0.30;
    const relevanceWeight = comp.relevanceScore || 0.5;

    // Combine match type confidence with relevance score
    const compWeight = (baseWeight + relevanceWeight) / 2;
    weightedSum += compWeight;
    totalWeight += 1;
  }

  const avgCompConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Factor in comp count (diminishing returns after 10)
  const countFactor = Math.min(1.0, validatedComps.length / 10);

  // Factor in price band confidence
  const avgBandConfidence = priceBands.length > 0
    ? priceBands.reduce((sum, band) => sum + band.confidence, 0) / priceBands.length
    : 0.5;

  // Weighted average: 40% comp quality, 30% count factor, 30% price band confidence
  const overallConfidence = (avgCompConfidence * 0.4) + (countFactor * 0.3) + (avgBandConfidence * 0.3);

  return Math.min(1.0, Math.max(0.1, overallConfidence));
}

/**
 * Count comps by match type for breakdown
 */
function countCompsByMatchType(
  comps: ResearchGraphState['comps'],
): Record<CompMatchType, number> {
  const counts: Record<CompMatchType, number> = {
    UPC_EXACT: 0,
    ASIN_EXACT: 0,
    EBAY_ITEM_ID: 0,
    BRAND_MODEL_IMAGE: 0,
    BRAND_MODEL_KEYWORD: 0,
    IMAGE_SIMILARITY: 0,
    GENERIC_KEYWORD: 0,
  };

  for (const comp of comps) {
    const matchType = comp.matchType || 'GENERIC_KEYWORD';
    if (matchType in counts) {
      counts[matchType]++;
    }
  }

  return counts;
}

/**
 * Minimum relevance score for a comp to be considered "validated"
 * Slice 5: Used for tiered confidence calculation
 */
const VALIDATED_COMP_THRESHOLD = 0.60;

/**
 * Calculate price node - Slice 5 Enhanced
 * Generates price bands, demand signals, and tiered pricing analysis
 */
export async function calculatePriceNode(
  state: ResearchGraphState,
  config?: { configurable?: { llm?: BaseChatModel; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  // Slice 5: Filter to validated comps (score >= 0.60) for tiered confidence
  const validatedComps = state.comps.filter((c) => c.relevanceScore >= VALIDATED_COMP_THRESHOLD);

  // For pricing calculation, use higher threshold (0.70) for quality
  const relevantComps = state.comps.filter((c) => c.relevanceScore >= 0.7);

  if (relevantComps.length === 0) {
    // Slice 5: Return insufficient tier when no relevant comps
    const tieredPricing: TieredPricingAnalysis = {
      suggestedPrice: 0,
      priceRange: { low: 0, high: 0 },
      currency: 'USD',
      confidenceTier: 'insufficient',
      confidence: 0.1,
      validatedCompCount: validatedComps.length,
      averageCompConfidence: 0,
      compsByMatchType: countCompsByMatchType(validatedComps),
      strategy: 'market_value',
      reasoning: PRICING_CONFIDENCE_LABELS['insufficient'].description,
    };

    return {
      priceBands: [],
      demandSignals: [],
      overallConfidence: 0.1,
      tieredPricing,
    };
  }

  // Calculate statistics
  const prices = relevantComps
    .filter((c) => c.price != null && c.price > 0)
    .map((c) => c.price!);

  const stats = calculatePriceStats(prices);

  // LLM reasoning for price bands - PERFORMANCE FIX: Wrapped with timeout
  const response = await withTimeout(
    () => llm.invoke([
      new SystemMessage(PRICING_PROMPT),
      new HumanMessage(
        JSON.stringify(
          {
            item: {
              title: state.item?.title,
              condition: state.item?.condition,
            },
            productId: state.productIdentification,
            comps: relevantComps.slice(0, 10).map((c) => ({
              title: c.title,
              price: c.price,
              condition: c.condition,
              relevanceScore: c.relevanceScore,
            })),
            stats,
          },
          null,
          2,
        ),
      ),
    ]),
    LLM_CALL_TIMEOUT_MS,
    'Price calculation LLM call timed out',
  );

  // Parse price bands
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  let priceBands: PriceBand[] = [];
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      priceBands = (parsed.priceBands || []).map((band: any) => ({
        label: band.label,
        amount: band.amount,
        currency: band.currency || 'USD',
        confidence: band.confidence || 0.5,
        reasoning: band.reasoning || '',
      }));
    }
  } catch (error) {
    // Fallback: generate simple price bands from stats
    if (stats.count > 0) {
      priceBands = [
        {
          label: 'floor',
          amount: Math.max(0, stats.min * 0.9),
          currency: 'USD',
          confidence: 0.6,
          reasoning: `Based on minimum comp price of $${stats.min.toFixed(2)}`,
        },
        {
          label: 'target',
          amount: stats.median,
          currency: 'USD',
          confidence: 0.7,
          reasoning: `Based on median comp price of $${stats.median.toFixed(2)}`,
        },
        {
          label: 'ceiling',
          amount: stats.max * 1.1,
          currency: 'USD',
          confidence: 0.6,
          reasoning: `Based on maximum comp price of $${stats.max.toFixed(2)}`,
        },
      ];
    }
  }

  // Calculate demand signals
  const demandSignals = calculateDemandSignals(state.comps);

  // Slice 5: Calculate tiered pricing analysis
  const overallConfidence = calculateOverallConfidence(validatedComps, priceBands);
  const confidenceTier = determinePricingConfidenceTier(validatedComps.length);
  const compsByMatchType = countCompsByMatchType(validatedComps);

  // Calculate average comp confidence
  const avgCompConfidence = validatedComps.length > 0
    ? validatedComps.reduce((sum, c) => sum + c.relevanceScore, 0) / validatedComps.length
    : 0;

  // Find suggested price (target band or median fallback)
  const targetBand = priceBands.find((b) => b.label === 'target');
  const suggestedPrice = targetBand?.amount || stats.median || 0;

  // Build tiered pricing analysis
  const tieredPricing: TieredPricingAnalysis = {
    suggestedPrice,
    priceRange: {
      low: priceBands.find((b) => b.label === 'floor')?.amount || stats.min || 0,
      high: priceBands.find((b) => b.label === 'ceiling')?.amount || stats.max || 0,
    },
    currency: 'USD',
    confidenceTier,
    confidence: overallConfidence,
    validatedCompCount: validatedComps.length,
    averageCompConfidence: avgCompConfidence,
    compsByMatchType,
    strategy: 'market_value', // Default strategy
    reasoning: generatePricingReasoning(confidenceTier, validatedComps.length, compsByMatchType),
  };

  return {
    priceBands,
    demandSignals,
    overallConfidence,
    tieredPricing,
    messages: [response],
  };
}

/**
 * Generate human-readable reasoning for the pricing recommendation
 */
function generatePricingReasoning(
  tier: PricingConfidenceTier,
  compCount: number,
  compsByMatchType: Record<CompMatchType, number>,
): string {
  const tierLabel = PRICING_CONFIDENCE_LABELS[tier].label;
  const tierDesc = PRICING_CONFIDENCE_LABELS[tier].description;

  // Count high-quality matches
  const highQualityCount = compsByMatchType.UPC_EXACT +
    compsByMatchType.ASIN_EXACT +
    compsByMatchType.EBAY_ITEM_ID +
    compsByMatchType.BRAND_MODEL_IMAGE;

  let reasoning = `${tierLabel}: ${tierDesc} `;
  reasoning += `Based on ${compCount} validated comparable${compCount !== 1 ? 's' : ''}.`;

  if (highQualityCount > 0) {
    reasoning += ` ${highQualityCount} high-confidence match${highQualityCount !== 1 ? 'es' : ''} (UPC/ASIN/image verified).`;
  }

  return reasoning;
}
