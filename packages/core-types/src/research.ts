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
  // Slice 4: Enhanced text chunks with classification
  textChunks?: TextChunk[];
}

/**
 * Text chunk region type
 * Slice 4: Where on the product the text was found
 */
export type TextChunkRegion = 'label' | 'tag' | 'packaging' | 'product' | 'unknown';

/**
 * Classified text chunk from OCR
 * Slice 4: OCR-to-Search Pipeline
 *
 * Each text chunk is classified to determine if it's likely a searchable identifier
 * (model number, SKU, etc.) vs descriptive text or noise.
 */
export interface TextChunk {
  /** The extracted text */
  text: string;
  /** Where on the product this was found */
  region: TextChunkRegion;
  /** Confidence in the extraction (0-1) */
  confidence: number;
  /** Whether this looks like a product identifier (model number, SKU, etc.) */
  isLikelyIdentifier: boolean;
  /** Pattern that matched if isLikelyIdentifier is true */
  matchedPattern?: string;
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
 * Slice 3 Update: Added matchType for tracking HOW each comp was matched
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
  // Slice 3: Match type tracking - how was this comp found?
  matchType?: CompMatchType;
  // Base confidence from match type (before validation adjustments)
  baseConfidence?: number;
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
  | 'reasoning'               // AI thinking/decision blocks
  // Field-Driven Research operations
  | 'initialize_field_states' // Initializing field states for research
  | 'extract_from_images'     // Extracting data from images (OCR + vision)
  | 'quick_lookups'           // Fast data lookups (UPC, Keepa)
  | 'evaluate_fields'         // Evaluating field completion
  | 'plan_next_research'      // Planning next research task
  | 'execute_research'        // Executing a research task
  | 'validate_readiness'      // Validating listing readiness
  // Slice 6: Identification Validation Checkpoint
  | 'validation_checkpoint';  // Validating identification against market evidence

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

// ============================================================================
// FIELD-DRIVEN RESEARCH SYSTEM
// New types for adaptive, field-level research with confidence tracking
// ============================================================================

/**
 * Extended source types for field data
 * Tracks where field values originated from
 */
export type FieldDataSourceType =
  | 'upc_lookup'              // UPC Database API
  | 'vision_ai'               // GPT-4o vision analysis
  | 'vision_analysis_guided'  // Category-specific guided vision
  | 'web_search'              // OpenAI web search (generic)
  | 'web_search_targeted'     // Field-specific web search
  | 'web_search_general'      // General product web search
  | 'reverse_image_search'    // Google Lens / visual similarity
  | 'keepa'                   // Keepa Amazon data
  | 'amazon_catalog'          // Amazon SP-API catalog
  | 'amazon_sp_api'           // Amazon SP-API (generic)
  | 'ebay_api'                // eBay Taxonomy/Browse API
  | 'ebay_sold'               // eBay sold listings
  | 'ebay_active'             // eBay active listings
  | 'user_input'              // User manually entered
  | 'ocr'                     // OCR text extraction
  | 'ocr_search'              // Search using OCR-extracted identifiers
  | 'user_hint'               // User provided hint during capture
  | 'product_page_extraction';  // Extracted from product page

/**
 * Source of field data with its contribution
 */
export interface FieldDataSource {
  type: FieldDataSourceType;
  confidence: number;     // How confident this source was (0-1)
  timestamp: string;      // ISO timestamp
  rawValue?: unknown;     // Original value before normalization
  query?: string;         // Search query if applicable
  cost?: number;          // Cost in USD for this lookup
}

/**
 * Confidence level for a single field
 */
export interface FieldConfidenceScore {
  value: number;              // 0-1 confidence score
  sources: FieldDataSource[]; // What contributed to this value
  lastUpdated: string;        // ISO timestamp
}

/**
 * State of a single field during research
 */
export interface FieldState {
  name: string;                       // Canonical field name (e.g., "brand", "material")
  displayName: string;                // Human-readable name (e.g., "Brand", "Material")
  value: unknown | null;              // Current best value
  confidence: FieldConfidenceScore;
  required: boolean;                  // Required by any target marketplace
  requiredBy: string[];               // Which marketplaces require this (e.g., ["ebay"])
  dataType: 'string' | 'number' | 'enum' | 'boolean' | 'array';
  allowedValues?: string[];           // For enum fields (from marketplace)
  mappedValue?: unknown;              // Value mapped to marketplace-specific format
  attempts: number;                   // How many times we've tried to research this
  status: 'pending' | 'researching' | 'complete' | 'failed' | 'user_required';
}

/**
 * Collection of all field states for an item
 */
export interface ItemFieldStates {
  fields: Record<string, FieldState>;

  // Computed metrics
  requiredFieldsComplete: number;     // Count of required fields with confidence >= threshold
  requiredFieldsTotal: number;        // Total required fields
  recommendedFieldsComplete: number;  // Count of recommended fields with confidence >= threshold
  recommendedFieldsTotal: number;     // Total recommended fields
  completionScore: number;            // 0-1 overall completion
  readyToPublish: boolean;            // All required fields meet threshold

  // Research tracking
  totalCost: number;                  // USD spent on research
  totalTimeMs: number;                // Time spent researching
  iterations: number;                 // Research loop iterations

  // Version for migrations
  version: string;
}

/**
 * Available research tools
 */
export type ResearchToolType =
  | 'vision_analysis'         // GPT-4o vision on images
  | 'vision_analysis_guided'  // Category-specific guided visual inspection
  | 'ocr_extraction'          // Text extraction from images
  | 'ocr_search'              // Search with OCR-extracted text that looks like identifiers
  | 'upc_lookup'              // UPC Database API
  | 'web_search_general'      // General product web search
  | 'web_search_targeted'     // Field-specific web search
  | 'web_search_iterative'    // Multi-strategy web search with query refinement
  | 'keepa_lookup'            // Keepa Amazon data
  | 'amazon_catalog'          // Amazon SP-API catalog
  // NOTE: ebay_comps is handled by search_comps node in Core Operations phase,
  // not as a field research tool. See buildFieldDrivenResearchGraph().
  | 'ebay_taxonomy'           // eBay category/aspects API
  | 'reverse_image_search'    // Google Lens / visual similarity search for identification
  | 'product_page_extraction' // Extract structured specs from product page URLs
  | 'domain_knowledge_lookup';  // Decode identifiers, check authenticity, detect value drivers

/**
 * Research tool metadata for planning
 */
export interface ResearchToolMetadata {
  type: ResearchToolType;
  displayName: string;
  description?: string;               // Human-readable description of what the tool does
  canProvideFields: string[];         // Fields this tool can help with ('*' = any)
  baseCost: number;                   // Base cost in USD
  baseTimeMs: number;                 // Base time in ms
  confidenceWeight: number;           // How much to trust this source (0-1)
  requiresFields?: string[];          // Fields needed to use this tool effectively
  priority: number;                   // Default priority (higher = try first)
}

/**
 * A single research task to execute
 */
export interface ResearchTask {
  id: string;
  targetFields: string[];             // Which fields we're trying to fill
  tool: ResearchToolType;             // Which tool to use
  query?: string;                     // Search query if applicable
  priority: number;                   // Higher = more important
  estimatedCost: number;              // Expected cost in USD
  estimatedTimeMs: number;            // Expected time
  reasoning: string;                  // Why we chose this task
}

/**
 * Research budget and constraints
 */
export interface ResearchConstraints {
  maxCostUsd: number;                 // Max spend per item
  maxTimeMs: number;                  // Max time per item
  maxIterations: number;              // Max research loop iterations
  requiredConfidence: number;         // Min confidence for required fields (0-1)
  recommendedConfidence: number;      // Min confidence for recommended fields (0-1)
  mode: 'fast' | 'balanced' | 'thorough';
}

/**
 * Result of evaluating field states
 */
export interface FieldEvaluationResult {
  decision: 'complete' | 'continue' | 'stop_with_warnings';
  reason: string;
  fieldsNeedingResearch: FieldState[];
  currentCompletionScore: number;
  budgetRemaining: number;
  iterationsRemaining: number;
}

/**
 * Result of executing a research task
 */
export interface ResearchTaskResult {
  task: ResearchTask;
  success: boolean;
  fieldUpdates: Array<{
    fieldName: string;
    value: unknown;
    source: FieldDataSource;
  }>;
  cost: number;
  timeMs: number;
  error?: string;
}

// ============================================================================
// TASK HISTORY TRACKING (Bulletproofing)
// Tracks tool attempts and failures to prevent infinite loops
// ============================================================================

/**
 * Maximum number of times to attempt a specific tool type per research run.
 * After this limit, the tool is considered exhausted.
 */
export const MAX_ATTEMPTS_PER_TOOL = 2;

/**
 * Maximum number of consecutive iterations with no field progress.
 * After this limit, research is considered stuck and should stop.
 */
export const MAX_CONSECUTIVE_NO_PROGRESS = 3;

/**
 * Tracks research task history to prevent infinite loops.
 * Used by the planner to skip failed/exhausted tools.
 */
export interface ResearchTaskHistory {
  /**
   * Number of times each tool has been attempted.
   * Key is tool type (e.g., 'web_search_targeted'), value is attempt count.
   */
  attemptsByTool: Partial<Record<ResearchToolType, number>>;

