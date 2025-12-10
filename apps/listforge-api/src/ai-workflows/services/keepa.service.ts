import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type {
  KeepaProductData,
  KeepaSearchResult,
  KeepaPriceStats,
  KeepaPrice,
  KeepaSalesRank,
} from '@listforge/core-types';
import { getRateLimiter, RATE_LIMITER_CONFIGS } from '../utils/rate-limiter';

/**
 * Keepa API response types
 */
interface KeepaApiProduct {
  asin: string;
  title?: string;
  brand?: string;
  manufacturer?: string;
  productGroup?: string;
  categoryTree?: Array<{ catId: number; name: string }>;
  salesRanks?: Record<string, number[]>; // Category ID -> [timestamp, rank, ...]
  csv?: (number | null)[][]; // Price history arrays
  stats?: {
    current?: number[];
    avg?: number[];
    avg30?: number[];
    avg90?: number[];
    avg180?: number[];
    min?: number[][];
    max?: number[][];
  };
  buyBoxSellerIdHistory?: string[];
  imagesCSV?: string;
  lastUpdate?: number;
  rootCategory?: number;
  parentAsin?: string;
  variationCSV?: string;
  // Offer counts
  newOfferCount?: number;
  usedOfferCount?: number;
  // Review data
  reviews?: number;
  rating?: number;
}

interface KeepaApiResponse {
  timestamp?: number;
  tokensLeft?: number;
  refillIn?: number;
  refillRate?: number;
  tokenFlowReduction?: number;
  tokensConsumed?: number;
  processingTimeInMs?: number;
  products?: KeepaApiProduct[];
  asinList?: string[];
  error?: {
    type: string;
    message: string;
  };
}

/**
 * Keepa time conversion helpers
 * Keepa uses minutes since 2011-01-01 00:00:00 UTC
 */
const KEEPA_EPOCH = new Date('2011-01-01T00:00:00Z').getTime();

function keepaTimeToDate(keepaTime: number): Date {
  return new Date(KEEPA_EPOCH + keepaTime * 60 * 1000);
}

function dateToKeepaTime(date: Date): number {
  return Math.floor((date.getTime() - KEEPA_EPOCH) / (60 * 1000));
}

/**
 * Price index constants from Keepa
 * Each index corresponds to a specific price type in the csv array
 */
const KEEPA_PRICE_INDEX = {
  AMAZON: 0, // Amazon direct price
  NEW: 1, // New third-party lowest
  USED: 2, // Used lowest
  SALES_RANK: 3, // Sales rank
  LIST_PRICE: 4, // List price
  COLLECTIBLE: 5, // Collectible lowest
  REFURBISHED: 6, // Refurbished lowest
  NEW_FBM_SHIPPING: 7, // New FBM shipping
  LIGHTNING_DEAL: 8, // Lightning deal
  WAREHOUSE: 9, // Warehouse deal
  NEW_FBA: 10, // New FBA lowest
  COUNT_NEW: 11, // New offer count
  COUNT_USED: 12, // Used offer count
  COUNT_REFURBISHED: 13, // Refurbished offer count
  COUNT_COLLECTIBLE: 14, // Collectible offer count
  RATING: 16, // Rating
  REVIEW_COUNT: 17, // Review count
  BUY_BOX_SHIPPING: 18, // Buy box shipping cost
  USED_NEW_SHIPPING: 19, // Used shipping
  USED_VERY_GOOD: 20, // Used very good
  USED_GOOD: 21, // Used good
  USED_ACCEPTABLE: 22, // Used acceptable
  COLLECTIBLE_NEW: 23, // Collectible new
  COLLECTIBLE_VERY_GOOD: 24, // Collectible very good
  COLLECTIBLE_GOOD: 25, // Collectible good
  COLLECTIBLE_ACCEPTABLE: 26, // Collectible acceptable
  COUNT_NEW_FBA: 27, // New FBA offer count
  COUNT_NEW_FBM: 28, // New FBM offer count
  TRADE_IN_VALUE: 29, // Trade-in value
  RENTAL: 30, // Rental price
};

