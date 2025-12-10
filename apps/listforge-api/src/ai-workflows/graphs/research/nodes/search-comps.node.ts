import { ResearchGraphState, ResearchWarning } from '../research-graph.state';
import {
  ResearchEvidenceRecord,
  AmazonProductMatch,
  CompMatchType,
  COMP_MATCH_TYPE_WEIGHTS,
} from '@listforge/core-types';
import { CompResult } from '@listforge/marketplace-adapters';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { createApiFailureWarning, createDataMissingWarning } from '../../../utils/warnings';
import { logNodeWarn } from '../../../utils/node-logger';

/**
 * Tools interface for comp search
 */
export interface CompSearchTools {
  // eBay search tools
  searchSoldListings: (params: { query: string; source: string; limit: number }) => Promise<CompResult[]>;
  searchActiveListings: (params: { query: string; source: string; limit: number }) => Promise<CompResult[]>;
  searchByImage: (params: { imageUrl: string; source: string; limit: number }) => Promise<CompResult[]>;
  // Amazon search tools
  searchAmazonProducts?: (params: { keywords: string; brand?: string; limit: number }) => Promise<CompResult[]>;
  lookupAmazonByUpc?: (params: { upc: string }) => Promise<AmazonProductMatch | null>;
  lookupAmazonByAsin?: (params: { asin: string }) => Promise<CompResult | null>;
}

/**
 * Convert CompResult to ResearchEvidenceRecord
 * Slice 3: Added matchType parameter for tracking how comp was found
 */
function toEvidenceRecord(
  comp: CompResult,
  type: 'sold_listing' | 'active_listing',
  source: 'ebay' | 'amazon' = 'ebay',
  matchType: CompMatchType = 'GENERIC_KEYWORD',
): ResearchEvidenceRecord {
  const baseConfidence = COMP_MATCH_TYPE_WEIGHTS[matchType];

  return {
    id: comp.listingId,
    type,
    source,
    sourceId: comp.listingId,
    url: comp.url,
    title: comp.title,
    price: comp.price,
    currency: comp.currency,
    soldDate: comp.soldDate?.toISOString(),
    condition: comp.condition || undefined,
    imageUrl: comp.imageUrl,
    relevanceScore: baseConfidence, // Start with match type confidence, refined in analyze_comps
    extractedData: {
      ...comp.attributes,
      // Include ASIN for Amazon items
      asin: source === 'amazon' ? comp.listingId : undefined,
    },
    fetchedAt: new Date().toISOString(),
    // Slice 3: Match type tracking
    matchType,
    baseConfidence,
  };
}

/**
 * Convert Amazon product match to evidence record
 * Slice 3: Determine match type based on how the product was matched
 */
function amazonMatchToEvidenceRecord(
  match: AmazonProductMatch,
  searchType: 'amazon_upc' | 'amazon_asin' | 'amazon_keyword',
): ResearchEvidenceRecord {
  // Determine match type based on how this Amazon result was found
  let matchType: CompMatchType;
  if (searchType === 'amazon_upc') {
    matchType = 'UPC_EXACT';
  } else if (searchType === 'amazon_asin') {
    matchType = 'ASIN_EXACT';
  } else {
    // Keyword search - check if we have brand+model info
    const hasBrandModel = match.brand && match.matchedBy?.includes('brand');
    matchType = hasBrandModel ? 'BRAND_MODEL_KEYWORD' : 'GENERIC_KEYWORD';
  }

  const baseConfidence = COMP_MATCH_TYPE_WEIGHTS[matchType];

  return {
    id: match.asin,
    type: 'active_listing',
    source: 'amazon',
    sourceId: match.asin,
    url: `https://www.amazon.com/dp/${match.asin}`,
    title: match.title,
    price: match.price,
    currency: 'USD',
    imageUrl: match.imageUrl,
    relevanceScore: Math.max(match.confidence, baseConfidence), // Use higher of match confidence or base
    extractedData: {
      asin: match.asin,
      brand: match.brand,
      category: match.category,
      salesRank: match.salesRank,
      matchedBy: match.matchedBy,
    },
    fetchedAt: new Date().toISOString(),
    // Slice 3: Match type tracking
    matchType,
    baseConfidence,
    asin: match.asin,
  };
}