  /**
   * Tools that have failed to produce results and should be skipped.
   * A tool is added here if it returns no field updates after execution.
   */
  failedTools: ResearchToolType[];

  /**
   * Number of consecutive iterations without any field state changes.
   * Used for stuck detection - reset to 0 when progress is made.
   */
  consecutiveNoProgress: number;

  /**
   * Hash of the last field states, used for stuck detection.
   * If this doesn't change between iterations, we're not making progress.
   */
  lastFieldStatesHash: string | null;
}

// ============================================================================
// UNIVERSAL REQUIRED FIELDS & CANONICAL FIELD DEFINITIONS
// ============================================================================

/**
 * Fields that are ALWAYS required regardless of marketplace
 */
export const UNIVERSAL_REQUIRED_FIELDS: string[] = [
  'title',
  'description',
  'condition',
  'price',
  'category',
  // photos handled separately (not a "field")
];

/**
 * Canonical field definition
 */
export interface CanonicalFieldDefinition {
  displayName: string;
  dataType: 'string' | 'number' | 'enum' | 'boolean' | 'array';
  description: string;
  aliases: string[];  // Other names for this field across marketplaces
}

/**
 * Canonical field definitions
 * These are the "master" field names that map to marketplace-specific names
 */
export const CANONICAL_FIELDS: Record<string, CanonicalFieldDefinition> = {
  title: {
    displayName: 'Title',
    dataType: 'string',
    description: 'Product title for listing',
    aliases: ['name', 'product_name', 'listing_title'],
  },
  description: {
    displayName: 'Description',
    dataType: 'string',
    description: 'Product description',
    aliases: ['product_description', 'item_description'],
  },
  condition: {
    displayName: 'Condition',
    dataType: 'enum',
    description: 'Item condition',
    aliases: ['item_condition', 'product_condition'],
  },
  category: {
    displayName: 'Category',
    dataType: 'string',
    description: 'Product category',
    aliases: ['product_type', 'item_category'],
  },
  price: {
    displayName: 'Price',
    dataType: 'number',
    description: 'Listing price',
    aliases: ['list_price', 'sale_price'],
  },
  brand: {
    displayName: 'Brand',
    dataType: 'string',
    description: 'Product brand or manufacturer',
    aliases: ['manufacturer', 'make', 'brand_name'],
  },
  model: {
    displayName: 'Model',
    dataType: 'string',
    description: 'Model name or number',
    aliases: ['model_number', 'model_name', 'part_number'],
  },
  mpn: {
    displayName: 'MPN',
    dataType: 'string',
    description: 'Manufacturer Part Number',
    aliases: ['manufacturer_part_number', 'part_number'],
  },
  upc: {
    displayName: 'UPC',
    dataType: 'string',
    description: 'Universal Product Code (barcode)',
    aliases: ['ean', 'gtin', 'barcode', 'isbn'],
  },
  color: {
    displayName: 'Color',
    dataType: 'string',
    description: 'Primary color of the product',
    aliases: ['colour', 'color_name', 'finish'],
  },
  size: {
    displayName: 'Size',
    dataType: 'string',
    description: 'Size designation',
    aliases: ['size_type', 'dimensions', 'item_size'],
  },
  material: {
    displayName: 'Material',
    dataType: 'string',
    description: 'Primary material composition',
    aliases: ['fabric_type', 'composition', 'fabric', 'material_type'],
  },
  weight: {
    displayName: 'Weight',
    dataType: 'string',
    description: 'Product weight',
    aliases: ['item_weight', 'shipping_weight', 'package_weight'],
  },
  width: {
    displayName: 'Width',
    dataType: 'string',
    description: 'Product width dimension',
    aliases: ['item_width'],
  },
  height: {
    displayName: 'Height',
    dataType: 'string',
    description: 'Product height dimension',
    aliases: ['item_height'],
  },
  depth: {
    displayName: 'Depth',
    dataType: 'string',
    description: 'Product depth dimension',
    aliases: ['item_depth', 'length', 'item_length'],
  },
  style: {
    displayName: 'Style',
    dataType: 'string',
    description: 'Product style or design',
    aliases: ['design', 'style_name'],
  },
  pattern: {
    displayName: 'Pattern',
    dataType: 'string',
    description: 'Pattern or print design',
    aliases: ['print', 'pattern_type'],
  },
  capacity: {
    displayName: 'Capacity',
    dataType: 'string',
    description: 'Storage or volume capacity',
    aliases: ['storage_capacity', 'volume'],
  },
  connectivity: {
    displayName: 'Connectivity',
    dataType: 'string',
    description: 'Connection type (USB, Bluetooth, etc.)',
    aliases: ['connection_type', 'interface'],
  },
  power_source: {
    displayName: 'Power Source',
    dataType: 'string',
    description: 'Power source type',
    aliases: ['power_type', 'battery_type'],
  },
  vintage: {
    displayName: 'Vintage',
    dataType: 'boolean',
    description: 'Whether item is vintage',
    aliases: ['is_vintage', 'antique'],
  },
  year_manufactured: {
    displayName: 'Year Manufactured',
    dataType: 'string',
    description: 'Year the product was made',
    aliases: ['year', 'manufacture_year', 'production_year'],
  },
  country_of_origin: {
    displayName: 'Country of Origin',
    dataType: 'string',
    description: 'Country where product was manufactured',
    aliases: ['made_in', 'country_of_manufacture'],
  },
};

// ============================================================================
// RESEARCH TOOL REGISTRY
// ============================================================================

/**
 * Default research tools metadata
 * Used by ResearchPlannerService to select appropriate tools
 */
export const RESEARCH_TOOLS: ResearchToolMetadata[] = [
  {
    type: 'ocr_extraction',
    displayName: 'OCR Text Extraction',
    canProvideFields: ['brand', 'model', 'mpn', 'upc', 'size', 'year_manufactured'],
    baseCost: 0.005,
    baseTimeMs: 1000,
    confidenceWeight: 0.75,
    priority: 100, // Run first - fast and cheap
  },
  {
    type: 'ocr_search',
    displayName: 'OCR Text Search',
    description: 'Search with OCR-extracted text that looks like product identifiers',
    canProvideFields: ['brand', 'model', 'title', 'category', 'mpn'],
    baseCost: 0.03, // Multiple web searches
    baseTimeMs: 3000,
    confidenceWeight: 0.72, // 0.85 OCR * 0.85 search indirection
    requiresFields: [], // Can run if we have images with extractable text
    priority: 82, // After OCR extraction, before general web search
  },
  {
    type: 'vision_analysis',
    displayName: 'Vision AI Analysis',
    canProvideFields: ['brand', 'color', 'material', 'condition', 'size', 'category', 'style', 'pattern', 'vintage'],
    baseCost: 0.02,
    baseTimeMs: 3000,
    confidenceWeight: 0.70,
    priority: 90,
  },
  {
    type: 'vision_analysis_guided',
    displayName: 'Guided Visual Inspection',
    description: 'Category-specific visual inspection with expert knowledge of where to look',
    canProvideFields: ['brand', 'model', 'serial', 'year', 'color', 'size', 'material', 'condition', 'authenticity'],
    baseCost: 0.03, // Slightly more expensive due to larger prompt
    baseTimeMs: 4000,
    confidenceWeight: 0.82, // Higher than generic vision due to targeted inspection
    requiresFields: [], // Can run on any item with images, detects category automatically
    priority: 88, // Run after generic vision but before web search
  },
  {
    type: 'upc_lookup',
    displayName: 'UPC Database Lookup',
    canProvideFields: ['brand', 'model', 'title', 'category', 'upc', 'mpn'],
    baseCost: 0.001,
    baseTimeMs: 500,
    confidenceWeight: 0.95,
    requiresFields: ['upc'],
    priority: 95, // High priority if UPC available
  },
  {
    type: 'keepa_lookup',
    displayName: 'Keepa Amazon Data',
    canProvideFields: ['brand', 'model', 'title', 'category', 'price', 'weight', 'width', 'height', 'depth'],
    baseCost: 0.01,
    baseTimeMs: 2000,
    confidenceWeight: 0.90,
    requiresFields: ['upc'], // or ASIN
    priority: 85,
  },
  {
    type: 'web_search_general',
    displayName: 'General Web Search',
    canProvideFields: ['*'], // Can help with any field
    baseCost: 0.05,
    baseTimeMs: 4000,
    confidenceWeight: 0.65,
    requiresFields: ['brand'], // More effective with brand known
    priority: 50, // Lower priority - use when specific tools don't work
  },
  {
    type: 'web_search_targeted',
    displayName: 'Targeted Web Search',
    canProvideFields: ['*'], // Can research any specific field
    baseCost: 0.05,
    baseTimeMs: 4000,
    confidenceWeight: 0.70,
    requiresFields: ['brand', 'model'], // Best with known product
    priority: 60,
  },
  {
    type: 'web_search_iterative',
    displayName: 'Iterative Web Search',
    description: 'Multi-strategy web search with query refinement based on partial matches',
    canProvideFields: ['brand', 'model', 'mpn', 'title', 'description', 'category', 'specifications'],
    baseCost: 0.08, // Higher cost due to multiple iterations
    baseTimeMs: 8000, // Longer time due to refinement loops
    confidenceWeight: 0.78, // Higher than single-shot due to refinement
    requiresFields: [], // Can run with any data - adapts strategy
    priority: 75, // Between targeted and general
  },
  // NOTE: ebay_comps removed from field research tools.
  // Comp search is handled by search_comps node in Core Operations phase,
  // which runs AFTER the adaptive field research loop.
  // See buildFieldDrivenResearchGraph() in research-graph.builder.ts.
  {
    type: 'ebay_taxonomy',
    displayName: 'eBay Category API',
    canProvideFields: ['category'],
    baseCost: 0.001,
    baseTimeMs: 1000,
    confidenceWeight: 0.95,
    priority: 80,
  },
  {
    type: 'amazon_catalog',
    displayName: 'Amazon Catalog Lookup',
    canProvideFields: ['brand', 'model', 'title', 'category', 'color', 'size', 'material', 'weight'],
    baseCost: 0.02,
    baseTimeMs: 2500,
    confidenceWeight: 0.88,
    requiresFields: ['upc'],
    priority: 75,
  },
  {
    type: 'reverse_image_search',
    displayName: 'Visual Product Search',
    description: 'Find matching products using image similarity (Google Lens style)',
    canProvideFields: ['brand', 'model', 'title', 'category', 'price'],
    baseCost: 0.02,
    baseTimeMs: 3000,
    confidenceWeight: 0.85, // High confidence when match found
    requiresFields: [], // No prerequisites - can run on any item with images
    priority: 92, // High priority - often most effective for identification
  },
  {
    type: 'product_page_extraction',
    displayName: 'Product Page Extraction',
    description: 'Extract structured specifications from product page URLs found in research',
    canProvideFields: ['brand', 'model', 'mpn', 'upc', 'title', 'description', 'specifications', 'price', 'weight', 'dimensions'],
    baseCost: 0.03, // Fetch + LLM parsing
    baseTimeMs: 5000, // Page fetch + extraction
    confidenceWeight: 0.80, // Good confidence from structured data
    requiresFields: [], // Needs URLs from prior research (tracked separately)
    priority: 70, // After web search finds URLs
  },
  {
    type: 'domain_knowledge_lookup',
    displayName: 'Domain Knowledge Lookup',
    description: 'Decode date codes, style numbers, and other category-specific identifiers. Detect value drivers and check authenticity markers.',
    canProvideFields: ['year', 'year_manufactured', 'authenticity', 'value_multiplier'],
    baseCost: 0.001, // Pure computation, no API calls
    baseTimeMs: 100, // Very fast local computation
    confidenceWeight: 0.98, // High confidence - deterministic decoding
    requiresFields: [], // Can run if extractedIdentifiers exist
    priority: 96, // High priority - fast and cheap, run early
  },
];

/**
 * Default research constraints by mode
 */
export const RESEARCH_MODE_CONSTRAINTS: Record<'fast' | 'balanced' | 'thorough', Omit<ResearchConstraints, 'mode'>> = {
  fast: {
    maxCostUsd: 0.05,
    maxTimeMs: 15000,
    maxIterations: 2,
    requiredConfidence: 0.65,
    recommendedConfidence: 0.40,
  },
  balanced: {
    maxCostUsd: 0.25,
    maxTimeMs: 60000,
    maxIterations: 5,
    requiredConfidence: 0.70,
    recommendedConfidence: 0.50,
  },
  thorough: {
    maxCostUsd: 0.50,
    maxTimeMs: 180000,
    maxIterations: 8,
    requiredConfidence: 0.85,
    recommendedConfidence: 0.70,
  },
};

// =============================================================================
// GOAL-DRIVEN RESEARCH SYSTEM (Slice 1)
// =============================================================================

/**
 * Types of research goals in the goal-driven architecture.
 * Goals form a DAG with dependencies - IDENTIFY_PRODUCT must complete
 * before parallel goals can begin.
 */
export type GoalType =
  | 'IDENTIFY_PRODUCT'       // First phase: figure out what the item is
  | 'VALIDATE_IDENTIFICATION' // Confirm identification with additional sources
  | 'GATHER_METADATA'        // Collect UPC, ASIN, color, variant, etc.
  | 'RESEARCH_MARKET'        // Search comps, analyze pricing
  | 'ASSEMBLE_LISTING';      // Build final listing data

/**
 * Status of a research goal
 */
export type GoalStatus =
  | 'pending'      // Not yet started, waiting for dependencies
  | 'in_progress'  // Currently being worked on
  | 'completed'    // Successfully finished
  | 'failed'       // Failed after all attempts
  | 'skipped';     // Intentionally skipped (e.g., optional goal)

/**
 * A single research goal with tracking information
 */
export interface ResearchGoal {
  /** Unique identifier for this goal instance */
  id: string;

