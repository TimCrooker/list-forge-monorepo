import { ResearchGraphState } from '../research-graph.state';
import { ResearchEvidenceRecord } from '@listforge/core-types';
import { CompResult } from '@listforge/marketplace-adapters';
import { logNodeDebug } from '../../../utils/node-logger';

/**
 * Tools interface for refined search
 */
export interface RefineSearchTools {
  searchSoldListings: (params: { query: string; source: string; limit: number }) => Promise<CompResult[]>;
}

/**
 * Convert CompResult to ResearchEvidenceRecord
 */
function toEvidenceRecord(comp: CompResult): ResearchEvidenceRecord {
  return {
    id: comp.listingId,
    type: 'sold_listing',
    source: 'ebay',
    sourceId: comp.listingId,
    url: comp.url,
    title: comp.title,
    price: comp.price,
    currency: comp.currency,
    soldDate: comp.soldDate?.toISOString(),
    condition: comp.condition || undefined,
    relevanceScore: 0.5,
    extractedData: comp.attributes || {},
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Generate refined queries based on missing info
 */
function generateRefinedQueries(state: ResearchGraphState): string[] {
  const queries: string[] = [];
  const parts: string[] = [];

  // Start with existing product identification
  if (state.productIdentification?.brand) {
    parts.push(state.productIdentification.brand);
  }
  if (state.productIdentification?.model) {
    parts.push(state.productIdentification.model);
  }

  // Add missing info fields to query
  for (const missing of state.missingInfo) {
    if (missing.importance !== 'optional' && missing.suggestedPrompt) {
      // Extract key terms from suggested prompt
      const promptLower = missing.suggestedPrompt.toLowerCase();
      if (promptLower.includes('model')) {
        // Will be added if we get model info
      }
      if (promptLower.includes('capacity') || promptLower.includes('size')) {
        // Could add size/capacity terms
      }
    }
  }

  if (parts.length > 0) {
    queries.push(parts.join(' '));
  }

  return queries.filter((q) => q.trim().length > 0);
}

/**
 * Refine search node
 * Performs additional searches based on missing info
 */
export async function refineSearchNode(
  state: ResearchGraphState,
  config?: { configurable?: { tools?: RefineSearchTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  logNodeDebug('refine-search', 'Starting refined search', {
    iteration: state.iteration,
    missingInfoCount: state.missingInfo?.length || 0,
  });

  const tools = config?.configurable?.tools;
  if (!tools) {
    throw new Error('RefineSearchTools not provided in config.configurable.tools');
  }

  // Generate refined queries
  const refinedQueries = generateRefinedQueries(state);
  logNodeDebug('refine-search', 'Generated refined queries', { queries: refinedQueries });

  if (refinedQueries.length === 0) {
    logNodeDebug('refine-search', 'No refined queries, incrementing iteration');
    return {
      iteration: state.iteration + 1,
    };
  }

  // Search with refined queries
  logNodeDebug('refine-search', 'Executing refined searches', { queryCount: refinedQueries.length });
  const searchPromises = refinedQueries.map((q) =>
    tools.searchSoldListings({ query: q, source: 'ebay', limit: 10 }),
  );

  const results = await Promise.allSettled(searchPromises);

  const newComps: ResearchEvidenceRecord[] = [];
  let fulfilledCount = 0;
  let rejectedCount = 0;
  for (const result of results) {
    if (result.status === 'fulfilled') {
      fulfilledCount++;
      newComps.push(...result.value.map(toEvidenceRecord));
    } else {
      rejectedCount++;
      logNodeDebug('refine-search', 'Refined search failed', { reason: result.reason });
    }
  }

  logNodeDebug('refine-search', 'Refined search complete', {
    queriesExecuted: refinedQueries.length,
    fulfilled: fulfilledCount,
    rejected: rejectedCount,
    newCompsFound: newComps.length,
    totalCompsAfter: state.comps.length + newComps.length,
  });

  return {
    comps: [...state.comps, ...newComps],
    searchQueries: [...state.searchQueries, ...refinedQueries],
    iteration: state.iteration + 1,
  };
}
