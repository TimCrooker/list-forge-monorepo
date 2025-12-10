import {
  MarketplaceAdapter,
  MarketplaceType,
  MarketplaceCredentials,
  SearchCompsParams,
  CompResult,
  CanonicalListing,
  PublishResult,
  MarketplaceWebhookEvent,
  TokenRefreshCallback,
} from '../types';
import { MarketplaceListingStatus } from '@listforge/core-types';
import {
  FacebookProductInput,
  FacebookProductResponse,
  FacebookProductData,
  FacebookWebhookEvent,
  FacebookWebhookEntry,
  FacebookCondition,
  FacebookAvailability,
  FacebookGraphError,
} from './facebook.types';

/**
 * Facebook Marketplace adapter
 * Uses Meta Graph API v18.0 for Commerce Platform / Catalog operations
 */
export class FacebookAdapter implements MarketplaceAdapter {
  readonly name: MarketplaceType = 'FACEBOOK';

  private credentials: MarketplaceCredentials;
  private onTokenRefresh?: TokenRefreshCallback;

  private readonly graphApiVersion = 'v18.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  constructor(credentials: MarketplaceCredentials, onTokenRefresh?: TokenRefreshCallback) {
    this.credentials = credentials;
    this.onTokenRefresh = onTokenRefresh;

    if (!credentials.accessToken) {
      console.error('[facebook-adapter] No access token provided');
    }

