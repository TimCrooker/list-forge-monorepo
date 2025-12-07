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

/**
 * Amazon SP-API token response
 */
interface AmazonTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Amazon Catalog Items API response item
 */
interface AmazonCatalogItem {
  asin?: string;
  attributes?: {
    title?: Array<{ value?: string }>;
    brand?: Array<{ value?: string }>;
    item_name?: Array<{ value?: string }>;
  };
  salesRankings?: Array<{
    marketplaceId?: string;
    classificationId?: string;
    title?: string;
    rank?: number;
  }>;
  summaries?: Array<{
    marketplaceId?: string;
    brandName?: string;
    browseClassification?: { displayName?: string };
    itemName?: string;
  }>;
}

/**
 * Amazon Product Pricing API response
 */
interface AmazonPricingResponse {
  offers?: Array<{
    listingPrice?: { amount?: number; currencyCode?: string };
    sellingPrice?: { amount?: number; currencyCode?: string };
  }>;
}

/**
 * Amazon Listings API item
 */
interface AmazonListingItem {
  sku: string;
  status?: string;
  itemName?: string;
  createdDate?: string;
  lastUpdatedDate?: string;
  issues?: Array<{ code?: string; message?: string }>;
}

/**
 * Amazon webhook notification payload
 */
interface AmazonWebhookPayload {
  notificationType?: string;
  payloadVersion?: string;
  eventTime?: string;
  payload?: {
    asin?: string;
    sku?: string;
    sellerId?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Amazon Selling Partner API adapter
 * Implements marketplace adapter interface for Amazon SP-API
 */
export class AmazonAdapter implements MarketplaceAdapter {
  readonly name: MarketplaceType = 'AMAZON';
  private credentials: MarketplaceCredentials;
  private onTokenRefresh?: TokenRefreshCallback;
  private baseUrl: string;
  private marketplaceId: string;

  constructor(credentials: MarketplaceCredentials, onTokenRefresh?: TokenRefreshCallback) {
    this.credentials = credentials;
    this.onTokenRefresh = onTokenRefresh;

    // Determine region and marketplace
    const region = credentials.amazonRegion || 'NA';
    this.marketplaceId = credentials.amazonMarketplaceId || 'ATVPDKIKX0DER'; // US marketplace

    // Set base URL based on region
    switch (region) {
      case 'EU':
        this.baseUrl = 'https://sellingpartnerapi-eu.amazon.com';
        break;
      case 'FE':
        this.baseUrl = 'https://sellingpartnerapi-fe.amazon.com';
        break;
      default:
        this.baseUrl = 'https://sellingpartnerapi-na.amazon.com';
    }

    // Validate required credentials
    if (!credentials.accessToken) {
      throw new Error('Amazon access token is required');
    }
  }

  /**
   * Refresh access token using LWA refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials.refreshToken) {
      throw new Error('No refresh token available');
    }

    const clientId = this.credentials.amazonClientId || process.env.AMAZON_CLIENT_ID;
    const clientSecret = this.credentials.amazonClientSecret || process.env.AMAZON_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Amazon client credentials are required for token refresh');
    }

    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Amazon token: ${await response.text()}`);
    }

    const tokenData = await response.json() as AmazonTokenResponse;

    const updatedCredentials: MarketplaceCredentials = {
      ...this.credentials,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || this.credentials.refreshToken,
      tokenExpiresAt: tokenData.expires_in
        ? Math.floor(Date.now() / 1000) + tokenData.expires_in
        : this.credentials.tokenExpiresAt,
    };

    this.credentials = updatedCredentials;

    if (this.onTokenRefresh) {
      await this.onTokenRefresh(updatedCredentials);
    }
  }

  /**
   * Check if token needs refresh and refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (this.credentials.tokenExpiresAt) {
      const expiresIn = this.credentials.tokenExpiresAt - Math.floor(Date.now() / 1000);
      // Refresh if expiring within 5 minutes
      if (expiresIn < 300) {
        await this.refreshAccessToken();
      }
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.ensureValidToken();

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': this.credentials.accessToken,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Amazon API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async searchComps(params: SearchCompsParams): Promise<CompResult[]> {
    const results: CompResult[] = [];

    try {
      // Build search keywords
      const keywords = this.buildKeywords(params);
      if (!keywords) {
        return results;
      }

      // Use Catalog Items API to search
      const searchParams = new URLSearchParams({
        keywords,
        marketplaceIds: this.marketplaceId,
        includedData: 'summaries,attributes,salesRanks',
        pageSize: String(params.limit || 20),
      });

      const catalogResponse = await this.makeRequest<{
        items?: AmazonCatalogItem[];
        pagination?: { nextToken?: string };
      }>(`/catalog/2022-04-01/items?${searchParams.toString()}`);

      if (catalogResponse.items) {
        // Get pricing for found items
        const asins = catalogResponse.items
          .map((item) => item.asin)
          .filter((asin): asin is string => !!asin)
          .slice(0, 20); // Limit to 20 ASINs per request

        let priceMap: Map<string, number> = new Map();
        if (asins.length > 0) {
          try {
            priceMap = await this.getPricesForAsins(asins);
          } catch {
            // Continue without pricing data
            console.warn('Failed to fetch Amazon pricing data');
          }
        }

        for (const item of catalogResponse.items) {
          if (!item.asin) continue;

          const summary = item.summaries?.[0];
          const title =
            item.attributes?.title?.[0]?.value ||
            item.attributes?.item_name?.[0]?.value ||
            summary?.itemName ||
            'Unknown';

          const price = priceMap.get(item.asin) || 0;

          results.push({
            listingId: item.asin,
            title,
            price,
            currency: 'USD',
            condition: params.condition,
            url: `https://www.amazon.com/dp/${item.asin}`,
            attributes: {
              asin: item.asin,
              brand: item.attributes?.brand?.[0]?.value || summary?.brandName,
              category: summary?.browseClassification?.displayName,
              salesRank: item.salesRankings?.[0]?.rank,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error searching Amazon comps:', error);
      // Return empty results instead of throwing - allows workflow to continue
    }

    return results;
  }

  /**
   * Get pricing for multiple ASINs
   */
  private async getPricesForAsins(asins: string[]): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();

    try {
      // Use Product Pricing API
      const params = new URLSearchParams({
        MarketplaceId: this.marketplaceId,
        ItemType: 'Asin',
      });

      asins.forEach((asin) => params.append('Asins', asin));

      const pricingResponse = await this.makeRequest<{
        prices?: Array<{
          ASIN?: string;
          Product?: {
            Offers?: AmazonPricingResponse['offers'];
          };
        }>;
      }>(`/products/pricing/v0/price?${params.toString()}`);

      if (pricingResponse.prices) {
        for (const priceData of pricingResponse.prices) {
          if (priceData.ASIN && priceData.Product?.Offers?.[0]) {
            const offer = priceData.Product.Offers[0];
            const price =
              offer.sellingPrice?.amount || offer.listingPrice?.amount || 0;
            priceMap.set(priceData.ASIN, price);
          }
        }
      }
    } catch {
      // Pricing API might fail, return empty map
    }

    return priceMap;
  }

  async createListing(listing: CanonicalListing): Promise<PublishResult> {
    try {
      const sellerId = this.credentials.remoteAccountId;
      if (!sellerId) {
        return {
          success: false,
          error: 'Seller ID is required to create Amazon listings',
        };
      }

      // Generate a unique SKU
      const sku = `LF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Build the listing payload according to Amazon's JSON_LISTINGS_FEED format
      const listingPayload = {
        productType: 'PRODUCT', // Generic product type, should be refined based on category
        requirements: 'LISTING',
        attributes: {
          item_name: [{ value: listing.title, marketplace_id: this.marketplaceId }],
          product_description: [{ value: listing.description, marketplace_id: this.marketplaceId }],
          bullet_point: listing.bulletPoints?.map((point) => ({
            value: point,
            marketplace_id: this.marketplaceId,
          })) || [],
          brand: listing.brand
            ? [{ value: listing.brand, marketplace_id: this.marketplaceId }]
            : undefined,
          model_number: listing.model
            ? [{ value: listing.model, marketplace_id: this.marketplaceId }]
            : undefined,
          condition_type: [
            { value: this.mapConditionToAmazon(listing.condition), marketplace_id: this.marketplaceId },
          ],
          purchasable_offer: [
            {
              currency: listing.currency || 'USD',
              our_price: [{ schedule: [{ value_with_tax: listing.price }] }],
              marketplace_id: this.marketplaceId,
            },
          ],
          fulfillment_availability: [
            {
              fulfillment_channel_code: 'DEFAULT', // Merchant fulfilled
              quantity: listing.quantity,
              marketplace_id: this.marketplaceId,
            },
          ],
          main_product_image_locator: listing.images[0]
            ? [{ value: listing.images[0], marketplace_id: this.marketplaceId }]
            : undefined,
          other_product_image_locator_1: listing.images[1]
            ? [{ value: listing.images[1], marketplace_id: this.marketplaceId }]
            : undefined,
          other_product_image_locator_2: listing.images[2]
            ? [{ value: listing.images[2], marketplace_id: this.marketplaceId }]
            : undefined,
        },
      };

      // Clean undefined values
      const cleanPayload = JSON.parse(JSON.stringify(listingPayload));

      // PUT listing to Listings API
      const result = await this.makeRequest<{
        sku?: string;
        status?: string;
        submissionId?: string;
        issues?: Array<{ code?: string; message?: string; severity?: string }>;
      }>(
        `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}?marketplaceIds=${this.marketplaceId}`,
        {
          method: 'PUT',
          body: JSON.stringify(cleanPayload),
        }
      );

      // Check for issues
      const errors = result.issues?.filter((i) => i.severity === 'ERROR') || [];
      if (errors.length > 0) {
        return {
          success: false,
          error: errors.map((e) => e.message).join('; '),
          metadata: { issues: result.issues },
        };
      }

      return {
        success: true,
        remoteListingId: sku,
        url: `https://sellercentral.amazon.com/inventory?sku=${encodeURIComponent(sku)}`,
        metadata: {
          submissionId: result.submissionId,
          status: result.status,
        },
      };
    } catch (error) {
      console.error('Error creating Amazon listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async updateListing(
    remoteListingId: string,
    updates: Partial<CanonicalListing>
  ): Promise<PublishResult> {
    try {
      const sellerId = this.credentials.remoteAccountId;
      if (!sellerId) {
        return {
          success: false,
          error: 'Seller ID is required to update Amazon listings',
        };
      }

      // Build partial update payload
      const patchPayload: {
        productType: string;
        patches: Array<{
          op: string;
          path: string;
          value: unknown[];
        }>;
      } = {
        productType: 'PRODUCT',
        patches: [],
      };

      if (updates.title) {
        patchPayload.patches.push({
          op: 'replace',
          path: '/attributes/item_name',
          value: [{ value: updates.title, marketplace_id: this.marketplaceId }],
        });
      }

      if (updates.description) {
        patchPayload.patches.push({
          op: 'replace',
          path: '/attributes/product_description',
          value: [{ value: updates.description, marketplace_id: this.marketplaceId }],
        });
      }

      if (updates.price !== undefined) {
        patchPayload.patches.push({
          op: 'replace',
          path: '/attributes/purchasable_offer',
          value: [
            {
              currency: updates.currency || 'USD',
              our_price: [{ schedule: [{ value_with_tax: updates.price }] }],
              marketplace_id: this.marketplaceId,
            },
          ],
        });
      }

      if (updates.quantity !== undefined) {
        patchPayload.patches.push({
          op: 'replace',
          path: '/attributes/fulfillment_availability',
          value: [
            {
              fulfillment_channel_code: 'DEFAULT',
              quantity: updates.quantity,
              marketplace_id: this.marketplaceId,
            },
          ],
        });
      }

      if (patchPayload.patches.length === 0) {
        return {
          success: true,
          remoteListingId,
          metadata: { message: 'No updates to apply' },
        };
      }

      const result = await this.makeRequest<{
        sku?: string;
        status?: string;
        issues?: Array<{ code?: string; message?: string; severity?: string }>;
      }>(
        `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(remoteListingId)}?marketplaceIds=${this.marketplaceId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patchPayload),
        }
      );

      const errors = result.issues?.filter((i) => i.severity === 'ERROR') || [];
      if (errors.length > 0) {
        return {
          success: false,
          error: errors.map((e) => e.message).join('; '),
        };
      }

      return {
        success: true,
        remoteListingId,
        metadata: { status: result.status },
      };
    } catch (error) {
      console.error('Error updating Amazon listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getListingStatus(remoteListingId: string): Promise<MarketplaceListingStatus> {
    try {
      const sellerId = this.credentials.remoteAccountId;
      if (!sellerId) {
        return 'error';
      }

      const result = await this.makeRequest<AmazonListingItem>(
        `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(remoteListingId)}?marketplaceIds=${this.marketplaceId}&includedData=summaries,issues`
      );

      // Map Amazon status to our status enum
      switch (result.status?.toUpperCase()) {
        case 'BUYABLE':
        case 'ACTIVE':
          return 'listed';
        case 'DISCOVERABLE':
          return 'listed';
        case 'DELETED':
          return 'ended';
        case 'INCOMPLETE':
        case 'INVALID':
          return 'error';
        default:
          return 'listing_pending';
      }
    } catch (error) {
      console.error('Error getting Amazon listing status:', error);
      return 'error';
    }
  }

  parseWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): MarketplaceWebhookEvent | null {
    try {
      const data =
        typeof payload === 'string'
          ? (JSON.parse(payload) as AmazonWebhookPayload)
          : (payload as AmazonWebhookPayload);

      if (!data || typeof data !== 'object') {
        return null;
      }

      // Amazon SNS notifications have a specific structure
      const notificationType = data.notificationType || 'unknown';
      const listingId =
        data.payload?.sku || data.payload?.asin || '';

      return {
        type: notificationType,
        listingId,
        payload: data as Record<string, unknown>,
        timestamp: data.eventTime ? new Date(data.eventTime) : new Date(),
      };
    } catch (error) {
      console.error('Error parsing Amazon webhook:', error);
      return null;
    }
  }

  /**
   * Build search keywords from params
   */
  private buildKeywords(params: SearchCompsParams): string {
    const parts: string[] = [];
    if (params.brand) parts.push(params.brand);
    if (params.model) parts.push(params.model);
    if (params.keywords) parts.push(params.keywords);
    return parts.join(' ');
  }

  /**
   * Map condition to Amazon condition type
   */
  private mapConditionToAmazon(condition: string): string {
    const mapping: Record<string, string> = {
      new: 'new_new',
      'like new': 'used_like_new',
      'very good': 'used_very_good',
      good: 'used_good',
      acceptable: 'used_acceptable',
      used: 'used_good',
      refurbished: 'refurbished_refurbished',
    };
    return mapping[condition.toLowerCase()] || 'used_good';
  }
}
