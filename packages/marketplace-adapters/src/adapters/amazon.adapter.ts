import { SellingPartnerApiAuth } from '@sp-api-sdk/auth';
import {
  CatalogItemsApiClient,
  SearchCatalogItemsIdentifiersTypeEnum,
  SearchCatalogItemsIncludedDataEnum,
  GetCatalogItemIncludedDataEnum,
  type Item,
  type ItemSearchResults,
} from '@sp-api-sdk/catalog-items-api-2022-04-01';
import {
  ProductPricingApiClient,
  GetCompetitivePricingItemTypeEnum,
  type GetPricingResponse,
} from '@sp-api-sdk/product-pricing-api-v0';
import {
  ListingsItemsApiClient,
  GetListingsItemIncludedDataEnum,
  PatchOperationOpEnum,
  ItemSummaryByMarketplaceStatusEnum,
  type ListingsItemSubmissionResponse,
  type Item as ListingsItem,
  type PatchOperation,
} from '@sp-api-sdk/listings-items-api-2021-08-01';
import { type SellingPartnerRegion, SellingPartnerApiError } from '@sp-api-sdk/common';

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
  AmazonProductDetails,
  AmazonPricingData,
  AmazonProductMatch,
  AmazonIdentifierLookupParams,
  AmazonSearchParams,
} from '../types';
import { MarketplaceListingStatus } from '@listforge/core-types';

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
 * Uses official @sp-api-sdk/* packages for type-safe API calls
 */
export class AmazonAdapter implements MarketplaceAdapter {
  readonly name: MarketplaceType = 'AMAZON';
  private credentials: MarketplaceCredentials;
  private marketplaceId: string;

  // SDK clients
  private auth: SellingPartnerApiAuth;
  private catalogClient: CatalogItemsApiClient;
  private pricingClient: ProductPricingApiClient;
  private listingsClient: ListingsItemsApiClient;

  constructor(credentials: MarketplaceCredentials, _onTokenRefresh?: TokenRefreshCallback) {
    this.credentials = credentials;
    // Note: onTokenRefresh callback is accepted for API compatibility but the SDK
    // handles token refresh automatically via SellingPartnerApiAuth

    // Determine region and marketplace
    const region = this.mapRegion(credentials.amazonRegion);
    this.marketplaceId = credentials.amazonMarketplaceId || 'ATVPDKIKX0DER'; // US marketplace

    // Get client credentials
    const clientId = credentials.amazonClientId || process.env.AMAZON_CLIENT_ID;
    const clientSecret = credentials.amazonClientSecret || process.env.AMAZON_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Amazon client credentials are required (amazonClientId and amazonClientSecret)');
    }

    if (!credentials.refreshToken) {
      throw new Error('Amazon refresh token is required');
    }

    // Initialize SDK auth
    this.auth = new SellingPartnerApiAuth({
      clientId,
      clientSecret,
      refreshToken: credentials.refreshToken,
    });

    // Initialize SDK clients with rate limiting enabled
    const clientConfig = {
      auth: this.auth,
      region,
      rateLimiting: {
        retry: true,
        onRetry: (info: { delay: number; retryCount: number }) => {
          console.log(`[amazon-adapter] Rate limited, retry ${info.retryCount} after ${info.delay}ms`);
        },
      },
    };