  /** The type of goal */
  type: GoalType;

  /** Current status */
  status: GoalStatus;

  /** Confidence level achieved (0-1) */
  confidence: number;

  /** Goal IDs that must complete before this can start */
  dependencies: string[];

  /** When the goal started */
  startedAt?: string;

  /** When the goal completed (success or failure) */
  completedAt?: string;

  /** Number of attempts made */
  attempts: number;

  /** Maximum attempts before marking as failed */
  maxAttempts: number;

  /** Error message if failed */
  errorMessage?: string;

  /** Minimum confidence required to consider complete */
  requiredConfidence: number;

  /** Results/outputs from this goal */
  result?: Record<string, unknown>;
}

/**
 * Match type for comp validation - determines base confidence weight
 * Higher weight = more trustworthy match
 */
export type CompMatchType =
  | 'UPC_EXACT'              // UPC/barcode matched exactly (0.95)
  | 'ASIN_EXACT'             // Amazon ASIN matched exactly (0.90)
  | 'EBAY_ITEM_ID'           // eBay item ID matched (0.90)
  | 'BRAND_MODEL_IMAGE'      // Brand+model match validated with image (0.85)
  | 'BRAND_MODEL_KEYWORD'    // Brand+model keyword match only (0.50) - needs image validation
  | 'IMAGE_SIMILARITY'       // Image-based match (0.65) - needs metadata validation
  | 'GENERIC_KEYWORD';       // Generic keyword search (0.30)

/**
 * Confidence weight multipliers for comp match types
 */
export const COMP_MATCH_TYPE_WEIGHTS: Record<CompMatchType, number> = {
  UPC_EXACT: 0.95,
  ASIN_EXACT: 0.90,
  EBAY_ITEM_ID: 0.90,
  BRAND_MODEL_IMAGE: 0.85,
  BRAND_MODEL_KEYWORD: 0.50,
  IMAGE_SIMILARITY: 0.65,
  GENERIC_KEYWORD: 0.30,
};

/**
 * Validation status for a comparable
 */
export type CompValidationStatus =
  | 'pending'           // Not yet validated
  | 'validated'         // Passed validation checks
  | 'failed'            // Failed validation - should be discarded or discounted
  | 'needs_image_check' // Keyword match needs image validation
  | 'needs_meta_check'; // Image match needs metadata validation

/**
 * Extended comparable with match type and validation tracking
 */
export interface ValidatedComparable {
  /** Original comparable data */
  listingId: string;
  title: string;
  price: number;
  currency: string;
  condition?: string;
  soldDate?: string;
  url?: string;
  imageUrl?: string;

