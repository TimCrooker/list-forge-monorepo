import { ResearchGraphState } from '../research-graph.state';
import { PriceBand, DemandSignal } from '@listforge/core-types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

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
 * Calculate overall confidence from price bands and comp count
 */
function calculateOverallConfidence(priceBands: PriceBand[], compCount: number): number {
  if (compCount === 0) {
    return 0.1;
  }

  // Base confidence from comp count
  let confidence = Math.min(0.7, compCount / 20);

  // Boost confidence if price bands have high confidence
  const avgBandConfidence = priceBands.reduce((sum, band) => sum + band.confidence, 0) / priceBands.length;
  confidence = (confidence + avgBandConfidence) / 2;

  return Math.min(1.0, confidence);
}

/**
 * Calculate price node
 * Generates price bands and demand signals
 */
export async function calculatePriceNode(
  state: ResearchGraphState,
  config?: { configurable?: { llm?: BaseChatModel; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  // Filter to highly relevant comps
  const relevantComps = state.comps.filter((c) => c.relevanceScore >= 0.7);

  if (relevantComps.length === 0) {
    return {
      priceBands: [],
      demandSignals: [],
      overallConfidence: 0.1,
    };
  }

  // Calculate statistics
  const prices = relevantComps
    .filter((c) => c.price != null && c.price > 0)
    .map((c) => c.price!);

  const stats = calculatePriceStats(prices);

  // LLM reasoning for price bands
  const response = await llm.invoke([
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
  ]);

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

  // Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(priceBands, relevantComps.length);

  return {
    priceBands,
    demandSignals,
    overallConfidence,
    messages: [response],
  };
}
