import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { OCRExtractionResult } from '@listforge/core-types';
import { classifyTextChunks } from '../utils/identifier-classifier';

// ============================================================================
// Constants - Extracted magic numbers for maintainability
// ============================================================================

/** Maximum image size in bytes for base64 conversion (10MB) */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Timeout for external fetch requests in milliseconds */
const FETCH_TIMEOUT_MS = 30000;

/** Default confidence when OCR response doesn't include one */
const DEFAULT_OCR_CONFIDENCE = 0.5;

/** Confidence multiplier for UPC field extraction */
const UPC_CONFIDENCE_MULTIPLIER = 0.9;

/** Confidence multiplier for brand from labels */
const BRAND_LABEL_CONFIDENCE_MULTIPLIER = 0.85;

/** Confidence multiplier for model number extraction */
const MODEL_CONFIDENCE_MULTIPLIER = 0.85;

/** Confidence multiplier for MPN extraction */
const MPN_CONFIDENCE_MULTIPLIER = 0.9;

/** Confidence multiplier for additional label fields */
const LABEL_FIELD_CONFIDENCE_MULTIPLIER = 0.7;

/** Maximum length for rawText array items */
const MAX_RAW_TEXT_LENGTH = 500;

/** Maximum number of rawText items to keep */
const MAX_RAW_TEXT_ITEMS = 100;

/** Maximum label key/value length */
const MAX_LABEL_LENGTH = 200;

/** Maximum number of label entries */
const MAX_LABEL_ENTRIES = 50;

/**
 * OCR Service - Slice 2: Enhanced Product Identification
 *
 * Dedicated vision service for extracting text from product images.
 * Focuses on identifying UPCs, model numbers, serial numbers, and other identifiers.
 *
 * This is separate from general media analysis to:
 * 1. Use a focused prompt optimized for text extraction
 * 2. Allow parallel execution with other analysis
 * 3. Provide structured output for identifier parsing
 */
