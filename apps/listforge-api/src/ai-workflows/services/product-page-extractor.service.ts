/**
 * Product Page Extractor Service - Slice 8
 *
 * Extracts structured product specifications from web page URLs.
 * Supports site-specific extraction for major retailers (Amazon, eBay, Walmart)
 * with LLM fallback for generic pages.
 *
 * Security features:
 * - SSRF protection via URL validation with DNS rebinding prevention
 * - Redirect chain validation
 * - Content-Type validation
 * - Rate limiting per domain
 * - Request timeouts
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as dns from 'dns/promises';
import { getRateLimiter, RateLimiterConfig } from '../utils/rate-limiter';
import type { FieldDataSource } from '@listforge/core-types';

/**
 * Extracted field value with source information
 */
interface ExtractedFieldValue {
  fieldName: string;
  value: unknown;
  source: FieldDataSource;
}

// ============================================================================
// Constants
// ============================================================================

/** Timeout for external HTTP requests (30 seconds) */
const FETCH_TIMEOUT_MS = 30000;

/** Timeout for DNS resolution (5 seconds) */
const DNS_TIMEOUT_MS = 5000;

/** Maximum URL length to prevent abuse */
const MAX_URL_LENGTH = 2048;

/** Maximum HTML content to process (500KB) */
const MAX_HTML_SIZE = 500 * 1024;

/** Maximum content to clean for LLM (50KB) */
const MAX_LLM_CONTENT_SIZE = 50000;

/** Maximum redirect hops to follow */
const MAX_REDIRECTS = 5;

/** Default model for LLM extraction */
const DEFAULT_EXTRACTION_MODEL = 'gpt-4o-mini';

/** LLM configuration */
const LLM_CONFIG = {
  temperature: 0.1,
  maxTokens: 2000,
  costPerToken: 0.00001, // Approximate cost for gpt-4o-mini
} as const;

/** JSON extraction regex pattern */
const JSON_EXTRACT_PATTERN = /\{[\s\S]*\}/;

/** Allowed content types for HTML responses */
const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/plain', // Some servers misconfigure
] as const;

/** Base confidence scores by extraction source */
const CONFIDENCE_SCORES = {
  amazon: 0.88,
  ebay: 0.85,
  walmart: 0.82,
  llm_generic: 0.65,
} as const;

/** Confidence adjustments */
const CONFIDENCE_ADJUSTMENTS = {
  multipleFields: 0.05,   // Bonus for extracting multiple fields
  priceFound: 0.05,       // Bonus if price found (indicates product page)
  searchResults: -0.10,   // Penalty if page appears to be search results
  descriptionPenalty: 0.9, // Multiplier for description confidence
  specFieldPenalty: 0.85,  // Multiplier for spec field confidence
} as const;

/** Minimum fields needed for multiple fields bonus */
const MIN_FIELDS_FOR_BONUS = 3;

/** Confidence range limits */
const CONFIDENCE_MIN = 0.1;
const CONFIDENCE_MAX = 0.95;

/** Rate limiter config for page fetching */
const PAGE_FETCH_RATE_LIMIT: RateLimiterConfig = {
  maxTokens: 10,
  refillRate: 2,
  refillInterval: 1000, // 2 requests per second
  name: 'PageFetch',
};

/** Default fields to extract when none specified */
const DEFAULT_TARGET_FIELDS = [
  'title',
  'brand',
  'model',
  'mpn',
  'upc',
  'price',
  'specifications',
  'description',
] as const;

/** Mapping of specification keys to standardized field names */
const SPEC_FIELD_MAPPINGS: Record<string, string> = {
  'weight': 'weight',
  'item weight': 'weight',
  'product weight': 'weight',
  'dimensions': 'dimensions',
  'product dimensions': 'dimensions',
  'size': 'size',
  'material': 'material',
  'color': 'color',
  'colour': 'color',
} as const;

