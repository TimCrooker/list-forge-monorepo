import { ResearchGraphState } from '../research-graph.state';
import {
  ResearchEvidenceRecord,
  CompValidation,
  KeepaProductData,
  COMP_MATCH_TYPE_WEIGHTS,
  CompMatchType,
  CategoryId,
} from '@listforge/core-types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import {
  validateAllComps,
  getValidationSummary,
  ItemValidationContext,
} from '../tools/validate-comp.tool';
import { logNodeWarn } from '../../../utils/node-logger';
import { withSpan, ResearchMetrics, startTiming } from '../../../utils/telemetry';
import { PRICING_THRESHOLDS, VALIDATION_SCORING } from '../../../config/research.constants';
import { getMatchBoosts, CATEGORY_ATTRIBUTE_WEIGHTS } from '../../../data/category-attribute-weights';

/**
 * Derive CategoryId from available state data
 * Slice 5: Helper to extract category for category-aware scoring
 *
 * Tries to map available category info to our internal CategoryId:
 * 1. Check mediaAnalysis.category if it's a valid CategoryId
 * 2. Check productIdentification.category array for known keywords
 * 3. Check item title for category keywords
 * 4. Falls back to undefined (uses general weights)
 */
function deriveCategoryId(state: ResearchGraphState): CategoryId | undefined {
  const validCategoryIds = Object.keys(CATEGORY_ATTRIBUTE_WEIGHTS) as CategoryId[];

  // 1. Check mediaAnalysis category if it's directly a valid CategoryId
  const mediaCategory = state.mediaAnalysis?.category?.toLowerCase();
  if (mediaCategory && validCategoryIds.includes(mediaCategory as CategoryId)) {
    return mediaCategory as CategoryId;
  }

  // 2. Check productIdentification.category array for keyword matches
  const productCategories = state.productIdentification?.category || [];
  for (const cat of productCategories) {
    const catLower = cat.toLowerCase();
    // Direct match
    if (validCategoryIds.includes(catLower as CategoryId)) {
      return catLower as CategoryId;
    }
    // Keyword mapping
    if (catLower.includes('sneaker') || catLower.includes('shoe') || catLower.includes('footwear')) {
      return 'sneakers';
    }
    if (catLower.includes('handbag') || catLower.includes('purse') || catLower.includes('luxury bag')) {
      return 'luxury_handbags';
    }
    if (catLower.includes('watch') || catLower.includes('timepiece')) {
      return 'watches';
    }
    if (catLower.includes('phone') || catLower.includes('smartphone') || catLower.includes('iphone')) {
      return 'electronics_phones';
    }
    if (catLower.includes('gaming') || catLower.includes('console') || catLower.includes('playstation') || catLower.includes('xbox')) {
      return 'electronics_gaming';
    }
    if (catLower.includes('trading card') || catLower.includes('pokemon') || catLower.includes('sports card')) {
      return 'trading_cards';
    }
    if (catLower.includes('denim') || catLower.includes('jeans') || catLower.includes('levi')) {
      return 'vintage_denim';
    }
    if (catLower.includes('designer') || catLower.includes('clothing') || catLower.includes('apparel')) {
      return 'designer_clothing';
    }
    if (catLower.includes('audio') || catLower.includes('speaker') || catLower.includes('headphone')) {
      return 'audio_equipment';
    }
  }

  // 3. Check item title for category keywords
  const title = state.item?.title?.toLowerCase() || '';
  if (title.includes('jordan') || title.includes('nike') || title.includes('yeezy') || title.includes('sneaker')) {
    return 'sneakers';
  }
  if (title.includes('louis vuitton') || title.includes('gucci') || title.includes('chanel') || title.includes('handbag')) {
    return 'luxury_handbags';
  }
  if (title.includes('rolex') || title.includes('omega') || title.includes('watch')) {
    return 'watches';
  }
  if (title.includes('iphone') || title.includes('samsung') || title.includes('pixel')) {
    return 'electronics_phones';
  }
  if (title.includes('ps5') || title.includes('xbox') || title.includes('nintendo')) {
    return 'electronics_gaming';
  }
  if (title.includes('psa') || title.includes('bgs') || title.includes('pokemon') || title.includes('trading card')) {
    return 'trading_cards';
  }

  // 4. No match - return undefined to use general weights
  return undefined;
}

