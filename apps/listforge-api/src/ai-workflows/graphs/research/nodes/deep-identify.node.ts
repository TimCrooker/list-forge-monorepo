import { ResearchGraphState } from '../research-graph.state';
import { DiscoveredProductData, WebSearchResult } from '@listforge/core-types';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { DEEP_IDENTIFICATION } from '../../../config/research.constants';

/**
 * Tools interface for deep identification
 */
export interface DeepIdentificationTools {
  searchProduct: (params: {
    brand?: string;
    model?: string;
    category?: string;
    upc?: string;
    extractedText?: string;
    attributes?: Record<string, string>;
  }) => Promise<WebSearchResult[]>;
  synthesizeProductData: (
    searchResults: WebSearchResult[],
    existingData: {
      brand?: string;
      model?: string;
      category?: string;
      attributes?: Record<string, string>;
    },
  ) => Promise<DiscoveredProductData>;
}

/**
 * Deep Identify Node
 *
 * Performs exhaustive web-based product identification until high confidence
 * is achieved or max attempts are reached. Uses OpenAI's web search to find
 * product specifications, manufacturer data, model numbers, and UPC verification.
 */
export async function deepIdentifyNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: DeepIdentificationTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.searchProduct || !tools?.synthesizeProductData) {
    throw new Error('DeepIdentificationTools not provided in config.configurable.tools');
  }

  const currentAttempt = (state.identificationAttempts || 0) + 1;
  const currentConfidence = state.identificationConfidence || 0;

  // Start the main identification operation
  let identifyOpId: string | undefined;
  if (activityLogger) {
    identifyOpId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'product_identification',
      title: `Product Identification (Attempt ${currentAttempt}/${DEEP_IDENTIFICATION.MAX_ATTEMPTS})`,
      message: `Starting deep product identification with ${(currentConfidence * 100).toFixed(0)}% current confidence`,
      stepId: 'deep_identify',
      data: {
        attempt: currentAttempt,
        currentConfidence,
        threshold: DEEP_IDENTIFICATION.CONFIDENCE_THRESHOLD,
      },
    });
  }

  try {
    // Check if we've already achieved the threshold
    if (currentConfidence >= DEEP_IDENTIFICATION.CONFIDENCE_THRESHOLD) {
      if (activityLogger && identifyOpId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId: identifyOpId,
          operationType: 'product_identification',
          title: 'Product Identification',
          message: `Already at ${(currentConfidence * 100).toFixed(0)}% confidence - threshold met`,
          stepId: 'deep_identify',
          data: { confidence: currentConfidence },
        });
      }

      return {
        identificationAttempts: currentAttempt,
        lowConfidenceFlag: false,
      };
    }

    // Check if max attempts reached
    if (currentAttempt > DEEP_IDENTIFICATION.MAX_ATTEMPTS) {
      if (activityLogger && identifyOpId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId: identifyOpId,
          operationType: 'product_identification',
          title: 'Product Identification',
          message: `Max attempts reached - proceeding with ${(currentConfidence * 100).toFixed(0)}% confidence`,
          stepId: 'deep_identify',
          data: {
            finalConfidence: currentConfidence,
            threshold: DEEP_IDENTIFICATION.CONFIDENCE_THRESHOLD,
            attempts: currentAttempt - 1,
            lowConfidence: true,
          },
        });
      }

      return {
        identificationAttempts: currentAttempt,
        lowConfidenceFlag: true,
      };
    }

    // Gather existing data from media analysis and previous identification
    const existingData = buildExistingData(state);

    // Start web search operation
    let webSearchOpId: string | undefined;
    if (activityLogger) {
      webSearchOpId = await activityLogger.startOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationType: 'web_search',
        title: 'Web Search',
        message: `Searching for product information (Attempt ${currentAttempt})`,
        stepId: 'deep_identify',
        data: {
          searchParams: {
            brand: existingData.brand,
            model: existingData.model,
            category: existingData.category,
            upc: existingData.upc,
          },
        },
      });
    }

    // Execute web search
    const searchResults = await tools.searchProduct({
      brand: existingData.brand,
      model: existingData.model,
      category: existingData.category,
      upc: existingData.upc,
      extractedText: existingData.extractedText,
      attributes: existingData.attributes,
    });

    // Complete web search operation
    if (activityLogger && webSearchOpId) {
      const successfulSearches = searchResults.filter((r) => !r.error && r.content.length > 0);
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId: webSearchOpId,
        operationType: 'web_search',
        title: 'Web Search',
        message: `Found ${successfulSearches.length} results from ${searchResults.length} queries`,
        stepId: 'deep_identify',
        data: {
          totalQueries: searchResults.length,
          successfulResults: successfulSearches.length,
          queries: searchResults.map((r) => r.query),
          sources: searchResults.flatMap((r) => r.sources || []).slice(0, 10),
        },
      });
    }

    // Emit progress on the main identification operation
    if (activityLogger && identifyOpId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId: identifyOpId,
        operationType: 'product_identification',
        message: 'Synthesizing product data from search results...',
        stepId: 'deep_identify',
      });
    }

    // Synthesize product data from search results
    const synthesizedData = await tools.synthesizeProductData(searchResults, {
      brand: existingData.brand,
      model: existingData.model,
      category: existingData.category,
      attributes: existingData.attributes,
    });

    // Update product identification from synthesized data
    const updatedProductId = {
      confidence: synthesizedData.confidence,
      brand: synthesizedData.brand || undefined,
      model: synthesizedData.model || undefined,
      mpn: synthesizedData.mpn || undefined,
      upc: synthesizedData.upc || undefined,
      category: synthesizedData.category.length > 0 ? synthesizedData.category : undefined,
      attributes: synthesizedData.specifications,
    };

    // Check if we've reached the threshold
    const thresholdReached = synthesizedData.confidence >= DEEP_IDENTIFICATION.CONFIDENCE_THRESHOLD;

    // Complete the main identification operation
    if (activityLogger && identifyOpId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId: identifyOpId,
        operationType: 'product_identification',
        title: 'Product Identification',
        message: thresholdReached
          ? `Identified with ${(synthesizedData.confidence * 100).toFixed(0)}% confidence`
          : `${(synthesizedData.confidence * 100).toFixed(0)}% confidence - may need refinement`,
        stepId: 'deep_identify',
        data: {
          confidence: synthesizedData.confidence,
          brand: synthesizedData.brand,
          model: synthesizedData.model,
          mpn: synthesizedData.mpn,
          upc: synthesizedData.upc,
          category: synthesizedData.category,
          specCount: Object.keys(synthesizedData.specifications).length,
          thresholdReached,
        },
      });
    }

    return {
      identificationAttempts: currentAttempt,
      identificationConfidence: synthesizedData.confidence,
      webSearchResults: searchResults,
      discoveredProductData: synthesizedData,
      productIdentification: updatedProductId,
      lowConfidenceFlag: !thresholdReached && currentAttempt >= DEEP_IDENTIFICATION.MAX_ATTEMPTS,
    };
  } catch (error) {
    if (activityLogger && identifyOpId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId: identifyOpId,
        operationType: 'product_identification',
        title: 'Product Identification',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'deep_identify',
        data: { attempt: currentAttempt },
      });
    }
    throw error;
  }
}