  /** Match type that found this comp */
  matchType: CompMatchType;

  /** Base relevance score from search (0-1) */
  relevanceScore: number;

  /** Validation status */
  validationStatus: CompValidationStatus;

  /** Validation details */
  validation?: {
    /** Image similarity score if image validation was performed */
    imageSimilarityScore?: number;
    /** Metadata match details */
    metadataMatches?: {
      brand?: boolean;
      model?: boolean;
      condition?: boolean;
      category?: boolean;
    };
    /** Reason for failure if validation failed */
    failureReason?: string;
    /** When validation was performed */
    validatedAt?: string;
  };

  /** Final weighted confidence score */
  confidenceScore: number;

  /** Data source (ebay_sold, amazon, etc.) */
  dataSource: string;
}

/**
 * Tiered pricing confidence based on number and quality of comps
 * Slice 5: Added 'insufficient' tier for 0-2 comps
 */
export type PricingConfidenceTier = 'insufficient' | 'low' | 'recommended' | 'high';

/**
 * Thresholds for pricing confidence tiers
 * Based on validated comp count (comps with score >= 0.60)
 */
export const PRICING_CONFIDENCE_THRESHOLDS = {
  /** 0-2 validated comps = insufficient */
  insufficient: 0,
  /** 3-4 validated comps = low confidence */
  low: 3,
  /** 5-9 validated comps = recommended confidence */
  recommended: 5,
  /** 10+ validated comps = high confidence */
  high: 10,
};

/**
 * Human-readable labels for confidence tiers
 */
export const PRICING_CONFIDENCE_LABELS: Record<PricingConfidenceTier, { label: string; description: string }> = {
  insufficient: {
    label: 'Insufficient Data',
    description: 'Not enough comparable sales to determine accurate pricing. Consider manual research.',
  },
  low: {
    label: 'Low Confidence',
    description: 'Limited comparable data. Price estimate may vary significantly.',
  },
  recommended: {
    label: 'Recommended',
    description: 'Good amount of comparable data. Price estimate is reliable.',
  },
  high: {
    label: 'High Confidence',
    description: 'Excellent comparable data. Price estimate is highly accurate.',
  },
};

/**
 * Pricing analysis with tiered confidence
 */
export interface TieredPricingAnalysis {
  /** Suggested price */
  suggestedPrice: number;

  /** Price range */
  priceRange: {
    low: number;
    high: number;
  };

  /** Currency code */
  currency: string;

  /** Confidence tier */
  confidenceTier: PricingConfidenceTier;

  /** Overall confidence score (0-1) */
  confidence: number;

  /** Number of validated comps used */
  validatedCompCount: number;

  /** Average weighted confidence of comps */
  averageCompConfidence: number;

  /** Breakdown by match type */
  compsByMatchType: Record<CompMatchType, number>;

  /** Strategy used for calculation */
  strategy: 'competitive' | 'market_value' | 'premium' | 'quick_sale';