/**
 * Image comparison result (from ImageComparisonService)
 */
export interface ImageComparisonResult {
  similarityScore: number;
  isSameProduct: boolean;
  reasoning: string;
  cached: boolean;
}

/**
 * Tools interface for comp analysis
 */
export interface CompAnalysisTools {
  llm: BaseChatModel;
  getKeepaData?: (params: { asins: string[] }) => Promise<Record<string, KeepaProductData>>;
  /** Slice 4: Image comparison for keyword comp validation */
  compareImages?: (
    itemImages: string[],
    compImages: string[],
  ) => Promise<ImageComparisonResult>;
}

/**
 * Score comp relevance using rule-based heuristics with match-type base scoring
 *
 * Slice 3 Enhancement: Uses matchType as the base score instead of flat 0.5
 * This ensures comps found via UPC/ASIN have higher inherent confidence than keyword searches.
 *
 * Slice 5 Enhancement: Uses category-specific boosts from category-attribute-weights.ts
 * Different categories weight different attributes:
 * - Sneakers: higher model boost (0.20) for colorway importance
 * - Watches: higher model boost (0.25) for reference number importance
 * - Trading cards: higher condition boost (0.30) for grade importance
 *
 * Match Type Base Scores (from COMP_MATCH_TYPE_WEIGHTS):
 * - UPC_EXACT: 0.95 (nearly certain match)
 * - ASIN_EXACT: 0.90 (very high confidence)
 * - EBAY_ITEM_ID: 0.90 (direct reference)
 * - BRAND_MODEL_IMAGE: 0.85 (visually verified)
 * - BRAND_MODEL_KEYWORD: 0.50 (keyword-only, needs validation)
 * - IMAGE_SIMILARITY: 0.65 (visual match, no text verification)
 * - GENERIC_KEYWORD: 0.30 (lowest confidence, broad search)
 *
 * Additional category-aware boosts applied for brand/model/condition matches.
 *
 * @param comps - Comparable listings to score
 * @param item - Item being researched
 * @param productId - Product identification data
 * @param categoryId - Optional category for category-specific boosts
 */
function scoreCompRelevanceHeuristic(
  comps: ResearchEvidenceRecord[],
  item: ResearchGraphState['item'],
  productId: ResearchGraphState['productIdentification'],
  categoryId?: CategoryId,
): ResearchEvidenceRecord[] {
  if (comps.length === 0) {
    return [];
  }

  // Slice 5: Get category-specific match boosts
  const boosts = getMatchBoosts(categoryId);

  return comps.map((comp) => {
    // Slice 3: Use matchType as base score (default to GENERIC_KEYWORD if not set)
    const matchType: CompMatchType = comp.matchType || 'GENERIC_KEYWORD';
    let score = comp.baseConfidence ?? COMP_MATCH_TYPE_WEIGHTS[matchType];

    const titleLower = comp.title.toLowerCase();
    const brand = productId?.brand?.toLowerCase();
    const model = productId?.model?.toLowerCase();

    // For high-confidence match types (UPC, ASIN), boosts are smaller since base is already high
    // For low-confidence match types (keyword), boosts matter more
    const boostMultiplier = matchType === 'UPC_EXACT' || matchType === 'ASIN_EXACT' || matchType === 'EBAY_ITEM_ID'
      ? 0.5 // Reduced boosts for already-confident matches
      : 1.0; // Full boosts for lower-confidence matches

    // Slice 5: Use category-specific boosts instead of hardcoded values
    // Boost for brand match (category-specific, e.g., 0.15 for sneakers, 0.20 for designer)
    if (brand && titleLower.includes(brand)) {
      score += boosts.brand * boostMultiplier;
    }

    // Boost for model match (category-specific, e.g., 0.20 for sneakers, 0.25 for watches)
    if (model && titleLower.includes(model)) {
      score += boosts.model * boostMultiplier;
    }

    // Boost for condition match (category-specific, e.g., 0.10 for sneakers, 0.30 for cards)
    if (item?.condition && comp.condition === item.condition) {
      score += boosts.condition * boostMultiplier;
    }

    // Boost for variant match (colorway for sneakers, storage for phones, etc.)
    // Slice 5: Use category-specific variant boost
    if (brand && model && titleLower.includes(brand) && titleLower.includes(model)) {
      score += boosts.variant * boostMultiplier;
    }

    return {
      ...comp,
      relevanceScore: Math.min(1.0, score),
    };
  });
}

