import eBayApi from 'ebay-api';
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
 * eBay OAuth2 credentials object
 * Must include token_type to satisfy ebay-api library
 */
interface EbayOAuth2Credentials {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

/**
 * eBay token refresh event payload
 */
interface EbayRefreshTokenEvent {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * eBay Browse API search parameters
 */
interface EbayBrowseSearchParams {
  q: string;
  limit: number;
  category_ids?: string;
}

/**
 * eBay Trading API item updates
 */
interface EbayItemUpdates {
  Title?: string;
  Description?: { __cdata: string };
  StartPrice?: string;
  Quantity?: number;
}

/**
 * eBay Trading API item format for creating listings
 * Uses index signature to be compatible with ebay-api library Fields type
 */
interface EbayTradingItem {
  Title: string;
  Description: { __cdata: string };
  StartPrice: string;
  Quantity: number;
  ListingType: string;
  ListingDuration: string;
  ConditionID: string;
  Country: string;
  Currency: string;
  PrimaryCategory?: { CategoryID: string };
  PictureDetails: { PictureURL: string[] };
  ShippingDetails: {
    ShippingType: string;
    ShippingServiceOptions: {
      ShippingServicePriority: number;
      ShippingService: string;
      ShippingServiceCost: string;
      FreeShipping: boolean;
    };
  };
  ReturnPolicy: {
    ReturnsAcceptedOption: string;
    RefundOption: string;
    ReturnsWithinOption: string;
    ShippingCostPaidByOption: string;
  };
  ItemSpecifics?: {
    NameValueList: Array<{ Name: string; Value: string[] }>;
  };
  [key: string]: unknown;
}

/**
 * eBay webhook payload structure
 */
interface EbayWebhookPayload {
  NotificationEventName?: string;
  ItemID?: string;
  itemId?: string;
  [key: string]: unknown;
}

/**
 * eBay marketplace adapter
 * Uses the hendt/ebay-api library for type-safe eBay API calls
 */
export class EbayAdapter implements MarketplaceAdapter {
  readonly name: MarketplaceType = 'EBAY';
  private ebay: eBayApi;
  private credentials: MarketplaceCredentials;
  private onTokenRefresh?: TokenRefreshCallback;
  private applicationToken?: string;
  private applicationTokenExpiry?: number;

  constructor(credentials: MarketplaceCredentials, onTokenRefresh?: TokenRefreshCallback) {
    this.credentials = credentials;
    this.onTokenRefresh = onTokenRefresh;

    // Initialize eBay API client
    const appId = credentials.appId || process.env.EBAY_APP_ID || '';
    const certId = credentials.certId || process.env.EBAY_CERT_ID || '';

    if (!appId || !certId) {
      console.error('[ebay-adapter] Missing App ID or Cert ID');
      throw new Error('eBay App ID and Cert ID are required');
    }

    const sandbox = credentials.sandbox ?? process.env.EBAY_SANDBOX === 'true';
    console.log('[ebay-adapter] Initializing eBay API client:', {
      hasAppId: !!appId,
      hasCertId: !!certId,
      appIdPrefix: appId.substring(0, 15) + '...',
      sandbox,
      hasAccessToken: !!credentials.accessToken,
    });

    // Validate production credentials format
    if (!sandbox) {
      if (appId.includes('SBX') || certId.includes('SBX')) {
        console.error('[ebay-adapter] WARNING: Detected sandbox credentials (SBX) but sandbox mode is FALSE');
        console.error('[ebay-adapter] This will cause authentication failures. Set EBAY_SANDBOX=true or use production credentials.');
      }
      if (!appId.includes('-PRD-') || !certId.startsWith('PRD-')) {
        console.warn('[ebay-adapter] WARNING: App ID or Cert ID does not contain production markers (-PRD- or PRD-)');
        console.warn('[ebay-adapter] Ensure you are using production credentials for production mode.');
      }
    }

    this.ebay = new eBayApi({
      appId,
      certId,
      devId: credentials.devId || process.env.EBAY_DEV_ID,
      sandbox,
      siteId: eBayApi.SiteId.EBAY_US,
      autoRefreshToken: true,
    });

    // Set OAuth token for user-level access
    if (credentials.accessToken) {
      const credentialsObj: EbayOAuth2Credentials = {
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken || '',
        token_type: 'User Access Token',
        expires_in: credentials.tokenExpiresAt
          ? credentials.tokenExpiresAt - Math.floor(Date.now() / 1000)
          : 3600, // Default to 1 hour if not specified
      };

      // Use type assertion as ebay-api's AuthToken type is overly restrictive
      this.ebay.OAuth2.setCredentials(credentialsObj as unknown as string);
    }

    // Register token refresh callback
    if (onTokenRefresh) {
      this.ebay.OAuth2.on('refreshAuthToken', async (token: EbayRefreshTokenEvent) => {
        const updatedCredentials: MarketplaceCredentials = {
          ...this.credentials,
          accessToken: token.access_token,
          refreshToken: token.refresh_token || this.credentials.refreshToken,
          tokenExpiresAt: token.expires_in
            ? Math.floor(Date.now() / 1000) + token.expires_in
            : this.credentials.tokenExpiresAt,
        };
        await onTokenRefresh(updatedCredentials);
        this.credentials = updatedCredentials;
      });
    }
  }