  /** Reasoning for the price recommendation */
  reasoning: string;
}

/**
 * Default goal configurations for initializing goals
 */
export const DEFAULT_GOAL_CONFIGS: Record<GoalType, Omit<ResearchGoal, 'id' | 'status' | 'confidence' | 'startedAt' | 'completedAt' | 'errorMessage' | 'result'>> = {
  IDENTIFY_PRODUCT: {
    type: 'IDENTIFY_PRODUCT',
    dependencies: [],
    attempts: 0,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  },
  VALIDATE_IDENTIFICATION: {
    type: 'VALIDATE_IDENTIFICATION',
    dependencies: [], // Will be set to IDENTIFY_PRODUCT goal ID
    attempts: 0,
    maxAttempts: 2,
    requiredConfidence: 0.90,
  },
  GATHER_METADATA: {
    type: 'GATHER_METADATA',
    dependencies: [], // Will be set to IDENTIFY_PRODUCT goal ID
    attempts: 0,
    maxAttempts: 3,
    requiredConfidence: 0.70,
  },
  RESEARCH_MARKET: {
    type: 'RESEARCH_MARKET',
    dependencies: [], // Will be set to IDENTIFY_PRODUCT goal ID
    attempts: 0,
    maxAttempts: 3,
    requiredConfidence: 0.75,
  },
  ASSEMBLE_LISTING: {
    type: 'ASSEMBLE_LISTING',
    dependencies: [], // Will be set to GATHER_METADATA and RESEARCH_MARKET goal IDs
    attempts: 0,
    maxAttempts: 2,
    requiredConfidence: 0.80,
  },
};

// =============================================================================
// PLANNING PHASE (Pre-Act Pattern) - Slice 2
// =============================================================================

/**
 * A single tool in the research plan sequence
 */
export interface ToolSequenceItem {
  /** Tool name (e.g., 'upc_lookup', 'web_search', 'keepa') */
  tool: string;
  /** Inputs required for the tool */
  inputs: string;
  /** What we expect to get from this tool */
  expectedYield: string;
  /** Priority (1 = highest) */
  priority?: number;
}

/**
 * A challenge identified during planning and its mitigation strategy
 */
export interface ResearchChallenge {
  /** Description of the risk */
  risk: string;
  /** How to handle this risk */
  mitigation: string;
}

/**
 * Visual assessment from analyzing item images
 */
export interface VisualAssessment {
  /** Likely product category */
  category: string | null;
  /** Brand indicators spotted in images */
  brandIndicators: string[];
  /** Estimated condition from visual inspection */
  conditionEstimate: string | null;
  /** Text visible in images (model numbers, labels, tags) */
  visibleText: string[];
}

/**
 * Strategy for identifying the product
 */
export interface IdentificationStrategy {
  /** Primary approach to identify product */
  primaryApproach: string;
  /** Fallback approaches if primary fails */
  fallbackApproaches: string[];
  /** Expected confidence level for identification (0-1) */
  expectedConfidence: number;
}

/**
 * Success criteria for the research
 */
export interface ResearchSuccessCriteria {
  /** What constitutes successful identification */
  identification: string;
  /** Minimum fields required for a good listing */
  minimumFields: string[];
}

// =============================================================================
// REVERSE IMAGE SEARCH TYPES (Slice 1 - Research Quality Improvement)
// =============================================================================

/**
 * Provider types for reverse image search
 */
export type ReverseImageSearchProvider =
  | 'google_cloud_vision'  // Google Cloud Vision Web Detection (primary - official API)
  | 'serpapi_google_lens'  // SerpApi Google Lens (backup)
  | 'bing_visual_search'   // Bing Visual Search API (backup)
  | 'openai_vision_web';   // OpenAI Vision + Web Search (fallback)

/**
 * A single visual match result from reverse image search
 */
export interface VisualSearchMatch {
  /** Product name/title from the match */
  title: string;
  /** Brand if identified */
  brand?: string;
  /** Model if identified */
  model?: string;
  /** Product category */
  category?: string;
  /** How confident the match is (0-1) */
  confidence: number;
  /** URL of the source page */
  sourceUrl: string;
  /** URL of the matching image */
  matchingImageUrl?: string;
  /** Price if found */
  price?: number;
  /** Currency for the price */
  currency?: string;
  /** Price range if available */
  priceRange?: { min: number; max: number };
  /** Source domain (e.g., "amazon.com", "ebay.com") */
  sourceDomain?: string;
  /** Additional extracted attributes */
  attributes?: Record<string, string>;
}

/**
 * Result from reverse image search service
 */
export interface ReverseImageSearchResult {
  /** Which provider returned this result */
  provider: ReverseImageSearchProvider;
  /** The image URL that was searched */
  searchedImageUrl: string;
  /** Visual matches found */
  matches: VisualSearchMatch[];
  /** Best match (highest confidence) */
  bestMatch?: VisualSearchMatch;
  /** Overall confidence in identification (0-1) */
  confidence: number;
  /** Whether the search was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Time taken in milliseconds */
  durationMs: number;
  /** Timestamp of the search */
  timestamp: string;
  /** Whether result came from cache */
  cached?: boolean;
}

/**
 * Complete research plan generated by the planning phase
 * Uses Pre-Act Pattern: plan before acting improves accuracy 20-40%
 */
export interface ResearchPlan {
  /** Visual assessment of the item from images */
  visualAssessment: VisualAssessment;

  /** Strategy for identifying the product */
  identificationStrategy: IdentificationStrategy;

  /** Sequence of tools to use and their expected yields */
  toolSequence: ToolSequenceItem[];

  /** Anticipated challenges and mitigations */
  challenges: ResearchChallenge[];

  /** Success criteria for this research */
  successCriteria: ResearchSuccessCriteria;

  /** When the plan was generated */
  generatedAt: string;

