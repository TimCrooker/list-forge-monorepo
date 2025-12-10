/**
 * Evidence Types
 *
 * Types for storing AI reasoning and research evidence for ListingDrafts.
 * Evidence captures what data the AI used to make decisions.
 */

import { CompValidation } from './research';

// Evidence item type discriminator
export type EvidenceItemType =
  | 'marketplace_sold'
  | 'marketplace_active'
  | 'article_metadata'
  | 'summary';

// Summary evidence kinds
export type SummaryKind =
  | 'pricing_overview'
  | 'condition_overview'
  | 'category_justification'
  | 'title_rationale'
  | 'description_rationale'
  | 'shipping_recommendation';

/**
 * Evidence from a sold marketplace listing (e.g., eBay completed sale)
 * Slice 3: Added validation field for comp validation results
 */
export interface MarketplaceSoldEvidence {
  type: 'marketplace_sold';
  marketplace: string;
  url: string;
  title: string;
  price: number;
  shippingCost: number | null;
  soldDate: string;
  condition: string | null;
  thumbUrl: string | null;
  relevanceScore: number | null;
  validation?: CompValidation; // Slice 3: Validation result
}

/**
 * Evidence from an active marketplace listing
 * Slice 3: Added validation field for comp validation results
 */
export interface MarketplaceActiveEvidence {
  type: 'marketplace_active';
  marketplace: string;
  url: string;
  title: string;
  price: number;
  shippingCost: number | null;
  timeLeft: string | null;
  sellerRating: number | null;
  thumbUrl: string | null;
  watchCount: number | null;
  validation?: CompValidation; // Slice 3: Validation result
}

/**
 * Evidence from external article/metadata source
 */
export interface ArticleMetadataEvidence {
  type: 'article_metadata';
  url: string;
  title: string;
  snippet: string;
  siteName: string | null;
}

/**
 * AI-generated summary/explanation evidence
 */
export interface SummaryEvidence {
  type: 'summary';
  kind: SummaryKind;
  text: string;
  data?: Record<string, unknown>;
}

/**
 * Union type for all evidence items
 */
export type EvidenceItemData =
  | MarketplaceSoldEvidence
  | MarketplaceActiveEvidence
  | ArticleMetadataEvidence
  | SummaryEvidence;
