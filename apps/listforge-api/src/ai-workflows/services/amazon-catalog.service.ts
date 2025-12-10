import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AmazonAdapter,
  AmazonProductMatch,
  AmazonProductDetails,
  AmazonPricingData,
  CompResult,
  SearchCompsParams,
  MarketplaceCredentials,
} from '@listforge/marketplace-adapters';
import type {
  KeepaProductData,
  KeepaPriceStats,
  AmazonResearchData,
} from '@listforge/core-types';
import { KeepaService } from './keepa.service';

/**
 * Parameters for unified product lookup
 */
export interface AmazonProductLookupParams {
  /** UPC barcode */
  upc?: string;
  /** EAN barcode */
  ean?: string;
  /** ISBN for books */
  isbn?: string;
  /** ASIN if already known */
  asin?: string;
  /** Search keywords (fallback) */
  keywords?: string;
  /** Brand name */
  brand?: string;
  /** Model number */
  model?: string;
}

/**
 * AmazonCatalogService - High-level Amazon research service
 *
 * Combines:
 * - Amazon SP-API via AmazonAdapter for current product data
 * - Keepa API for historical pricing and sales rank data
 *
 * Features:
 * - Unified product lookup (UPC → ASIN → full data)
 * - Graceful degradation (works without Keepa, just less data)
 * - Caching handled by underlying services
 */