/**
 * KeepaService - Historical Amazon pricing data via Keepa API
 *
 * Provides:
 * - ASIN lookup with full price history
 * - UPC/EAN to ASIN resolution
 * - Bulk product lookups (up to 100 ASINs)
 * - Price statistics calculations
 * - Redis caching for performance
 *
 * Keepa API docs: https://keepa.com/#!discuss/t/product-data-api-documentation/1
 */
@Injectable()
export class KeepaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepaService.name);
  private redis: Redis | null = null;
  private readonly apiKey: string | null;
  private readonly apiBaseUrl = 'https://api.keepa.com';
  private readonly isConfigured: boolean;

  // Cache TTLs
  private readonly CACHE_TTL_PRODUCT = 60 * 60 * 24; // 24 hours for product data
  private readonly CACHE_TTL_UPC = 60 * 60 * 24 * 7; // 7 days for UPC->ASIN mappings
  private readonly CACHE_TTL_NOT_FOUND = 60 * 60 * 6; // 6 hours for not-found results

  // Default domain for US Amazon
  private readonly DOMAIN_US = 1;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KEEPA_API_KEY') || null;
    this.isConfigured = !!this.apiKey;

    if (!this.apiKey) {
      this.logger.warn('KEEPA_API_KEY not configured - Keepa lookups will be unavailable');
    }
  }

  async onModuleInit() {
    await this.initRedis();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Initialize Redis connection
   */
  private async initRedis() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      const redisHost = this.configService.get<string>('REDIS_HOST');

      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      } else if (redisHost) {
        this.redis = new Redis({
          host: redisHost,
          port: parseInt(this.configService.get<string>('REDIS_PORT') || '6379', 10),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: parseInt(this.configService.get<string>('REDIS_DB') || '0', 10),
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });
      }

      if (this.redis) {
        await this.redis.connect();
        this.logger.log('Redis connected for Keepa caching');
      } else {
        this.logger.warn('No Redis configured - Keepa caching disabled');
      }
    } catch (error) {
      this.logger.warn('Failed to connect to Redis for Keepa caching:', error);
      this.redis = null;
    }
  }

  /**
   * Check if the service is configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get product data by ASIN
   */
  async getProductByAsin(asin: string): Promise<KeepaProductData | null> {
    if (!this.isConfigured) {
      this.logger.debug('Keepa not configured, skipping ASIN lookup');
      return null;
    }

    // Check cache first
    const cached = await this.getFromCache<KeepaProductData>(`keepa:product:${asin}`);
    if (cached) {
      this.logger.debug(`Cache hit for ASIN: ${asin}`);
      return cached;
    }

    try {
      const response = await this.callApi('/product', {
        domain: this.DOMAIN_US,
        asin,
        stats: 90, // Get 90-day stats
        history: 1, // Include price history
        offers: 0, // Don't include offer data (saves tokens)
      });

      if (!response.products || response.products.length === 0) {
        this.logger.debug(`No product found for ASIN: ${asin}`);
        await this.setCache(`keepa:product:${asin}`, null, this.CACHE_TTL_NOT_FOUND);
        return null;
      }

      const product = this.parseProduct(response.products[0]);
      await this.setCache(`keepa:product:${asin}`, product, this.CACHE_TTL_PRODUCT);

      return product;
    } catch (error) {
      this.logger.error(`Failed to fetch ASIN ${asin}:`, error);
      return null;
    }
  }

  /**
   * Get multiple products by ASINs (batch lookup)
   * Keepa supports up to 100 ASINs per request
   */
  async getBulkProducts(asins: string[]): Promise<Map<string, KeepaProductData>> {
    const results = new Map<string, KeepaProductData>();

    if (!this.isConfigured || asins.length === 0) {
      return results;
    }

    // Check cache first for all ASINs
    const uncachedAsins: string[] = [];
    for (const asin of asins) {
      const cached = await this.getFromCache<KeepaProductData>(`keepa:product:${asin}`);
      if (cached) {
        results.set(asin, cached);
      } else {
        uncachedAsins.push(asin);
      }
    }

    if (uncachedAsins.length === 0) {
      this.logger.debug(`All ${asins.length} ASINs found in cache`);
      return results;
    }

    // Batch request for uncached ASINs (max 100 per request)
    const batches = this.chunkArray(uncachedAsins, 100);

    for (const batch of batches) {
      try {
        const response = await this.callApi('/product', {
          domain: this.DOMAIN_US,
          asin: batch.join(','),
          stats: 90,
          history: 1,
          offers: 0,
        });

        if (response.products) {
          for (const apiProduct of response.products) {
            const product = this.parseProduct(apiProduct);
            results.set(product.asin, product);
            await this.setCache(`keepa:product:${product.asin}`, product, this.CACHE_TTL_PRODUCT);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to fetch batch of ${batch.length} ASINs:`, error);
      }
    }

    return results;
  }

  /**
   * Search by UPC/EAN code to find matching ASIN
   */
  async searchByUpc(upc: string): Promise<KeepaSearchResult | null> {
    if (!this.isConfigured) {
      return null;
    }

    // Clean the UPC
    const cleanUpc = upc.replace(/\D/g, '');
    if (!cleanUpc) {
      return null;
    }

    // Check cache first
    const cacheKey = `keepa:upc:${cleanUpc}`;
    const cached = await this.getFromCache<KeepaSearchResult>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for UPC: ${cleanUpc}`);
      return cached;
    }

    try {
      // Use the product request API with code parameter for UPC/EAN lookup
      const response = await this.callApi('/product', {
        domain: this.DOMAIN_US,
        code: cleanUpc,
        stats: 0, // Don't need stats for search
        history: 0,
        offers: 0,
      });

      if (!response.products || response.products.length === 0) {
        this.logger.debug(`No product found for UPC: ${cleanUpc}`);
        await this.setCache(cacheKey, null, this.CACHE_TTL_NOT_FOUND);
        return null;
      }

      const firstProduct = response.products[0];
      const result: KeepaSearchResult = {
        asin: firstProduct.asin,
        title: firstProduct.title || '',
        domainId: this.DOMAIN_US,
        trackingSince: firstProduct.lastUpdate || 0,
        type: firstProduct.parentAsin ? 'variation' : 'product',
      };

      await this.setCache(cacheKey, result, this.CACHE_TTL_UPC);
      return result;
    } catch (error) {
      this.logger.error(`Failed to search UPC ${cleanUpc}:`, error);
      return null;
    }
  }

  /**
   * Search by keyword to find matching products
   */
  async searchByKeyword(
    keyword: string,
    limit: number = 10,
  ): Promise<KeepaSearchResult[]> {
    if (!this.isConfigured || !keyword.trim()) {
      return [];
    }

    try {
      const response = await this.callApi('/search', {
        domain: this.DOMAIN_US,
        type: 'product',
        term: keyword,
        page: 0,
      });

      const results: KeepaSearchResult[] = [];
      if (response.asinList) {
        for (const asin of response.asinList.slice(0, limit)) {
          results.push({
            asin,
            title: '', // Title not returned by search endpoint
            domainId: this.DOMAIN_US,
            trackingSince: 0,
            type: 'product',
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to search keyword "${keyword}":`, error);
      return [];
    }
  }

  /**
   * Calculate price statistics from Keepa data
   */
  calculatePriceStats(data: KeepaProductData): KeepaPriceStats {
    const now = dateToKeepaTime(new Date());
    const thirtyDaysAgo = now - (30 * 24 * 60); // 30 days in Keepa time (minutes)
    const ninetyDaysAgo = now - (90 * 24 * 60); // 90 days in Keepa time

    // Get current price (prefer Amazon, then New)
    const current = this.getLatestPrice(data.priceHistory.amazon) ||
                    this.getLatestPrice(data.priceHistory.new);

    // Calculate stats for each period
    const prices30 = this.getPricesInRange(data.priceHistory.new, thirtyDaysAgo, now);
    const prices90 = this.getPricesInRange(data.priceHistory.new, ninetyDaysAgo, now);

    return {
      current: current ? current / 100 : null, // Convert cents to dollars
      avg30: prices30.length > 0 ? this.average(prices30) / 100 : null,
      avg90: prices90.length > 0 ? this.average(prices90) / 100 : null,
      min30: prices30.length > 0 ? Math.min(...prices30) / 100 : null,
      max30: prices30.length > 0 ? Math.max(...prices30) / 100 : null,
      min90: prices90.length > 0 ? Math.min(...prices90) / 100 : null,
      max90: prices90.length > 0 ? Math.max(...prices90) / 100 : null,
      dropChance: this.calculateDropChance(data.priceHistory.new),
    };
  }

  /**
   * Calculate BSR trend from sales rank history
   */
  calculateBsrTrend(history: KeepaSalesRank[]): 'rising' | 'falling' | 'stable' {
    if (history.length < 2) {
      return 'stable';
    }

    const recent = history.slice(-10); // Last 10 data points
    if (recent.length < 2) {
      return 'stable';
    }

    const firstRank = recent[0].rank;
    const lastRank = recent[recent.length - 1].rank;

    // Note: Lower BSR = better sales, so "rising" means improving sales (lower rank)
    const percentChange = ((lastRank - firstRank) / firstRank) * 100;

    if (percentChange < -10) {
      return 'rising'; // Rank improved (got lower = more sales)
    } else if (percentChange > 10) {
      return 'falling'; // Rank worsened (got higher = fewer sales)
    }

    return 'stable';
  }

  /**
   * Call the Keepa API with rate limiting
   */
  private async callApi(
    endpoint: string,
    params: Record<string, string | number>,
  ): Promise<KeepaApiResponse> {
    if (!this.apiKey) {
      throw new Error('Keepa API key not configured');
    }

    // Apply rate limiting
    const rateLimiter = getRateLimiter('keepa', RATE_LIMITER_CONFIGS.keepa);
    await rateLimiter.acquire();

    const url = new URL(`${this.apiBaseUrl}${endpoint}`);
    url.searchParams.set('key', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    this.logger.debug(`Calling Keepa API: ${endpoint}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Keepa API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as KeepaApiResponse;

    // Log token usage
    if (data.tokensLeft !== undefined) {
      this.logger.debug(
        `Keepa tokens: ${data.tokensConsumed} consumed, ${data.tokensLeft} remaining, ` +
        `refill in ${data.refillIn}ms`,
      );
    }

    // Check for API errors
    if (data.error) {
      throw new Error(`Keepa API error: ${data.error.type} - ${data.error.message}`);
    }

    return data;
  }

  /**
   * Parse Keepa API product response into our format
   */
  private parseProduct(apiProduct: KeepaApiProduct): KeepaProductData {
    const csv = apiProduct.csv || [];

    // Parse price histories from CSV arrays
    const priceHistory = {
      amazon: this.parsePriceArray(csv[KEEPA_PRICE_INDEX.AMAZON]),
      new: this.parsePriceArray(csv[KEEPA_PRICE_INDEX.NEW]),
      used: this.parsePriceArray(csv[KEEPA_PRICE_INDEX.USED]),
      salesRank: this.parsePriceArray(csv[KEEPA_PRICE_INDEX.SALES_RANK]),
    };

    // Parse sales rank history
    const salesRankHistory = this.parseSalesRankHistory(apiProduct.salesRanks);

    // Get current buy box price
    const buyBoxPrice = this.getLatestPrice(priceHistory.new);

    // Build category path
    const category = (apiProduct.categoryTree || []).map((c) => c.name);

    return {
      asin: apiProduct.asin,
      title: apiProduct.title || '',
      brand: apiProduct.brand,
      manufacturer: apiProduct.manufacturer,
      productGroup: apiProduct.productGroup,
      category,
      salesRank: salesRankHistory.length > 0 ? salesRankHistory[salesRankHistory.length - 1].rank : null,
      salesRankHistory,
      priceHistory,
      buyBoxPrice,
      buyBoxSeller: apiProduct.buyBoxSellerIdHistory?.[0] || null,
      newOfferCount: apiProduct.newOfferCount || 0,
      usedOfferCount: apiProduct.usedOfferCount || 0,
      reviewCount: apiProduct.reviews || 0,
      rating: apiProduct.rating || 0,
      imageUrls: apiProduct.imagesCSV ? apiProduct.imagesCSV.split(',') : [],
      lastUpdate: apiProduct.lastUpdate ? keepaTimeToDate(apiProduct.lastUpdate).toISOString() : new Date().toISOString(),
      rootCategory: apiProduct.rootCategory?.toString(),
      parentAsin: apiProduct.parentAsin,
      variationCSV: apiProduct.variationCSV,
    };
  }

  /**
   * Parse Keepa price array format: [time1, price1, time2, price2, ...]
   */
  private parsePriceArray(arr?: (number | null)[]): KeepaPrice[] {
    const prices: KeepaPrice[] = [];

    if (!arr || arr.length < 2) {
      return prices;
    }

    for (let i = 0; i < arr.length - 1; i += 2) {
      const timestamp = arr[i];
      const price = arr[i + 1];

      if (timestamp !== null && price !== null && price >= 0) {
        prices.push({ timestamp, price });
      }
    }

    return prices;
  }

  /**
   * Parse sales rank history from Keepa format
   */
  private parseSalesRankHistory(salesRanks?: Record<string, number[]>): KeepaSalesRank[] {
    const history: KeepaSalesRank[] = [];

    if (!salesRanks) {
      return history;
    }

    // Get the main category sales rank (usually first key)
    const categoryIds = Object.keys(salesRanks);
    if (categoryIds.length === 0) {
      return history;
    }

    const mainCategoryRanks = salesRanks[categoryIds[0]];
    if (!mainCategoryRanks || mainCategoryRanks.length < 2) {
      return history;
    }

    for (let i = 0; i < mainCategoryRanks.length - 1; i += 2) {
      const timestamp = mainCategoryRanks[i];
      const rank = mainCategoryRanks[i + 1];

      if (timestamp !== null && rank !== null && rank > 0) {
        history.push({ timestamp, rank });
      }
    }

    return history;
  }

  /**
   * Get the most recent price from a price array
   */
  private getLatestPrice(prices: KeepaPrice[]): number | null {
    if (prices.length === 0) {
      return null;
    }

    // Prices are in chronological order, get the last one
    const latest = prices[prices.length - 1];
    return latest.price;
  }

  /**
   * Get prices within a time range
   */
  private getPricesInRange(prices: KeepaPrice[], startTime: number, endTime: number): number[] {
    return prices
      .filter((p) => p.timestamp >= startTime && p.timestamp <= endTime)
      .map((p) => p.price);
  }

  /**
   * Calculate average of numbers
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Calculate drop chance based on price history volatility
   */
  private calculateDropChance(prices: KeepaPrice[]): number {
    if (prices.length < 10) {
      return 0;
    }

    // Count how often price dropped
    let drops = 0;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i].price < prices[i - 1].price) {
        drops++;
      }
    }

    return Math.round((drops / (prices.length - 1)) * 100);
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get value from cache
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Handle null cache entries (not found results)
        return parsed as T;
      }
    } catch (error) {
      this.logger.warn('Cache read error:', error);
    }
    return null;
  }

  /**
   * Set value in cache
   */
  private async setCache(key: string, value: unknown, ttl: number): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.warn('Cache write error:', error);
    }
  }
}