/**
 * Determine impact of failed search based on what data we already have
 */
function determineImpact(searchType: string, currentEbayCount: number, currentAmazonCount: number): string {
  if (searchType.includes('sold') && currentEbayCount === 0) {
    return 'Pricing confidence will be reduced without sold listings data';
  } else if (searchType.includes('sold')) {
    return 'Some sold listings data unavailable, but other sources available';
  } else if (searchType.includes('amazon') && currentAmazonCount === 0) {
    return 'Amazon pricing data unavailable, relying on eBay only';
  } else if (searchType.includes('active')) {
    return 'Active listings data unavailable, but sold data available';
  }
  return 'Data from this source unavailable, using other sources';
}

/**
 * Generate search queries from product identification and item data
 */
function generateSearchQueries(state: ResearchGraphState): string[] {
  const queries: string[] = [];
  const parts: string[] = [];

  // Add brand
  if (state.productIdentification?.brand) {
    parts.push(state.productIdentification.brand);
  } else if (state.mediaAnalysis?.brand) {
    parts.push(state.mediaAnalysis.brand);
  }

  // Add model
  if (state.productIdentification?.model) {
    parts.push(state.productIdentification.model);
  } else if (state.mediaAnalysis?.model) {
    parts.push(state.mediaAnalysis.model);
  }

  // Primary query with brand + model
  if (parts.length > 0) {
    queries.push(parts.join(' '));
  }

  // Fallback queries
  if (state.item?.title) {
    queries.push(state.item.title);
  }

  if (state.mediaAnalysis?.category) {
    queries.push(state.mediaAnalysis.category);
  }

  // Remove duplicates, empty strings, and very short queries (minimum 2 characters)
  return [...new Set(queries
    .filter((q) => q.trim().length >= 2) // Minimum 2 characters
    .map((q) => q.trim())
  )];
}

/**
 * Search comps node
 * Searches for comparable listings across marketplaces (eBay + Amazon)
 */
