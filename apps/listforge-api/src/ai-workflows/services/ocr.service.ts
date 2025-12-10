import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { OCRExtractionResult } from '@listforge/core-types';

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

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - OCR will be unavailable');
      this.client = new OpenAI({ apiKey: 'not-configured' });
    } else {
      this.client = new OpenAI({ apiKey });
    }
  }

  /**
   * Check if a URL is a local URL that OpenAI can't access
   */
  private isLocalUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.') ||
        parsed.hostname === 'host.docker.internal'
      );
    } catch {
      return false;
    }
  }

  /**
   * Fetch an image and convert to base64 data URI
   */
  private async imageToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      this.logger.error(`Failed to convert image to base64: ${url}`, error);
      throw error;
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
        model: 'gpt-4o',
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
      this.logger.error('OCR extraction failed:', error);
      return this.emptyResult();
    }
  }

  /**
   * Parse the OCR response JSON
   */
  private parseOCRResponse(content: string): OCRExtractionResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('OCR response did not contain valid JSON');
        return this.emptyResult();
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and clean UPC/EAN
      const upc = this.validateUPC(parsed.upc);
      const ean = this.validateEAN(parsed.ean);

      return {
        upc: upc || undefined,
        ean: ean || undefined,
        modelNumber: parsed.modelNumber || undefined,
        serialNumber: parsed.serialNumber || undefined,
        mpn: parsed.mpn || undefined,
        rawText: Array.isArray(parsed.rawText) ? parsed.rawText : [],
        labels: typeof parsed.labels === 'object' && parsed.labels !== null ? parsed.labels : {},
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      };
    } catch (error) {
      this.logger.warn('Failed to parse OCR response:', error);
      return this.emptyResult();
    }
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
