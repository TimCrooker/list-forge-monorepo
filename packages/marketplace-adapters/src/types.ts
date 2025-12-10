import { MarketplaceListingStatus } from '@listforge/core-types';

/**
 * Supported marketplace types
 */
export type MarketplaceType = 'EBAY' | 'AMAZON';

/**
 * OAuth credentials for marketplace authentication
 */
export interface MarketplaceCredentials {
  /** Marketplace type */
  marketplace: MarketplaceType;

  /** OAuth access token */
  accessToken: string;

  /** OAuth refresh token (for token refresh) */
  refreshToken?: string;

  /** Token expiration timestamp (Unix epoch in seconds) */
  tokenExpiresAt?: number;

  /** eBay-specific: App ID (Client ID) */
  appId?: string;

  /** eBay-specific: Cert ID (Client Secret) */
  certId?: string;

  /** eBay-specific: Dev ID (for certain APIs) */
  devId?: string;

  /** eBay-specific: Sandbox mode flag */
  sandbox?: boolean;

  /** Amazon-specific: LWA Client ID */
  amazonClientId?: string;

  /** Amazon-specific: LWA Client Secret */
  amazonClientSecret?: string;

  /** Amazon-specific: Region (NA, EU, FE) */
  amazonRegion?: 'NA' | 'EU' | 'FE';

  /** Amazon-specific: Marketplace ID (e.g., ATVPDKIKX0DER for US) */
  amazonMarketplaceId?: string;

  /** Remote account/user ID from marketplace (eBay username, Amazon seller ID) */
  remoteAccountId?: string;
}

/**
 * Parameters for searching comparable listings (comps)
 */
export interface SearchCompsParams {
  /** Search keywords */
  keywords?: string;

  /** Category ID */
  categoryId?: string;

  /** Brand name */
  brand?: string;

  /** Model name */
  model?: string;

  /** Item condition */
  condition?: string;

  /** Search sold listings (true) or active listings (false) */
  soldOnly?: boolean;

  /** Maximum number of results */
  limit?: number;

  /** Base64-encoded image for image search */
  imageBase64?: string;

  /** Image URL to fetch and search by */
  imageUrl?: string;
}

/**
 * Result from a comp search
 */
export interface CompResult {
  /** Listing ID from marketplace */
  listingId: string;

  /** Listing title */
  title: string;

  /** Price in USD */
  price: number;

  /** Currency code */
  currency: string;

  /** Condition */
  condition?: string;

  /** Listing URL */
  url: string;

  /** Sold date (for sold listings) */
  soldDate?: Date;

  /** Listing end date (for active listings) */
  endDate?: Date;

  /** Additional attributes */
  attributes?: Record<string, string | number | boolean | undefined>;
}

/**
 * Canonical listing format (normalized across marketplaces)
 */
export interface CanonicalListing {
  /** Title */
  title: string;

  /** Description (HTML supported) */
  description: string;

  /** Bullet points (for marketplaces that support them) */
  bulletPoints?: string[];

  /** Category ID */
  categoryId?: string;

  /** Brand */
  brand?: string;

  /** Model */
  model?: string;

  /** Condition */
  condition: string;

  /** Price in USD */
  price: number;

  /** Currency code */
  currency: string;

  /** Quantity available */
  quantity: number;

  /** Image URLs */
  images: string[];

  /** Shipping options */
  shipping?: {
    /** Shipping cost */
    cost?: number;
    /** Shipping service name */
    service?: string;
    /** Free shipping flag */
    freeShipping?: boolean;
  };

  /** Additional attributes */
  attributes?: Record<string, string | number | boolean | undefined>;
}

/**
 * Result from publishing a listing
 */
export interface PublishResult {
  /** Success flag */
  success: boolean;

  /** Remote listing ID from marketplace */
  remoteListingId?: string;

  /** Listing URL */
  url?: string;

  /** Error message if failed */
  error?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Webhook event from marketplace
 */
export interface MarketplaceWebhookEvent {
  /** Event type */
  type: string;