export async function searchCompsNode(
  state: ResearchGraphState,
  config?: { configurable?: { tools?: CompSearchTools; activityLogger?: ResearchActivityLoggerService; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools) {
    throw new Error('CompSearchTools not provided in config.configurable.tools');
  }

  // Start comp search operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'comp_search',
      title: 'Finding Comparables',
      message: 'Searching for comparable listings on eBay and Amazon',
      stepId: 'search_comps',
    });
  }

  try {
    // Generate search queries
    const queries = generateSearchQueries(state);

    // Check if we have a UPC for direct Amazon lookup
    const upc = state.ocrResult?.upc || state.upcLookupResult?.upc || state.productIdentification?.upc;
    const asin = state.amazonAsin; // From previous UPC lookup

    if (queries.length === 0 && !upc && !asin) {
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'comp_search',
          title: 'Finding Comparables',
          message: 'No search queries could be generated',
          stepId: 'search_comps',
          data: { queries: [], totalComps: 0 },
        });
      }
      return {
        comps: [],
        searchQueries: [],
      };
    }

    // Emit progress with query info
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'comp_search',
        message: `Searching eBay and Amazon with ${queries.length} queries...`,
        stepId: 'search_comps',
        data: { queries, hasUpc: !!upc, hasAsin: !!asin },
      });
    }

    // Track search sources for metadata
    // Slice 3: Added matchType to promiseMeta for proper comp tagging
    type SearchSource = 'ebay_sold' | 'ebay_active' | 'ebay_image' | 'amazon_keyword' | 'amazon_upc' | 'amazon_asin';
    const searchPromises: Promise<CompResult | CompResult[] | AmazonProductMatch | null>[] = [];
    const promiseMeta: Array<{
      type: 'sold_listing' | 'active_listing';
      source: 'ebay' | 'amazon';
      searchType: SearchSource;
      matchType: CompMatchType; // Slice 3: How was this comp found?
    }> = [];

    // Slice 3: Determine if we have brand+model info for better match type tagging
    const hasBrandModel = !!(
      (state.productIdentification?.brand && state.productIdentification?.model) ||
      (state.mediaAnalysis?.brand && state.mediaAnalysis?.model)
    );

    // eBay searches
    for (const query of queries.slice(0, 3)) { // Limit to 3 queries
      // Slice 3: Determine match type based on query content
      const ebayKeywordMatchType: CompMatchType = hasBrandModel
        ? 'BRAND_MODEL_KEYWORD'
        : 'GENERIC_KEYWORD';

      searchPromises.push(
        tools.searchSoldListings({ query, source: 'ebay', limit: 20 }),
      );
      promiseMeta.push({
        type: 'sold_listing',
        source: 'ebay',
        searchType: 'ebay_sold',
        matchType: ebayKeywordMatchType,
      });

      searchPromises.push(
        tools.searchActiveListings({ query, source: 'ebay', limit: 10 }),
      );
      promiseMeta.push({
        type: 'active_listing',
        source: 'ebay',
        searchType: 'ebay_active',
        matchType: ebayKeywordMatchType,
      });
    }

    // eBay image search if item has images
    if (state.item?.media && state.item.media.length > 0) {
      const firstImage = state.item.media[0];
      if (firstImage.url) {
        searchPromises.push(
          tools.searchByImage({ imageUrl: firstImage.url, source: 'ebay', limit: 15 }),
        );
        promiseMeta.push({
          type: 'active_listing',
          source: 'ebay',
          searchType: 'ebay_image',
          matchType: 'IMAGE_SIMILARITY', // Slice 3: Image-based matches
        });
      }
    }

    // Amazon searches
    if (tools.searchAmazonProducts) {
      // Keyword search on Amazon
      const amazonKeywordMatchType: CompMatchType = hasBrandModel
        ? 'BRAND_MODEL_KEYWORD'
        : 'GENERIC_KEYWORD';

      for (const query of queries.slice(0, 2)) { // Limit to 2 Amazon keyword searches
        searchPromises.push(
          tools.searchAmazonProducts({ keywords: query, limit: 15 }),
        );
        promiseMeta.push({
          type: 'active_listing',
          source: 'amazon',
          searchType: 'amazon_keyword',
          matchType: amazonKeywordMatchType,
        });
      }
    }

    // Amazon UPC lookup (high-value for exact matching)
    if (tools.lookupAmazonByUpc && upc) {
      searchPromises.push(
        tools.lookupAmazonByUpc({ upc }),
      );
      promiseMeta.push({
        type: 'active_listing',
        source: 'amazon',
        searchType: 'amazon_upc',
        matchType: 'UPC_EXACT', // Slice 3: Highest confidence match type
      });
    }

    // Amazon ASIN lookup (if we already have an ASIN from earlier)
    if (tools.lookupAmazonByAsin && asin) {
      searchPromises.push(
        tools.lookupAmazonByAsin({ asin }),
      );
      promiseMeta.push({
        type: 'active_listing',
        source: 'amazon',
        searchType: 'amazon_asin',
        matchType: 'ASIN_EXACT', // Slice 3: Very high confidence
      });
    }

    const results = await Promise.allSettled(searchPromises);

    const comps: ResearchEvidenceRecord[] = [];
    const amazonMatches: AmazonProductMatch[] = [];
    const availableDataSources: string[] = [];
    const warnings: ResearchWarning[] = [];
    let ebayCount = 0;
    let amazonCount = 0;
    let fulfilledCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const meta = promiseMeta[i];

      if (result.status === 'fulfilled' && result.value) {
        fulfilledCount++;

        // Handle different result types
        if (meta.searchType === 'amazon_upc') {
          // Single Amazon product match from UPC lookup
          const match = result.value as AmazonProductMatch | null;
          if (match) {
            amazonMatches.push(match);
            // Slice 3: Pass searchType for match type determination
            comps.push(amazonMatchToEvidenceRecord(match, meta.searchType));
            amazonCount++;
            if (!availableDataSources.includes('amazon_identifier')) {
              availableDataSources.push('amazon_identifier');
            }
          }
        } else if (meta.searchType === 'amazon_asin') {
          // Single CompResult from ASIN lookup
          const comp = result.value as CompResult | null;
          if (comp) {
            // Slice 3: Pass matchType from meta
            comps.push(toEvidenceRecord(comp, meta.type, meta.source, meta.matchType));
            amazonCount++;
            if (!availableDataSources.includes('amazon_identifier')) {
              availableDataSources.push('amazon_identifier');
            }
          }
        } else {
          // Array of CompResults
          const compResults = result.value as CompResult[];
          if (compResults.length > 0) {
            // Slice 3: Pass matchType from meta to each comp
            const compsForQuery = compResults.map((comp) =>
              toEvidenceRecord(comp, meta.type, meta.source, meta.matchType)
            );
            comps.push(...compsForQuery);

            if (meta.source === 'ebay') {
              ebayCount += compResults.length;
            } else {
              amazonCount += compResults.length;
            }

            // Track successful data sources
            if (!availableDataSources.includes(meta.searchType)) {
              availableDataSources.push(meta.searchType);
            }
          }
        }
      } else if (result.status === 'rejected') {
        rejectedCount++;
        const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);

        // Create warning for failed API call
        const warning = createApiFailureWarning(
          'search_comps',
          meta.searchType.replace('_', ' '),
          errorMessage,
          determineImpact(meta.searchType, ebayCount, amazonCount),
          { searchType: meta.searchType, query: queries[0] }
        );
        warnings.push(warning);

        logNodeWarn('search-comps', `Search failed (${meta.searchType})`, { searchType: meta.searchType, reason: result.reason });
      }
    }

    const soldListingsCount = comps.filter((c) => c.type === 'sold_listing').length;
    const activeListingsCount = comps.filter((c) => c.type === 'active_listing').length;
    const ebayComps = comps.filter((c) => c.source === 'ebay').length;
    const amazonComps = comps.filter((c) => c.source === 'amazon').length;

    // Complete the operation with summary
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'comp_search',
        title: 'Finding Comparables',
        message: comps.length > 0
          ? `Found ${comps.length} comparables: ${ebayComps} from eBay, ${amazonComps} from Amazon (${soldListingsCount} sold, ${activeListingsCount} active)`
          : 'No comparable listings found',
        stepId: 'search_comps',
        data: {
          totalComps: comps.length,
          soldListings: soldListingsCount,
          activeListings: activeListingsCount,
          ebayComps,
          amazonComps,
          queries,
          sources: availableDataSources,
          successfulSearches: fulfilledCount,
          failedSearches: rejectedCount,
          comps: comps.slice(0, 8).map(c => ({
            title: c.title,
            price: c.price,
            type: c.type,
            source: c.source,
            url: c.url,
          })),
        },
      });
    }

    // Add warning if no comps found at all
    if (comps.length === 0 && queries.length > 0) {
      warnings.push(createDataMissingWarning(
        'search_comps',
        'comparable listings',
        'Cannot calculate pricing without comparables',
        { queriesAttempted: queries.length, failedSearches: rejectedCount }
      ));
    }

    // Add warning if no sold listings (critical for pricing)
    if (soldListingsCount === 0 && comps.length > 0) {
      warnings.push(createDataMissingWarning(
        'search_comps',
        'sold listings',
        'Pricing confidence reduced without historical sold data',
        { activeListingsAvailable: activeListingsCount }
      ));
    }

    return {
      comps,
      searchQueries: queries,
      availableDataSources,
      amazonMatches: amazonMatches.length > 0 ? amazonMatches : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'comp_search',
        title: 'Finding Comparables',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'search_comps',
      });
    }
    throw error;
  }
}