/**
 * Conditional edge: should we continue identification attempts?
 */
export function shouldContinueIdentification(
  state: ResearchGraphState,
): 'continue' | 'proceed' {
  const confidence = state.identificationConfidence || 0;
  const attempts = state.identificationAttempts || 0;

  // If we've reached 90% confidence, proceed to next step
  if (confidence >= DEEP_IDENTIFICATION.CONFIDENCE_THRESHOLD) {
    return 'proceed';
  }

  // If we haven't exhausted attempts, continue trying
  if (attempts < DEEP_IDENTIFICATION.MAX_ATTEMPTS) {
    return 'continue';
  }

  // Max attempts reached, proceed with warning
  return 'proceed';
}

/**
 * Values that indicate "unknown" or "not detected" - should be filtered out
 * These are placeholder responses from the LLM when it can't identify something
 */
const PLACEHOLDER_VALUES = [
  'not visible',
  'unknown',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  'not available',
  'not detected',
  'not found',
  'cannot determine',
  'unidentified',
];

/**
 * Check if a value is a placeholder/unknown value that should be filtered out
 */
function isPlaceholderValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase().trim();
  if (normalized.length === 0) return true;
  return PLACEHOLDER_VALUES.some(
    (placeholder) =>
      normalized === placeholder ||
      normalized.includes(placeholder) ||
      placeholder.includes(normalized),
  );
}

/**
 * Return the value only if it's not a placeholder
 */
function cleanValue(value: string | undefined | null): string | undefined {
  if (isPlaceholderValue(value)) return undefined;
  return value || undefined;
}

/**
 * Build existing data object from state
 */
function buildExistingData(state: ResearchGraphState): {
  brand?: string;
  model?: string;
  category?: string;
  upc?: string;
  extractedText?: string;
  attributes?: Record<string, string>;
} {
  const mediaAnalysis = state.mediaAnalysis;
  const productId = state.productIdentification;
  const item = state.item;

  // Combine data from all sources, filtering out placeholder values
  const brand = cleanValue(
    productId?.brand || mediaAnalysis?.brand || findAttribute(item?.attributes, 'brand'),
  );
  const model = cleanValue(
    productId?.model || mediaAnalysis?.model || findAttribute(item?.attributes, 'model'),
  );
  const category = cleanValue(mediaAnalysis?.category || item?.title?.split(' ')[0]);
  const upc = cleanValue(
    productId?.upc ||
      mediaAnalysis?.extractedText?.upc ||
      mediaAnalysis?.extractedText?.UPC ||
      findAttribute(item?.attributes, 'upc'),
  );

  // Combine extracted text (filter out placeholder values)
  const extractedText = mediaAnalysis?.extractedText
    ? Object.values(mediaAnalysis.extractedText)
        .filter((v) => v && !isPlaceholderValue(v))
        .join(' ')
    : undefined;

  // Build attributes map (filter out placeholder values)
  const attributes: Record<string, string> = {};
  if (mediaAnalysis?.attributes) {
    for (const [key, value] of Object.entries(mediaAnalysis.attributes)) {
      const strValue = typeof value === 'string' ? value : String(value);
      if (!isPlaceholderValue(strValue)) {
        attributes[key] = strValue;
      }
    }
  }
  if (item?.attributes) {
    for (const attr of item.attributes) {
      if (!isPlaceholderValue(attr.value)) {
        attributes[attr.key] = attr.value;
      }
    }
  }

  return {
    brand,
    model,
    category,
    upc,
    extractedText: extractedText && extractedText.trim().length > 0 ? extractedText : undefined,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
  };
}

/**
 * Find an attribute value by key (case-insensitive)
 */
function findAttribute(
  attributes: Array<{ key: string; value: string }> | undefined,
  key: string,
): string | undefined {
  if (!attributes) return undefined;
  const found = attributes.find((a) => a.key.toLowerCase() === key.toLowerCase());
  return found?.value;
}