/** Primary fields that get standard confidence */
const PRIMARY_EXTRACTION_FIELDS = ['title', 'brand', 'model', 'mpn', 'upc', 'price'] as const;

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * Check if an IP address is private/internal
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (/^127\./.test(ip)) return true; // Loopback
  if (/^10\./.test(ip)) return true; // Class A private
  if (/^192\.168\./.test(ip)) return true; // Class C private
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true; // Class B private
  if (/^169\.254\./.test(ip)) return true; // Link-local
  if (/^0\./.test(ip)) return true; // Current network
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-7])\./.test(ip)) return true; // Carrier-grade NAT
  if (/^192\.0\.0\./.test(ip)) return true; // IETF Protocol Assignments
  if (/^192\.0\.2\./.test(ip)) return true; // TEST-NET-1
  if (/^198\.51\.100\./.test(ip)) return true; // TEST-NET-2
  if (/^203\.0\.113\./.test(ip)) return true; // TEST-NET-3
  if (/^224\./.test(ip)) return true; // Multicast
  if (/^240\./.test(ip)) return true; // Reserved
  if (ip === '255.255.255.255') return true; // Broadcast

  // IPv6 private ranges
  if (/^::1$/.test(ip)) return true; // Loopback
  if (/^fe80:/i.test(ip)) return true; // Link-local
  if (/^fc00:/i.test(ip)) return true; // Unique local
  if (/^fd[0-9a-f]{2}:/i.test(ip)) return true; // Unique local
  if (/^::ffff:127\./i.test(ip)) return true; // IPv4-mapped loopback
  if (/^::ffff:10\./i.test(ip)) return true; // IPv4-mapped private
  if (/^::ffff:192\.168\./i.test(ip)) return true; // IPv4-mapped private
  if (/^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i.test(ip)) return true; // IPv4-mapped private

  return false;
}

/**
 * Validate URL for SSRF prevention (initial hostname check)
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

    // Block dangerous hostnames
    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === 'host.docker.internal' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localdomain')
    ) {
      return { safe: false, reason: 'Local or private network URL not allowed' };
    }

    // Check if hostname is an IP address
    if (isPrivateIP(hostname)) {
      return { safe: false, reason: 'Private IP address not allowed' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Malformed URL' };
  }
}

/**
 * Resolve hostname to IP and validate - prevents DNS rebinding attacks
 */
async function resolveAndValidateIP(hostname: string): Promise<{ valid: boolean; ip?: string; reason?: string }> {
  try {
    // Set timeout for DNS resolution
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('DNS resolution timeout')), DNS_TIMEOUT_MS);
    });

    const resolvePromise = dns.lookup(hostname);
    const result = await Promise.race([resolvePromise, timeoutPromise]);

    const ip = result.address;

    if (isPrivateIP(ip)) {
      return { valid: false, reason: `Hostname resolves to private IP: ${ip}` };
    }

    return { valid: true, ip };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, reason: `DNS resolution failed: ${message}` };
  }
}

/**
 * Validate Content-Type header
 */
function isValidContentType(contentType: string | null): boolean {
  if (!contentType) return false;

  const lowerType = contentType.toLowerCase().split(';')[0].trim();
  return ALLOWED_CONTENT_TYPES.some(allowed => lowerType === allowed);
}

/**
 * Fetch with comprehensive security checks:
 * - DNS rebinding prevention (resolve and validate IP before fetch)
 * - Manual redirect handling with validation
 * - Content-Type validation
 * - Timeout protection
 */