  /** Reasoning summary (~1000 tokens) */
  reasoning?: string;
}

// =============================================================================
// CATEGORY INSPECTION GUIDES (Slice 2 - Research Quality Improvement)
// =============================================================================

/**
 * Category identifier for inspection guides
 * Used to match items to appropriate inspection guides
 */
export type CategoryId =
  | 'luxury_handbags'
  | 'sneakers'
  | 'vintage_denim'
  | 'watches'
  | 'electronics_phones'
  | 'electronics_computers'
  | 'electronics_gaming'
  | 'designer_clothing'
  | 'vintage_tshirts'
  | 'trading_cards'
  | 'vinyl_records'
  | 'collectible_toys'
  | 'jewelry'
  | 'art_prints'
  | 'camera_equipment'
  | 'audio_equipment'
  | 'sporting_goods'
  | 'musical_instruments'
  | 'tools_equipment'
  | 'general';

/**
 * A specific region on a product to inspect
 * Tells the AI exactly where to look and what to extract
 */
export interface InspectionRegion {
  /** Name of the region (e.g., "Interior Label", "Case Back") */
  name: string;
  /** Human-readable description of where this region is */
  description: string;
  /** Specific things to look for in this region */
  lookFor: string[];
  /** Example prompt to guide the AI for this region */
  examplePrompt: string;
  /** Priority of this region (higher = more important) */
  priority?: number;
  /** Fields this region can help identify */
  canProvideFields?: string[];
}

/**
 * A specific identifying feature for a category
 * Contains decoding information for codes, patterns, etc.
 */
export interface IdentifyingFeature {
  /** Name of the feature (e.g., "Date Code", "Style Number") */
  feature: string;
  /** Description of how to decode this feature */
  description?: string;
  /** Pattern format explanation */
  decodingPattern?: string;
  /** Example values */
  example?: string;
  /** Regular expression to match this feature */
  matchPattern?: string;
}

/**
 * Brand-specific identification information
 */
export interface BrandGuide {
  /** Brand name */
  brand: string;
  /** Things that identify this brand */
  identifiers: string[];
  /** Known model/style patterns */
  modelPatterns?: string[];
  /** Common authenticity markers */
  authenticityMarkers?: string[];
  /** Typical price range for this brand */
  priceRange?: { min: number; max: number };
}

/**
 * Authenticity marker for luxury/collectible items
 */
export interface AuthenticityMarker {
  /** Name of the marker */
  name: string;
  /** What to look for */
  description: string;
  /** How important this is for authentication */
  importance: 'critical' | 'important' | 'helpful';
  /** Brands this applies to */
  applicableBrands?: string[];
}

/**
 * Complete category inspection guide
 * Contains everything needed for category-specific visual inspection
 */
export interface CategoryInspectionGuide {
  /** Unique category identifier */
  categoryId: CategoryId;
  /** Human-readable category name */
  categoryName: string;
  /** Keywords that might indicate this category */
  categoryKeywords: string[];
  /** Specific regions to inspect */
  inspectionRegions: InspectionRegion[];
  /** Identifying features unique to this category */
  identifyingFeatures: IdentifyingFeature[];
  /** Brand-specific guidance for common brands */
  commonBrands: BrandGuide[];
  /** Attributes that significantly affect value */
  valueDrivers: string[];
  /** Authenticity markers (for luxury/collectible items) */
  authenticityMarkers?: AuthenticityMarker[];
  /** System prompt additions for this category */
  systemPromptAdditions?: string;
  /** Typical fields this category needs */
  typicalFields?: string[];
}

/**
 * Result from category detection
 */
export interface CategoryDetectionResult {
  /** Detected category ID */
  categoryId: CategoryId;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Reasoning for this detection */
  reasoning?: string;
  /** Alternative categories considered */
  alternatives?: Array<{ categoryId: CategoryId; confidence: number }>;
}

/**
 * Result from guided vision analysis
 */
export interface GuidedVisionAnalysisResult {
  /** Category used for analysis */
  categoryId: CategoryId;
  /** Results from each inspection region */
  regionResults: RegionAnalysisResult[];
  /** Extracted identifiers (model numbers, codes, etc.) */
  extractedIdentifiers: ExtractedIdentifier[];
  /** Overall confidence in the analysis */
  confidence: number;
  /** Summary of findings */
  summary: string;
  /** Raw extracted text from all regions */
  allExtractedText: string[];
}

/**
 * Result from analyzing a single region
 */
export interface RegionAnalysisResult {
  /** Region that was analyzed */
  regionName: string;
  /** Whether the region was found */
  found: boolean;
  /** Extracted text from this region */
  extractedText: string[];
  /** Identified values (brand, model, etc.) */
  identifiedValues: Record<string, string>;
  /** Confidence in this region's results */
  confidence: number;
  /** Notes about this region */
  notes?: string;
}

/**
 * An extracted identifier (model number, serial, code, etc.)
 */
export interface ExtractedIdentifier {
  /** Type of identifier */
  type: 'model_number' | 'serial_number' | 'date_code' | 'style_number' | 'upc' | 'sku' | 'other';
  /** The extracted value */
  value: string;
  /** Where this was found */
  source: string;
  /** Confidence in extraction */
  confidence: number;
  /** Decoded meaning (if applicable) */
  decoded?: Record<string, string>;
}

// =============================================================================
// ITERATIVE SEARCH REFINEMENT (Slice 3 - Research Quality Improvement)
// =============================================================================

/**
 * Search strategy types for iterative search refinement
 * Each strategy represents a different approach to finding product information
 */
export type IterativeSearchStrategy =
  | 'exact_identifier'    // Search with extracted model numbers/SKUs (highest precision)
  | 'brand_model'         // Search with brand + model combination
  | 'ocr_text'            // Search with raw OCR text chunks
  | 'descriptive'         // Search with category + attributes (broadest)
  | 'refined';            // Search with signals from previous iterations

/**
 * A signal extracted from search results that guides query refinement
 * These hints help generate better follow-up queries
 */
export interface RefinementSignal {
  /** Type of signal found */
  type: 'found_brand' | 'found_model' | 'found_variant' | 'found_category' | 'price_cluster' | 'no_results' | 'ambiguous_results';
  /** The extracted value */
  value: string;
  /** Confidence in this signal (0-1) */
  confidence: number;
  /** Source URLs where this was found */
  sourceUrls?: string[];
  /** Additional context about the signal */
  context?: string;
}

/**
 * A single search iteration with its results and refinement signals
 */
export interface SearchIteration {
  /** Which strategy was used */
  strategy: IterativeSearchStrategy;
  /** The query that was executed */
  query: string;
  /** Search results */
  results: WebSearchResult[];
  /** Signals extracted from results for refinement */
  refinementSignals: RefinementSignal[];
  /** Whether this iteration found a strong match */
  hasStrongMatch: boolean;
  /** Iteration number (1-based) */
  iterationNumber: number;
  /** Time taken in milliseconds */
  durationMs: number;
}

/**
 * Product identification extracted from iterative search
 */
export interface IterativeSearchIdentification {
  /** Brand identified */
  brand?: string;
  /** Model identified */
  model?: string;
  /** MPN if found */
  mpn?: string;
  /** UPC if found */
  upc?: string;
  /** Suggested title */
  title?: string;
  /** Suggested description */
  description?: string;
  /** Category path */
  category?: string[];
  /** Additional specifications */
  specifications?: Record<string, string | number | boolean>;
  /** Source URLs that contributed to this identification */
  sourceUrls: string[];
}

/**
 * Complete result from iterative search service
 */
export interface IterativeSearchResult {
  /** Product identification if found */
  identification: IterativeSearchIdentification | null;
  /** All iterations performed */
  iterations: SearchIteration[];
  /** Total number of searches executed */
  totalSearches: number;
  /** Overall confidence in the identification (0-1) */
  confidence: number;
  /** Best strategy that produced results */
  bestStrategy?: IterativeSearchStrategy;
  /** Whether search was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Total time taken in milliseconds */
  totalDurationMs: number;
  /** Total cost in USD */
  totalCost: number;
}

/**
 * Context for iterative search
 * Contains all available data to guide search strategies
 */
export interface IterativeSearchContext {
  /** Item ID for logging */
  itemId: string;
  /** Organization ID */
  organizationId: string;
  /** Extracted identifiers (model numbers, SKUs) from OCR/vision */
  extractedIdentifiers: string[];
  /** Brand if already known */
  brand?: string;
  /** Model if already known */
  model?: string;
  /** Category if already known */
  category?: string;
  /** Color if known */
  color?: string;
  /** Size if known */
  size?: string;
  /** MPN if known */
  mpn?: string;
  /** UPC if known */
  upc?: string;
  /** Raw OCR text chunks for search */
  ocrTextChunks?: string[];
  /** Visual description from image analysis */
  visualDescription?: string;
  /** Current field values for context */
  currentFields?: Record<string, unknown>;
}

// =============================================================================
// SLICE 5: STRUCTURED COMP ATTRIBUTE MATCHING
// Category-aware attribute weights for more accurate comp scoring
// =============================================================================

/**
 * Structured attributes extracted from comps for attribute-level matching.
 * These are the normalized attributes used for scoring.
 */
export interface CompAttributes {
  brand?: string;
  model?: string;
  variant?: string;
  size?: string;
  color?: string;
  year?: number;
  condition?: string;
  edition?: string;    // "OG", "Retro", "Limited", etc.
  gender?: string;
  material?: string;
  storage?: string;    // For electronics (e.g., "256GB")
  colorway?: string;   // For sneakers (e.g., "Infrared")
  refNumber?: string;  // For watches (e.g., "116500LN")
  grade?: string;      // For trading cards (e.g., "PSA 10")
}

/**
 * Result of matching a single attribute between item and comp.
 * Provides detailed breakdown of how each attribute contributes to score.
 */
export interface AttributeMatchResult {
  /** Attribute name (e.g., "brand", "colorway") */
  attribute: string;
  /** Value from the item being listed */
  itemValue: string | null;
  /** Value from the comparable listing */
  compValue: string | null;
  /** Type of match achieved */
  matchType: 'exact' | 'partial' | 'missing' | 'mismatch';
  /** Importance weight for this attribute (0-1, category-specific) */
  importance: number;
  /** Calculated contribution to score (importance * match_score) */
  scoreImpact: number;
}

/**
 * Category-specific weights for comp validation and scoring.
 * Different categories prioritize different attributes.
 * E.g., sneakers weight colorway heavily; watches weight reference number.
 */
export interface CategoryAttributeWeights {
  /** Category this weight set applies to */
  categoryId: CategoryId;

