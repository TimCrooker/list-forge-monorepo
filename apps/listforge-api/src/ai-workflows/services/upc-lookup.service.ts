import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { UPCLookupResult } from '@listforge/core-types';

/**
 * UPC Lookup Service - Slice 2: Enhanced Product Identification
 *
 * Provides product information lookup via UPC/EAN barcodes.
 * Uses UPCitemdb.com API with Redis caching for performance.
 *
 * Features:
 * - 30-day cache for successful lookups
 * - 24-hour cache for not-found results (to avoid repeated API calls)
 * - Graceful degradation when API is unavailable
 */
@Injectable()
export class UPCLookupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UPCLookupService.name);
  private redis: Redis | null = null;
  private readonly apiKey: string | null;
  private readonly apiBaseUrl = 'https://api.upcitemdb.com/prod/trial/lookup';

  // Cache TTLs
  private readonly CACHE_TTL_FOUND = 60 * 60 * 24 * 30; // 30 days for found results
  private readonly CACHE_TTL_NOT_FOUND = 60 * 60 * 24; // 24 hours for not-found results

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('UPC_DATABASE_API_KEY') || null;
    if (!this.apiKey) {
      this.logger.warn('UPC_DATABASE_API_KEY not configured - UPC lookup will use trial API with rate limits');
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
   * Initialize Redis connection using the same config as BullMQ
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
        this.logger.log('Redis connected for UPC caching');
      } else {
        this.logger.warn('No Redis configured - UPC lookup caching disabled');
      }
    } catch (error) {
      this.logger.warn('Failed to connect to Redis for UPC caching:', error);
      this.redis = null;
    }
  }

  /**
   * Look up product information by UPC or EAN code
   */
  async lookup(code: string): Promise<UPCLookupResult> {
    const cleanCode = this.cleanCode(code);
    if (!cleanCode) {
      return { found: false, upc: code };
    }

    this.logger.debug(`Looking up UPC/EAN: ${cleanCode}`);

    // Check cache first
    const cached = await this.getFromCache(cleanCode);
    if (cached) {
      this.logger.debug(`Cache hit for UPC: ${cleanCode}`);
      return { ...cached, cached: true };
    }

    // Call external API
    const result = await this.callAPI(cleanCode);

    // Cache the result
    await this.setCache(cleanCode, result);

    return result;
  }

  /**
   * Clean and validate the UPC/EAN code
   */
  private cleanCode(code: string): string | null {
    if (!code) return null;
    // Remove spaces, dashes, and other non-digit characters
    const cleaned = code.replace(/\D/g, '');
    // Valid UPC-A is 12 digits, UPC-E is 8 digits
    // Valid EAN-13 is 13 digits, EAN-8 is 8 digits
    if ([8, 12, 13, 14].includes(cleaned.length)) {
      return cleaned;
    }
    return null;
  }

  /**
   * Get result from cache
   */
  private async getFromCache(code: string): Promise<UPCLookupResult | null> {
    if (!this.redis) return null;

    try {
      const cacheKey = `upc:${code}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Cache read error:', error);
    }
    return null;
  }

  /**
   * Store result in cache
   */
  private async setCache(code: string, result: UPCLookupResult): Promise<void> {
    if (!this.redis) return;

    try {
      const cacheKey = `upc:${code}`;
      const ttl = result.found ? this.CACHE_TTL_FOUND : this.CACHE_TTL_NOT_FOUND;
      await this.redis.setex(cacheKey, ttl, JSON.stringify(result));
    } catch (error) {
      this.logger.warn('Cache write error:', error);
    }
  }

  /**
   * Call the UPC database API
   */
  private async callAPI(code: string): Promise<UPCLookupResult> {
    try {
      const url = `${this.apiBaseUrl}?upc=${code}`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      // Add API key if available (for higher rate limits)
      if (this.apiKey) {
        headers['user_key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 429) {
          this.logger.warn('UPC API rate limit exceeded');
        } else if (response.status === 404) {
          return { found: false, upc: code };
        } else {
          this.logger.warn(`UPC API error: ${response.status} ${response.statusText}`);
        }
        return { found: false, upc: code };
      }

      const data = await response.json();
      return this.parseAPIResponse(code, data);
    } catch (error) {
      this.logger.error('UPC API call failed:', error);
      return { found: false, upc: code };
    }
  }

  /**
   * Parse the API response into our format
   */
  private parseAPIResponse(code: string, data: any): UPCLookupResult {
    // UPCitemdb response structure
    if (data.code === 'OK' && data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        found: true,
        upc: code,
        brand: item.brand || undefined,
        name: item.title || undefined,
        description: item.description || undefined,
        category: item.category || undefined,
        imageUrl: item.images?.[0] || undefined,
      };
    }

    return { found: false, upc: code };
  }
}