/**
 * Build item validation context from graph state
 */
function buildItemContext(state: ResearchGraphState): ItemValidationContext {
  // Extract variant info from attributes if available
  const attributes = state.item?.attributes || [];
  const getAttr = (key: string): string | undefined => {
    const attr = attributes.find((a) => a.key.toLowerCase() === key.toLowerCase());
    return attr?.value;
  };

  // Also check media analysis for variant info (Slice 2)
  const mediaAnalysis = state.mediaAnalysis;

  return {
    brand: state.productIdentification?.brand || mediaAnalysis?.brand,
    model: state.productIdentification?.model || mediaAnalysis?.model,
    condition: state.item?.condition || mediaAnalysis?.condition || undefined,
    variant: {
      color: getAttr('color') || mediaAnalysis?.color || undefined,
      size: getAttr('size') || mediaAnalysis?.size || undefined,
      edition: getAttr('edition') || mediaAnalysis?.edition || undefined,
    },
  };
}

/**
 * Analyze comps node - Slice 3 Enhanced
 * Validates and scores comparable listings using structured validation
 */
export async function analyzeCompsNode(
  state: ResearchGraphState,
  config?: { configurable?: { llm?: BaseChatModel; activityLogger?: ResearchActivityLoggerService; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const timing = startTiming();

  return withSpan(
    'research.node.analyze_comps',
    'analyze_comps',
    async (span) => {
      // Add span attributes
      span.setAttribute('research.run_id', state.researchRunId);
      span.setAttribute('research.item_id', state.itemId);
      span.setAttribute('research.comps_count', state.comps.length);

      const llm = config?.configurable?.llm;
      const activityLogger = config?.configurable?.activityLogger;

      if (!llm) {
        throw new Error('LLM not provided in config.configurable.llm');
      }

      // Start comp analysis operation
      let operationId: string | undefined;
      if (activityLogger) {
        operationId = await activityLogger.startOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationType: 'comp_analysis',
          title: 'Validating Comparables',
          message: `Validating ${state.comps.length} comparable listings`,
          stepId: 'analyze_comps',
          data: { compsCount: state.comps.length },
        });
      }

      try {
        if (state.comps.length === 0) {
          if (activityLogger && operationId) {
            await activityLogger.completeOperation({
              researchRunId: state.researchRunId,
              itemId: state.itemId,
              operationId,
              operationType: 'comp_analysis',
              title: 'Validating Comparables',
              message: 'No comparables to analyze',
              stepId: 'analyze_comps',
              data: { compsCount: 0, skipped: true },
            });
          }
          ResearchMetrics.nodeDuration(timing.stop(), { node: 'analyze_comps' });
          return {};
        }

    // Step 1: Score relevance using fast rule-based heuristics
    // PERFORMANCE FIX: Removed LLM call, using heuristic scoring instead
    // Slice 5: Derive category for category-aware boosts
    const detectedCategoryId = deriveCategoryId(state);
    const scoredComps = scoreCompRelevanceHeuristic(
      state.comps,
      state.item,
      state.productIdentification,
      detectedCategoryId,
    );

    // Step 2: Enrich Amazon comps with Keepa data
    const tools = config?.configurable?.tools as CompAnalysisTools;
    let keepaData = state.keepaData || {};
    const amazonComps = scoredComps.filter((c) => c.source === 'amazon');

    if (amazonComps.length > 0 && tools?.getKeepaData) {
      // Extract ASINs from Amazon comps
      const asins = amazonComps
        .map((c) => c.extractedData?.asin as string)
        .filter((asin): asin is string => !!asin && !keepaData[asin]); // Only lookup new ASINs

      if (asins.length > 0) {
        // Emit progress for Keepa enrichment
        if (activityLogger && operationId) {
          await activityLogger.emitProgress({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationId,
            operationType: 'comp_analysis',
            message: `Fetching Keepa historical data for ${asins.length} Amazon product(s)...`,
            stepId: 'analyze_comps',
            data: { asins },
          });
        }

        try {
          const newKeepaData = await tools.getKeepaData({ asins });

          // Merge new data with existing
          keepaData = { ...keepaData, ...newKeepaData };

          // Enrich comp records with Keepa data
          for (const comp of scoredComps) {
            const asin = comp.extractedData?.asin as string;
            if (asin && keepaData[asin]) {
              const keepa = keepaData[asin];
              // Add Keepa data to extracted data
              comp.extractedData = {
                ...comp.extractedData,
                keepaSalesRank: keepa.salesRank,
                keepaBuyBoxPrice: keepa.buyBoxPrice ? keepa.buyBoxPrice / 100 : undefined, // Convert cents to dollars
                keepaNewOfferCount: keepa.newOfferCount,
                keepaUsedOfferCount: keepa.usedOfferCount,
                keepaReviewCount: keepa.reviewCount,
                keepaRating: keepa.rating ? keepa.rating / 10 : undefined, // Convert to 0-5 scale
                keepaLastUpdate: keepa.lastUpdate,
                hasKeepaHistory: keepa.priceHistory?.new?.length > 0,
              };
            }
          }
        } catch (error) {
          // Don't fail analysis if Keepa fails - just log and continue
          logNodeWarn('analyze-comps', 'Keepa enrichment failed', { error });
        }
      }
    }

    // Step 2.5: Image Cross-Validation for Keyword Comps (Slice 4)
    // Validate keyword-matched comps by comparing images to upgrade/downgrade confidence
    const itemImages = state.item?.media?.map((m) => m.url).filter((url): url is string => !!url) || [];

    if (itemImages.length > 0 && tools?.compareImages) {
      // Find keyword comps that need image validation
      const keywordComps = scoredComps.filter(
        (c) => c.matchType === 'BRAND_MODEL_KEYWORD' || c.matchType === 'GENERIC_KEYWORD',
      );

      if (keywordComps.length > 0) {
        // Emit progress for image validation
        if (activityLogger && operationId) {
          await activityLogger.emitProgress({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationId,
            operationType: 'comp_analysis',
            message: `Validating ${keywordComps.length} keyword match(es) via image comparison...`,
            stepId: 'analyze_comps',
            data: { keywordCompsCount: keywordComps.length },
          });
        }

        // Process image comparisons (limit concurrency to avoid rate limits)
        const imageValidationResults: Map<string, ImageComparisonResult> = new Map();
        const BATCH_SIZE = 5;

        for (let i = 0; i < keywordComps.length; i += BATCH_SIZE) {
          const batch = keywordComps.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async (comp) => {
              if (!comp.imageUrl) {
                return { id: comp.id, result: null };
              }
              try {
                const result = await tools.compareImages!(itemImages, [comp.imageUrl]);
                return { id: comp.id, result };
              } catch (error) {
                logNodeWarn('analyze-comps', `Image comparison failed for ${comp.id}`, { error });
                return { id: comp.id, result: null };
              }
            }),
          );

          for (const outcome of batchResults) {
            if (outcome.status === 'fulfilled' && outcome.value.result) {
              imageValidationResults.set(outcome.value.id, outcome.value.result);
            }
          }
        }

        // Apply image validation results to adjust matchType and confidence
        // Upgrade/downgrade based on image similarity score
        for (const comp of scoredComps) {
          const imageResult = imageValidationResults.get(comp.id);
          if (imageResult) {
            const { similarityScore, isSameProduct } = imageResult;

            // Store image comparison result in extractedData
            comp.extractedData = {
              ...comp.extractedData,
              imageValidation: {
                score: similarityScore,
                isSameProduct,
                reasoning: imageResult.reasoning,
              },
            };

            // Adjust matchType and confidence based on image similarity (per spec)
            if (isSameProduct && similarityScore >= 0.80) {
              // High image match: Upgrade to BRAND_MODEL_IMAGE (0.85 confidence)
              comp.matchType = 'BRAND_MODEL_IMAGE';
              comp.baseConfidence = COMP_MATCH_TYPE_WEIGHTS['BRAND_MODEL_IMAGE']; // 0.85
              comp.relevanceScore = 0.85; // Fixed confidence per spec
            } else if (similarityScore >= 0.50) {
              // Partial match: baseConfidence * imageScore (per spec)
              // For BRAND_MODEL_KEYWORD (0.50), this gives range 0.25-0.40
              const baseConf = comp.baseConfidence ?? COMP_MATCH_TYPE_WEIGHTS[comp.matchType || 'BRAND_MODEL_KEYWORD'];
              comp.relevanceScore = baseConf * similarityScore;
            } else {
              // Low image match: Downgrade to 0.20 (probably wrong product per spec)
              comp.relevanceScore = 0.20;
              // Mark as likely wrong product
              comp.extractedData = {
                ...comp.extractedData,
                imageValidationFailed: true,
              };
            }
          }
        }

        // Log summary of image validation
        const upgraded = scoredComps.filter((c) => c.matchType === 'BRAND_MODEL_IMAGE' && c.extractedData?.imageValidation).length;
        const downgraded = scoredComps.filter((c) => c.extractedData?.imageValidationFailed).length;

        if (activityLogger && operationId) {
          await activityLogger.emitProgress({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationId,
            operationType: 'comp_analysis',
            message: `Image validation: ${upgraded} upgraded, ${downgraded} flagged as potential mismatches`,
            stepId: 'analyze_comps',
            data: { upgraded, downgraded, validated: imageValidationResults.size },
          });
        }
      }
    }

    // Step 3: Emit progress for validation
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'comp_analysis',
        message: 'Running structured validation...',
        stepId: 'analyze_comps',
      });
    }

    // Step 4: Run structured validation (Slice 3)
    // Slice 5: Use derived category for category-aware validation weights
    const itemContext = buildItemContext(state);
    const validatedComps = validateAllComps(
      scoredComps,
      itemContext,
      state.productIdentification,
      {}, // Use default validation config
      detectedCategoryId,
    );

    // Step 5: Calculate validation summary
    const validationSummary = getValidationSummary(validatedComps);

    // Step 6: Context-dependent comp filtering (per spec)
    // Threshold for "validated" comps
    const VALIDATED_THRESHOLD = 0.60;
    const MARGINAL_THRESHOLD = 0.25;
    const MARGINAL_DISCOUNT = 0.5; // 50% discount for marginal comps when scarce

    // First, update relevance scores to use validation score where available
    const compsWithFinalScores = validatedComps.map((c) => ({
      ...c,
      relevanceScore: c.validation?.overallScore ?? c.relevanceScore,
    }));

    // Count validated comps (score >= 0.60)
    const validatedCount = compsWithFinalScores.filter((c) => c.relevanceScore >= VALIDATED_THRESHOLD).length;

    let finalComps: ResearchEvidenceRecord[];

    if (validatedCount >= 5) {
      // We have enough good comps - be strict, discard lower-scored comps
      finalComps = compsWithFinalScores.filter((c) => c.relevanceScore >= VALIDATED_THRESHOLD);
    } else {
      // Comps are scarce - include marginal comps with 0.5x discount
      const goodComps = compsWithFinalScores.filter((c) => c.relevanceScore >= VALIDATED_THRESHOLD);

      const marginalComps = compsWithFinalScores
        .filter((c) => c.relevanceScore >= MARGINAL_THRESHOLD && c.relevanceScore < VALIDATED_THRESHOLD)
        .map((c) => ({
          ...c,
          relevanceScore: c.relevanceScore * MARGINAL_DISCOUNT, // Heavy discount
          extractedData: {
            ...c.extractedData,
            marginalCompDiscounted: true, // Flag for UI
          },
        }));

      finalComps = [...goodComps, ...marginalComps];
    }

    // Sort by relevance score descending
    const updatedComps = finalComps.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Calculate score distribution based on validation
    const scoreDistribution = {
      high: updatedComps.filter((c) => c.relevanceScore >= PRICING_THRESHOLDS.MIN_RELEVANCE_SCORE).length,
      medium: updatedComps.filter((c) => c.relevanceScore >= PRICING_THRESHOLDS.MIN_COMBINED_SCORE && c.relevanceScore < PRICING_THRESHOLDS.MIN_RELEVANCE_SCORE).length,
      low: validatedComps.filter((c) => !finalComps.includes(c)).length,
    };

    // Prepare top comps with validation details for UI
    const topCompsWithValidation = updatedComps.slice(0, 5).map((c) => ({
      id: c.id,
      title: c.title,
      price: c.price,
      condition: c.condition,
      relevanceScore: c.relevanceScore,
      validation: c.validation ? {
        isValid: c.validation.isValid,
        overallScore: c.validation.overallScore,
        criteria: {
          brand: c.validation.criteria.brandMatch.matches,
          model: c.validation.criteria.modelMatch.matches,
          condition: c.validation.criteria.conditionMatch.matches,
          recency: c.validation.criteria.recency.valid,
          variant: c.validation.criteria.variantMatch.matches,
        },
        reasoning: c.validation.reasoning,
      } : undefined,
    }));

    // Complete the operation with rich validation data
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'comp_analysis',
        title: 'Validating Comparables',
        message: `${validationSummary.passed} validated, ${validationSummary.failed} filtered out`,
        stepId: 'analyze_comps',
        data: {
          totalScored: validatedComps.length,
          relevantCount: updatedComps.length,
          scoreDistribution,
          validated: {
            passed: validationSummary.passed,
            failed: validationSummary.failed,
          },
          criteriaBreakdown: validationSummary.criteriaBreakdown,
          topComps: topCompsWithValidation,
          // Item context used for validation
          itemContext: {
            brand: itemContext.brand,
            model: itemContext.model,
            condition: itemContext.condition,
          },
        },
      });
    }

        // Record metrics
        ResearchMetrics.nodeDuration(timing.stop(), { node: 'analyze_comps' });
        ResearchMetrics.nodeExecuted({ node: 'analyze_comps', status: 'success' });
        ResearchMetrics.compsFound(updatedComps.length, { source: 'all', type: 'sold' });

        // Calculate source distribution for metrics
        const ebayComps = updatedComps.filter((c) => c.source === 'ebay').length;
        const amazonCompsCount = updatedComps.filter((c) => c.source === 'amazon').length;
        const keepaEnrichedCount = updatedComps.filter((c) => c.extractedData?.hasKeepaHistory).length;

        // Record additional metrics
        if (ebayComps > 0) ResearchMetrics.compsFound(ebayComps, { source: 'ebay', type: 'active' });
        if (amazonCompsCount > 0) ResearchMetrics.compsFound(amazonCompsCount, { source: 'amazon', type: 'active' });

        return {
          comps: updatedComps,
          keepaData: Object.keys(keepaData).length > 0 ? keepaData : undefined,
        };
      } catch (error) {
        if (activityLogger && operationId) {
          await activityLogger.failOperation({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationId,
            operationType: 'comp_analysis',
            title: 'Validating Comparables',
            error: error instanceof Error ? error.message : String(error),
            stepId: 'analyze_comps',
          });
        }
        ResearchMetrics.nodeDuration(timing.stop(), { node: 'analyze_comps' });
        ResearchMetrics.nodeExecuted({ node: 'analyze_comps', status: 'error' });
        throw error;
      }
    },
    {
      'research.run_id': state.researchRunId,
      'research.item_id': state.itemId,
    },
  );
}
