import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import {
  ReverseImageSearchResult,
  ReverseImageSearchProvider,
  VisualSearchMatch,
} from '@listforge/core-types';
import { getRateLimiter, RATE_LIMITER_CONFIGS } from '../utils/rate-limiter';

// ============================================================================
// Constants - Extracted for maintainability and configurability
// ============================================================================

/** Cache TTL in milliseconds (15 minutes) */
const CACHE_TTL_MS = 15 * 60 * 1000;

/** Maximum cache size before cleanup */
const MAX_CACHE_SIZE = 500;

/** Timeout for external HTTP requests (30 seconds) */
const FETCH_TIMEOUT_MS = 30000;

/** Maximum results to process per category */
const MAX_PAGE_RESULTS = 10;
const MAX_SIMILAR_RESULTS = 5;
const MAX_FULL_MATCH_RESULTS = 5;
const MAX_VISUAL_MATCHES = 10;
const MAX_KNOWLEDGE_GRAPH = 5;
const MAX_SHOPPING_RESULTS = 10;
const MAX_WEB_RESULTS = 5;

/** Confidence adjustments */
const CONFIDENCE_BOOST_TRUSTED_DOMAIN = 0.15;
const CONFIDENCE_BOOST_FULL_MATCH = 0.1;
const CONFIDENCE_BOOST_MULTIPLE_MATCHES = 0.05;
const CONFIDENCE_BOOST_SHOPPING = 0.15;
const CONFIDENCE_BOOST_PRICE = 0.1;
const CONFIDENCE_BOOST_RATINGS = 0.05;
const CONFIDENCE_MAX = 0.95;
const CONFIDENCE_KNOWLEDGE_GRAPH = 0.85;
const CONFIDENCE_BASE = 0.5;

/** Trusted retail domains for confidence boosting */
const TRUSTED_RETAIL_DOMAINS = [
  'amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com',
  'homedepot.com', 'lowes.com', 'costco.com', 'samsclub.com',
  'nike.com', 'apple.com', 'nordstrom.com', 'macys.com', 'kohls.com',
  'wayfair.com', 'overstock.com', 'newegg.com', 'bhphotovideo.com',
];