async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS,
  maxRedirects: number = MAX_REDIRECTS,
): Promise<Response> {
  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // Step 1: Validate URL structure
    const urlCheck = isUrlSafe(currentUrl);
    if (!urlCheck.safe) {
      throw new Error(`URL validation failed: ${urlCheck.reason}`);
    }

    // Step 2: Resolve DNS and validate IP (prevents DNS rebinding)
    const parsed = new URL(currentUrl);
    const dnsCheck = await resolveAndValidateIP(parsed.hostname);
    if (!dnsCheck.valid) {
      throw new Error(`DNS validation failed: ${dnsCheck.reason}`);
    }

    // Step 3: Fetch with redirect disabled (we handle redirects manually)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        ...options,
        signal: controller.signal,
        redirect: 'manual', // Handle redirects manually for security
        headers: {
          ...options.headers,
          'User-Agent': 'Mozilla/5.0 (compatible; ListForge/1.0; +https://listforge.io)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });
      clearTimeout(timeoutId);

      // Step 4: Handle redirects
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Redirect response missing Location header');
        }

        // Resolve relative redirects
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;

        if (redirectCount > maxRedirects) {
          throw new Error(`Too many redirects (max: ${maxRedirects})`);
        }

        // Continue loop to validate new URL
        continue;
      }

      // Step 5: Validate Content-Type for successful responses
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (!isValidContentType(contentType)) {
          throw new Error(`Invalid content type: ${contentType || 'missing'}. Expected HTML.`);
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  throw new Error('Max redirects exceeded');
}

/**
 * Safely parse JSON with error handling
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
 * Clean HTML for LLM processing
 * Removes scripts, styles, and other non-content elements
 */