@Injectable()
export class AmazonCatalogService {
  private readonly logger = new Logger(AmazonCatalogService.name);
  private adapter: AmazonAdapter | null = null;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly keepaService: KeepaService,
  ) {
    // Initialize Amazon adapter if credentials available
    this.isConfigured = this.initializeAdapter();
  }

  /**
   * Initialize the Amazon adapter with environment credentials
   */
  private initializeAdapter(): boolean {
    const accessToken = this.configService.get<string>('AMAZON_ACCESS_TOKEN');
    const refreshToken = this.configService.get<string>('AMAZON_REFRESH_TOKEN');
    const clientId = this.configService.get<string>('AMAZON_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AMAZON_CLIENT_SECRET');

    // Check if we have the minimum required credentials
    if (!accessToken && !refreshToken) {
      this.logger.warn(
        'Amazon SP-API credentials not configured - Amazon lookups will use Keepa only',
      );
      return false;
    }

    try {
      const credentials: MarketplaceCredentials = {
        marketplace: 'AMAZON',
        accessToken: accessToken || '',
        refreshToken,
        amazonClientId: clientId,
        amazonClientSecret: clientSecret,
        amazonRegion: (this.configService.get<string>('AMAZON_REGION') as 'NA' | 'EU' | 'FE') || 'NA',
        amazonMarketplaceId: this.configService.get<string>('AMAZON_MARKETPLACE_ID') || 'ATVPDKIKX0DER',
      };

      this.adapter = new AmazonAdapter(credentials, async (updatedCreds) => {
        // Log token refresh
        this.logger.log('Amazon token refreshed');
      });

      this.logger.log('Amazon SP-API adapter initialized');
      return true;
    } catch (error) {
      this.logger.warn('Failed to initialize Amazon adapter:', error);
      return false;
    }
  }

  /**
   * Check if the service is configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured || this.keepaService.isServiceConfigured();
  }

  /**
   * Unified product lookup - tries multiple strategies
   * 1. UPC/EAN/ISBN → Amazon SP-API identifier lookup
   * 2. UPC → Keepa UPC search (fallback)
   * 3. Keywords → Amazon SP-API search (fallback)
   */
  async findProduct(params: AmazonProductLookupParams): Promise<AmazonProductMatch | null> {
    this.logger.debug(`Finding Amazon product:`, {
      hasUpc: !!params.upc,
      hasAsin: !!params.asin,
      hasKeywords: !!params.keywords,
    });

    // Strategy 1: Direct ASIN lookup if provided
    if (params.asin) {
      const product = await this.getProductDetails(params.asin);
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
        };
      }
    }

    // Strategy 2: UPC/EAN/ISBN lookup via Amazon SP-API
    if (this.adapter && (params.upc || params.ean || params.isbn)) {
      const match = await this.adapter.lookupByIdentifier({
        upc: params.upc,
        ean: params.ean,
        isbn: params.isbn,
      });

      if (match) {
        this.logger.debug(`Found product via SP-API identifier: ${match.asin}`);
        return match;
      }
    }

    // Strategy 3: UPC lookup via Keepa (fallback)
    if (params.upc && this.keepaService.isServiceConfigured()) {
      const keepaResult = await this.keepaService.searchByUpc(params.upc);
      if (keepaResult) {
        this.logger.debug(`Found product via Keepa UPC: ${keepaResult.asin}`);

        // Get additional details from Amazon if possible
        let details: AmazonProductDetails | null = null;
        if (this.adapter) {
          details = await this.adapter.getProductByAsin(keepaResult.asin);
        }

        return {
          asin: keepaResult.asin,
          title: details?.title || keepaResult.title,
          brand: details?.brand,
          category: details?.category,
          imageUrl: details?.imageUrl,
          salesRank: details?.salesRank,
          confidence: 0.9, // High confidence for UPC match
          source: 'catalog-api',
          matchedBy: 'upc',
        };
      }
    }

    // Strategy 4: Keyword search (lowest confidence)
    if (this.adapter && (params.keywords || params.brand || params.model)) {
      const keywords = [params.brand, params.model, params.keywords].filter(Boolean).join(' ');

      const searchResults = await this.adapter.searchProducts({
        keywords,
        limit: 5,
        includeSalesRank: true,
      });

      if (searchResults.length > 0) {
        // Return the best match (first result)
        const best = searchResults[0];
        this.logger.debug(`Found product via keyword search: ${best.asin}`);
        return {
          ...best,
          confidence: Math.min(best.confidence, 0.6), // Cap confidence for keyword matches
        };
      }
    }

    this.logger.debug('No Amazon product found');
    return null;
  }

  /**
   * Get full research data for an ASIN
   * Combines product details, current pricing, and Keepa historical data
   */
  async getResearchData(asin: string): Promise<AmazonResearchData | null> {
    this.logger.debug(`Getting research data for ASIN: ${asin}`);

    // Get product details
    let product: AmazonProductMatch | null = null;
    let productDetails: AmazonProductDetails | null = null;

    if (this.adapter) {
      productDetails = await this.adapter.getProductByAsin(asin);
      if (productDetails) {
        product = {
          asin: productDetails.asin,
          title: productDetails.title,
          brand: productDetails.brand,
          category: productDetails.category,
          imageUrl: productDetails.imageUrl,
          salesRank: productDetails.salesRank,
          confidence: 1.0,
          source: 'catalog-api',
        };
      }
    }

    // Get Keepa data
    let keepaData: KeepaProductData | null = null;
    let priceStats: KeepaPriceStats | null = null;

    if (this.keepaService.isServiceConfigured()) {
      keepaData = await this.keepaService.getProductByAsin(asin);

      if (keepaData) {
        priceStats = this.keepaService.calculatePriceStats(keepaData);

        // Use Keepa data to fill in missing product details
        if (!product) {
          product = {
            asin: keepaData.asin,
            title: keepaData.title,
            brand: keepaData.brand,
            category: keepaData.category?.[0],
            salesRank: keepaData.salesRank || undefined,
            confidence: 0.85,
            source: 'catalog-api',
          };
        } else {
          // Enrich with Keepa data
          if (!product.salesRank && keepaData.salesRank) {
            product.salesRank = keepaData.salesRank;
          }
        }
      }
    }

    if (!product) {
      return null;
    }

    // Get current pricing
    let currentPricing: AmazonPricingData | null = null;
    if (this.adapter) {
      const priceMap = await this.adapter.getCurrentPrices([asin]);
      currentPricing = priceMap.get(asin) || null;
    }

    // Use Keepa buy box price as fallback
    if (!currentPricing && keepaData?.buyBoxPrice) {
      currentPricing = {
        asin,
        buyBoxPrice: keepaData.buyBoxPrice / 100, // Keepa stores in cents
        newOfferCount: keepaData.newOfferCount,
        usedOfferCount: keepaData.usedOfferCount,
        currency: 'USD',
        lastUpdate: keepaData.lastUpdate,
      };
    }

    return {
      product,
      keepaData,
      currentPricing,
      priceStats,
    };
  }

  /**
   * Get product details by ASIN
   */
  async getProductDetails(asin: string): Promise<AmazonProductDetails | null> {
    if (this.adapter) {
      return this.adapter.getProductByAsin(asin);
    }

    // Fallback to Keepa
    if (this.keepaService.isServiceConfigured()) {
      const keepaData = await this.keepaService.getProductByAsin(asin);
      if (keepaData) {
        return {
          asin: keepaData.asin,
          title: keepaData.title,
          brand: keepaData.brand,
          manufacturer: keepaData.manufacturer,
          category: keepaData.category?.[0],
          categoryPath: keepaData.category,
          salesRank: keepaData.salesRank || undefined,
          lastUpdate: keepaData.lastUpdate,
        };
      }
    }

    return null;
  }

  /**
   * Search for comparable products on Amazon
   * Returns results with current pricing
   */
  async searchComps(params: SearchCompsParams): Promise<CompResult[]> {
    const results: CompResult[] = [];

    if (!this.adapter) {
      this.logger.debug('Amazon adapter not configured, skipping comp search');
      return results;
    }

    try {
      // Use the adapter's searchComps method
      const comps = await this.adapter.searchComps(params);

      // Enrich results with source identifier
      for (const comp of comps) {
        results.push({
          ...comp,
          attributes: {
            ...comp.attributes,
            source: 'amazon',
          },
        });
      }

      this.logger.debug(`Found ${results.length} Amazon comps`);
    } catch (error) {
      this.logger.error('Error searching Amazon comps:', error);
    }

    return results;
  }

  /**
   * Get Keepa historical data for multiple ASINs
   * Useful for batch enrichment of search results
   */
  async getBulkKeepaData(asins: string[]): Promise<Map<string, KeepaProductData>> {
    if (!this.keepaService.isServiceConfigured()) {
      return new Map();
    }

    return this.keepaService.getBulkProducts(asins);
  }

  /**
   * Calculate BSR trend for a product
   */
  getBsrTrend(keepaData: KeepaProductData): 'rising' | 'falling' | 'stable' {
    return this.keepaService.calculateBsrTrend(keepaData.salesRankHistory);
  }

  /**
   * Get price statistics from Keepa data
   */
  getPriceStats(keepaData: KeepaProductData): KeepaPriceStats {
    return this.keepaService.calculatePriceStats(keepaData);
  }
}

