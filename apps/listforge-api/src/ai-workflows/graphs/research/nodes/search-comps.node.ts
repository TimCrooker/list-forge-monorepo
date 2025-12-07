import { ResearchGraphState } from '../research-graph.state';
import { ResearchEvidenceRecord } from '@listforge/core-types';
import { CompResult } from '@listforge/marketplace-adapters';

/**
 * Tools interface for comp search
 */
export interface CompSearchTools {
  searchSoldListings: (params: { query: string; source: string; limit: number }) => Promise<CompResult[]>;
  searchActiveListings: (params: { query: string; source: string; limit: number }) => Promise<CompResult[]>;
}

/**
 * Convert CompResult to ResearchEvidenceRecord
 */
function toEvidenceRecord(comp: CompResult, type: 'sold_listing' | 'active_listing'): ResearchEvidenceRecord {
  return {
    id: comp.listingId,
    type,
    source: 'ebay',
    sourceId: comp.listingId,
    url: comp.url,
    title: comp.title,
    price: comp.price,
    currency: comp.currency,
    soldDate: comp.soldDate?.toISOString(),
    condition: comp.condition || undefined,
    relevanceScore: 0.5, // Will be scored in analyze_comps
    extractedData: comp.attributes || {},
    fetchedAt: new Date().toISOString(),
  };
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

  // Remove duplicates and empty strings
  return [...new Set(queries.filter((q) => q.trim().length > 0))];
}

/**
 * Search comps node
 * Searches for comparable listings across marketplaces
 */
export async function searchCompsNode(
  state: ResearchGraphState,
  config?: { configurable?: { tools?: CompSearchTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools) {
    throw new Error('CompSearchTools not provided in config.configurable.tools');
  }

  // Generate search queries
  const queries = generateSearchQueries(state);

  if (queries.length === 0) {
    return {
      comps: [],
      searchQueries: [],
    };
  }

  // Search across sources in parallel
  const searchPromises: Promise<CompResult[]>[] = [];

  for (const query of queries.slice(0, 3)) { // Limit to 3 queries
    searchPromises.push(
      tools.searchSoldListings({ query, source: 'ebay', limit: 20 }),
      tools.searchActiveListings({ query, source: 'ebay', limit: 10 }),
    );
  }

  const results = await Promise.allSettled(searchPromises);

  const comps: ResearchEvidenceRecord[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      const type = i % 2 === 0 ? 'sold_listing' : 'active_listing';
      comps.push(...result.value.map((comp) => toEvidenceRecord(comp, type)));
    }
  }

  return {
    comps,
    searchQueries: queries,
  };
}