  /**
   * Fetch image from URL and convert to Base64
   */
  private async fetchImageAsBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      console.error('[ebay-adapter] Error fetching image:', error);
      throw new Error(
        `Failed to fetch image from URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search active listings by keyword using Browse API
   */
  private async searchByKeyword(params: SearchCompsParams): Promise<CompResult[]> {
    const keywords = this.buildKeywords(params);
    if (!keywords || keywords.length === 0) {
      console.log('[ebay-adapter] Empty keywords, returning empty array');
      return [];
    }

    console.log('[ebay-adapter] Searching active listings by keyword:', keywords);

    try {
      const searchParams: any = {
        q: keywords,
        limit: params.limit || 50,
      };

      if (params.categoryId) {
        searchParams.category_ids = params.categoryId;
      }

      // Add condition filter if specified
      if (params.condition) {
        const conditionId = this.mapConditionToEbay(params.condition);
        searchParams.filter = `conditionIds:{${conditionId}}`;
      }

      const browseResults = await this.ebay.buy.browse.search(searchParams);

      console.log('[ebay-adapter] Browse API response:', {
        hasItemSummaries: !!browseResults.itemSummaries,
        itemCount: browseResults.itemSummaries?.length || 0,
        total: browseResults.total,
      });

      const results: CompResult[] = [];
      if (browseResults.itemSummaries) {
        for (const item of browseResults.itemSummaries) {
          results.push({
            listingId: item.itemId || '',
            title: item.title || '',
            price: parseFloat(item.price?.value || '0'),
            currency: item.price?.currency || 'USD',
            condition: item.condition,
            url: item.itemWebUrl || '',
            endDate: item.itemEndDate ? new Date(item.itemEndDate) : undefined,
            attributes: {
              categoryId: item.categoryPath,
              imageUrl: item.image?.imageUrl,
            },
          });
        }
      }

      console.log('[ebay-adapter] Processed', results.length, 'active listings by keyword');
      return results;
    } catch (error: any) {
      const errorMessage = error?.meta?.description || error?.message || String(error);
      const statusCode = error?.response?.status || error?.meta?.res?.status || error?.statusCode;

      // Check for authentication errors (401)
      if (statusCode === 401 || errorMessage.includes('invalid_client') || errorMessage.includes('Unauthorized')) {
        console.error('[ebay-adapter] ⚠️  AUTHENTICATION FAILED (401) ⚠️');
        console.error('[ebay-adapter] eBay API rejected your App ID / Cert ID credentials');
        console.error('[ebay-adapter] Common causes:');
        console.error('[ebay-adapter]   1. Production credentials require "Marketplace Account Deletion" compliance');
        console.error('[ebay-adapter]      → Complete at: https://developer.ebay.com/my/keys');
        console.error('[ebay-adapter]   2. Sandbox/Production mismatch (EBAY_SANDBOX setting vs credential type)');
        console.error('[ebay-adapter]   3. Invalid or expired credentials');
        console.error('[ebay-adapter] Current settings: sandbox=' + (this.ebay.config?.sandbox ? 'true' : 'false'));
        console.error('[ebay-adapter] Active listings search will be disabled until credentials are fixed.');
        return [];
      }

      console.error('[ebay-adapter] Error searching by keyword:', errorMessage);
      console.warn('[ebay-adapter] Keyword search failed, returning empty results');
      return [];
    }
  }

  /**
   * Search active listings by image using Browse API searchByImage
   */
  private async searchByImage(params: SearchCompsParams): Promise<CompResult[]> {
    let imageBase64 = params.imageBase64;

    // Fetch image if URL provided
    if (!imageBase64 && params.imageUrl) {
      console.log('[ebay-adapter] Fetching image from URL:', params.imageUrl);
      try {
        imageBase64 = await this.fetchImageAsBase64(params.imageUrl);
      } catch (fetchError) {
        console.warn('[ebay-adapter] Failed to fetch image, skipping image search:', fetchError);
        return [];
      }
    }

    if (!imageBase64) {
      console.log('[ebay-adapter] No image provided for image search');
      return [];
    }

    console.log('[ebay-adapter] Searching active listings by image');

    try {
      const searchParams: any = {
        limit: params.limit || 20,
      };

      if (params.categoryId) {
        searchParams.category_ids = params.categoryId;
      }

      const imageResults = await this.ebay.buy.browse.searchByImage(
        searchParams,
        { image: imageBase64 }
      );

      console.log('[ebay-adapter] searchByImage API response:', {
        hasItemSummaries: !!imageResults.itemSummaries,
        itemCount: imageResults.itemSummaries?.length || 0,
        total: imageResults.total,
      });

      const results: CompResult[] = [];
      if (imageResults.itemSummaries) {
        for (const item of imageResults.itemSummaries) {
          results.push({
            listingId: item.itemId || '',
            title: item.title || '',
            price: parseFloat(item.price?.value || '0'),
            currency: item.price?.currency || 'USD',
            condition: item.condition,
            url: item.itemWebUrl || '',
            endDate: item.itemEndDate ? new Date(item.itemEndDate) : undefined,
            attributes: {
              categoryId: item.categoryPath,
              imageUrl: item.image?.imageUrl,
            },
          });
        }
      }

      console.log('[ebay-adapter] Processed', results.length, 'active listings by image');
      return results;
    } catch (error: any) {
      const errorMessage = error?.meta?.description || error?.message || String(error);
      const statusCode = error?.response?.status || error?.meta?.res?.status || error?.statusCode;

      // Check for authentication errors (401)
      if (statusCode === 401 || errorMessage.includes('invalid_client') || errorMessage.includes('Unauthorized')) {
        console.error('[ebay-adapter] ⚠️  AUTHENTICATION FAILED (401) ⚠️');
        console.error('[ebay-adapter] eBay API rejected your App ID / Cert ID credentials');
        console.error('[ebay-adapter] Image search will be disabled until credentials are fixed.');
        return [];
      }

      console.warn('[ebay-adapter] Image search failed:', errorMessage);
      console.warn('[ebay-adapter] Returning empty results, research will continue with keyword searches');
      return [];
    }
  }

  /**
   * Search sold listings using Marketplace Insights API (Limited Release)
   */
  private async searchSoldListings(params: SearchCompsParams): Promise<CompResult[]> {
    const keywords = this.buildKeywords(params);
    if (!keywords || keywords.length === 0) {
      console.log('[ebay-adapter] Empty keywords, returning empty array');
      return [];
    }

    console.log('[ebay-adapter] Searching sold listings via Marketplace Insights API:', keywords);

    try {
      const searchParams: any = {
        q: keywords,
        limit: params.limit || 50,
      };

      if (params.categoryId) {
        searchParams.categoryIds = params.categoryId;
      }

      // Add filter for fixed price items
      searchParams.filter = 'buyingOptions:{FIXED_PRICE}';

      const insightsResults = await this.ebay.buy.marketplaceInsights.search(searchParams);

      console.log('[ebay-adapter] Marketplace Insights API response:', {
        hasItemSales: !!insightsResults.itemSales,
        itemCount: insightsResults.itemSales?.length || 0,
        total: insightsResults.total,
      });

      const results: CompResult[] = [];
      if (insightsResults.itemSales) {
        for (const item of insightsResults.itemSales) {
          // Marketplace Insights returns sold items with sale data
          results.push({
            listingId: item.itemId || '',
            title: item.title || '',
            price: parseFloat(item.price?.value || '0'),
            currency: item.price?.currency || 'USD',
            condition: item.condition,
            url: item.itemWebUrl || '',
            soldDate: item.lastSoldDate ? new Date(item.lastSoldDate) : undefined,
            attributes: {
              categoryId: item.categoryPath,
              salesCount: item.salesCount,
            },
          });
        }
      }

      console.log('[ebay-adapter] Processed', results.length, 'sold listings');
      return results;
    } catch (error: any) {
      const errorMessage = error?.meta?.description || error?.message || String(error);
      const statusCode = error?.response?.status || error?.meta?.res?.status || error?.statusCode;

      // Check for authentication errors (401)
      if (statusCode === 401 || errorMessage.includes('invalid_client') || errorMessage.includes('Unauthorized')) {
        console.error('[ebay-adapter] ⚠️  AUTHENTICATION FAILED (401) ⚠️');
        console.error('[ebay-adapter] eBay API rejected your App ID / Cert ID credentials');
        console.error('[ebay-adapter] Common causes:');
        console.error('[ebay-adapter]   1. Production credentials require "Marketplace Account Deletion" compliance');
        console.error('[ebay-adapter]      → Complete at: https://developer.ebay.com/my/keys');
        console.error('[ebay-adapter]   2. Sandbox/Production mismatch (EBAY_SANDBOX setting vs credential type)');
        console.error('[ebay-adapter]   3. Invalid or expired credentials');
        console.error('[ebay-adapter] Current settings: sandbox=' + (this.ebay.config?.sandbox ? 'true' : 'false'));
        console.error('[ebay-adapter] Sold listings search will be disabled until credentials are fixed.');
        return [];
      }

      // Check if this is a 403 (no access to Marketplace Insights API)
      if (statusCode === 403) {
        console.warn('[ebay-adapter] Marketplace Insights API access denied (403)');
        console.warn('[ebay-adapter] This API requires eBay Partner Network approval');
        console.warn('[ebay-adapter] Apply at: https://partnernetwork.ebay.com');
        return [];
      }

      console.error('[ebay-adapter] Error searching sold listings:', errorMessage);
      // Don't throw - gracefully degrade if sold listings unavailable
      console.warn('[ebay-adapter] Sold listings search failed, returning empty results');
      return [];
    }
  }

  async searchComps(params: SearchCompsParams): Promise<CompResult[]> {
    console.log('[ebay-adapter] searchComps called:', {
      brand: params.brand,
      model: params.model,
      keywords: params.keywords,
      soldOnly: params.soldOnly,
      limit: params.limit,
      condition: params.condition,
      categoryId: params.categoryId,
      hasImageBase64: !!params.imageBase64,
      hasImageUrl: !!params.imageUrl,
      sandbox: this.ebay.config?.sandbox,
    });

    // Route to appropriate search method
    if (params.imageBase64 || params.imageUrl) {
      // Image search requested
      return this.searchByImage(params);
    } else if (params.soldOnly) {
      // Sold listings via Marketplace Insights API
      return this.searchSoldListings(params);
    } else {
      // Active listings via Browse API keyword search
      return this.searchByKeyword(params);
    }
  }

  async createListing(listing: CanonicalListing): Promise<PublishResult> {
    try {
      // Convert canonical listing to eBay Trading API format
      const ebayItem = this.canonicalToEbayItem(listing);

      // Create listing using Trading API
      // Type assertion needed as ebay-api's Fields type is overly restrictive
      const result = await this.ebay.trading.AddFixedPriceItem(
        { Item: ebayItem } as Parameters<typeof this.ebay.trading.AddFixedPriceItem>[0]
      );

      const itemId = result.ItemID;

      if (!itemId) {
        throw new Error('eBay did not return an item ID');
      }

      // Build listing URL
      const url = `https://www.ebay.com/itm/${itemId}`;

      return {
        success: true,
        remoteListingId: itemId,
        url,
        metadata: {
          fees: result.Fees,
        },
      };
    } catch (error) {
      console.error('Error creating eBay listing:', error);
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
      // Convert updates to eBay format
      const ebayUpdates: EbayItemUpdates = {};

      if (updates.title) {
        ebayUpdates.Title = updates.title;
      }
      if (updates.description) {
        ebayUpdates.Description = {
          __cdata: updates.description,
        };
      }
      if (updates.price !== undefined) {
        ebayUpdates.StartPrice = updates.price.toString();
      }
      if (updates.quantity !== undefined) {
        ebayUpdates.Quantity = updates.quantity;
      }

      // Type assertion needed as ebay-api's Fields type is overly restrictive
      const result = await this.ebay.trading.ReviseFixedPriceItem(
        { Item: { ItemID: remoteListingId, ...ebayUpdates } } as Parameters<typeof this.ebay.trading.ReviseFixedPriceItem>[0]
      );

      return {
        success: true,
        remoteListingId,
        metadata: {
          fees: result.Fees,
        },
      };
    } catch (error) {
      console.error('Error updating eBay listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getListingStatus(remoteListingId: string): Promise<MarketplaceListingStatus> {
    try {
      const result = await this.ebay.trading.GetItem({
        ItemID: remoteListingId,
      });

      const item = result.Item;
      if (!item) {
        return 'error';
      }

      // Map eBay listing status to our status enum
      const listingStatus = item.ListingStatus;
      const sellingStatus = item.SellingStatus?.ListingStatus;

      if (listingStatus === 'Completed' || sellingStatus === 'EndedWithoutSales') {
        return 'ended';
      }
      if (sellingStatus === 'Sold') {
        return 'sold';
      }
      if (listingStatus === 'Active') {
        return 'listed';
      }
      if (listingStatus === 'Ended') {
        return 'ended';
      }

      return 'listed';
    } catch (error) {
      console.error('Error getting eBay listing status:', error);
      return 'error';
    }
  }

  parseWebhook(payload: unknown, headers: Record<string, string>): MarketplaceWebhookEvent | null {
    // eBay webhook parsing - implementation depends on eBay's webhook format
    // This is a placeholder that should be implemented based on eBay's actual webhook structure
    try {
      const rawData = typeof payload === 'string' ? JSON.parse(payload) : payload;

      // eBay typically sends notifications via XML or JSON
      // This needs to be customized based on actual eBay webhook format
      if (rawData && typeof rawData === 'object') {
        const data = rawData as EbayWebhookPayload;
        return {
          type: data.NotificationEventName || 'unknown',
          listingId: data.ItemID || data.itemId || '',
          payload: data as Record<string, unknown>,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('Error parsing eBay webhook:', error);
    }

    return null;
  }

  /**
   * Build search keywords from params
   * Sanitizes input and removes control characters
   */
  private buildKeywords(params: SearchCompsParams): string {
    const parts: string[] = [];
    if (params.brand) parts.push(params.brand.trim());
    if (params.model) parts.push(params.model.trim());
    if (params.keywords) parts.push(params.keywords.trim());

    const keywords = parts.join(' ').trim();

    if (!keywords || keywords.length === 0) {
      console.log('[ebay-adapter] buildKeywords: Empty after joining parts');
      return ''; // Return empty string, validation happens in searchComps
    }

    // Sanitize: remove control characters and excessive whitespace
    const sanitized = keywords.replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ');
    console.log('[ebay-adapter] buildKeywords:', {
      inputParts: parts,
      beforeSanitize: keywords,
      afterSanitize: sanitized,
      length: sanitized.length,
    });
    return sanitized;
  }

  /**
   * Map condition to eBay condition format
   */
  private mapConditionToEbay(condition: string): string {
    const mapping: Record<string, string> = {
      new: '1000',
      'like new': '1500',
      'very good': '3000',
      good: '4000',
      acceptable: '5000',
      used: '5000',
      'for parts': '7000',
    };
    return mapping[condition.toLowerCase()] || '3000';
  }

  /**
   * Convert canonical listing to eBay Trading API item format
   */
  private canonicalToEbayItem(listing: CanonicalListing): EbayTradingItem {
    const item: EbayTradingItem = {
      Title: listing.title,
      Description: {
        __cdata: listing.description,
      },
      StartPrice: listing.price.toString(),
      Quantity: listing.quantity,
      ListingType: 'FixedPriceItem',
      ListingDuration: 'GTC', // Good Till Cancelled
      ConditionID: this.mapConditionToEbay(listing.condition),
      Country: 'US',
      Currency: listing.currency || 'USD',
      PictureDetails: {
        PictureURL: listing.images.slice(0, 12), // eBay allows up to 12 images
      },
      ShippingDetails: {
        ShippingType: 'Flat',
        ShippingServiceOptions: {
          ShippingServicePriority: 1,
          ShippingService: listing.shipping?.service || 'USPSPriority',
          ShippingServiceCost: listing.shipping?.cost?.toString() || '0.00',
          FreeShipping: listing.shipping?.freeShipping || false,
        },
      },
      ReturnPolicy: {
        ReturnsAcceptedOption: 'ReturnsAccepted',
        RefundOption: 'MoneyBack',
        ReturnsWithinOption: 'Days_30',
        ShippingCostPaidByOption: 'Buyer',
      },
    };

    // Add category if provided
    if (listing.categoryId) {
      item.PrimaryCategory = { CategoryID: listing.categoryId };
    }

    // Add item specifics (attributes)
    if (listing.brand || listing.model || listing.attributes) {
      const nameValueList: Array<{ Name: string; Value: string[] }> = [];

      if (listing.brand) {
        nameValueList.push({
          Name: 'Brand',
          Value: [listing.brand],
        });
      }

      if (listing.model) {
        nameValueList.push({
          Name: 'Model',
          Value: [listing.model],
        });
      }

      // Add other attributes
      if (listing.attributes) {
        for (const [key, value] of Object.entries(listing.attributes)) {
          if (value !== null && value !== undefined) {
            nameValueList.push({
              Name: key,
              Value: [String(value)],
            });
          }
        }
      }

      if (nameValueList.length > 0) {
        item.ItemSpecifics = { NameValueList: nameValueList };
      }
    }

    return item;
  }
}