@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);
  private client: OpenAI;
  private readonly visionModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OpenAI API not configured - OCR will be unavailable');
      this.client = new OpenAI({ apiKey: 'not-configured' });
    } else {
      this.client = new OpenAI({ apiKey });
    }

    // Make model configurable with sensible default
    this.visionModel = this.configService.get<string>('OCR_VISION_MODEL') || 'gpt-4o';
  }

  /**
   * Check if a URL is a local URL that OpenAI can't access
   * Handles URL-encoded hostnames to prevent bypass attacks
   */
  private isLocalUrl(url: string): boolean {
    try {
      // Decode URL first to prevent encoded bypass attempts
      // e.g., localhost could be encoded as %6c%6f%63%61%6c%68%6f%73%74
      const decodedUrl = decodeURIComponent(url);
      const parsed = new URL(decodedUrl);

      // Normalize hostname to lowercase
      const hostname = parsed.hostname.toLowerCase();

      // Check for various local/private network indicators
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.') ||
        hostname === 'host.docker.internal' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.localhost') ||
        // Block 0.0.0.0 which can resolve to localhost
        hostname === '0.0.0.0'
      );
    } catch {
      // If URL parsing fails, treat as unsafe (not local, but also invalid)
      return false;
    }
  }

  /**
   * Fetch an image and convert to base64 data URI
   * Includes timeout and size limits for security
   */
  private async imageToBase64(url: string): Promise<string> {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ListForge-OCR/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Image fetch failed with status ${response.status}`);
      }

      // Check Content-Length header if available
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image exceeds maximum allowed size');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Validate content type is actually an image
      if (!contentType.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      const buffer = await response.arrayBuffer();

      // Check actual size (Content-Length might be missing or incorrect)
      if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image exceeds maximum allowed size');
      }

      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      clearTimeout(timeoutId);

      // Sanitize error message to prevent information leakage
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          this.logger.warn('Image fetch timed out');
          throw new Error('Image fetch timed out');
        }
        // Don't log the full URL which might contain sensitive info
        this.logger.warn(`Image conversion failed: ${error.message}`);
        throw new Error(`Image conversion failed: ${error.message}`);
      }
      throw new Error('Image conversion failed');
    }
  }

  /**
   * Prepare image URLs for OpenAI - convert local URLs to base64
   */
  private async prepareImageUrls(urls: string[]): Promise<string[]> {
    return Promise.all(
      urls.map(async (url) => {
        if (this.isLocalUrl(url)) {
          this.logger.debug(`Converting local URL to base64: ${url}`);
          return this.imageToBase64(url);
        }
        return url;
      }),
    );
  }

  /**
   * Extract text and identifiers from product images
   *
   * Uses a focused prompt to extract:
   * - UPC/EAN barcodes (12-14 digit numbers)
   * - Model numbers
   * - Serial numbers
   * - MPN (Manufacturer Part Number)
   * - Key-value pairs from labels
   */
  async extractText(imageUrls: string[]): Promise<OCRExtractionResult> {
    if (imageUrls.length === 0) {
      return {
        rawText: [],
        labels: {},
        confidence: 0,
      };
    }

    this.logger.debug(`Extracting text from ${imageUrls.length} image(s)`);

    try {
      // Convert local URLs to base64 so OpenAI can access them
      const preparedUrls = await this.prepareImageUrls(imageUrls);

      const imageContents = preparedUrls.map((url) => ({
        type: 'image_url' as const,
        image_url: { url, detail: 'high' as const }, // Use high detail for better text reading
      }));

      const response = await this.client.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert OCR system specialized in extracting text from product images.
Your task is to find and extract ALL visible text, with special focus on:

1. **UPC/EAN Barcodes**: 8-14 digit numbers, often near barcodes
2. **Model Numbers**: Alphanumeric codes like "WH-1000XM4", "A2141", "SM-G991B"
3. **Serial Numbers**: Usually labeled "S/N", "Serial", or "SN:"
4. **MPN**: Manufacturer Part Numbers, often labeled "MPN", "Part #", "P/N"
5. **Labels**: Any key-value pairs like "Made in: China", "Capacity: 500GB"

Return JSON with this exact structure:
{
  "upc": "string or null - 12-14 digit barcode if found",
  "ean": "string or null - 8 or 13 digit EAN if found",
  "modelNumber": "string or null - primary model/part number",
  "serialNumber": "string or null - serial number if found",
  "mpn": "string or null - manufacturer part number if different from model",
  "rawText": ["array of all readable text snippets"],
  "labels": {"key": "value pairs from product labels"},
  "confidence": 0.0-1.0 based on text clarity and certainty
}

Be precise with numbers - verify digit counts for UPC (12 digits) and EAN (8 or 13 digits).
If uncertain about a field, set it to null rather than guessing.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all visible text from these product images. Focus on barcodes, model numbers, serial numbers, and any labels or markings.',
              },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.1, // Low temperature for accuracy
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        this.logger.warn('No response from OCR extraction');
        return this.emptyResult();
      }

      return this.parseOCRResponse(content);
    } catch (error) {
      // Sanitize error logging to prevent API key or sensitive data exposure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`OCR extraction failed: ${errorMessage}`);
      return this.emptyResult();
    }
  }

  /**
   * Parse the OCR response JSON with schema validation
   * Slice 4: Enhanced with text chunk classification
   */
  private parseOCRResponse(content: string): OCRExtractionResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('OCR response did not contain valid JSON');
        return this.emptyResult();
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Schema validation - ensure parsed data matches expected structure
      if (typeof parsed !== 'object' || parsed === null) {
        this.logger.warn('OCR response is not a valid object');
        return this.emptyResult();
      }

      // Validate and clean UPC/EAN
      const upc = this.validateUPC(parsed.upc);
      const ean = this.validateEAN(parsed.ean);

      // Validate and sanitize rawText array
      const rawText = this.validateAndSanitizeRawText(parsed.rawText);

      // Validate confidence with bounds checking
      const confidence = this.validateConfidence(parsed.confidence);

      // Validate and sanitize string fields
      const modelNumber = this.sanitizeStringField(parsed.modelNumber);
      const serialNumber = this.sanitizeStringField(parsed.serialNumber);
      const mpn = this.sanitizeStringField(parsed.mpn);

      // Validate and sanitize labels object
      const labels = this.validateAndSanitizeLabels(parsed.labels);

      // Slice 4: Classify text chunks for potential search queries
      // This helps identify which raw text looks like product identifiers
      const textChunks = classifyTextChunks(rawText, confidence);

      const identifierCount = textChunks.filter(c => c.isLikelyIdentifier).length;
      if (identifierCount > 0) {
        this.logger.debug(`OCR found ${identifierCount} identifier-like text chunks`);
      }

      return {
        upc: upc || undefined,
        ean: ean || undefined,
        modelNumber: modelNumber || undefined,
        serialNumber: serialNumber || undefined,
        mpn: mpn || undefined,
        rawText,
        labels,
        confidence,
        textChunks,
      };
    } catch (error) {
      // Sanitize error message to prevent information leakage
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to parse OCR response: ${errorMessage}`);
      return this.emptyResult();
    }
  }

  /**
   * Validate and sanitize rawText array
   */
  private validateAndSanitizeRawText(rawText: unknown): string[] {
    if (!Array.isArray(rawText)) {
      return [];
    }

    return rawText
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.slice(0, MAX_RAW_TEXT_LENGTH).trim())
      .filter(item => item.length > 0)
      .slice(0, MAX_RAW_TEXT_ITEMS);
  }

  /**
   * Validate confidence value with bounds
   */
  private validateConfidence(confidence: unknown): number {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
      return DEFAULT_OCR_CONFIDENCE;
    }
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Sanitize a string field with length limit
   */
  private sanitizeStringField(value: unknown, maxLength: number = MAX_LABEL_LENGTH): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return trimmed.slice(0, maxLength);
  }

  /**
   * Validate and sanitize labels object
   */
  private validateAndSanitizeLabels(labels: unknown): Record<string, string> {
    if (typeof labels !== 'object' || labels === null) {
      return {};
    }

    const sanitized: Record<string, string> = {};
    let count = 0;

    for (const [key, value] of Object.entries(labels)) {
      if (count >= MAX_LABEL_ENTRIES) break;

      // Skip prototype properties
      if (!Object.prototype.hasOwnProperty.call(labels, key)) continue;

      // Sanitize key and value
      const sanitizedKey = this.sanitizeStringField(key);
      const sanitizedValue = this.sanitizeStringField(value);

      if (sanitizedKey && sanitizedValue) {
        sanitized[sanitizedKey] = sanitizedValue;
        count++;
      }
    }

    return sanitized;
  }

  /**
   * Validate UPC format (12 digits)
   */
  private validateUPC(value: string | null | undefined): string | null {
    if (!value) return null;
    // Remove any spaces or dashes
    const cleaned = value.replace(/[\s-]/g, '');
    // UPC-A is 12 digits
    if (/^\d{12}$/.test(cleaned)) {
      return cleaned;
    }
    // UPC-E is 8 digits (can be expanded to 12)
    if (/^\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    return null;
  }

  /**
   * Validate EAN format (8 or 13 digits)
   */
  private validateEAN(value: string | null | undefined): string | null {
    if (!value) return null;
    // Remove any spaces or dashes
    const cleaned = value.replace(/[\s-]/g, '');
    // EAN-13 is 13 digits, EAN-8 is 8 digits
    if (/^\d{13}$/.test(cleaned) || /^\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    return null;
  }

  /**
   * Return empty result for error cases
   */
  private emptyResult(): OCRExtractionResult {
    return {
      rawText: [],
      labels: {},
      confidence: 0,
    };
  }
}
