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

  constructor(credentials: MarketplaceCredentials, onTokenRefresh?: TokenRefreshCallback) {
    this.credentials = credentials;
    this.onTokenRefresh = onTokenRefresh;

    // Initialize eBay API client
    const appId = credentials.appId || process.env.EBAY_APP_ID || '';
    const certId = credentials.certId || process.env.EBAY_CERT_ID || '';

    if (!appId || !certId) {
      throw new Error('eBay App ID and Cert ID are required');
    }

    this.ebay = new eBayApi({
      appId,
      certId,
      devId: credentials.devId || process.env.EBAY_DEV_ID,
      sandbox: credentials.sandbox ?? process.env.EBAY_SANDBOX === 'true',
      siteId: eBayApi.SiteId.EBAY_US,
      autoRefreshToken: true,
    });

    // Set OAuth token
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

  async searchComps(params: SearchCompsParams): Promise<CompResult[]> {
    const results: CompResult[] = [];

    try {
      if (params.soldOnly) {
        // Search sold listings using Finding API
        const findingResults = await this.ebay.finding.findItemsAdvanced({
          keywords: this.buildKeywords(params),
          itemFilter: [
            {
              name: 'SoldItemsOnly',
              value: 'true',
            },
            ...(params.condition
              ? [
                  {
                    name: 'Condition',
                    value: this.mapConditionToEbay(params.condition),
                  },
                ]
              : []),
          ],
          paginationInput: {
            entriesPerPage: params.limit || 50,
            pageNumber: 1,
          },
        });

        if (findingResults.searchResult?.item) {
          for (const item of findingResults.searchResult.item) {
            results.push({
              listingId: item.itemId || '',
              title: item.title || '',
              price: parseFloat(item.sellingStatus?.currentPrice?.['#value'] || '0'),
              currency: item.sellingStatus?.currentPrice?.['@currencyId'] || 'USD',
              condition: item.condition?.conditionDisplayName,
              url: item.viewItemURL || '',
              soldDate: item.listingInfo?.endTime
                ? new Date(item.listingInfo.endTime)
                : undefined,
              attributes: {
                categoryId: item.primaryCategory?.categoryId,
                categoryName: item.primaryCategory?.categoryName,
              },
            });
          }
        }
      } else {
        // Search active listings using Browse API
        const searchParams: EbayBrowseSearchParams = {
          q: this.buildKeywords(params),
          limit: params.limit || 50,
        };

        if (params.categoryId) {
          searchParams.category_ids = params.categoryId;
        }

        const browseResults = await this.ebay.buy.browse.search(searchParams);

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
      }
    } catch (error) {
      console.error('Error searching eBay comps:', error);
      throw new Error(`Failed to search eBay comps: ${error instanceof Error ? error.message : String(error)}`);
    }

    return results;
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
   */
  private buildKeywords(params: SearchCompsParams): string {
    const parts: string[] = [];
    if (params.brand) parts.push(params.brand);
    if (params.model) parts.push(params.model);
    if (params.keywords) parts.push(params.keywords);
    return parts.join(' ') || '';
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

