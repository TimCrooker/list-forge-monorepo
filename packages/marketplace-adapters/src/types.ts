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

