/**
 * Facebook Marketplace / Commerce Platform Types
 * Based on Meta Graph API v18.0 Catalog API
 */

/**
 * Product availability status for Facebook Catalog
 */
export type FacebookAvailability =
  | 'in stock'
  | 'out of stock'
  | 'available for order'
  | 'discontinued';

/**
 * Product condition for Facebook Marketplace
 */
export type FacebookCondition =
  | 'new'
  | 'refurbished'
  | 'used'
  | 'used_like_new'
  | 'used_good'
  | 'used_fair';

/**
 * Input structure for creating/updating a product in Facebook Catalog
 * Reference: https://developers.facebook.com/docs/commerce-platform/catalog/products
 */
export interface FacebookProductInput {
  /** External ID (maps to our item ID) - must be unique within catalog */
  retailer_id: string;

  /** Product availability */
  availability: FacebookAvailability;

  /** Product condition */
  condition: FacebookCondition;

  /** Product description (max 9999 chars) */
  description: string;

  /** Primary image URL (min 500x500px, max 8MB) */
  image_url: string;

  /** Additional image URLs (up to 10) */
  additional_image_urls?: string[];

  /** Product name/title (max 150 chars for Marketplace) */
  name: string;

  /** Price in cents (e.g., 1999 for $19.99) */
  price: number;

  /** Currency code (ISO 4217, e.g., USD) */
  currency: string;

  /** Product URL on your website */
  url?: string;

  /** Brand name */
  brand?: string;

  /** Google Product Category ID */
  google_product_category?: string;

  /** Facebook-specific category */
  fb_product_category?: string;

  /** Custom product type (your categorization) */
  product_type?: string;

  /** Quantity in stock */
  inventory?: number;

  /** Sale price in cents (optional) */
  sale_price?: number;

  /** Sale price effective date range */
  sale_price_effective_date?: string;

  /** Size (for apparel, etc.) */
  size?: string;

  /** Color */
  color?: string;

  /** Material */
  material?: string;

  /** Gender targeting */
  gender?: 'female' | 'male' | 'unisex';

  /** Age group */
  age_group?: 'adult' | 'all ages' | 'infant' | 'kids' | 'newborn' | 'teen' | 'toddler';

  /** Custom labels for filtering/reporting (up to 5) */
  custom_label_0?: string;
  custom_label_1?: string;
  custom_label_2?: string;
  custom_label_3?: string;
  custom_label_4?: string;
}

/**
 * Response from Facebook Graph API when creating/updating a product
 */
export interface FacebookProductResponse {
  /** Facebook product ID */
  id: string;

  /** Our external ID */
  retailer_id: string;
}

/**
 * Product data returned from Facebook Graph API GET request
 */
export interface FacebookProductData {
  id: string;
  retailer_id: string;
  name: string;
  description?: string;
  availability: FacebookAvailability;
  condition?: FacebookCondition;
  price: string;
  currency: string;
  image_url?: string;
  url?: string;
  brand?: string;
  review_status?: 'pending' | 'approved' | 'rejected';
  review_rejection_reasons?: string[];
}

/**
 * Batch request item for bulk product operations
 */
export interface FacebookBatchRequestItem {
  method: 'CREATE' | 'UPDATE' | 'DELETE';
  retailer_id: string;
  data?: Partial<FacebookProductInput>;
}

/**
 * Batch request response
 */
export interface FacebookBatchResponse {
  handles: string[];
  validation_status?: Array<{
    retailer_id: string;
    errors?: Array<{
      message: string;
    }>;
  }>;
}

/**
 * Facebook webhook event structure
 * Reference: https://developers.facebook.com/docs/graph-api/webhooks/reference
 */
export interface FacebookWebhookEvent {
  /** Object type that triggered the webhook */
  object: 'page' | 'product_catalog';

  /** Array of webhook entries */
  entry: FacebookWebhookEntry[];
}

/**
 * Individual webhook entry
 */
export interface FacebookWebhookEntry {
  /** ID of the object (page ID or catalog ID) */
  id: string;

  /** Unix timestamp of the event */
  time: number;

  /** Changes that triggered the webhook */
  changes?: FacebookWebhookChange[];

  /** Messaging events (for page webhooks) */
  messaging?: unknown[];
}

/**
 * Webhook change event
 */
export interface FacebookWebhookChange {
  /** Field that changed */
  field: string;

  /** New value or change details */
  value: FacebookWebhookValue;
}

/**
 * Webhook value for product catalog changes
 */
export interface FacebookWebhookValue {
  /** Catalog ID */
  catalog_id?: string;

  /** Product retailer ID (our item ID) */
  retailer_id?: string;

  /** Product ID */
  product_id?: string;

  /** Type of change */
  verb?: 'add' | 'update' | 'delete';

  /** Items affected */
  items?: Array<{
    id: string;
    retailer_id: string;
  }>;

  /** Feed status for feed_status_change events */
  feed_id?: string;
  feed_status?: 'complete' | 'error' | 'in_progress';
  error_count?: number;
  num_uploaded?: number;
}

/**
 * Facebook OAuth token response
 */
export interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

/**
 * Long-lived token exchange response
 */
export interface FacebookLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Typically ~60 days in seconds
}

/**
 * Facebook user/page info response
 */
export interface FacebookUserInfoResponse {
  id: string;
  name: string;
}

/**
 * Facebook page info (for users with page access)
 */
export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

/**
 * Facebook pages list response
 */
export interface FacebookPagesResponse {
  data: FacebookPageInfo[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Facebook catalog info
 */
export interface FacebookCatalogInfo {
  id: string;
  name: string;
  business?: {
    id: string;
    name: string;
  };
}

/**
 * Error response from Facebook Graph API
 */
export interface FacebookGraphError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
}

/**
 * Rate limit info from response headers
 */
export interface FacebookRateLimitInfo {
  /** Percentage of rate limit used */
  usage: number;

  /** Total calls allowed in this period */
  total: number;

  /** Calls made in this period */
  call_count: number;

  /** Time until rate limit resets (seconds) */
  time_until_reset?: number;
}