    this.catalogClient = new CatalogItemsApiClient(clientConfig);
    this.pricingClient = new ProductPricingApiClient(clientConfig);
    this.listingsClient = new ListingsItemsApiClient(clientConfig);
  }

  /**
   * Map credential region to SDK region type
   */
  private mapRegion(region?: 'NA' | 'EU' | 'FE'): SellingPartnerRegion {
    switch (region) {
      case 'EU':
        return 'eu';
      case 'FE':
        return 'fe';
      default:
        return 'na';
    }
  }

  async searchComps(params: SearchCompsParams): Promise<CompResult[]> {
    const results: CompResult[] = [];

    try {
      // Build search keywords
      const keywords = this.buildKeywords(params);
      if (!keywords) {
        return results;
      }

      // Use SDK to search catalog
      const response = await this.catalogClient.searchCatalogItems({
        marketplaceIds: [this.marketplaceId],
        keywords: keywords.split(' '),
        includedData: [
          SearchCatalogItemsIncludedDataEnum.Summaries,
          SearchCatalogItemsIncludedDataEnum.Attributes,
          SearchCatalogItemsIncludedDataEnum.SalesRanks,
        ],
        pageSize: params.limit || 20,
      });

      const catalogResponse: ItemSearchResults = response.data;

      if (catalogResponse.items && catalogResponse.items.length > 0) {
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
          const attrs = item.attributes || {};
          const title =
            attrs.title?.[0]?.value ||
            attrs.item_name?.[0]?.value ||
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
              brand: attrs.brand?.[0]?.value || summary?.brand,
              category: summary?.browseClassification?.displayName,
              salesRank: item.salesRanks?.[0]?.classificationRanks?.[0]?.rank,
            },
          });
        }
      }
    } catch (error) {
      this.handleError('searchComps', error);
      // Return empty results instead of throwing - allows workflow to continue
    }

    return results;
  }

  // ============================================================================
  // Enhanced Research Methods
  // ============================================================================

  /**
   * Look up product by UPC/EAN/ISBN identifier
   * Uses Amazon Catalog Items API with identifiers parameter
   */
  async lookupByIdentifier(params: AmazonIdentifierLookupParams): Promise<AmazonProductMatch | null> {
    try {
      // Determine which identifier to use
      let identifierType: SearchCatalogItemsIdentifiersTypeEnum;
      let identifierValue: string;

      if (params.upc) {
        identifierType = SearchCatalogItemsIdentifiersTypeEnum.Upc;
        identifierValue = params.upc.replace(/\D/g, ''); // Clean non-digits
      } else if (params.ean) {
        identifierType = SearchCatalogItemsIdentifiersTypeEnum.Ean;
        identifierValue = params.ean.replace(/\D/g, '');
      } else if (params.isbn) {
        identifierType = SearchCatalogItemsIdentifiersTypeEnum.Isbn;
        identifierValue = params.isbn.replace(/[\s-]/g, ''); // Clean spaces and dashes
      } else if (params.asin) {
        // Direct ASIN lookup
        const product = await this.getProductByAsin(params.asin);
        if (product) {
          return {
            asin: product.asin,
            title: product.title,
            brand: product.brand,
            category: product.category,
            imageUrl: product.imageUrl,
            salesRank: product.salesRank,
            confidence: 1.0,
            source: 'catalog-api',
            matchedBy: undefined,
          };
        }
        return null;
      } else {
        return null;
      }

      // Use SDK to search by identifier
      const response = await this.catalogClient.searchCatalogItems({
        marketplaceIds: [this.marketplaceId],
        identifiers: [identifierValue],
        identifiersType: identifierType,
        includedData: [
          SearchCatalogItemsIncludedDataEnum.Summaries,
          SearchCatalogItemsIncludedDataEnum.Attributes,
          SearchCatalogItemsIncludedDataEnum.SalesRanks,
          SearchCatalogItemsIncludedDataEnum.Images,
        ],
        pageSize: 1,
      });

      const catalogResponse: ItemSearchResults = response.data;

      if (!catalogResponse.items || catalogResponse.items.length === 0) {
        console.log(`[amazon-adapter] No product found for ${identifierType}: ${identifierValue}`);
        return null;
      }

      const item = catalogResponse.items[0];
      return this.itemToProductMatch(item, identifierType.toLowerCase() as 'upc' | 'ean' | 'isbn', 0.95);
    } catch (error) {
      this.handleError('lookupByIdentifier', error);
      return null;
    }
  }

  /**
   * Convenience method to look up by UPC
   */
  async lookupByUpc(upc: string): Promise<AmazonProductMatch | null> {
    return this.lookupByIdentifier({ upc });
  }

  /**
   * Get detailed product information by ASIN
   */
  async getProductByAsin(asin: string): Promise<AmazonProductDetails | null> {
    try {
      const response = await this.catalogClient.getCatalogItem({
        asin,
        marketplaceIds: [this.marketplaceId],
        includedData: [
          GetCatalogItemIncludedDataEnum.Summaries,
          GetCatalogItemIncludedDataEnum.Attributes,
          GetCatalogItemIncludedDataEnum.SalesRanks,
          GetCatalogItemIncludedDataEnum.Images,
          GetCatalogItemIncludedDataEnum.Dimensions,
          GetCatalogItemIncludedDataEnum.Identifiers,
        ],
      });

      const item: Item = response.data;

      if (!item.asin) {
        return null;
      }

      const summary = item.summaries?.[0];
      const attrs = item.attributes || {};

      // Extract identifiers
      const identifiers: AmazonProductDetails['identifiers'] = {};
      for (const idGroup of item.identifiers || []) {
        for (const id of idGroup.identifiers || []) {
          if (id.identifierType === 'UPC') identifiers.upc = id.identifier;
          if (id.identifierType === 'EAN') identifiers.ean = id.identifier;
          if (id.identifierType === 'ISBN') identifiers.isbn = id.identifier;
        }
      }

      // Extract image URL
      const imageUrl = item.images?.[0]?.images?.[0]?.link;

      return {
        asin: item.asin,
        title: attrs.title?.[0]?.value || attrs.item_name?.[0]?.value || summary?.itemName || '',
        brand: attrs.brand?.[0]?.value || summary?.brand,
        manufacturer: attrs.manufacturer?.[0]?.value || summary?.manufacturer,
        model: attrs.model_number?.[0]?.value || attrs.model?.[0]?.value || summary?.modelNumber,
        color: attrs.color?.[0]?.value || summary?.color,
        size: attrs.size?.[0]?.value || summary?.size,
        productGroup: undefined,
        category: summary?.browseClassification?.displayName,
        categoryPath: undefined,
        imageUrl,
        salesRank: item.salesRanks?.[0]?.classificationRanks?.[0]?.rank,
        salesRankCategory: item.salesRanks?.[0]?.classificationRanks?.[0]?.title,
        bulletPoints: attrs.bullet_point?.map((b: { value?: string }) => b.value).filter(Boolean),
        features: attrs.product_feature?.map((f: { value?: string }) => f.value).filter(Boolean),
        identifiers,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      this.handleError(`getProductByAsin(${asin})`, error);
      return null;
    }
  }

  /**
   * Enhanced product search with more options
   */
  async searchProducts(params: AmazonSearchParams): Promise<AmazonProductMatch[]> {
    const results: AmazonProductMatch[] = [];

    try {
      if (!params.keywords && !params.brand) {
        return results;
      }

      // Build search query
      const keywords = [params.keywords, params.brand].filter(Boolean).join(' ');

      const includedData = params.includeSalesRank
        ? [
            SearchCatalogItemsIncludedDataEnum.Summaries,
            SearchCatalogItemsIncludedDataEnum.Attributes,
            SearchCatalogItemsIncludedDataEnum.SalesRanks,
          ]
        : [
            SearchCatalogItemsIncludedDataEnum.Summaries,
            SearchCatalogItemsIncludedDataEnum.Attributes,
          ];

      const response = await this.catalogClient.searchCatalogItems({
        marketplaceIds: [this.marketplaceId],
        keywords: keywords.split(' '),
        includedData,
        pageSize: params.limit || 20,
        classificationIds: params.browseNode ? [params.browseNode] : undefined,
      });

      const catalogResponse: ItemSearchResults = response.data;

      if (!catalogResponse.items) {
        return results;
      }

      // Get pricing for top results
      const asins = catalogResponse.items
        .map((item) => item.asin)
        .filter((asin): asin is string => !!asin)
        .slice(0, 20);

      let priceMap = new Map<string, number>();
      if (asins.length > 0) {
        try {
          priceMap = await this.getPricesForAsins(asins);
        } catch {
          // Continue without pricing
        }
      }

      for (const item of catalogResponse.items) {
        const match = this.itemToProductMatch(item, 'keywords', 0.7);
        if (match) {
          match.price = priceMap.get(item.asin);
          results.push(match);
        }
      }
    } catch (error) {
      this.handleError('searchProducts', error);
    }

    return results;
  }

  /**
   * Get current pricing data for multiple ASINs
   * Returns detailed pricing including buy box, new, used, FBA, FBM prices
   */
  async getCurrentPrices(asins: string[]): Promise<Map<string, AmazonPricingData>> {
    const priceMap = new Map<string, AmazonPricingData>();

    if (asins.length === 0) {
      return priceMap;
    }

    // Process in batches of 20 (Amazon API limit)
    const batches = this.chunkArray(asins, 20);

    for (const batch of batches) {
      try {
        const response = await this.pricingClient.getCompetitivePricing({
          marketplaceId: this.marketplaceId,
          itemType: GetCompetitivePricingItemTypeEnum.Asin,
          asins: batch,
        });

        const pricingResponse: GetPricingResponse = response.data;

        if (pricingResponse.payload) {
          for (const priceData of pricingResponse.payload) {
            if (!priceData.ASIN || priceData.status !== 'Success') continue;

            const competitivePricing = priceData.Product?.CompetitivePricing;
            const competitivePrices = competitivePricing?.CompetitivePrices || [];
            const offerListings = competitivePricing?.NumberOfOfferListings || [];

            // Extract different price types from competitive prices
            let buyBoxPrice: number | undefined;
            let newPrice: number | undefined;
            let usedPrice: number | undefined;

            for (const cp of competitivePrices) {
              const price = cp.Price?.ListingPrice?.Amount;
              const condition = cp.condition;
              const belongsToRequester = cp.belongsToRequester;

              if (price !== undefined) {
                if (belongsToRequester) {
                  buyBoxPrice = price;
                }
                if (condition === 'New') {
                  if (!newPrice || price < newPrice) newPrice = price;
                }
                if (condition === 'Used') {
                  if (!usedPrice || price < usedPrice) usedPrice = price;
                }
              }
            }

            // Count offers
            let newOfferCount = 0;
            let usedOfferCount = 0;
            for (const listing of offerListings) {
              if (listing.condition === 'New' || listing.condition === 'new') {
                newOfferCount += listing.Count || 0;
              } else if (listing.condition === 'Used' || listing.condition === 'used') {
                usedOfferCount += listing.Count || 0;
              }
            }

            priceMap.set(priceData.ASIN, {
              asin: priceData.ASIN,
              buyBoxPrice,
              newPrice,
              usedPrice,
              fbaPrice: undefined, // Would need separate API call for FBA/FBM breakdown
              fbmPrice: undefined,
              newOfferCount,
              usedOfferCount,
              currency: 'USD',
              lastUpdate: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        this.handleError(`getCurrentPrices batch`, error);
        // Continue with next batch
      }
    }

    return priceMap;
  }

  /**
   * Helper to split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get pricing for multiple ASINs (simple version returning price map)
   */
  private async getPricesForAsins(asins: string[]): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();

    try {
      const response = await this.pricingClient.getCompetitivePricing({
        marketplaceId: this.marketplaceId,
        itemType: GetCompetitivePricingItemTypeEnum.Asin,
        asins,
      });

      const pricingResponse: GetPricingResponse = response.data;

      if (pricingResponse.payload) {
        for (const priceData of pricingResponse.payload) {
          if (priceData.ASIN && priceData.status === 'Success') {
            const prices = priceData.Product?.CompetitivePricing?.CompetitivePrices || [];
            // Get the first available price
            const price = prices[0]?.Price?.ListingPrice?.Amount;
            if (price !== undefined) {
              priceMap.set(priceData.ASIN, price);
            }
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
      const attributes: Record<string, unknown[]> = {
        item_name: [{ value: listing.title, marketplace_id: this.marketplaceId }],
        product_description: [{ value: listing.description, marketplace_id: this.marketplaceId }],
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
      };

      if (listing.bulletPoints?.length) {
        attributes.bullet_point = listing.bulletPoints.map((point) => ({
          value: point,
          marketplace_id: this.marketplaceId,
        }));
      }

      if (listing.brand) {
        attributes.brand = [{ value: listing.brand, marketplace_id: this.marketplaceId }];
      }

      if (listing.model) {
        attributes.model_number = [{ value: listing.model, marketplace_id: this.marketplaceId }];
      }

      if (listing.images[0]) {
        attributes.main_product_image_locator = [{ value: listing.images[0], marketplace_id: this.marketplaceId }];
      }
      if (listing.images[1]) {
        attributes.other_product_image_locator_1 = [{ value: listing.images[1], marketplace_id: this.marketplaceId }];
      }
      if (listing.images[2]) {
        attributes.other_product_image_locator_2 = [{ value: listing.images[2], marketplace_id: this.marketplaceId }];
      }

      // PUT listing using SDK
      const response = await this.listingsClient.putListingsItem({
        sellerId,
        sku,
        marketplaceIds: [this.marketplaceId],
        body: {
          productType: 'PRODUCT',
          requirements: 'LISTING',
          attributes,
        },
      });

      const result: ListingsItemSubmissionResponse = response.data;

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
      this.handleError('createListing', error);
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
      const patches: PatchOperation[] = [];

      if (updates.title) {
        patches.push({
          op: PatchOperationOpEnum.Replace,
          path: '/attributes/item_name',
          value: [{ value: updates.title, marketplace_id: this.marketplaceId }],
        });
      }

      if (updates.description) {
        patches.push({
          op: PatchOperationOpEnum.Replace,
          path: '/attributes/product_description',
          value: [{ value: updates.description, marketplace_id: this.marketplaceId }],
        });
      }

      if (updates.price !== undefined) {
        patches.push({
          op: PatchOperationOpEnum.Replace,
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
        patches.push({
          op: PatchOperationOpEnum.Replace,
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

      if (patches.length === 0) {
        return {
          success: true,
          remoteListingId,
          metadata: { message: 'No updates to apply' },
        };
      }

      // PATCH listing using SDK
      const response = await this.listingsClient.patchListingsItem({
        sellerId,
        sku: remoteListingId,
        marketplaceIds: [this.marketplaceId],
        body: {
          productType: 'PRODUCT',
          patches,
        },
      });

      const result: ListingsItemSubmissionResponse = response.data;

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
      this.handleError('updateListing', error);
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

      const response = await this.listingsClient.getListingsItem({
        sellerId,
        sku: remoteListingId,
        marketplaceIds: [this.marketplaceId],
        includedData: [
          GetListingsItemIncludedDataEnum.Summaries,
          GetListingsItemIncludedDataEnum.Issues,
        ],
      });

      const result: ListingsItem = response.data;

      // Map Amazon status to our status enum
      // SDK returns status as an array of status enums in summaries
      const summary = result.summaries?.[0];
      const statusArray = summary?.status || [];

      // Check for known statuses (status is an array of enum values)
      if (statusArray.includes(ItemSummaryByMarketplaceStatusEnum.Buyable)) {
        return 'listed';
      }
      if (statusArray.includes(ItemSummaryByMarketplaceStatusEnum.Discoverable)) {
        return 'listed';
      }

      // If no status or unrecognized, assume pending
      return 'listing_pending';
    } catch (error) {
      this.handleError('getListingStatus', error);
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
   * Convert SDK Item to AmazonProductMatch
   */
  private itemToProductMatch(
    item: Item,
    matchedBy: 'upc' | 'ean' | 'isbn' | 'keywords',
    confidence: number
  ): AmazonProductMatch | null {
    if (!item.asin) {
      return null;
    }

    const summary = item.summaries?.[0];
    const attrs = item.attributes || {};
    const title =
      attrs.title?.[0]?.value ||
      attrs.item_name?.[0]?.value ||
      summary?.itemName ||
      'Unknown';

    const imageUrl = item.images?.[0]?.images?.[0]?.link;

    return {
      asin: item.asin,
      title,
      brand: attrs.brand?.[0]?.value || summary?.brand,
      category: summary?.browseClassification?.displayName,
      imageUrl,
      salesRank: item.salesRanks?.[0]?.classificationRanks?.[0]?.rank,
      confidence,
      source: 'catalog-api',
      matchedBy,
    };
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

  /**
   * Handle and log SDK errors gracefully
   */
  private handleError(operation: string, error: unknown): void {
    if (error instanceof SellingPartnerApiError) {
      console.error(`[amazon-adapter] ${operation} failed:`, {
        message: error.innerMessage,
        apiName: error.apiName,
        apiVersion: error.apiVersion,
        status: error.response?.status,
      });
    } else if (error instanceof Error) {
      console.error(`[amazon-adapter] ${operation} failed:`, error.message);
    } else {
      console.error(`[amazon-adapter] ${operation} failed:`, error);
    }
  }
}