/** Known brand patterns for detection */
const KNOWN_BRAND_PATTERN = /^(Nike|Adidas|Apple|Samsung|Sony|Louis Vuitton|Gucci|Chanel|Prada|Coach|Michael Kors|Kate Spade|Nintendo|PlayStation|Xbox|Canon|Nikon|Levi's|Ralph Lauren|Tommy Hilfiger|Calvin Klein|Under Armour|Puma|New Balance|Asics|Vans|Converse|Jordan|Yeezy|Supreme|Bose|JBL|Beats|Dyson|KitchenAid|Cuisinart|Instant Pot|Vitamix|Ninja|Keurig|Nespresso|Rolex|Omega|Tag Heuer|Cartier|Tiffany|Dell|HP|Lenovo|ASUS|Acer|LG|Panasonic|Philips|Bosch|Whirlpool|Maytag|GE|Frigidaire|Kenmore)$/i;

/** Domain to brand mapping */
const DOMAIN_BRAND_MAP: Record<string, string> = {
  'nike.com': 'Nike',
  'adidas.com': 'Adidas',
  'apple.com': 'Apple',
  'samsung.com': 'Samsung',
};

/** Default OpenAI model for vision tasks */
const DEFAULT_VISION_MODEL = 'gpt-4o';

/** Maximum image size in bytes for conversion (10MB) */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum URL length to prevent abuse */
const MAX_URL_LENGTH = 2048;

/** Maximum results to return from web search parsing */
const MAX_WEB_SEARCH_RESULTS = 5;

/** JSON extraction regex pattern */
const JSON_EXTRACT_PATTERN = /\{[\s\S]*\}/;

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * Validate URL for SSRF prevention
 * Rejects local URLs, private IPs, and malformed URLs
 */
function isUrlSafe(url: string): { safe: boolean; reason?: string } {
  if (!url || typeof url !== 'string') {
    return { safe: false, reason: 'Invalid URL' };
  }

  if (url.length > MAX_URL_LENGTH) {
    return { safe: false, reason: 'URL too long' };
  }

  try {
    // Decode URL first to prevent encoded bypass attempts
    const decodedUrl = decodeURIComponent(url);
    const parsed = new URL(decodedUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Block non-http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { safe: false, reason: 'Invalid protocol' };
    }

    // Block local and private network addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname === 'host.docker.internal' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal')
    ) {
      return { safe: false, reason: 'Local or private network URL not allowed' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Malformed URL' };
  }
}

/**
 * Fetch with timeout and safety checks
 */
async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const urlCheck = isUrlSafe(url);
  if (!urlCheck.safe) {
    throw new Error(`URL validation failed: ${urlCheck.reason}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

/**
 * Safely parse JSON with error handling
 * Does NOT validate schema - use type guards after parsing
 */
function safeJsonParse<T>(text: string): T | null {
  try {
    const jsonMatch = text.match(JSON_EXTRACT_PATTERN);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Sanitize error message to prevent information leakage
 */
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose stack traces or internal paths
    const msg = error.message;
    // Remove file paths
    const sanitized = msg.replace(/\/[^\s]+/g, '[path]');
    // Truncate long messages
    return sanitized.slice(0, 200);
  }
  return 'An error occurred';
}

/**
 * Provider interface for reverse image search implementations
 */
interface ImageSearchProvider {
  name: ReverseImageSearchProvider;
  isConfigured(): boolean;
  search(imageUrl: string): Promise<ReverseImageSearchResult>;
}

/**
 * Search statistics for monitoring
 */
export interface ReverseImageSearchStats {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  cacheHits: number;
  byProvider: Record<ReverseImageSearchProvider, { attempts: number; successes: number }>;
}

/**
 * Reverse Image Search Service
 *
 * Provides Google Lens-style visual product search for identification.
 * Supports multiple providers with automatic fallback:
 * 1. SerpApi Google Lens (primary) - Best accuracy
 * 2. OpenAI Vision + Web Search (backup) - Good fallback
 *
 * Usage:
 *   const result = await reverseImageSearchService.search(imageUrl);
 *   if (result.success && result.bestMatch) {
 *     // Use result.bestMatch.brand, result.bestMatch.model, etc.
 *   }
 */
@Injectable()
export class ReverseImageSearchService implements OnModuleInit {
  private readonly logger = new Logger(ReverseImageSearchService.name);
  private providers: ImageSearchProvider[] = [];
  private cache = new Map<string, { result: ReverseImageSearchResult; expiresAt: number }>();

  private stats: ReverseImageSearchStats = {
    totalSearches: 0,
    successfulSearches: 0,
    failedSearches: 0,
    cacheHits: 0,
    byProvider: {
      google_cloud_vision: { attempts: 0, successes: 0 },
      serpapi_google_lens: { attempts: 0, successes: 0 },
      bing_visual_search: { attempts: 0, successes: 0 },
      openai_vision_web: { attempts: 0, successes: 0 },
    },
  };

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeProviders();
  }

  /**
   * Initialize all available providers based on configuration
   * Priority: Google Cloud Vision (official) > SerpApi (scraper) > OpenAI Vision (fallback)
   */
  private initializeProviders(): void {
    // Google Cloud Vision Web Detection (Primary - Official Google API)
    // Uses GOOGLE_APPLICATION_CREDENTIALS env var for authentication
    const gcpCredentials = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    const gcpProjectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT');
    if (gcpCredentials || gcpProjectId) {
      try {
        this.providers.push(new GoogleCloudVisionProvider(this.logger));
        this.logger.log('Google Cloud Vision Web Detection provider initialized (primary)');
      } catch (error) {
        this.logger.warn(`Failed to initialize Google Cloud Vision: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not configured - Google Cloud Vision provider unavailable');
    }

    // SerpApi Google Lens (Secondary/Backup)
    const serpApiKey = this.configService.get<string>('SERPAPI_API_KEY');
    if (serpApiKey) {
      this.providers.push(new SerpApiGoogleLensProvider(serpApiKey, this.logger));
      this.logger.log('SerpApi Google Lens provider initialized (backup)');
    } else {
      this.logger.debug('SERPAPI_API_KEY not configured - SerpApi provider unavailable');
    }

    // OpenAI Vision + Web Search (Tertiary/Fallback)
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.providers.push(new OpenAIVisionWebProvider(openaiKey, this.logger));
      this.logger.log('OpenAI Vision + Web Search provider initialized (fallback)');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - OpenAI Vision provider unavailable');
    }

    if (this.providers.length === 0) {
      this.logger.error('No reverse image search providers configured - feature will be unavailable');
    } else {
      this.logger.log(`Reverse image search initialized with ${this.providers.length} provider(s)`);
    }
  }

  /**
   * Check if the service has any configured providers
   */
  isServiceConfigured(): boolean {
    return this.providers.length > 0;
  }

  /**
   * Get search statistics for monitoring
   */
  getStats(): ReverseImageSearchStats {
    return { ...this.stats };
  }

  /**
   * Search for product matches using reverse image search
   * Automatically tries providers in order until one succeeds
   *
   * @param imageUrl - URL of the image to search
   * @returns Search result with matches and best match
   */
  async search(imageUrl: string): Promise<ReverseImageSearchResult> {
    this.stats.totalSearches++;

    // Check cache first
    const cached = this.getFromCache(imageUrl);
    if (cached) {
      this.stats.cacheHits++;
      this.logger.debug(`Cache hit for reverse image search: ${imageUrl}`);
      return { ...cached, cached: true };
    }

    if (this.providers.length === 0) {
      return this.createErrorResult(imageUrl, 'No providers configured', 'google_cloud_vision');
    }

    const startTime = Date.now();
    let lastError: string | undefined;

    // Try each provider in order
    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        continue;
      }

      this.stats.byProvider[provider.name].attempts++;

      try {
        this.logger.debug(`Trying reverse image search with ${provider.name}: ${imageUrl}`);
        const result = await provider.search(imageUrl);

        if (result.success && result.matches.length > 0) {
          this.stats.byProvider[provider.name].successes++;
          this.stats.successfulSearches++;

          // Cache successful result
          this.setCache(imageUrl, result);

          this.logger.log(
            `Reverse image search succeeded with ${provider.name}: found ${result.matches.length} matches`
          );
          return result;
        }

        // Provider returned no matches - try next
        lastError = result.error || 'No matches found';
        this.logger.debug(`${provider.name} returned no matches, trying next provider`);
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        this.logger.warn(`${provider.name} failed: ${lastError}`);
      }
    }

    // All providers failed
    this.stats.failedSearches++;
    const durationMs = Date.now() - startTime;

    return this.createErrorResult(
      imageUrl,
      lastError || 'All providers failed',
      this.providers[0]?.name || 'google_cloud_vision',
      durationMs
    );
  }

  /**
   * Search with a specific provider (for testing or explicit selection)
   */
  async searchWithProvider(
    imageUrl: string,
    providerName: ReverseImageSearchProvider
  ): Promise<ReverseImageSearchResult> {
    const provider = this.providers.find((p) => p.name === providerName);

    if (!provider) {
      return this.createErrorResult(imageUrl, `Provider ${providerName} not available`, providerName);
    }

    return provider.search(imageUrl);
  }

  /**
   * Get available provider names
   */
  getAvailableProviders(): ReverseImageSearchProvider[] {
    return this.providers.filter((p) => p.isConfigured()).map((p) => p.name);
  }

  private getFromCache(imageUrl: string): ReverseImageSearchResult | null {
    // Normalize cache key to match setCache
    const cacheKey = imageUrl.trim().toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }
    return null;
  }

  private setCache(imageUrl: string, result: ReverseImageSearchResult): void {
    // Normalize cache key to prevent subtle variations
    const cacheKey = imageUrl.trim().toLowerCase();
    this.cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Clean up old entries periodically
    if (this.cache.size > MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  private createErrorResult(
    imageUrl: string,
    error: string,
    provider: ReverseImageSearchProvider,
    durationMs: number = 0
  ): ReverseImageSearchResult {
    return {
      provider,
      searchedImageUrl: imageUrl,
      matches: [],
      confidence: 0,
      success: false,
      error,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  }
}

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

/**
 * Google Cloud Vision Web Detection Provider (Primary)
 * Official Google API - $3.50/1000 images, first 1000/month free
 * https://cloud.google.com/vision/docs/detecting-web
 *
 * Features:
 * - Web Detection: Find visually similar images across the web
 * - Best Guess Labels: Product identification
 * - Web Entities: Named entities detected in the image
 * - Matching Images: Full and partial matches from the web
 * - Pages with Matching Images: Product pages, shopping sites
 */
class GoogleCloudVisionProvider implements ImageSearchProvider {
  name: ReverseImageSearchProvider = 'google_cloud_vision';
  private client: ImageAnnotatorClient;
  private rateLimiter = getRateLimiter('googleCloudVision', RATE_LIMITER_CONFIGS.googleCloudVision);

  constructor(private readonly logger: Logger) {
    // Client auto-authenticates using GOOGLE_APPLICATION_CREDENTIALS env var
    this.client = new ImageAnnotatorClient();
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async search(imageUrl: string): Promise<ReverseImageSearchResult> {
    const startTime = Date.now();

    try {
      // Validate image URL first
      const urlCheck = isUrlSafe(imageUrl);
      if (!urlCheck.safe) {
        throw new Error(`Invalid image URL: ${urlCheck.reason}`);
      }

      await this.rateLimiter.acquire();

      // Call Web Detection API
      const [result] = await this.client.webDetection(imageUrl);
      const webDetection = result.webDetection;

      if (!webDetection) {
        throw new Error('No web detection results returned');
      }

      const matches = this.parseWebDetectionResults(webDetection);
      const durationMs = Date.now() - startTime;

      // Find best match by confidence
      const bestMatch = matches.length > 0
        ? matches.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          )
        : undefined;

      return {
        provider: this.name,
        searchedImageUrl: imageUrl,
        matches,
        bestMatch,
        confidence: bestMatch?.confidence || 0,
        success: matches.length > 0,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = sanitizeErrorMessage(error);
      this.logger.error(`Google Cloud Vision Web Detection failed: ${errorMsg}`);

      return {
        provider: this.name,
        searchedImageUrl: imageUrl,
        matches: [],
        confidence: 0,
        success: false,
        error: errorMsg,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private parseWebDetectionResults(
    webDetection: protos.google.cloud.vision.v1.IWebDetection
  ): VisualSearchMatch[] {
    const matches: VisualSearchMatch[] = [];

    // Parse best guess labels (product identification)
    const bestGuessLabels = webDetection.bestGuessLabels || [];
    const primaryLabel = bestGuessLabels[0]?.label;

    // Parse web entities (named entities like brands, products)
    const webEntities = webDetection.webEntities || [];
    const topEntity = webEntities[0];

    // Parse pages with matching images (product pages, shopping sites)
    const pagesWithMatchingImages = webDetection.pagesWithMatchingImages || [];
    for (const page of pagesWithMatchingImages.slice(0, MAX_PAGE_RESULTS)) {
      if (!page.url) continue;

      const sourceDomain = this.extractDomain(page.url);
      const parsed = this.parsePage(page, primaryLabel, webEntities, sourceDomain);
      if (parsed) matches.push(parsed);
    }

    // Parse visually similar images
    const visuallySimilarImages = webDetection.visuallySimilarImages || [];
    for (const similar of visuallySimilarImages.slice(0, MAX_SIMILAR_RESULTS)) {
      if (!similar.url) continue;

      const sourceDomain = this.extractDomain(similar.url);
      matches.push({
        title: primaryLabel || topEntity?.description || 'Similar product',
        sourceUrl: similar.url,
        matchingImageUrl: similar.url,
        sourceDomain,
        confidence: this.calculateImageConfidence(topEntity, sourceDomain),
        attributes: {
          matchType: 'visually_similar',
        },
      });
    }

    // Parse full matching images (exact matches)
    const fullMatchingImages = webDetection.fullMatchingImages || [];
    for (const match of fullMatchingImages.slice(0, MAX_FULL_MATCH_RESULTS)) {
      if (!match.url) continue;

      const sourceDomain = this.extractDomain(match.url);
      matches.push({
        title: primaryLabel || topEntity?.description || 'Exact match',
        sourceUrl: match.url,
        matchingImageUrl: match.url,
        sourceDomain,
        confidence: Math.min(CONFIDENCE_MAX, (topEntity?.score || 0.7) + CONFIDENCE_BOOST_FULL_MATCH),
        attributes: {
          matchType: 'full_match',
        },
      });
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches;
  }

  private parsePage(
    page: protos.google.cloud.vision.v1.WebDetection.IWebPage,
    primaryLabel: string | null | undefined,
    webEntities: protos.google.cloud.vision.v1.WebDetection.IWebEntity[],
    sourceDomain: string | undefined
  ): VisualSearchMatch | null {
    if (!page.url) return null;

    // Extract brand from web entities
    const brandEntity = webEntities.find(e =>
      e.description && this.looksLikeBrand(e.description)
    );

    // Extract title from page title or primary label
    const title = page.pageTitle || primaryLabel || webEntities[0]?.description || 'Product';

    // Calculate confidence based on entity scores and domain trust
    const baseConfidence = webEntities[0]?.score || 0.5;
    const confidence = this.calculatePageConfidence(baseConfidence, sourceDomain, page);

    return {
      title: this.cleanTitle(title),
      brand: brandEntity?.description,
      sourceUrl: page.url,
      matchingImageUrl: page.fullMatchingImages?.[0]?.url || page.partialMatchingImages?.[0]?.url,
      sourceDomain,
      confidence,
      attributes: {
        pageTitle: page.pageTitle || '',
        matchType: 'page_match',
        fullMatches: String(page.fullMatchingImages?.length || 0),
        partialMatches: String(page.partialMatchingImages?.length || 0),
      },
    };
  }

  private looksLikeBrand(text: string): boolean {
    // Use centralized known brand pattern
    if (KNOWN_BRAND_PATTERN.test(text)) return true;

    // Heuristic: Short text (1-3 words) with capital letters is often a brand
    const words = text.split(/\s+/);
    if (words.length <= 3 && /^[A-Z]/.test(text)) {
      return true;
    }

    return false;
  }

  private calculatePageConfidence(
    baseConfidence: number,
    sourceDomain: string | undefined,
    page: protos.google.cloud.vision.v1.WebDetection.IWebPage
  ): number {
    let confidence = baseConfidence;

    // Boost for trusted retail domains (use centralized constant)
    if (sourceDomain && TRUSTED_RETAIL_DOMAINS.some(d => sourceDomain.includes(d))) {
      confidence += CONFIDENCE_BOOST_TRUSTED_DOMAIN;
    }

    // Boost for pages with full matching images
    if (page.fullMatchingImages && page.fullMatchingImages.length > 0) {
      confidence += CONFIDENCE_BOOST_FULL_MATCH;
    }

    // Boost for pages with multiple matching images
    const totalMatches = (page.fullMatchingImages?.length || 0) + (page.partialMatchingImages?.length || 0);
    if (totalMatches > 2) {
      confidence += CONFIDENCE_BOOST_MULTIPLE_MATCHES;
    }

    return Math.min(CONFIDENCE_MAX, confidence);
  }

  private calculateImageConfidence(
    topEntity: protos.google.cloud.vision.v1.WebDetection.IWebEntity | undefined,
    sourceDomain: string | undefined
  ): number {
    let confidence = topEntity?.score || CONFIDENCE_BASE;

    // Boost for trusted domains (use centralized constant)
    if (sourceDomain && TRUSTED_RETAIL_DOMAINS.some(d => sourceDomain.includes(d))) {
      confidence += CONFIDENCE_BOOST_FULL_MATCH;
    }

    return Math.min(0.9, confidence);
  }

  private extractDomain(url: string): string | undefined {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return undefined;
    }
  }

  private cleanTitle(title: string): string {
    // Remove common suffixes and clean up
    return title
      .replace(/\s*[-|]\s*(Amazon|eBay|Walmart|Target|Best Buy).*$/i, '')
      .replace(/\s*\|\s*.*$/, '')
      .replace(/\s*-\s*$/, '')
      .trim();
  }
}

/**
 * SerpApi Google Lens Provider (Backup)
 * Uses SerpApi to access Google Lens results (unofficial scraper)
 * https://serpapi.com/google-lens-api
 */
class SerpApiGoogleLensProvider implements ImageSearchProvider {
  name: ReverseImageSearchProvider = 'serpapi_google_lens';
  private rateLimiter = getRateLimiter('serpapi', RATE_LIMITER_CONFIGS.serpapi);

  constructor(
    private readonly apiKey: string,
    private readonly logger: Logger
  ) {}

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(imageUrl: string): Promise<ReverseImageSearchResult> {
    const startTime = Date.now();

    try {
      // Validate image URL first
      const urlCheck = isUrlSafe(imageUrl);
      if (!urlCheck.safe) {
        throw new Error(`Invalid image URL: ${urlCheck.reason}`);
      }

      await this.rateLimiter.acquire();

      // Call SerpApi Google Lens API with timeout
      const params = new URLSearchParams({
        api_key: this.apiKey,
        engine: 'google_lens',
        url: imageUrl,
      });

      const response = await safeFetch(`https://serpapi.com/search.json?${params}`);

      if (!response.ok) {
        throw new Error(`SerpApi returned ${response.status}`);
      }

      const data = await response.json();
      const matches = this.parseGoogleLensResults(data);
      const durationMs = Date.now() - startTime;

      // Find best match by confidence
      const bestMatch = matches.length > 0
        ? matches.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          )
        : undefined;

      return {
        provider: this.name,
        searchedImageUrl: imageUrl,
        matches,
        bestMatch,
        confidence: bestMatch?.confidence || 0,
        success: matches.length > 0,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = sanitizeErrorMessage(error);
      this.logger.error(`SerpApi Google Lens search failed: ${errorMsg}`);

      return {
        provider: this.name,
        searchedImageUrl: imageUrl,
        matches: [],
        confidence: 0,
        success: false,
        error: errorMsg,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private parseGoogleLensResults(data: any): VisualSearchMatch[] {
    const matches: VisualSearchMatch[] = [];

    // Type guard - ensure data is an object
    if (typeof data !== 'object' || data === null) {
      return matches;
    }

    // Parse visual matches from Google Lens response
    // The structure varies, so we try multiple paths

    // Visual matches (exact or similar products)
    if (data.visual_matches && Array.isArray(data.visual_matches)) {
      for (const match of data.visual_matches.slice(0, MAX_VISUAL_MATCHES)) {
        const parsed = this.parseVisualMatch(match);
        if (parsed) matches.push(parsed);
      }
    }

    // Knowledge graph results (identified products)
    if (data.knowledge_graph && Array.isArray(data.knowledge_graph)) {
      for (const kg of data.knowledge_graph.slice(0, MAX_KNOWLEDGE_GRAPH)) {
        const parsed = this.parseKnowledgeGraph(kg);
        if (parsed) matches.push(parsed);
      }
    }

    // Shopping results (products with prices)
    if (data.shopping_results && Array.isArray(data.shopping_results)) {
      for (const shop of data.shopping_results.slice(0, MAX_SHOPPING_RESULTS)) {
        const parsed = this.parseShoppingResult(shop);
        if (parsed) matches.push(parsed);
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches;
  }

  private parseVisualMatch(match: any): VisualSearchMatch | null {
    if (!match.title) return null;

    const sourceDomain = this.extractDomain(match.link || match.source);

    return {
      title: match.title,
      brand: this.extractBrand(match.title, match.source),
      sourceUrl: match.link || '',
      matchingImageUrl: match.thumbnail || match.image,
      sourceDomain,
      confidence: this.calculateConfidence(match, sourceDomain),
      attributes: this.extractAttributes(match),
    };
  }

  private parseKnowledgeGraph(kg: any): VisualSearchMatch | null {
    if (!kg || typeof kg !== 'object' || !kg.title) return null;

    return {
      title: String(kg.title).slice(0, 500), // Limit title length
      brand: kg.subtitle ? String(kg.subtitle).slice(0, 100) : this.extractBrand(String(kg.title), ''),
      category: kg.category ? String(kg.category).slice(0, 100) : undefined,
      sourceUrl: kg.link ? String(kg.link).slice(0, MAX_URL_LENGTH) : '',
      matchingImageUrl: kg.thumbnail ? String(kg.thumbnail).slice(0, MAX_URL_LENGTH) : undefined,
      confidence: CONFIDENCE_KNOWLEDGE_GRAPH, // Knowledge graph results are usually high quality
      attributes: typeof kg.attributes === 'object' && kg.attributes !== null ? kg.attributes : {},
    };
  }

  private parseShoppingResult(shop: any): VisualSearchMatch | null {
    if (!shop.title) return null;

    const price = this.parsePrice(shop.price || shop.extracted_price);
    const sourceDomain = this.extractDomain(shop.link || shop.source);

    return {
      title: shop.title,
      brand: shop.brand || this.extractBrand(shop.title, shop.source),
      sourceUrl: shop.link || '',
      matchingImageUrl: shop.thumbnail,
      price: price?.amount,
      currency: price?.currency || 'USD',
      sourceDomain,
      confidence: this.calculateConfidence(shop, sourceDomain, true),
      attributes: {
        source: shop.source || '',
        rating: shop.rating ? String(shop.rating) : '',
        reviews: shop.reviews ? String(shop.reviews) : '',
      },
    };
  }

  private extractDomain(url: string): string | undefined {
    if (!url) return undefined;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return undefined;
    }
  }

  private extractBrand(title: string, source: string): string | undefined {
    // Use centralized known brand pattern
    const match = title.match(KNOWN_BRAND_PATTERN);
    if (match) return match[1];

    // Check source domain for brand hints (use centralized constant)
    const domain = this.extractDomain(source);
    if (domain && DOMAIN_BRAND_MAP[domain]) {
      return DOMAIN_BRAND_MAP[domain];
    }

    return undefined;
  }

  private calculateConfidence(
    match: any,
    sourceDomain?: string,
    isShopping: boolean = false
  ): number {
    let confidence = CONFIDENCE_BASE;

    // Boost for shopping results (have structured product data)
    if (isShopping) confidence += CONFIDENCE_BOOST_SHOPPING;

    // Boost for trusted domains (use centralized constant)
    if (sourceDomain && TRUSTED_RETAIL_DOMAINS.some((d) => sourceDomain.includes(d))) {
      confidence += CONFIDENCE_BOOST_TRUSTED_DOMAIN + CONFIDENCE_BOOST_MULTIPLE_MATCHES;
    }

    // Boost if has price
    if (match.price || match.extracted_price) {
      confidence += CONFIDENCE_BOOST_PRICE;
    }

    // Boost if has ratings/reviews
    if (match.rating || match.reviews) {
      confidence += CONFIDENCE_BOOST_RATINGS;
    }

    return Math.min(CONFIDENCE_MAX, confidence);
  }

  private parsePrice(priceStr: string | number | undefined): { amount: number; currency: string } | null {
    if (!priceStr) return null;

    if (typeof priceStr === 'number') {
      return { amount: priceStr, currency: 'USD' };
    }

    // Parse price strings like "$29.99", "29.99 USD", etc.
    const match = priceStr.match(/[\$\u00A3\u20AC]?\s*(\d+(?:\.\d{2})?)/);
    if (match) {
      const amount = parseFloat(match[1]);
      let currency = 'USD';
      if (priceStr.includes('\u00A3')) currency = 'GBP';
      if (priceStr.includes('\u20AC')) currency = 'EUR';
      return { amount, currency };
    }

    return null;
  }

  private extractAttributes(match: any): Record<string, string> {
    const attrs: Record<string, string> = {};

    if (match.source) attrs.source = match.source;
    if (match.rating) attrs.rating = String(match.rating);
    if (match.reviews) attrs.reviews = String(match.reviews);

    return attrs;
  }
}

/**
 * OpenAI Vision + Web Search Provider (Backup/Fallback)
 * Uses GPT-4V to analyze image and identify product, then web search to find matches
 */
class OpenAIVisionWebProvider implements ImageSearchProvider {
  name: ReverseImageSearchProvider = 'openai_vision_web';
  private client: OpenAI;
  private rateLimiter = getRateLimiter('openai', RATE_LIMITER_CONFIGS.openai);
  private readonly visionModel: string;

  constructor(
    apiKey: string,
    private readonly logger: Logger,
    visionModel?: string
  ) {
    this.client = new OpenAI({ apiKey });
    // Allow model to be configured, default to constant
    this.visionModel = visionModel || process.env.OPENAI_VISION_MODEL || DEFAULT_VISION_MODEL;
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async search(imageUrl: string): Promise<ReverseImageSearchResult> {
    const startTime = Date.now();

    try {
      // Validate image URL first
      const urlCheck = isUrlSafe(imageUrl);
      if (!urlCheck.safe) {
        throw new Error(`Invalid image URL: ${urlCheck.reason}`);
      }

      await this.rateLimiter.acquire();

      // Step 1: Use Vision to identify the product
      const identification = await this.identifyProduct(imageUrl);

      if (!identification.success) {
        throw new Error(identification.error || 'Failed to identify product');
      }

      // Step 2: Use Web Search to find matching products
      const searchQuery = this.buildSearchQuery(identification);
      const webResults = await this.searchWeb(searchQuery);

      // Step 3: Combine into matches
      const matches = this.combineResults(identification, webResults);
      const durationMs = Date.now() - startTime;

      const bestMatch = matches.length > 0
        ? matches.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          )
        : undefined;

      return {
        provider: this.name,
        searchedImageUrl: imageUrl,
        matches,
        bestMatch,
        confidence: bestMatch?.confidence || identification.confidence,
        success: matches.length > 0 || identification.success,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = sanitizeErrorMessage(error);
      this.logger.error(`OpenAI Vision + Web search failed: ${errorMsg}`);

      return {
        provider: this.name,
        searchedImageUrl: imageUrl,
        matches: [],
        confidence: 0,
        success: false,
        error: errorMsg,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async identifyProduct(imageUrl: string): Promise<{
    success: boolean;
    title?: string;
    brand?: string;
    model?: string;
    category?: string;
    confidence: number;
    error?: string;
  }> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.visionModel, // Use configurable model
        messages: [
          {
            role: 'system',
            content: `You are a product identification expert. Analyze the image and identify the product.
Return JSON with:
{
  "title": "full product name",
  "brand": "brand name if identifiable",
  "model": "model number/name if visible",
  "category": "product category",
  "confidence": 0.0-1.0,
  "identifiers": ["any visible text like model numbers, SKUs"]
}
Be precise. Only include brand/model if you can see it or are highly confident.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this product:' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { success: false, confidence: 0, error: 'No response from vision model' };
      }

      // Use safe JSON parsing
      interface ProductIdentification {
        title?: string;
        brand?: string;
        model?: string;
        category?: string;
        confidence?: number;
      }
      const parsed = safeJsonParse<ProductIdentification>(content);
      if (!parsed) {
        return { success: false, confidence: 0, error: 'Invalid JSON response' };
      }

      return {
        success: true,
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
        brand: typeof parsed.brand === 'string' ? parsed.brand : undefined,
        model: typeof parsed.model === 'string' ? parsed.model : undefined,
        category: typeof parsed.category === 'string' ? parsed.category : undefined,
        confidence: Math.min(1, Math.max(0, typeof parsed.confidence === 'number' ? parsed.confidence : CONFIDENCE_BASE)),
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        error: sanitizeErrorMessage(error),
      };
    }
  }

  private buildSearchQuery(identification: {
    title?: string;
    brand?: string;
    model?: string;
    category?: string;
  }): string {
    const parts: string[] = [];

    if (identification.brand) parts.push(identification.brand);
    if (identification.model) parts.push(identification.model);
    if (identification.title && parts.length === 0) {
      parts.push(identification.title);
    }
    if (identification.category && parts.length < 2) {
      parts.push(identification.category);
    }

    return parts.join(' ') || 'product';
  }

  private async searchWeb(query: string): Promise<any[]> {
    try {
      // Sanitize query to prevent injection
      const sanitizedQuery = query.slice(0, 200).replace(/[<>]/g, '');

      // Use OpenAI's responses API with web_search tool
      const response = await (this.client as any).responses.create({
        model: this.visionModel, // Use configurable model
        tools: [{ type: 'web_search' }],
        input: `Find product listings and prices for: ${sanitizedQuery}. Return product names, prices, and URLs.`,
      });

      // Parse results from response
      // The structure varies, so we handle it flexibly
      const outputText = response.output_text || '';
      const results = this.parseWebSearchResults(outputText);

      return results;
    } catch (error) {
      this.logger.warn(`Web search failed: ${sanitizeErrorMessage(error)}`);
      return [];
    }
  }

  private parseWebSearchResults(outputText: string): any[] {
    // Extract product mentions from web search output
    const results: any[] = [];

    // Look for product listings in the text
    const pricePattern = /\$(\d+(?:\.\d{2})?)/g;
    const urlPattern = /https?:\/\/[^\s]+/g;

    const prices = outputText.match(pricePattern) || [];
    const urls = outputText.match(urlPattern) || [];

    // Create basic results from extracted data (use constant for limit)
    if (urls.length > 0) {
      for (let i = 0; i < Math.min(urls.length, MAX_WEB_SEARCH_RESULTS); i++) {
        // Validate URL before including
        const urlCheck = isUrlSafe(urls[i]);
        if (urlCheck.safe) {
          results.push({
            url: urls[i],
            price: prices[i] ? parseFloat(prices[i].replace('$', '')) : undefined,
          });
        }
      }
    }

    return results;
  }

  private combineResults(
    identification: {
      title?: string;
      brand?: string;
      model?: string;
      category?: string;
      confidence: number;
    },
    webResults: any[]
  ): VisualSearchMatch[] {
    const matches: VisualSearchMatch[] = [];

    // Create primary match from identification
    if (identification.title || identification.brand) {
      matches.push({
        title: identification.title || `${identification.brand} ${identification.model || ''}`.trim(),
        brand: identification.brand,
        model: identification.model,
        category: identification.category,
        confidence: identification.confidence * 0.9, // Slightly reduce since it's AI-only
        sourceUrl: '',
      });
    }

    // Add web results as additional matches
    for (const result of webResults) {
      if (result.url) {
        matches.push({
          title: identification.title || 'Product',
          brand: identification.brand,
          price: result.price,
          currency: 'USD',
          sourceUrl: result.url,
          sourceDomain: this.extractDomain(result.url),
          confidence: Math.min(0.7, identification.confidence * 0.8),
        });
      }
    }

    return matches;
  }

  private extractDomain(url: string): string | undefined {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return undefined;
    }
  }
}
