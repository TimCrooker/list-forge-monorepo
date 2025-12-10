import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import eBayApi from 'ebay-api';
import Redis from 'ioredis';
import type {
  CategoryNode,
  FieldRequirement,
  MarketplaceCategory,
  FieldCompletion,
  ItemCondition,
} from '@listforge/core-types';
import { getRateLimiter, RATE_LIMITER_CONFIGS } from '../utils/rate-limiter';

/**
 * Product info for category detection
 */
export interface ProductInfo {
  brand?: string;
  model?: string;
  title?: string;
  category?: string[];
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Category detection result
 */
export interface CategoryDetection {
  categoryId: string;
  categoryPath: string[];
  categoryName: string;
  confidence: number;
  requiredFields: FieldRequirement[];
  recommendedFields: FieldRequirement[];
}

/**
 * eBay category suggestion from API
 */
interface EbayCategorySuggestion {
  category: {
    categoryId: string;
    categoryName: string;
    categoryTreeNodeLevel?: number;
  };
  categoryTreeNodeAncestors?: Array<{
    categoryId: string;
    categoryName: string;
    categoryTreeNodeLevel?: number;
  }>;
  relevancy?: string;
}

/**
 * eBay aspect (item specific) from Taxonomy API
 */
interface EbayAspect {
  localizedAspectName: string;
  aspectConstraint?: {
    aspectRequired?: boolean;
    aspectDataType?: string;
    itemToAspectCardinality?: string;
    aspectMode?: string;
  };
  aspectValues?: Array<{
    localizedValue: string;
  }>;
}

/**
 * MarketplaceSchemaService - Slice 4: Marketplace Schema Awareness
 *
 * Provides dynamic understanding of marketplace requirements:
 * - Category detection using eBay Taxonomy API
 * - Required/recommended field fetching per category
 * - Condition code mapping
 * - Redis caching for performance
 */
@Injectable()
export class MarketplaceSchemaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketplaceSchemaService.name);
  private redis: Redis | null = null;
  private ebay: eBayApi | null = null;

  // Cache TTLs
  private readonly CACHE_TTL_CATEGORY_TREE = 60 * 60 * 24 * 7; // 7 days
  private readonly CACHE_TTL_CATEGORY_ASPECTS = 60 * 60 * 24 * 7; // 7 days
  private readonly CACHE_TTL_SUGGESTIONS = 60 * 60 * 24; // 1 day

  // eBay category tree ID for US marketplace
  private readonly EBAY_US_CATEGORY_TREE_ID = '0';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initRedis();
    this.initEbay();
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
        this.logger.log('Redis connected for marketplace schema caching');
      } else {
        this.logger.warn('No Redis configured - marketplace schema caching disabled');
      }
    } catch (error) {
      this.logger.warn('Failed to connect to Redis for marketplace schema caching:', error);
      this.redis = null;
    }
  }

  /**
   * Initialize eBay API client for Taxonomy API calls
   * Uses application-level OAuth (no user tokens needed)
   */
  private initEbay() {
    try {
      const appId = this.configService.get<string>('EBAY_APP_ID');
      const certId = this.configService.get<string>('EBAY_CERT_ID');
      const sandbox = this.configService.get<string>('EBAY_SANDBOX') === 'true';

      if (!appId || !certId) {
        this.logger.warn('eBay credentials not configured - category detection will be limited');
        return;
      }

      this.ebay = new eBayApi({
        appId,
        certId,
        sandbox,
        siteId: eBayApi.SiteId.EBAY_US,
      });

      this.logger.log('eBay API client initialized for Taxonomy API');
    } catch (error) {
      this.logger.warn('Failed to initialize eBay API client:', error);
      this.ebay = null;
    }
  }

  /**
   * Get category suggestions for a product query
   * Uses eBay Taxonomy API getCategorySuggestions
   */
  async getCategorySuggestions(query: string): Promise<EbayCategorySuggestion[]> {
    if (!this.ebay || !query.trim()) {
      return [];
    }

    // Check cache first
    const cacheKey = `ebay:category:suggestions:${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = await this.getFromCache<EbayCategorySuggestion[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for category suggestions: ${query}`);
      return cached;
    }

    try {
      // Apply rate limiting before eBay API call
      const rateLimiter = getRateLimiter('ebayTaxonomy', RATE_LIMITER_CONFIGS.ebayTaxonomy);
      await rateLimiter.acquire();

      // Use the Taxonomy API to get category suggestions
      // Note: The ebay-api library expects (categoryTreeId: string, query: string)
      const response = await this.ebay.commerce.taxonomy.getCategorySuggestions(
        this.EBAY_US_CATEGORY_TREE_ID,
        query
      );

      const suggestions = (response.categorySuggestions || []) as EbayCategorySuggestion[];

      // Cache the results
      await this.setCache(cacheKey, suggestions, this.CACHE_TTL_SUGGESTIONS);

      this.logger.debug(`Got ${suggestions.length} category suggestions for: ${query}`);
      return suggestions;
    } catch (error: any) {
      this.logger.warn(`Failed to get category suggestions for "${query}":`, error?.message);
      return [];
    }
  }

  /**
   * Get item aspects (required/recommended fields) for a category
   * Uses eBay Taxonomy API getItemAspectsForCategory
   */
  async getCategoryAspects(categoryId: string): Promise<{
    required: FieldRequirement[];
    recommended: FieldRequirement[];
  }> {
    if (!this.ebay || !categoryId) {
      return { required: [], recommended: [] };
    }

    // Check cache first
    const cacheKey = `ebay:category:aspects:${categoryId}`;
    const cached = await this.getFromCache<{ required: FieldRequirement[]; recommended: FieldRequirement[] }>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for category aspects: ${categoryId}`);
      return cached;
    }

    try {
      // Apply rate limiting before eBay API call
      const rateLimiter = getRateLimiter('ebayTaxonomy', RATE_LIMITER_CONFIGS.ebayTaxonomy);
      await rateLimiter.acquire();

      // Note: The ebay-api library expects (categoryTreeId: string, categoryId: string)
      const response = await this.ebay.commerce.taxonomy.getItemAspectsForCategory(
        this.EBAY_US_CATEGORY_TREE_ID,
        categoryId
      );

      const aspects = (response.aspects || []) as EbayAspect[];
      const required: FieldRequirement[] = [];
      const recommended: FieldRequirement[] = [];

      for (const aspect of aspects) {
        const field: FieldRequirement = {
          name: aspect.localizedAspectName,
          localizedName: aspect.localizedAspectName,
          dataType: this.mapAspectDataType(aspect.aspectConstraint?.aspectDataType),
          required: aspect.aspectConstraint?.aspectRequired === true,
          cardinality: aspect.aspectConstraint?.itemToAspectCardinality === 'MULTI' ? 'multi' : 'single',
          allowedValues: aspect.aspectValues?.map(v => v.localizedValue),
        };

        if (field.required) {
          required.push(field);
        } else {
          recommended.push(field);
        }
      }

      const result = { required, recommended };

      // Cache the results
      await this.setCache(cacheKey, result, this.CACHE_TTL_CATEGORY_ASPECTS);

      this.logger.debug(`Got ${required.length} required, ${recommended.length} recommended fields for category: ${categoryId}`);
      return result;
    } catch (error: any) {
      this.logger.warn(`Failed to get category aspects for "${categoryId}":`, error?.message);
      return { required: [], recommended: [] };
    }
  }

  /**
   * Detect the best eBay category for a product
   * Combines product info into a search query and uses eBay's suggestions
   */
  async detectCategory(productInfo: ProductInfo): Promise<CategoryDetection | null> {
    // Build a search query from product info
    const queryParts: string[] = [];
    if (productInfo.brand) queryParts.push(productInfo.brand);
    if (productInfo.model) queryParts.push(productInfo.model);
    if (productInfo.title && !productInfo.brand && !productInfo.model) {
      queryParts.push(productInfo.title);
    }

    const query = queryParts.join(' ').trim();
    if (!query) {
      this.logger.debug('No query available for category detection');
      return null;
    }

    // Get category suggestions
    const suggestions = await this.getCategorySuggestions(query);
    if (suggestions.length === 0) {
      return null;
    }

    // Use the first (best) suggestion
    const best = suggestions[0];
    const categoryId = best.category.categoryId;
    const categoryName = best.category.categoryName;

    // Build category path from ancestors
    const categoryPath: string[] = [];
    if (best.categoryTreeNodeAncestors) {
      // Sort by level to get correct order
      const sorted = [...best.categoryTreeNodeAncestors].sort(
        (a, b) => (a.categoryTreeNodeLevel || 0) - (b.categoryTreeNodeLevel || 0)
      );
      for (const ancestor of sorted) {
        categoryPath.push(ancestor.categoryName);
      }
    }
    categoryPath.push(categoryName);

    // Get required/recommended fields for this category
    const { required, recommended } = await this.getCategoryAspects(categoryId);

    // Calculate confidence based on relevancy if provided
    let confidence = 0.8; // Default confidence
    if (best.relevancy === 'HIGH') {
      confidence = 0.95;
    } else if (best.relevancy === 'MEDIUM') {
      confidence = 0.75;
    } else if (best.relevancy === 'LOW') {
      confidence = 0.5;
    }

    return {
      categoryId,
      categoryPath,
      categoryName,
      confidence,
      requiredFields: required,
      recommendedFields: recommended,
    };
  }

  /**
   * Map internal condition to eBay condition ID
   * eBay condition IDs vary by category, but common ones are:
   * - 1000: New
   * - 1500: New other (see details)
   * - 2000: Certified refurbished
   * - 2500: Seller refurbished
   * - 3000: Used
   * - 4000: Very Good
   * - 5000: Good
   * - 6000: Acceptable
   * - 7000: For parts or not working
   */
  mapCondition(condition: ItemCondition | string, _categoryId?: string): string {
    const normalizedCondition = typeof condition === 'string' ? condition.toLowerCase() : condition;

    const mapping: Record<string, string> = {
      'new': '1000',
      'used_like_new': '1500',
      'like_new': '1500',
      'used_very_good': '3000',
      'very_good': '3000',
      'used_good': '4000',
      'good': '4000',
      'used_acceptable': '5000',
      'acceptable': '5000',
      'for_parts': '7000',
    };

    return mapping[normalizedCondition] || '3000'; // Default to Used
  }

  /**
   * Get reverse condition mapping (eBay ID to display name)
   */
  getConditionName(conditionId: string): string {
    const reverseMapping: Record<string, string> = {
      '1000': 'New',
      '1500': 'New (Other)',
      '2000': 'Certified Refurbished',
      '2500': 'Seller Refurbished',
      '3000': 'Used',
      '4000': 'Very Good',
      '5000': 'Good',
      '6000': 'Acceptable',
      '7000': 'For parts or not working',
    };

    return reverseMapping[conditionId] || 'Used';
  }

  /**
   * Calculate field completion for an item
   */
  calculateFieldCompletion(
    itemAttributes: Record<string, string | number | boolean | undefined>,
    requiredFields: FieldRequirement[],
    recommendedFields: FieldRequirement[]
  ): FieldCompletion {
    const normalizedAttrs = new Map<string, string | number | boolean>();
    for (const [key, value] of Object.entries(itemAttributes)) {
      if (value !== undefined && value !== null && value !== '') {
        normalizedAttrs.set(key.toLowerCase(), value);
      }
    }

    // Check required fields
    const filledRequired: string[] = [];
    const missingRequired: string[] = [];
    for (const field of requiredFields) {
      const key = field.name.toLowerCase();
      if (normalizedAttrs.has(key)) {
        filledRequired.push(field.name);
      } else {
        missingRequired.push(field.name);
      }
    }

    // Check recommended fields
    const filledRecommended: string[] = [];
    const missingRecommended: string[] = [];
    for (const field of recommendedFields) {
      const key = field.name.toLowerCase();
      if (normalizedAttrs.has(key)) {
        filledRecommended.push(field.name);
      } else {
        missingRecommended.push(field.name);
      }
    }

    // Calculate readiness score
    // Required fields have higher weight (70%), recommended have lower (30%)
    const requiredScore = requiredFields.length > 0
      ? filledRequired.length / requiredFields.length
      : 1;
    const recommendedScore = recommendedFields.length > 0
      ? filledRecommended.length / recommendedFields.length
      : 1;
    const readinessScore = requiredScore * 0.7 + recommendedScore * 0.3;

    return {
      required: {
        filled: filledRequired.length,
        total: requiredFields.length,
        missing: missingRequired,
      },
      recommended: {
        filled: filledRecommended.length,
        total: recommendedFields.length,
        missing: missingRecommended,
      },
      readinessScore,
    };
  }

  /**
   * Build a MarketplaceCategory object from detection results
   */
  buildMarketplaceCategory(
    detection: CategoryDetection,
    condition: ItemCondition | string
  ): MarketplaceCategory {
    return {
      marketplace: 'ebay',
      categoryId: detection.categoryId,
      categoryPath: detection.categoryPath,
      categoryName: detection.categoryName,
      confidence: detection.confidence,
      conditionId: this.mapCondition(condition),
    };
  }

  /**
   * Map eBay aspect data type to our field data type
   */
  private mapAspectDataType(ebayType?: string): 'string' | 'number' | 'enum' {
    switch (ebayType) {
      case 'NUMBER':
        return 'number';
      case 'STRING_ARRAY':
      case 'STRING':
      default:
        return 'string';
    }
  }

  /**
   * Get value from cache
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
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
