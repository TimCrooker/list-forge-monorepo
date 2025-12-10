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
  | 'paused'     // Paused by user (can be resumed)
  | 'cancelled'  // Cancelled by user (cannot be resumed)
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
 * Pricing strategy option with time-to-sell estimate
 * Slice 5: Represents a pricing strategy (aggressive/balanced/premium) with estimated days to sell
 * Uses same strategy values as PricingStrategy type in item.ts for consistency
 */
export interface PricingStrategyOption {
  strategy: 'aggressive' | 'balanced' | 'premium'; // 'aggressive' = fast sale
  label: string; // "Fast Sale", "Balanced", "Premium"
  price: number;
  currency: string;
  estimatedDaysToSell: {
    min: number;
    max: number;
  };
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Demand signal metric from market research
 * Slice 5: Added 'price_trend' metric for market direction
 * Amazon Integration: Added 'bsr' and 'bsr_trend' metrics
 */
export interface DemandSignal {
  metric: 'sell_through_rate' | 'days_to_sell' | 'active_competition' | 'search_volume' | 'price_trend' | 'bsr' | 'bsr_trend';
  value: number;
  unit: string;
  period?: string; // e.g., "30d", "90d"
  source: string;
  direction?: 'up' | 'down' | 'stable'; // Slice 5: For price_trend metric
  // Amazon-specific fields (for BSR metrics)
  bsr?: number;
  bsrCategory?: string;
  bsrTrend?: 'rising' | 'falling' | 'stable';
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

// ============================================================================
// Slice 2: Enhanced Product Identification Types
// ============================================================================

/**
 * Source of data for a field value
 */
export type FieldSource = 'ocr' | 'upc_lookup' | 'web_search' | 'vision' | 'user';

/**
 * A field value with confidence score and source tracking
 * Used for per-field confidence in enhanced product identification
 */
export interface FieldWithConfidence<T> {
  value: T;
  confidence: number; // 0-1
  source: FieldSource;
  evidenceIds?: string[]; // Links to evidence items that support this value
}

/**
 * Enhanced product identification with per-field confidence
 * Slice 2: Tracks confidence and source for each identified field
 */
export interface EnhancedProductIdentification {
  confidence: number; // 0-1 overall confidence
  brand: FieldWithConfidence<string> | null;
  model: FieldWithConfidence<string> | null;
  mpn: FieldWithConfidence<string> | null;
  upc: FieldWithConfidence<string> | null;
  variant: {
    color?: FieldWithConfidence<string>;
    size?: FieldWithConfidence<string>;
    edition?: FieldWithConfidence<string>;
  };
  category?: string[];
  attributes: Record<string, FieldWithConfidence<string | number | boolean>>;
}

/**
 * OCR extraction result from dedicated text extraction
 * Slice 2: Structured output from OCR service
 */
export interface OCRExtractionResult {
  upc?: string;
  ean?: string;
  serialNumber?: string;
  modelNumber?: string;
  mpn?: string;
  rawText: string[];
  labels: Record<string, string>; // key-value pairs from labels
  confidence: number; // 0-1
}

/**
 * UPC lookup result from external database
 * Slice 2: Product data retrieved from UPC database
 */
export interface UPCLookupResult {
  found: boolean;
  upc: string;
  brand?: string;
  name?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  cached?: boolean; // Whether result came from cache
}

/**
 * Structured research data output
 * Slice 4: Added marketplaceCategory and fieldCompletion
 * Slice 5: Added pricingStrategies for strategy selection
 * Slice 6: Added listings for assembled marketplace payloads
 */
export interface ItemResearchData {
  productId?: ProductIdentification;
  priceBands: PriceBand[];
  pricingStrategies?: PricingStrategyOption[]; // Slice 5: Pricing strategy options with time-to-sell
  demandSignals: DemandSignal[];
  missingInfo: MissingInfoHint[];
  competitorCount?: number;
  recommendedMarketplaces: string[];
  // Slice 4: Marketplace schema awareness
  marketplaceCategory?: MarketplaceCategory;
  fieldCompletion?: FieldCompletion;
  // Slice 6: Assembled marketplace listings
  listings?: MarketplaceListingPayload[];
  generatedAt: string; // ISO timestamp
  version: string; // Schema version for migrations
}

// ============================================================================
// Slice 3: Comp Validation Types
// ============================================================================

/**
 * Detailed validation criteria for a comparable listing
 * Slice 3: Each criterion tracks whether it matches and why
 */
export interface CompValidationCriteria {
  brandMatch: {
    matches: boolean;
    confidence: number; // 0-1
    itemBrand?: string;
    compBrand?: string;
  };
  modelMatch: {
    matches: boolean;
    confidence: number; // 0-1
    itemModel?: string;
    compModel?: string;
  };
  variantMatch: {
    matches: boolean;
    confidence: number; // 0-1
    details?: string; // e.g., "Color: Black matches Black"
  };
  conditionMatch: {
    matches: boolean;
    withinGrade: number; // How many grades apart (0 = exact match, 1 = one grade off, etc.)
    itemCondition?: string;
    compCondition?: string;
  };
  recency: {
    valid: boolean;
    daysSinceSold: number | null; // null for active listings
    threshold: number; // e.g., 90 days
  };
  priceOutlier: {
    isOutlier: boolean;
    zScore?: number; // How many std devs from mean
  };
}

/**
 * Complete validation result for a comparable listing
 * Slice 3: Determines whether a comp should be used for pricing
 */
export interface CompValidation {
  isValid: boolean; // Overall pass/fail (score >= 0.7)
  overallScore: number; // 0-1 weighted score
  criteria: CompValidationCriteria;
  reasoning: string; // Human-readable explanation
}

// ============================================================================
// Slice 4: Marketplace Schema Awareness Types
// ============================================================================

/**
 * eBay category node from taxonomy API
 * Slice 4: Used for category tree navigation and detection
 */
export interface CategoryNode {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  leafCategory: boolean;
  children?: CategoryNode[];
}

/**
 * Field requirement from marketplace category aspects
 * Slice 4: Defines required/recommended fields for a category
 */
export interface FieldRequirement {
  name: string;
  localizedName: string;
  dataType: 'string' | 'number' | 'enum';
  required: boolean;
  cardinality: 'single' | 'multi';
  allowedValues?: string[];
  defaultValue?: string;
}

/**
 * Detected marketplace category with confidence
 * Slice 4: Result of AI category detection
 */
export interface MarketplaceCategory {
  marketplace: 'ebay' | 'amazon';
  categoryId: string;
  categoryPath: string[];
  categoryName: string;
  confidence: number; // 0-1
  conditionId: string;
}

/**
 * Field completion status for listing readiness
 * Slice 4: Tracks which required/recommended fields are filled
 */
export interface FieldCompletion {
  required: {
    filled: number;
    total: number;
    missing: string[];
  };
  recommended: {
    filled: number;
    total: number;
    missing: string[];
  };
  readinessScore: number; // 0-1
}

// ============================================================================
// Slice 6: Full Listing Assembly Types
// ============================================================================

/**
 * Status of a listing's readiness for publication
 * Slice 6: Determines what action is needed before publishing
 */
export type ListingReadinessStatus =
  | 'READY_FOR_PUBLISH'  // All requirements met, can auto-publish
  | 'READY_FOR_REVIEW'   // Needs human review before publishing
  | 'NEEDS_INFO';        // Missing required information

/**
 * Shipping configuration for a listing
 * Slice 6: Shipping details for marketplace listing
 */
export interface ListingShipping {
  type: 'flat' | 'calculated' | 'free' | 'local_pickup';
  cost?: number;
  freeShipping?: boolean;
  handlingTime?: number; // Business days
}

/**
 * The actual listing content ready to submit to marketplace
 * Slice 6: Contains all fields needed for marketplace API
 */
export interface ListingPayloadContent {
  title: string;
  description: string;
  bulletPoints: string[];
  categoryId: string;
  conditionId: string;
  price: number;
  currency: string;
  quantity: number;
  shipping: ListingShipping;
  attributes: Record<string, string | number>;
  photos: string[];
}

/**
 * Complete marketplace listing payload with status and validation
 * Slice 6: The output of listing assembly, ready for publish or review
 */
export interface MarketplaceListingPayload {
  marketplace: 'ebay' | 'amazon';
  ready: boolean;
  status: ListingReadinessStatus;
  statusReason?: string;
  missingRequired: string[];
  payload: ListingPayloadContent;
  validation: ListingValidation;
  confidence: number; // 0-1
  generatedAt: string; // ISO timestamp
}

/**
 * Validation results for a listing
 * Slice 6: Tracks which parts of listing pass validation
 */
export interface ListingValidation {
  titleValid: boolean;
  titleIssues: string[];
  descriptionValid: boolean;
  descriptionIssues: string[];
  categoryValid: boolean;
  attributesComplete: boolean;
  missingAttributes: string[];
  conditionMapped: boolean;
  priceSet: boolean;
  photosValid: boolean;
  photoCount: number;
  overallValid: boolean;
}

// ============================================================================
// Phase 7 Slice 2: Research Evidence Record
// ============================================================================

/**
 * Research evidence record - individual evidence items collected during research
 * Slice 3: Added optional validation field for comp validation results
 * Amazon Integration: Added Amazon-specific fields
 */
export interface ResearchEvidenceRecord {
  id: string;
  type: 'sold_listing' | 'active_listing' | 'product_page' | 'price_guide' | 'ai_analysis';
  source: 'ebay' | 'amazon' | 'keepa' | string; // Marketplace source
  sourceId?: string; // External ID from source (ASIN for Amazon)
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
  validation?: CompValidation; // Slice 3: Detailed validation result
  // Amazon-specific fields (available when source === 'amazon')
  asin?: string;
  keepaData?: {
    priceHistory30d: { min: number; max: number; avg: number };
    bsr: number;
    bsrTrend: 'rising' | 'falling' | 'stable';
  };
}

// ============================================================================
// Research Activity Log - Granular event tracking
// ============================================================================

/**
 * Type of activity logged during research execution
 */
export type ResearchActivityType =
  | 'step_started' | 'step_completed' | 'step_failed'
  | 'search_query' | 'search_results' | 'image_search'
  | 'web_search' | 'web_search_results'
  | 'product_identified' | 'upc_lookup'
  | 'item_updated'
  | 'comp_found' | 'comp_analyzed'
  | 'price_calculated' | 'demand_signal'
  | 'missing_info_detected' | 'results_persisted'
  | 'info' | 'warning' | 'error';

/**
 * Status of an activity log entry
 */
export type ResearchActivityStatus = 'success' | 'error' | 'warning' | 'info' | 'processing';

/**
 * Research activity log entry - granular event emitted during research execution
 * These are persisted to database and streamed via WebSocket for real-time UI updates
 */
export interface ResearchActivityLogEntry {
  id: string;
  researchRunId: string;
  itemId: string;
  type: ResearchActivityType;
  message: string;
  metadata?: Record<string, unknown>;  // Expandable JSON data (listings, product info, etc.)
  status: ResearchActivityStatus;
  stepId?: string;  // Links to checklist step (e.g., 'search_comps', 'analyze_media')
  timestamp: string; // ISO timestamp
}

// ============================================================================
// Web Search Types - Deep Product Identification
// ============================================================================

/**
 * Result from a single web search query
 */
export interface WebSearchResult {
  query: string;
  content: string;
  sources: string[];
  timestamp: string;
  error?: string;
}

/**
 * Discovered product data synthesized from web search results
 * Used to populate Item fields with high-confidence data
 */
export interface DiscoveredProductData {
  confidence: number; // 0-1 overall confidence score
  brand: string | null;
  model: string | null;
  mpn: string | null; // Manufacturer Part Number
  upc: string | null;
  title: string | null; // Suggested product title
  description: string | null; // Detailed product description
  category: string[]; // Category hierarchy
  condition: string | null;
  specifications: Record<string, string | number | boolean>;
  sources: string[]; // URLs of sources used
}

/**
 * Item update data derived from deep identification
 * Maps discovered data to Item entity fields
 */
export interface ItemUpdateFromResearch {
  title?: string;
  description?: string;
  condition?: string;
  categoryPath?: string[];
  attributes?: Array<{ key: string; value: string; source: 'ai' | 'user' | 'imported'; confidence?: number }>;
  aiConfidenceScore?: number;
}

// ============================================================================
// Agent Activity Feed - Operation-based event tracking for UI
// ============================================================================

/**
 * Operation types - each becomes a collapsible widget in the UI
 * These represent logical units of work (tool calls) in an agent flow
 */
export type AgentOperationType =
  | 'load_context'            // Loading item data and context
  | 'media_analysis'          // Analyzing photos/media with AI vision
  | 'ocr_extraction'          // Slice 2: Dedicated OCR text extraction from images
  | 'web_search'              // Web search for product information
  | 'product_identification'  // Identifying product details
  | 'upc_lookup'              // Looking up UPC/barcode data
  | 'category_detection'      // Slice 4: Detecting marketplace category
  | 'comp_search'             // Searching for comparable listings
  | 'comp_analysis'           // Analyzing comparable listings
  | 'price_calculation'       // Calculating price recommendations
  | 'demand_analysis'         // Analyzing market demand signals
  | 'listing_assembly'        // Slice 6: Assembling marketplace-ready listing
  | 'item_update'             // Updating item fields
  | 'persist_results'         // Saving research results
  | 'reasoning';              // AI thinking/decision blocks

/**
 * Event lifecycle types within an operation
 */
export type OperationEventType =
  | 'started'     // Operation has begun
  | 'progress'    // Streaming progress update
  | 'completed'   // Operation finished successfully
  | 'failed';     // Operation failed with error

/**
 * Operation status derived from events
 */
export type OperationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Agent operation event - groups related events by operationId
 * These are persisted to database and streamed via WebSocket for real-time UI updates
 *
 * The frontend groups events by operationId to render collapsible operation widgets
 */
export interface AgentOperationEvent {
  id: string;
  runId: string;                    // Generic run ID (researchRunId, chatSessionId, etc.)
  contextId: string;                // Generic context ID (itemId, etc.)
  operationId: string;              // Groups events for same operation
  operationType: AgentOperationType;
  eventType: OperationEventType;
  stepId?: string;                  // Links to checklist step (e.g., 'deep_identify', 'search_comps')
  title: string;                    // Short display title for the operation
  message?: string;                 // Longer description or progress message
  data?: Record<string, unknown>;   // Operation-specific payload (queries, results, etc.)
  timestamp: string;                // ISO timestamp
}

/**
 * Grouped operation for UI rendering
 * Computed on frontend by grouping AgentOperationEvents by operationId
 */
export interface GroupedOperation {
  operationId: string;
  operationType: AgentOperationType;
  status: OperationStatus;
  stepId?: string;
  title: string;
  summary?: string;                 // Computed from completed event message
  events: AgentOperationEvent[];    // All events for this operation, sorted by timestamp
  startedAt: string;
  completedAt?: string;
  error?: string;                   // Error message if failed
}

// ============================================================================
// Amazon/Keepa Integration Types
// ============================================================================

/**
 * Price history point from Keepa
 */
export interface KeepaPrice {
  timestamp: number; // Keepa time (minutes since 2011-01-01)
  price: number; // Price in cents
}

/**
 * Sales rank history point from Keepa
 */
export interface KeepaSalesRank {
  timestamp: number;
  rank: number;
}

/**
 * Keepa product data - historical pricing and sales data from Amazon
 * Retrieved via Keepa API for ASIN lookups
 */
export interface KeepaProductData {
  asin: string;
  title: string;
  brand?: string;
  manufacturer?: string;
  productGroup?: string;
  category: string[];
  salesRank: number | null;
  salesRankHistory: KeepaSalesRank[];
  priceHistory: {
    amazon: KeepaPrice[]; // Amazon direct price
    new: KeepaPrice[]; // New third-party offers
    used: KeepaPrice[]; // Used offers
    salesRank: KeepaPrice[]; // Sales rank over time
  };
  buyBoxPrice: number | null; // Current buy box price in cents
  buyBoxSeller: string | null;
  newOfferCount: number;
  usedOfferCount: number;
  reviewCount: number;
  rating: number; // 0-50 (multiply by 0.1 to get 0-5)
  imageUrls: string[];
  lastUpdate: string; // ISO timestamp
  rootCategory?: string;
  parentAsin?: string;
  variationCSV?: string;
}

/**
 * Keepa price statistics computed from history
 */
export interface KeepaPriceStats {
  current: number | null;
  avg30: number | null;
  avg90: number | null;
  min30: number | null;
  max30: number | null;
  min90: number | null;
  max90: number | null;
  dropChance: number; // Percentage chance of price drop based on history
}

/**
 * Keepa search result for UPC/EAN lookups
 */
export interface KeepaSearchResult {
  asin: string;
  title: string;
  domainId: number; // 1 = amazon.com
  trackingSince: number;
  type: 'product' | 'variation' | 'parent';
}

/**
 * Amazon demand signal with BSR data
 * Extends base DemandSignal with Amazon-specific metrics
 */
export interface AmazonDemandSignal {
  metric: 'bsr' | 'bsr_trend' | 'review_velocity' | 'offer_count';
  value: number;
  unit: string;
  period?: string;
  source: 'amazon' | 'keepa';
  bsr?: number;
  bsrCategory?: string;
  bsrTrend?: 'rising' | 'falling' | 'stable';
  reviewVelocity?: number; // Reviews per month
}

/**
 * Amazon product match result from UPC/keyword search
 */
export interface AmazonProductMatch {
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  salesRank?: number;
  price?: number;
  confidence: number; // 0-1
  source: 'sp-api' | 'keepa' | 'catalog-api' | 'identifier-lookup';
  /** How the product was matched (for UPC/EAN/keyword lookups) */
  matchedBy?: 'upc' | 'ean' | 'isbn' | 'keywords';
}

/**
 * Amazon pricing data (current prices)
 */
export interface AmazonPricing {
  asin: string;
  buyBoxPrice?: number;
  newPrice?: number;
  usedPrice?: number;
  fbaPrice?: number;
  fbmPrice?: number;
  /** Number of new offers */
  newOfferCount?: number;
  /** Number of used offers */
  usedOfferCount?: number;
  currency: string;
  lastUpdate: string;
}

/**
 * Combined Amazon research data for a product
 */
export interface AmazonResearchData {
  product: AmazonProductMatch;
  keepaData: KeepaProductData | null;
  currentPricing: AmazonPricing | null;
  priceStats: KeepaPriceStats | null;
}
