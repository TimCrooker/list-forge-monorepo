/**
 * Result from AI vision analysis of product photos
 */
export interface VisionExtractResult {
  /** Product category (e.g., "Electronics", "Clothing") */
  category: string;

  /** Brand name if identified */
  brand: string | null;

  /** Model name/number if identified */
  model: string | null;

  /** Condition assessment (e.g., "New", "Like New", "Good") */
  condition: string;

  /** Additional extracted attributes */
  attributes: ExtractedAttributes;

  /** AI-generated description from photos */
  description: string;
}

/**
 * Extracted product attributes from vision analysis
 */
export interface ExtractedAttributes {
  /** Product color(s) */
  color?: string;

  /** Product size */
  size?: string;

  /** Material type */
  material?: string;

  /** Product dimensions */
  dimensions?: string;

  /** Weight */
  weight?: string;

  /** Any additional attributes */
  [key: string]: string | number | boolean | undefined;
}

/**
 * AI-generated listing content
 */
export interface GeneratedListingContent {
  /** Listing title */
  title: string;

  /** Full description */
  description: string;

  /** Bullet points highlighting features */
  bulletPoints: string[];
}

/**
 * Price statistics from comp research
 */
export interface PriceStatistics {
  /** Minimum price found */
  min: number;

  /** Maximum price found */
  max: number;

  /** Average price */
  avg: number;

  /** Median price */
  median: number;
}

/**
 * Research snapshot from marketplace comps search
 */
export interface ResearchSnapshot {
  /** Number of sold comps found */
  soldComps: number;

  /** Number of active comps found */
  activeComps: number;

  /** Statistics for sold items (null if no data) */
  soldPrices: PriceStatistics | null;

  /** Statistics for active listings (null if no data) */
  activePrices: PriceStatistics | null;

  /** ISO timestamp when search was performed */
  searchedAt: string;
}

/**
 * Meta listing attributes stored as JSONB
 * Note: Does not extend ExtractedAttributes to avoid index signature conflicts
 */
export interface MetaListingAttributes {
  /** Product color(s) */
  color?: string;

  /** Product size */
  size?: string;

  /** Material type */
  material?: string;

  /** Product dimensions */
  dimensions?: string;

  /** Weight */
  weight?: string;

  /** Item condition */
  condition?: string;

  /** Category ID for marketplace */
  categoryId?: string;

  /** Research snapshot from comps search */
  researchSnapshot?: ResearchSnapshot | null;

  /** Any additional string-valued attributes */
  [key: string]: string | number | boolean | ResearchSnapshot | null | undefined;
}

/**
 * Shipping options stored as JSONB
 */
export interface ShippingOptions {
  /** Shipping cost */
  cost?: number;

  /** Shipping service name */
  service?: string;

  /** Free shipping flag */
  freeShipping?: boolean;

  /** Handling time in days */
  handlingDays?: number;

  /** Expedited shipping available */
  expeditedAvailable?: boolean;
}

/**
 * Marketplace account settings stored as JSONB
 */
export interface MarketplaceAccountSettings {
  /** Default return policy */
  defaultReturnPolicy?: string;

  /** Preferred shipping service */
  preferredShippingService?: string;

  /** Auto-relist enabled */
  autoRelist?: boolean;

  /** Facebook-specific: Catalog ID for product listings */
  facebookCatalogId?: string;

  /** Facebook-specific: Page ID (for Marketplace listings) */
  facebookPageId?: string;

  /** Facebook-specific: Business ID */
  facebookBusinessId?: string;

  /** Additional marketplace-specific settings */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Workflow run state stored as JSONB
 */
export interface WorkflowRunState {
  /** Current step in the workflow */
  currentStep?: string;

  /** Accumulated data during workflow execution */
  data?: Record<string, unknown>;

  /** Checkpoint data for resumability */
  checkpoint?: Record<string, unknown>;
}