  /** Remote listing ID */
  listingId: string;

  /** Event payload */
  payload: Record<string, unknown>;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Callback function for token refresh
 * Called when adapter refreshes OAuth tokens
 */
export type TokenRefreshCallback = (credentials: MarketplaceCredentials) => Promise<void> | void;

/**
 * Marketplace adapter interface
 * All marketplace adapters must implement this interface
 */
export interface MarketplaceAdapter {
  /** Marketplace type */
  readonly name: MarketplaceType;

  /**
   * Search for comparable listings
   */
  searchComps(params: SearchCompsParams): Promise<CompResult[]>;

  /**
   * Create a new listing
   */
  createListing(listing: CanonicalListing): Promise<PublishResult>;

  /**
   * Update an existing listing
   */
  updateListing?(remoteListingId: string, updates: Partial<CanonicalListing>): Promise<PublishResult>;

  /**
   * Get listing status
   */
  getListingStatus?(remoteListingId: string): Promise<MarketplaceListingStatus>;

  /**
   * Parse webhook payload from marketplace
   */
  parseWebhook(payload: unknown, headers: Record<string, string>): MarketplaceWebhookEvent | null;
}

// ============================================================================
// Amazon-Specific Types for Research
// ============================================================================

/**
 * Amazon product details from Catalog Items API
 */
export interface AmazonProductDetails {
  asin: string;
  title: string;
  brand?: string;
  manufacturer?: string;
  model?: string;
  color?: string;
  size?: string;
  productGroup?: string;
  category?: string;
  categoryPath?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  salesRank?: number;
  salesRankCategory?: string;
  bulletPoints?: string[];
  features?: string[];
  dimensions?: {
    height?: { value: number; unit: string };
    width?: { value: number; unit: string };
    length?: { value: number; unit: string };
    weight?: { value: number; unit: string };
  };
  identifiers?: {
    upc?: string;
    ean?: string;
    isbn?: string;
  };
  lastUpdate: string;
}

/**
 * Amazon pricing data from Product Pricing API
 */
export interface AmazonPricingData {
  asin: string;
  /** Buy box price (the price shown on product page) */
  buyBoxPrice?: number;
  /** Lowest new price from third-party sellers */
  newPrice?: number;
  /** Lowest used price */
  usedPrice?: number;
  /** Lowest FBA (Fulfilled by Amazon) price */
  fbaPrice?: number;
  /** Lowest FBM (Fulfilled by Merchant) price */
  fbmPrice?: number;
  /** Amazon's own price if they sell it */
  amazonPrice?: number;
  /** List price / MSRP */
  listPrice?: number;
  /** Number of new offers */
  newOfferCount?: number;
  /** Number of used offers */
  usedOfferCount?: number;
  currency: string;
  lastUpdate: string;
}

/**
 * Parameters for Amazon UPC/identifier lookup
 */
export interface AmazonIdentifierLookupParams {
  /** UPC code */
  upc?: string;
  /** EAN code */
  ean?: string;
  /** ISBN for books */
  isbn?: string;
  /** ASIN if known */
  asin?: string;
}

/**
 * Parameters for enhanced Amazon product search
 */
export interface AmazonSearchParams {
  /** Search keywords */
  keywords?: string;
  /** Brand filter */
  brand?: string;
  /** Category/browse node filter */
  browseNode?: string;
  /** Maximum results */
  limit?: number;
  /** Include sales rank data */
  includeSalesRank?: boolean;
}

/**
 * Amazon product match from UPC/identifier lookup
 */
export interface AmazonProductMatch {
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  salesRank?: number;
  price?: number;
  /** Confidence score 0-1 */
  confidence: number;
  /** Source of the match */
  source: 'catalog-api' | 'identifier-lookup';
  /** Matched identifier type */
  matchedBy?: 'upc' | 'ean' | 'isbn' | 'keywords';
}