  /**
   * Weights for main validation criteria.
   * Used in calculateOverallScore() for comp validation.
   * Must sum to 1.0 for proper normalization.
   */
  validationWeights: {
    brand: number;       // Brand match importance
    model: number;       // Model match importance
    variant: number;     // Variant/colorway match importance
    condition: number;   // Condition match importance
    recency: number;     // How recent the sale was
    priceOutlier: number; // Price deviation penalty
  };

  /**
   * Importance weights for variant sub-attributes.
   * Used when breaking down variant match scoring.
   * Higher values = more important for this category.
   */
  variantImportance: {
    color: number;       // Color importance
    size: number;        // Size importance
    edition: number;     // Edition/release importance
    material: number;    // Material importance
    year: number;        // Year/age importance
    colorway?: number;   // Sneaker colorway (overrides color)
    storage?: number;    // Electronics storage capacity
    refNumber?: number;  // Watch reference number
    grade?: number;      // Trading card grade
  };

  /**
   * Score boosts applied when attributes match.
   * Used in scoreCompRelevanceHeuristic() for quick relevance scoring.
   */
  matchBoosts: {
    brand: number;       // Boost for brand match
    model: number;       // Boost for model match
    condition: number;   // Boost for condition match
    variant: number;     // Boost for variant match
  };
}

// =============================================================================
// SLICE 6: IDENTIFICATION VALIDATION CHECKPOINT
// Validates identification against market evidence before pricing
// =============================================================================

/**
 * Type of validation issue detected during identification checkpoint
 */
export type ValidationIssueType =
  | 'price_mismatch'           // Comp prices don't match expected range
  | 'no_matching_comps'        // Found comps but none match well
  | 'attribute_inconsistency'  // Extracted attributes don't make sense together
  | 'visual_mismatch'          // Item doesn't look like matched comps
  | 'low_comp_quality'         // Comps are low relevance/confidence
  | 'category_mismatch';       // Comps suggest different category

/**
 * Severity of validation issue
 */
export type ValidationSeverity = 'info' | 'warning' | 'error';

/**
 * Individual validation issue found during checkpoint
 */
export interface ValidationIssue {
  /** Type of issue detected */
  type: ValidationIssueType;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable description of the issue */
  message: string;
  /** Evidence supporting the issue */
  evidence: {
    /** Expected value or range */
    expected?: unknown;
    /** Actual observed value */
    actual?: unknown;
    /** Additional details */
    details?: Record<string, unknown>;
  };
}

/**
 * Hint to guide re-identification when validation fails
 */
export interface ReidentificationHint {
  /** Type of hint */
  type:
    | 'exclude_brand'       // Current brand seems wrong
    | 'exclude_model'       // Current model seems wrong
    | 'try_category'        // Try a different category
    | 'use_comp_suggestion' // Use terms from comp titles
    | 'search_different';   // Try broader/different search
  /** Value associated with the hint */
  value: string;
  /** Reason for this hint */
  reason: string;
  /** Confidence in this hint (0-1) */
  confidence: number;
}

/**
 * Result of the identification validation checkpoint.
 * Determines whether to proceed with pricing or re-identify.
 */
export interface ValidationCheckResult {
  /** Whether identification passed validation */
  isValid: boolean;
  /** Overall confidence in the validation (0-1) */
  confidence: number;
  /** All issues found during validation */
  issues: ValidationIssue[];
  /** Whether we should attempt re-identification */
  shouldReidentify: boolean;
  /** Hints for re-identification if needed */
  reidentificationHints?: ReidentificationHint[];
  /** Summary statistics */
  stats: {
    /** Total number of validation checks run */
    totalChecks: number;
    /** Number of checks that passed */
    passedChecks: number;
    /** Number of warnings */
    warningCount: number;
    /** Number of errors */
    errorCount: number;
  };
}

// =============================================================================
// Slice 7: Cross-Source Validation Types
// =============================================================================

/**
 * Source independence groups
 * Sources in the same group are NOT independent (derived from same underlying data)
 *
 * Used to determine corroboration - two sources in the SAME group don't count
 * as independent corroboration because they draw from the same data pool.
 */
export type SourceIndependenceGroup =
  | 'amazon'          // amazon_catalog, keepa, amazon_sp_api - All Amazon ecosystem
  | 'vision'          // vision_ai, vision_analysis_guided - Same vision model
  | 'text_extraction' // ocr, ocr_search - OCR-based extraction
  | 'ebay'            // ebay_sold, ebay_active, ebay_api - All eBay ecosystem
  | 'web'             // web_search_*, reverse_image_search - General web sources
  | 'user'            // user_input, user_hint - User-provided data
  | 'upc';            // upc_lookup - Standalone authoritative source

/**
 * Mapping from FieldDataSourceType to independence group
 */
export const SOURCE_TO_GROUP: Record<FieldDataSourceType, SourceIndependenceGroup> = {
  // Amazon ecosystem
  amazon_catalog: 'amazon',
  keepa: 'amazon',
  amazon_sp_api: 'amazon',

  // Vision AI
  vision_ai: 'vision',
  vision_analysis_guided: 'vision',

  // Text extraction
  ocr: 'text_extraction',
  ocr_search: 'text_extraction',

  // eBay ecosystem
  ebay_sold: 'ebay',
  ebay_active: 'ebay',
  ebay_api: 'ebay',

  // Web search sources
  web_search: 'web',
  web_search_targeted: 'web',
  web_search_general: 'web',
  reverse_image_search: 'web',

  // User provided
  user_input: 'user',
  user_hint: 'user',

  // Authoritative sources (standalone)
  upc_lookup: 'upc',

  // Product page extraction (web source)
  product_page_extraction: 'web',
};

/**
 * Conflict between sources for a field value
 * Indicates that two independent sources disagree on a value
 */
export interface FieldConflict {
  /** Field name where conflict occurred */
  fieldName: string;
  /** First conflicting value */
  value1: unknown;
  /** Source type of first value */
  source1: FieldDataSourceType;
  /** Independence group of first source */
  group1: SourceIndependenceGroup;
  /** Second conflicting value */
  value2: unknown;
  /** Source type of second value */
  source2: FieldDataSourceType;
  /** Independence group of second source */
  group2: SourceIndependenceGroup;
  /** Severity of the conflict */
  severity: 'minor' | 'major';
  /** When conflict was detected */
  timestamp: string;
}

/**
 * Cross-validated field with corroboration information
 * Shows how confidence was adjusted based on source agreement
 */
export interface CrossValidatedField {
  /** Field name */
  fieldName: string;
  /** Current field value */
  value: unknown;
  /** Confidence before cross-validation adjustments */
  baseConfidence: number;
  /** Confidence after applying corroboration multiplier */
  crossValidatedConfidence: number;
  /** All sources that contributed to this field */
  sources: FieldDataSource[];
  /** Number of unique independence groups */
  independentGroupCount: number;
  /** Agreement score (0-1, 1 = perfect agreement) */
  agreementScore: number;
  /** Detected conflicts between sources */
  conflicts: FieldConflict[];
  /** Multiplier applied (0.8 for single source, up to 1.1 for corroboration) */
  corroborationMultiplier: number;
}

/**
 * Cross-validation result for all fields in an item
 */
export interface CrossValidationResult {
  /** Cross-validation details per field */
  fields: Record<string, CrossValidatedField>;
  /** Total conflicts detected across all fields */
  totalConflicts: number;
  /** Average corroboration multiplier across fields */
  averageCorroboration: number;
  /** Count of fields with 2+ independent source groups */
  fieldsWithMultipleIndependentSources: number;
}

// =============================================================================
// Slice 9: Domain Knowledge Database Types
// Decoders, value drivers, and authenticity checking
// =============================================================================

/**
 * Base interface for decoded identifier values
 * All decoder results extend this base type
 */
export interface DecodedValue {
  /** Original raw value that was decoded */
  rawValue: string;
  /** Type of identifier (e.g., 'lv_date_code', 'nike_style_code') */
  identifierType: string;
  /** Whether decoding was successful */
  success: boolean;
  /** Confidence in the decoded result (0-1) */
  confidence: number;
  /** Decoded key-value pairs (supports primitives and string arrays) */
  decoded: Record<string, string | number | boolean | string[]>;
  /** Error message if decoding failed */
  error?: string;
  /** Name of decoder function used */
  decoderUsed?: string;
}

/**
 * Decoded Louis Vuitton date code
 * Format: AA#### (e.g., "SD1234" = San Dimas factory, week 12, year 2034)
 */
export interface DecodedLVDateCode extends DecodedValue {
  identifierType: 'lv_date_code';
  decoded: {
    /** Two-letter factory code (e.g., "SD") */
    factoryCode: string;
    /** Factory location name (e.g., "San Dimas, California") */
    factoryLocation: string;
    /** Country where factory is located */
    factoryCountry: string;
    /** Week of manufacture (1-52) */
    week: number;
    /** Year of manufacture (4-digit) */
    year: number;
    /** Era of date code format */
    era: 'pre-2007' | 'post-2007';
    /** Whether the format is valid for Louis Vuitton */
    isValidFormat: boolean;
  };
}

/**
 * Decoded Hermes blindstamp year code
 * Single letter A-Z indicates year (with cycles)
 */
export interface DecodedHermesBlindstamp extends DecodedValue {
  identifierType: 'hermes_blindstamp';
  decoded: {
    /** Single letter year code */
    yearLetter: string;
    /** Decoded year */
    year: number;
    /** Whether format is valid */
    isValidFormat: boolean;
    /** Whether stamp had square bracket (indicates cycle) */
    hasSquare?: boolean;
  };
}

/**
 * Decoded Nike style code
 * Format: XXXXXX-XXX (e.g., "CW2288-111")
 */
export interface DecodedNikeStyleCode extends DecodedValue {
  identifierType: 'nike_style_code';
  decoded: {
    /** Model code portion (e.g., "CW2288") */
    modelCode: string;
    /** Colorway code portion (e.g., "111") */
    colorwayCode: string;
    /** Full style code */
    fullStyleCode: string;
    /** Whether format is valid */
    isValidFormat: boolean;
  };
}

/**
 * Decoded Rolex reference number
 * Reference numbers map to specific model families
 */
export interface DecodedRolexReference extends DecodedValue {
  identifierType: 'rolex_reference';
  decoded: {
    /** Reference number */
    referenceNumber: string;
    /** Model family (e.g., "Submariner") */
    modelFamily?: string;
    /** Specific model name (e.g., "Submariner Date") */
    modelName?: string;
    /** Case material (e.g., "Stainless Steel") */
    material?: string;
    /** Whether reference is in known database */
    isValidReference: boolean;
  };
}

/**
 * Vintage denim analysis result
 * Detects Big E, selvedge, Made in USA indicators
 */
export interface VintageDenimAnalysis extends DecodedValue {
  identifierType: 'vintage_denim';
  decoded: {
    /** Whether "LEVI'S" has capital E (pre-1971) */
    isBigE: boolean;
    /** Whether selvedge denim is detected */
    isSelvedge: boolean;
    /** Whether "Made in USA" is present */
    isMadeInUSA: boolean;
    /** Estimated production era */
    estimatedEra?: string;
    /** Value indicators found */
    valueIndicators: string[];
  };
}

/**
 * Value driver definition
 * Identifies price-affecting attributes for specific categories
 */
export interface ValueDriver {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Attribute this driver affects (e.g., "label_type", "material") */
  attribute: string;
  /** Category this driver applies to */
  categoryId: CategoryId;
  /** Specific brands this applies to (optional) */
  applicableBrands?: string[];
  /** Description of what makes this valuable */
  description: string;
  /** Condition/pattern to check for this driver */
  checkCondition: string;
  /** Price multiplier when detected (e.g., 5.0 = 5x price) */
  priceMultiplier: number;
  /** Priority for evaluation (higher = check first) */
  priority: number;
}

/**
 * Result of matching a value driver
 */
export interface ValueDriverMatch {
  /** The matched driver */
  driver: ValueDriver;
  /** The value that matched */
  matchedValue: string;
  /** Confidence in the match (0-1) */
  confidence: number;
  /** Explanation of why this matched */
  reasoning: string;
}

/**
 * Definition of an authenticity marker
 * Used to validate that items are genuine
 */
export interface AuthenticityMarkerDef {
  /** Unique identifier */
  id: string;
  /** Name of the marker */
  name: string;
  /** Brands this marker applies to */
  brands: string[];
  /** Category this applies to */
  categoryId: CategoryId;
  /** Description of what to check */
  checkDescription: string;
  /** How important this is for authentication */
  importance: 'critical' | 'important' | 'helpful';
  /** Regex pattern to validate format (if applicable) */
  pattern?: string;
  /** Whether a match indicates authentic (true) or potential fake (false) */
  indicatesAuthentic: boolean;
}

/**
 * Result of checking a single authenticity marker
 */
export interface AuthenticityMarkerCheckResult {
  /** Marker that was checked */
  marker: AuthenticityMarkerDef;
  /** Whether the check passed */
  passed: boolean;
  /** Confidence in this check (0-1) */
  confidence: number;
  /** Details about what was found */
  details: string;
  /** The value that was checked */
  checkedValue?: string;
}

/**
 * Complete authenticity check result
 */
export interface AuthenticityCheckResult {
  /** Overall assessment */
  assessment: 'likely_authentic' | 'uncertain' | 'likely_fake' | 'insufficient_data';
  /** Overall confidence (0-1) */
  confidence: number;
  /** All markers that were checked */
  markersChecked: AuthenticityMarkerCheckResult[];
  /** Human-readable summary */
  summary: string;
  /** Warning messages */
  warnings: string[];
}
