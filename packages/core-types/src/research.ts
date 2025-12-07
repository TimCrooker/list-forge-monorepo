/**
 * Research Types - Phase 6 Sub-Phase 8 + Phase 7 Slice 1
 *
 * Types for ItemResearchRun entity, research workflows, and structured research data.
 */

/**
 * Type of research run
 */
export type ResearchRunType =
  | 'initial_intake'    // First-time research during AI capture
  | 'pricing_refresh'   // Re-run pricing research
  | 'manual_request';   // User-triggered manual research

/**
 * Status of a research run
 */
export type ResearchRunStatus =
  | 'pending'    // Queued but not started
  | 'running'    // Currently executing
  | 'success'    // Completed successfully
  | 'error';     // Failed with error

// ============================================================================
// Phase 7 Slice 1: Structured Research Data Types
// ============================================================================

/**
 * Price band recommendation with confidence and reasoning
 */
export interface PriceBand {
  label: 'floor' | 'target' | 'ceiling';
  amount: number;
  currency: string;
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Demand signal metric from market research
 */
export interface DemandSignal {
  metric: 'sell_through_rate' | 'days_to_sell' | 'active_competition' | 'search_volume';
  value: number;
  unit: string;
  period?: string; // e.g., "30d", "90d"
  source: string;
}

/**
 * Hint about missing information that would improve research accuracy
 */
export interface MissingInfoHint {
  field: string; // e.g., "model_number", "capacity", "color"
  importance: 'required' | 'recommended' | 'optional';
  reason: string;
  suggestedPrompt?: string; // Question to ask user
}

/**
 * Product identification from research
 */
export interface ProductIdentification {
  confidence: number; // 0-1
  brand?: string;
  model?: string;
  mpn?: string;
  upc?: string;
  category?: string[];
  attributes: Record<string, string | number | boolean>;
}

/**
 * Structured research data output
 */
export interface ItemResearchData {
  productId?: ProductIdentification;
  priceBands: PriceBand[];
  demandSignals: DemandSignal[];
  missingInfo: MissingInfoHint[];
  competitorCount?: number;
  recommendedMarketplaces: string[];
  generatedAt: string; // ISO timestamp
  version: string; // Schema version for migrations
}

// ============================================================================
// Phase 7 Slice 2: Research Evidence Record
// ============================================================================

/**
 * Research evidence record - individual evidence items collected during research
 */
export interface ResearchEvidenceRecord {
  id: string;
  type: 'sold_listing' | 'active_listing' | 'product_page' | 'price_guide' | 'ai_analysis';
  source: string; // e.g., "ebay", "amazon", "terapeak"
  sourceId?: string; // External ID from source
  url?: string;
  title: string;
  price?: number;
  currency?: string;
  soldDate?: string;
  condition?: string;
  imageUrl?: string;
  relevanceScore: number; // 0-1, how relevant to our item
  extractedData: Record<string, unknown>;
  fetchedAt: string;
}