function cleanHtmlForLLM(html: string): string {
  // Remove script tags and content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove SVG elements
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // Remove head section
  cleaned = cleaned.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');

  // Remove all HTML tags but preserve text content
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Truncate if too long
  if (cleaned.length > MAX_LLM_CONTENT_SIZE) {
    cleaned = cleaned.substring(0, MAX_LLM_CONTENT_SIZE) + '... [truncated]';
  }

  return cleaned;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Extracted product page data
 */
export interface ProductPageData {
  url: string;
  domain: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  mpn: string | null;
  upc: string | null;
  price: number | null;
  currency: string | null;
  specifications: Record<string, string>;
  description: string | null;
  images: string[];
  extractionMethod: 'amazon' | 'ebay' | 'walmart' | 'llm_generic';
  confidence: number;
}

/**
 * Result of extraction attempt
 */
export interface ProductPageExtractionResult {
  success: boolean;
  data: ProductPageData | null;
  error?: string;
  timeMs: number;
  cost: number;
}

// ============================================================================
// Service
// ============================================================================

@Injectable()
export class ProductPageExtractorService implements OnModuleInit {
  private readonly logger = new Logger(ProductPageExtractorService.name);
  private openai: OpenAI | null = null;
  private extractionModel: string;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    this.extractionModel = this.configService.get<string>('EXTRACTION_MODEL') || DEFAULT_EXTRACTION_MODEL;
  }

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
      this.logger.log('ProductPageExtractorService initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - LLM extraction unavailable');
    }
  }

  /**
   * Check if service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Extract product data from a URL
   */
  async extractFromUrl(
    url: string,
    targetFields: string[] = [],
  ): Promise<ProductPageExtractionResult> {
    const startTime = Date.now();

    try {
      // Validate URL
      const urlCheck = isUrlSafe(url);
      if (!urlCheck.safe) {
        return {
          success: false,
          data: null,
          error: `Invalid URL: ${urlCheck.reason}`,
          timeMs: Date.now() - startTime,
          cost: 0,
        };
      }

      // Rate limit
      const limiter = getRateLimiter('pageFetch', PAGE_FETCH_RATE_LIMIT);
      await limiter.acquire();

      // Fetch the page
      this.logger.debug(`Fetching product page: ${url}`);
      const response = await safeFetch(url);

      if (!response.ok) {
        return {
          success: false,
          data: null,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timeMs: Date.now() - startTime,
          cost: 0,
        };
      }

      // Get HTML content
      const html = await response.text();
      if (html.length > MAX_HTML_SIZE) {
        this.logger.warn(`Page content too large (${html.length} bytes), truncating`);
      }

      const truncatedHtml = html.substring(0, MAX_HTML_SIZE);

      // Determine domain and extraction method
      const domain = this.getDomain(url);
      let data: ProductPageData;
      let cost = 0;

      // Try site-specific extractors first
      if (domain.includes('amazon.')) {
        data = await this.extractAmazon(truncatedHtml, url, domain);
      } else if (domain.includes('ebay.')) {
        data = await this.extractEbay(truncatedHtml, url, domain);
      } else if (domain.includes('walmart.')) {
        data = await this.extractWalmart(truncatedHtml, url, domain);
      } else {
        // Fall back to LLM extraction
        if (!this.openai) {
          return {
            success: false,
            data: null,
            error: 'LLM extraction not configured',
            timeMs: Date.now() - startTime,
            cost: 0,
          };
        }
        const result = await this.extractWithLLM(truncatedHtml, url, domain, targetFields);
        data = result.data;
        cost = result.cost;
      }

      // Apply confidence adjustments
      data.confidence = this.adjustConfidence(data);

      return {
        success: true,
        data,
        timeMs: Date.now() - startTime,
        cost,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to extract from ${url}: ${message}`);
      return {
        success: false,
        data: null,
        error: message,
        timeMs: Date.now() - startTime,
        cost: 0,
      };
    }
  }

  /**
   * Convert extracted data to field updates
   */
  toFieldUpdates(data: ProductPageData, url: string): ExtractedFieldValue[] {
    const updates: ExtractedFieldValue[] = [];
    const timestamp = new Date().toISOString();
    const sourceType = 'product_page_extraction' as const;

    // Helper to create field update with source
    const createFieldUpdate = (
      fieldName: string,
      value: unknown,
      confidenceMultiplier = 1.0,
    ): ExtractedFieldValue => ({
      fieldName,
      value,
      source: {
        type: sourceType,
        confidence: data.confidence * confidenceMultiplier,
        timestamp,
        rawValue: value,
        query: url,
      },
    });

    // Add primary fields with standard confidence
    for (const field of PRIMARY_EXTRACTION_FIELDS) {
      const value = data[field];
      if (value != null) {
        updates.push(createFieldUpdate(field, value));
      }
    }

    // Add description with slightly lower confidence
    if (data.description) {
      updates.push(createFieldUpdate('description', data.description, CONFIDENCE_ADJUSTMENTS.descriptionPenalty));
    }

    // Add specifications as individual fields if they map to known fields
    for (const [specKey, specValue] of Object.entries(data.specifications)) {
      const normalizedKey = specKey.toLowerCase();
      const fieldName = SPEC_FIELD_MAPPINGS[normalizedKey];
      if (fieldName) {
        updates.push(createFieldUpdate(fieldName, specValue, CONFIDENCE_ADJUSTMENTS.specFieldPenalty));
      }
    }

    return updates;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Extract domain from URL
   */
  private getDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  /**
   * Create base ProductPageData structure
   * Reduces duplication across site-specific extractors
   */
  private createBaseProductData(
    url: string,
    domain: string,
    extractionMethod: ProductPageData['extractionMethod'],
  ): ProductPageData {
    return {
      url,
      domain,
      title: null,
      brand: null,
      model: null,
      mpn: null,
      upc: null,
      price: null,
      currency: 'USD',
      specifications: {},
      description: null,
      images: [],
      extractionMethod,
      confidence: CONFIDENCE_SCORES[extractionMethod],
    };
  }

  /**
   * Adjust confidence based on extraction quality
   */
  private adjustConfidence(data: ProductPageData): number {
    let confidence = data.confidence;

    // Count extracted fields
    const fieldsExtracted = [
      data.title,
      data.brand,
      data.model,
      data.mpn,
      data.upc,
      data.price,
    ].filter(Boolean).length;

    // Bonus for multiple fields
    if (fieldsExtracted >= MIN_FIELDS_FOR_BONUS) {
      confidence += CONFIDENCE_ADJUSTMENTS.multipleFields;
    }

    // Bonus for price found
    if (data.price) {
      confidence += CONFIDENCE_ADJUSTMENTS.priceFound;
    }

    // Penalty if title looks like search results
    if (data.title && /search results?|showing \d+ results?/i.test(data.title)) {
      confidence += CONFIDENCE_ADJUSTMENTS.searchResults;
    }

    // Clamp to valid range
    return Math.max(CONFIDENCE_MIN, Math.min(CONFIDENCE_MAX, confidence));
  }

  /**
   * Extract from Amazon product page
   */
  private async extractAmazon(html: string, url: string, domain: string): Promise<ProductPageData> {
    const data = this.createBaseProductData(url, domain, 'amazon');

    // Extract title
    const titleMatch = html.match(/id="productTitle"[^>]*>([^<]+)</);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    // Extract brand from byline
    const brandMatch = html.match(/id="bylineInfo"[^>]*>[^<]*<a[^>]*>([^<]+)</);
    if (brandMatch) {
      data.brand = brandMatch[1].replace(/^Visit the /, '').replace(/ Store$/, '').trim();
    }

    // Alternative brand extraction from store link
    if (!data.brand) {
      const storeBrandMatch = html.match(/href="\/stores\/[^"]*"[^>]*>([^<]+)</);
      if (storeBrandMatch) {
        data.brand = storeBrandMatch[1].trim();
      }
    }

    // Extract price
    const priceMatch = html.match(/class="a-price[^"]*"[^>]*>.*?<span[^>]*class="a-offscreen"[^>]*>\$?([\d,.]+)/s);
    if (priceMatch) {
      data.price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    // Extract ASIN from URL (useful for cross-referencing)
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
    if (asinMatch) {
      data.specifications['ASIN'] = asinMatch[1].toUpperCase();
    }

    // Extract specs from product details table
    const specMatches = html.matchAll(/<th[^>]*class="[^"]*prodDetSectionEntry[^"]*"[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)/gi);
    for (const match of specMatches) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value && value !== 'N/A') {
        data.specifications[key] = value;

        // Extract model from specs
        if (/model|part number/i.test(key) && !data.model) {
          data.model = value;
        }

        // Extract UPC from specs
        if (/upc|ean/i.test(key) && !data.upc) {
          data.upc = value;
        }
      }
    }

    // Extract from technical specifications section
    const techSpecMatches = html.matchAll(/<tr[^>]*>\s*<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)/gi);
    for (const match of techSpecMatches) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value && value !== 'N/A') {
        data.specifications[key] = value;
      }
    }

    return data;
  }

  /**
   * Extract from eBay listing page
   */
  private async extractEbay(html: string, url: string, domain: string): Promise<ProductPageData> {
    const data = this.createBaseProductData(url, domain, 'ebay');

    // Extract title
    const titleMatch = html.match(/class="[^"]*x-item-title[^"]*"[^>]*>.*?<span[^>]*>([^<]+)/s);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    // Alternative title extraction
    if (!data.title) {
      const altTitleMatch = html.match(/<h1[^>]*class="[^"]*it-ttl[^"]*"[^>]*>([^<]+)/);
      if (altTitleMatch) {
        data.title = altTitleMatch[1].trim();
      }
    }

    // Extract price
    const priceMatch = html.match(/itemprop="price"[^>]*content="([\d.]+)"/);
    if (priceMatch) {
      data.price = parseFloat(priceMatch[1]);
    }

    // Alternative price extraction
    if (!data.price) {
      const altPriceMatch = html.match(/class="[^"]*x-price-primary[^"]*"[^>]*>.*?\$?([\d,.]+)/s);
      if (altPriceMatch) {
        data.price = parseFloat(altPriceMatch[1].replace(/,/g, ''));
      }
    }

    // Extract item specifics (key-value pairs)
    const specificsMatches = html.matchAll(/class="[^"]*ux-labels-values[^"]*"[^>]*>.*?<dt[^>]*>([^<]+)<\/dt>.*?<dd[^>]*>([^<]+)/gis);
    for (const match of specificsMatches) {
      const key = match[1].trim().replace(/:$/, '');
      const value = match[2].trim();
      if (key && value) {
        data.specifications[key] = value;

        // Extract known fields from specs
        if (/^brand$/i.test(key)) {
          data.brand = value;
        } else if (/^model$/i.test(key) || /model number/i.test(key)) {
          data.model = value;
        } else if (/^mpn$/i.test(key) || /manufacturer part/i.test(key)) {
          data.mpn = value;
        } else if (/^upc$/i.test(key)) {
          data.upc = value;
        }
      }
    }

    // Extract item ID from URL
    const itemIdMatch = url.match(/\/itm\/(\d+)/);
    if (itemIdMatch) {
      data.specifications['eBay Item ID'] = itemIdMatch[1];
    }

    return data;
  }

  /**
   * Extract from Walmart product page
   */
  private async extractWalmart(html: string, url: string, domain: string): Promise<ProductPageData> {
    const data = this.createBaseProductData(url, domain, 'walmart');

    // Extract title
    const titleMatch = html.match(/data-automation-id="product-title"[^>]*>([^<]+)/);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    // Alternative title extraction
    if (!data.title) {
      const altTitleMatch = html.match(/<h1[^>]*itemprop="name"[^>]*>([^<]+)/);
      if (altTitleMatch) {
        data.title = altTitleMatch[1].trim();
      }
    }

    // Extract price
    const priceMatch = html.match(/itemprop="price"[^>]*content="([\d.]+)"/);
    if (priceMatch) {
      data.price = parseFloat(priceMatch[1]);
    }

    // Extract brand
    const brandMatch = html.match(/data-automation-id="product-brand"[^>]*>([^<]+)/);
    if (brandMatch) {
      data.brand = brandMatch[1].trim();
    }

    // Extract specifications from product specs table
    const specMatches = html.matchAll(/<tr[^>]*>\s*<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)/gi);
    for (const match of specMatches) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value) {
        data.specifications[key] = value;

        // Extract known fields
        if (/model/i.test(key) && !data.model) {
          data.model = value;
        } else if (/manufacturer part/i.test(key) && !data.mpn) {
          data.mpn = value;
        } else if (/upc/i.test(key) && !data.upc) {
          data.upc = value;
        }
      }
    }

    return data;
  }

  /**
   * Extract using LLM for generic pages
   */
  private async extractWithLLM(
    html: string,
    url: string,
    domain: string,
    targetFields: string[],
  ): Promise<{ data: ProductPageData; cost: number }> {
    const cleanedHtml = cleanHtmlForLLM(html);

    const fieldsToExtract = targetFields.length > 0
      ? targetFields
      : [...DEFAULT_TARGET_FIELDS];

    const prompt = `Extract product information from this web page content.

URL: ${url}
Domain: ${domain}

Page content:
${cleanedHtml}

Extract and return a JSON object with these fields (only include fields you can confidently extract):
${fieldsToExtract.map(f => `- ${f}`).join('\n')}

For specifications, return key-value pairs of product attributes.
For price, return just the number (e.g., 29.99) without currency symbols.

Return ONLY valid JSON, no explanation.`;

    const response = await this.openai!.chat.completions.create({
      model: this.extractionModel,
      messages: [
        {
          role: 'system',
          content: 'You are a product data extractor. Extract structured product information from web page content. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: LLM_CONFIG.temperature,
      max_tokens: LLM_CONFIG.maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = safeJsonParse<Record<string, unknown>>(content);

    // Estimate cost based on token usage
    const tokens = response.usage?.total_tokens || 0;
    const cost = tokens * LLM_CONFIG.costPerToken;

    // Start with base structure and populate from parsed response
    const data = this.createBaseProductData(url, domain, 'llm_generic');

    if (parsed) {
      data.title = typeof parsed.title === 'string' ? parsed.title : null;
      data.brand = typeof parsed.brand === 'string' ? parsed.brand : null;
      data.model = typeof parsed.model === 'string' ? parsed.model : null;
      data.mpn = typeof parsed.mpn === 'string' ? parsed.mpn : null;
      data.upc = typeof parsed.upc === 'string' ? parsed.upc : null;
      data.price = typeof parsed.price === 'number' ? parsed.price : null;
      data.description = typeof parsed.description === 'string' ? parsed.description : null;

      if (typeof parsed.specifications === 'object' && parsed.specifications !== null) {
        data.specifications = parsed.specifications as Record<string, string>;
      }
    }

    return { data, cost };
  }
}