    if (!credentials.facebookCatalogId) {
      console.warn('[facebook-adapter] No catalog ID provided - listing operations will fail');
    }
  }

  /**
   * Get full API URL for an endpoint
   */
  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${this.graphApiVersion}/${endpoint}`;
  }

  /**
   * Make authenticated request to Facebook Graph API
   */
  private async graphRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'DELETE';
      body?: Record<string, unknown>;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params = {} } = options;

    // Add access token to params
    params.access_token = this.credentials.accessToken;

    const url = new URL(this.getApiUrl(endpoint));
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`[facebook-adapter] ${method} ${endpoint}`);

    const response = await fetch(url.toString(), requestOptions);
    const data = await response.json();

    if (!response.ok) {
      const error = data as FacebookGraphError;
      const errorMessage = error.error?.message || 'Unknown Facebook API error';
      const errorCode = error.error?.code || 0;

      console.error('[facebook-adapter] API error:', {
        status: response.status,
        code: errorCode,
        message: errorMessage,
        subcode: error.error?.error_subcode,
      });

      // Check for token expiration
      if (errorCode === 190 || response.status === 401) {
        console.error('[facebook-adapter] Access token expired or invalid');
        throw new Error('Facebook access token expired. Please reconnect your account.');
      }

      throw new Error(`Facebook API error (${errorCode}): ${errorMessage}`);
    }

    return data as T;
  }

  /**
   * Search for comparable listings
   * Note: Facebook Marketplace doesn't have a public search API for external applications.
   * This method returns an empty array as comps must be sourced from other platforms.
   */
  async searchComps(_params: SearchCompsParams): Promise<CompResult[]> {
    console.log('[facebook-adapter] searchComps called - Facebook does not provide public comp search API');
    // Facebook Marketplace doesn't expose a public search API
    // Comp research should use eBay/Amazon adapters instead
    return [];
  }

  /**
   * Create a new listing in Facebook Catalog
   */
  async createListing(listing: CanonicalListing): Promise<PublishResult> {
    const catalogId = this.credentials.facebookCatalogId;

    if (!catalogId) {
      return {
        success: false,
        error: 'Facebook Catalog ID not configured. Please reconnect your Facebook account.',
      };
    }

    try {
      // Convert canonical listing to Facebook product format
      const facebookProduct = this.canonicalToFacebookProduct(listing);

      // Create product via Catalog API
      // POST /{catalog-id}/products
      const result = await this.graphRequest<FacebookProductResponse>(
        `${catalogId}/products`,
        {
          method: 'POST',
          body: facebookProduct as unknown as Record<string, unknown>,
        }
      );

      if (result.id) {
        console.log('[facebook-adapter] Product created successfully:', result.id);

        return {
          success: true,
          remoteListingId: result.id,
          url: `https://www.facebook.com/marketplace/item/${result.id}`,
          metadata: {
            retailer_id: facebookProduct.retailer_id,
          },
        };
      }

      return {
        success: false,
        error: 'Facebook did not return a product ID',
      };
    } catch (error) {
      console.error('[facebook-adapter] Error creating listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update an existing listing
   */
  async updateListing(
    remoteListingId: string,
    updates: Partial<CanonicalListing>
  ): Promise<PublishResult> {
    try {
      const updateData: Partial<FacebookProductInput> = {};

      if (updates.title) {
        updateData.name = updates.title.slice(0, 150);
      }
      if (updates.description) {
        updateData.description = updates.description.slice(0, 9999);
      }
      if (updates.price !== undefined) {
        updateData.price = Math.round(updates.price * 100); // Convert to cents
        updateData.currency = updates.currency || 'USD';
      }
      if (updates.quantity !== undefined) {
        updateData.availability = updates.quantity > 0 ? 'in stock' : 'out of stock';
        updateData.inventory = updates.quantity;
      }
      if (updates.condition) {
        updateData.condition = this.mapConditionToFacebook(updates.condition);
      }
      if (updates.images && updates.images.length > 0) {
        updateData.image_url = updates.images[0];
        if (updates.images.length > 1) {
          updateData.additional_image_urls = updates.images.slice(1, 11);
        }
      }

      // POST /{product-id}
      await this.graphRequest<FacebookProductResponse>(
        remoteListingId,
        {
          method: 'POST',
          body: updateData as unknown as Record<string, unknown>,
        }
      );

      console.log('[facebook-adapter] Product updated successfully:', remoteListingId);

      return {
        success: true,
        remoteListingId,
      };
    } catch (error) {
      console.error('[facebook-adapter] Error updating listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get listing status from Facebook
   */
  async getListingStatus(remoteListingId: string): Promise<MarketplaceListingStatus> {
    try {
      // GET /{product-id}?fields=availability,review_status
      const product = await this.graphRequest<FacebookProductData>(
        remoteListingId,
        {
          params: {
            fields: 'id,retailer_id,availability,review_status',
          },
        }
      );

      // Map Facebook status to our status enum
      if (product.review_status === 'rejected') {
        return 'error';
      }

      if (product.review_status === 'pending') {
        return 'listing_pending';
      }

      switch (product.availability) {
        case 'in stock':
        case 'available for order':
          return 'listed';
        case 'out of stock':
        case 'discontinued':
          return 'ended';
        default:
          return 'listed';
      }
    } catch (error) {
      console.error('[facebook-adapter] Error getting listing status:', error);
      return 'error';
    }
  }

  /**
   * Delete a listing from Facebook Catalog
   */
  async deleteListing(remoteListingId: string): Promise<boolean> {
    try {
      // DELETE /{product-id}
      await this.graphRequest<{ success: boolean }>(
        remoteListingId,
        { method: 'DELETE' }
      );

      console.log('[facebook-adapter] Product deleted successfully:', remoteListingId);
      return true;
    } catch (error) {
      console.error('[facebook-adapter] Error deleting listing:', error);
      return false;
    }
  }

  /**
   * Parse webhook payload from Facebook
   */
  parseWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): MarketplaceWebhookEvent | null {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

      if (!data || typeof data !== 'object') {
        return null;
      }

      const webhookData = data as FacebookWebhookEvent;

      // Only process product_catalog webhooks
      if (webhookData.object !== 'product_catalog') {
        console.log('[facebook-adapter] Ignoring non-catalog webhook:', webhookData.object);
        return null;
      }

      if (!webhookData.entry || webhookData.entry.length === 0) {
        return null;
      }

      // Process the first entry (typically there's only one)
      const entry: FacebookWebhookEntry = webhookData.entry[0];

      if (!entry.changes || entry.changes.length === 0) {
        return null;
      }

      const change = entry.changes[0];
      const value = change.value;

      // Determine event type and listing ID
      let eventType = 'product_update';
      let listingId = '';

      if (change.field === 'product_update' || change.field === 'product') {
        eventType = value.verb || 'update';
        listingId = value.product_id || value.retailer_id || '';
      } else if (change.field === 'feed_status_change') {
        eventType = 'feed_status_change';
        listingId = value.feed_id || '';
      }

      return {
        type: eventType,
        listingId,
        payload: value as unknown as Record<string, unknown>,
        timestamp: new Date(entry.time * 1000),
      };
    } catch (error) {
      console.error('[facebook-adapter] Error parsing webhook:', error);
      return null;
    }
  }

  /**
   * Convert canonical listing to Facebook product format
   */
  private canonicalToFacebookProduct(listing: CanonicalListing): FacebookProductInput {
    // Generate a unique retailer_id if not provided
    const retailerId = (listing.attributes?.itemId as string) ||
      `lf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const product: FacebookProductInput = {
      retailer_id: retailerId,
      name: listing.title.slice(0, 150), // Facebook limit
      description: listing.description.slice(0, 9999), // Facebook limit
      availability: listing.quantity > 0 ? 'in stock' : 'out of stock',
      condition: this.mapConditionToFacebook(listing.condition),
      price: Math.round(listing.price * 100), // Convert to cents
      currency: listing.currency || 'USD',
      image_url: listing.images[0] || '',
      inventory: listing.quantity,
    };

    // Add additional images (up to 10)
    if (listing.images.length > 1) {
      product.additional_image_urls = listing.images.slice(1, 11);
    }

    // Add optional fields
    if (listing.brand) {
      product.brand = listing.brand;
    }

    if (listing.categoryId) {
      product.google_product_category = listing.categoryId;
    }

    // Map additional attributes
    if (listing.attributes) {
      if (listing.attributes.color) {
        product.color = String(listing.attributes.color);
      }
      if (listing.attributes.size) {
        product.size = String(listing.attributes.size);
      }
      if (listing.attributes.material) {
        product.material = String(listing.attributes.material);
      }
    }

    return product;
  }

  /**
   * Map our condition values to Facebook condition enum
   */
  private mapConditionToFacebook(condition: string): FacebookCondition {
    const normalized = condition.toLowerCase().trim();

    const mapping: Record<string, FacebookCondition> = {
      'new': 'new',
      'brand new': 'new',
      'refurbished': 'refurbished',
      'renewed': 'refurbished',
      'like new': 'used_like_new',
      'used - like new': 'used_like_new',
      'excellent': 'used_like_new',
      'very good': 'used_good',
      'used - very good': 'used_good',
      'good': 'used_good',
      'used - good': 'used_good',
      'used': 'used_good',
      'acceptable': 'used_fair',
      'used - acceptable': 'used_fair',
      'fair': 'used_fair',
      'used - fair': 'used_fair',
      'poor': 'used_fair',
      'for parts': 'used_fair',
    };

    return mapping[normalized] || 'used_good';
  }

  /**
   * Map Facebook availability to our status
   */
  private mapAvailabilityToStatus(availability: FacebookAvailability): MarketplaceListingStatus {
    switch (availability) {
      case 'in stock':
      case 'available for order':
        return 'listed';
      case 'out of stock':
        return 'ended';
      case 'discontinued':
        return 'ended';
      default:
        return 'listed';
    }
  }
}
