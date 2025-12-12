import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  CategoryId,
  CategoryInspectionGuide,
  GuidedVisionAnalysisResult,
  RegionAnalysisResult,
  ExtractedIdentifier,
  InspectionRegion,
} from '@listforge/core-types';
import { getCategoryInspectionGuide } from '../data/category-inspection-guides';
import { CategoryDetectionService, CategoryDetectionContext } from './category-detection.service';
import { getRateLimiter, RATE_LIMITER_CONFIGS } from '../utils/rate-limiter';

// ============================================================================
// Constants - Extracted for maintainability and configurability
// ============================================================================

/** Default OpenAI model for vision tasks */
const DEFAULT_VISION_MODEL = 'gpt-4o';

/** Maximum number of images to process in one request */
const MAX_IMAGES_PER_REQUEST = 6;

/** Maximum tokens for vision response */
const MAX_TOKENS = 2000;

/** Temperature for factual extraction (low for accuracy) */
const TEMPERATURE = 0.2;

/** Maximum URL length to prevent abuse */
const MAX_URL_LENGTH = 2048;

/** Maximum length for text fields */
const MAX_TEXT_LENGTH = 500;

/** Maximum number of extraction results to process */
const MAX_REGION_RESULTS = 50;
const MAX_EXTRACTED_IDENTIFIERS = 100;

/** Confidence bounds */
const CONFIDENCE_MIN = 0;
const CONFIDENCE_MAX = 0.95;
const CONFIDENCE_DEFAULT = 0.5;
const CONFIDENCE_EMPTY = 0.2;
const REGION_CONFIDENCE_BONUS = 0.05;
const MAX_REGION_CONFIDENCE_BONUS = 0.2;

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
 * Sanitize error message to prevent information leakage
 */
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    const sanitized = msg.replace(/\/[^\s]+/g, '[path]');
    return sanitized.slice(0, 200);
  }
  return 'An error occurred';
}

/**
 * Sanitize user-provided string input
 */
function sanitizeUserInput(input: string | undefined, maxLength: number = MAX_TEXT_LENGTH): string {
  if (!input || typeof input !== 'string') return '';
  // Remove potential injection characters and limit length
  return input.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

/**
 * Context for guided vision analysis
 */
export interface GuidedVisionContext {
  /** Image URLs to analyze */
  imageUrls: string[];
  /** Pre-detected category (skips detection if provided) */
  categoryId?: CategoryId;
  /** Any existing item data */
  existingData?: {
    title?: string;
    description?: string;
    brand?: string;
    model?: string;
  };
  /** Target fields to focus on */
  targetFields?: string[];
}

/**
 * GuidedVisionAnalysisService
 *
 * Performs category-specific visual inspection of products.
 * Unlike generic vision analysis, this service:
 *
 * 1. Detects or uses provided category
 * 2. Loads category-specific inspection guide
 * 3. Analyzes specific regions (labels, tags, hardware, etc.)
 * 4. Extracts identifiers using category knowledge
 * 5. Returns structured results with region-by-region findings
 *
 * This enables expert-level visual inspection by telling the AI
 * exactly where to look and what to extract for each product type.
 */
@Injectable()
export class GuidedVisionAnalysisService {
  private readonly logger = new Logger(GuidedVisionAnalysisService.name);
  private openai: OpenAI | null = null;
  private rateLimiter = getRateLimiter('openai', RATE_LIMITER_CONFIGS.openai);
  private readonly visionModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly categoryDetectionService: CategoryDetectionService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    // Allow model to be configured
    this.visionModel = this.configService.get<string>('OPENAI_VISION_MODEL') || DEFAULT_VISION_MODEL;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('GuidedVisionAnalysisService initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - guided vision analysis unavailable');
    }
  }

  /**
   * Check if the service is configured and ready
   */
  isConfigured(): boolean {
    return this.openai !== null;
  }

  /**
   * Perform guided visual analysis on product images
   *
   * @param context - Images and optional context
   * @returns Structured analysis results with region findings
   */
  async analyze(context: GuidedVisionContext): Promise<GuidedVisionAnalysisResult> {
    if (!this.openai) {
      throw new Error('GuidedVisionAnalysisService not configured - missing OPENAI_API_KEY');
    }

    if (context.imageUrls.length === 0) {
      throw new Error('No images provided for analysis');
    }

    // Validate all image URLs for SSRF prevention
    const validatedUrls: string[] = [];
    for (const url of context.imageUrls) {
      const urlCheck = isUrlSafe(url);
      if (!urlCheck.safe) {
        this.logger.warn(`Skipping invalid URL: ${urlCheck.reason}`);
        continue;
      }
      validatedUrls.push(url);
    }

    if (validatedUrls.length === 0) {
      throw new Error('No valid image URLs provided for analysis');
    }

    // Step 1: Detect or use provided category
    let categoryId = context.categoryId;
    if (!categoryId) {
      const detectionContext: CategoryDetectionContext = {
        imageUrls: validatedUrls,
        title: sanitizeUserInput(context.existingData?.title),
        description: sanitizeUserInput(context.existingData?.description),
        brand: sanitizeUserInput(context.existingData?.brand, 100),
      };
      const detection = await this.categoryDetectionService.detectCategory(detectionContext);
      categoryId = detection.categoryId;
      this.logger.debug(`Detected category: ${categoryId} (confidence: ${detection.confidence})`);
    }

    // Step 2: Get inspection guide for category
    const guide = getCategoryInspectionGuide(categoryId);
    this.logger.debug(`Using inspection guide: ${guide.categoryName}`);

    // Step 3: Perform guided analysis
    const analysisResult = await this.performGuidedAnalysis(
      validatedUrls,
      guide,
      context.existingData,
      context.targetFields,
    );

    return {
      categoryId,
      ...analysisResult,
    };
  }

  /**
   * Perform the actual guided analysis using the inspection guide
   */
  private async performGuidedAnalysis(
    imageUrls: string[],
    guide: CategoryInspectionGuide,
    existingData?: GuidedVisionContext['existingData'],
    targetFields?: string[],
  ): Promise<Omit<GuidedVisionAnalysisResult, 'categoryId'>> {
    await this.rateLimiter.acquire();

    // Build the analysis prompt based on the guide
    const systemPrompt = this.buildSystemPrompt(guide, targetFields);
    const userPrompt = this.buildUserPrompt(guide, existingData);

    // Prepare image content (limit to MAX_IMAGES_PER_REQUEST)
    const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = imageUrls
      .slice(0, MAX_IMAGES_PER_REQUEST)
      .map(url => ({
        type: 'image_url' as const,
        image_url: { url, detail: 'high' as const }, // Use high detail for inspection
      }));

    try {
      const response = await this.openai!.chat.completions.create({
        model: this.visionModel, // Use configurable model
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              ...imageContent,
            ],
          },
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from vision model');
      }

      // Parse the structured response
      return this.parseAnalysisResponse(content, guide);
    } catch (error) {
      const errorMsg = sanitizeErrorMessage(error);
      this.logger.error(`Guided vision analysis failed: ${errorMsg}`);
      throw new Error(`Guided vision analysis failed: ${errorMsg}`);
    }
  }

  /**
   * Build the system prompt with category-specific instructions
   */
  private buildSystemPrompt(guide: CategoryInspectionGuide, targetFields?: string[]): string {
    // Build region inspection instructions
    const regionInstructions = guide.inspectionRegions
      .sort((a, b) => (b.priority || 5) - (a.priority || 5))
      .map((region, idx) => `
${idx + 1}. **${region.name}** (Priority: ${region.priority || 5}/10)
   - Location: ${region.description}
   - Look for: ${region.lookFor.join(', ')}
   - Specific instruction: ${region.examplePrompt}`)
      .join('\n');

    // Build identifying features instructions
    const featureInstructions = guide.identifyingFeatures.length > 0
      ? `
## Identifying Features to Look For
${guide.identifyingFeatures.map(f => `
- **${f.feature}**: ${f.description || ''}
  ${f.decodingPattern ? `Pattern: ${f.decodingPattern}` : ''}
  ${f.example ? `Examples: ${f.example}` : ''}`).join('\n')}`
      : '';

    // Build brand-specific instructions
    const brandInstructions = guide.commonBrands.length > 0
      ? `
## Brand-Specific Guidance
${guide.commonBrands.slice(0, 5).map(b => `
- **${b.brand}**: Look for ${b.identifiers.slice(0, 3).join(', ')}`).join('\n')}`
      : '';

    return `You are an expert product inspector for ${guide.categoryName}. Your job is to systematically inspect product images and extract identifying information.

## Inspection Regions
Examine each region carefully if visible in the images:
${regionInstructions}
${featureInstructions}
${brandInstructions}

## Output Format
Return a JSON object with this structure:
{
  "regionResults": [
    {
      "regionName": "Region Name",
      "found": true/false,
      "extractedText": ["text1", "text2"],
      "identifiedValues": {
        "brand": "value",
        "model": "value",
        ...other fields
      },
      "confidence": 0.0-1.0,
      "notes": "Any relevant observations"
    }
  ],
  "extractedIdentifiers": [
    {
      "type": "model_number|serial_number|date_code|style_number|upc|sku|other",
      "value": "extracted value",
      "source": "where found",
      "confidence": 0.0-1.0,
      "decoded": { ...decoded meaning if applicable }
    }
  ],
  "confidence": 0.0-1.0,
  "summary": "Brief summary of findings",
  "allExtractedText": ["all", "text", "found"]
}

## Important Guidelines
- ONLY report what you can actually see in the images
- Extract ALL visible text, even if you don't understand it
- Be specific about where you found each piece of information
- Set confidence based on image quality and text clarity
- If a region isn't visible, set found=false
- Don't guess or hallucinate - only report observed information
${guide.systemPromptAdditions || ''}`;
  }

  /**
   * Build the user prompt with any existing data context
   */
  private buildUserPrompt(
    guide: CategoryInspectionGuide,
    existingData?: GuidedVisionContext['existingData'],
  ): string {
    let prompt = `Perform a detailed inspection of this ${guide.categoryName} product. `;

    if (existingData) {
      const context: string[] = [];
      if (existingData.title) context.push(`Title: "${existingData.title}"`);
      if (existingData.brand) context.push(`Brand: ${existingData.brand}`);
      if (existingData.model) context.push(`Model: ${existingData.model}`);

      if (context.length > 0) {
        prompt += `\n\nExisting information (verify and expand):\n${context.join('\n')}\n\n`;
      }
    }

    prompt += `Examine each inspection region and extract all visible text and identifying information. Focus especially on:
${guide.inspectionRegions.slice(0, 5).map(r => `- ${r.name}: ${r.lookFor.slice(0, 3).join(', ')}`).join('\n')}

Return your findings as structured JSON.`;

    return prompt;
  }

  /**
   * Parse the AI response into structured results
   */
  private parseAnalysisResponse(
    content: string,
    guide: CategoryInspectionGuide,
  ): Omit<GuidedVisionAnalysisResult, 'categoryId'> {
    // Use safe JSON parsing
    interface ParsedResponse {
      regionResults?: any[];
      extractedIdentifiers?: any[];
      allExtractedText?: string[];
      confidence?: number;
      summary?: string;
    }

    const parsed = safeJsonParse<ParsedResponse>(content);
    if (!parsed) {
      this.logger.warn('Failed to parse JSON from guided vision response');
      return this.createEmptyResult(guide);
    }

    try {
      // Validate and normalize region results (limit count)
      const regionResults: RegionAnalysisResult[] = (parsed.regionResults || [])
        .slice(0, MAX_REGION_RESULTS)
        .map((r: any) => ({
          regionName: typeof r.regionName === 'string' ? r.regionName.slice(0, 100) : 'Unknown',
          found: Boolean(r.found),
          extractedText: Array.isArray(r.extractedText)
            ? r.extractedText.filter((t: any) => typeof t === 'string').slice(0, 50).map((t: string) => t.slice(0, MAX_TEXT_LENGTH))
            : [],
          identifiedValues: typeof r.identifiedValues === 'object' && r.identifiedValues !== null
            ? this.sanitizeIdentifiedValues(r.identifiedValues)
            : {},
          confidence: Math.min(1, Math.max(CONFIDENCE_MIN, typeof r.confidence === 'number' ? r.confidence : 0)),
          notes: typeof r.notes === 'string' ? r.notes.slice(0, MAX_TEXT_LENGTH) : undefined,
        }));

      // Validate and normalize extracted identifiers (limit count)
      const extractedIdentifiers: ExtractedIdentifier[] = (parsed.extractedIdentifiers || [])
        .filter((i: any) => i && i.value)
        .slice(0, MAX_EXTRACTED_IDENTIFIERS)
        .map((i: any) => ({
          type: this.normalizeIdentifierType(i.type),
          value: String(i.value).trim().slice(0, 200),
          source: typeof i.source === 'string' ? i.source.slice(0, 100) : 'unknown',
          confidence: Math.min(1, Math.max(CONFIDENCE_MIN, typeof i.confidence === 'number' ? i.confidence : CONFIDENCE_DEFAULT)),
          decoded: typeof i.decoded === 'object' && i.decoded !== null ? i.decoded : undefined,
        }));

      // Collect all extracted text (with limits)
      const allExtractedText = Array.isArray(parsed.allExtractedText)
        ? parsed.allExtractedText.filter((t: any) => typeof t === 'string').slice(0, 200).map((t: string) => t.slice(0, MAX_TEXT_LENGTH))
        : regionResults.flatMap(r => r.extractedText);

      return {
        regionResults,
        extractedIdentifiers,
        confidence: Math.min(1, Math.max(CONFIDENCE_MIN, typeof parsed.confidence === 'number' ? parsed.confidence : this.calculateConfidence(regionResults))),
        summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1000) : this.generateSummary(regionResults, extractedIdentifiers),
        allExtractedText,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse guided vision response: ${sanitizeErrorMessage(error)}`);
      return this.createEmptyResult(guide);
    }
  }

  /**
   * Sanitize identified values object
   */
  private sanitizeIdentifiedValues(values: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    let count = 0;
    for (const [key, value] of Object.entries(values)) {
      if (count >= 50) break;
      if (typeof key === 'string' && key.length <= 100) {
        const sanitizedValue = typeof value === 'string' ? value.slice(0, MAX_TEXT_LENGTH) : String(value).slice(0, MAX_TEXT_LENGTH);
        sanitized[key.slice(0, 100)] = sanitizedValue;
        count++;
      }
    }
    return sanitized;
  }

  /**
   * Normalize identifier type to valid enum value
   */
  private normalizeIdentifierType(type: string): ExtractedIdentifier['type'] {
    const validTypes: ExtractedIdentifier['type'][] = [
      'model_number', 'serial_number', 'date_code', 'style_number', 'upc', 'sku', 'other',
    ];
    const normalized = type?.toLowerCase().replace(/\s+/g, '_');
    return validTypes.includes(normalized as any) ? normalized as ExtractedIdentifier['type'] : 'other';
  }

  /**
   * Calculate overall confidence from region results
   */
  private calculateConfidence(regionResults: RegionAnalysisResult[]): number {
    const found = regionResults.filter(r => r.found);
    if (found.length === 0) return CONFIDENCE_EMPTY;

    const avgConfidence = found.reduce((sum, r) => sum + r.confidence, 0) / found.length;
    // Boost for finding multiple regions
    const regionBonus = Math.min(MAX_REGION_CONFIDENCE_BONUS, found.length * REGION_CONFIDENCE_BONUS);

    return Math.min(CONFIDENCE_MAX, avgConfidence + regionBonus);
  }

  /**
   * Generate a summary from the results
   */
  private generateSummary(
    regionResults: RegionAnalysisResult[],
    extractedIdentifiers: ExtractedIdentifier[],
  ): string {
    const foundRegions = regionResults.filter(r => r.found);
    const identifierCount = extractedIdentifiers.length;

    const parts: string[] = [];

    if (foundRegions.length > 0) {
      parts.push(`Found ${foundRegions.length} inspection region(s)`);
    }

    if (identifierCount > 0) {
      parts.push(`extracted ${identifierCount} identifier(s)`);
    }

    // Extract key identified values
    const allValues = foundRegions.flatMap(r => Object.entries(r.identifiedValues));
    const brand = allValues.find(([k]) => k === 'brand')?.[1];
    const model = allValues.find(([k]) => k === 'model')?.[1];

    if (brand || model) {
      parts.push(`identified as ${[brand, model].filter(Boolean).join(' ')}`);
    }

    return parts.length > 0 ? parts.join(', ') + '.' : 'No significant findings.';
  }

  /**
   * Create empty result when parsing fails
   */
  private createEmptyResult(guide: CategoryInspectionGuide): Omit<GuidedVisionAnalysisResult, 'categoryId'> {
    return {
      regionResults: guide.inspectionRegions.map(r => ({
        regionName: r.name,
        found: false,
        extractedText: [],
        identifiedValues: {},
        confidence: 0,
      })),
      extractedIdentifiers: [],
      confidence: 0,
      summary: 'Analysis failed to produce structured results.',
      allExtractedText: [],
    };
  }

  /**
   * Extract field values from guided analysis results
   * Maps region findings to standard item fields
   */
  extractFieldValues(
    result: GuidedVisionAnalysisResult,
    targetFields: string[],
  ): Record<string, { value: string; confidence: number; source: string }> {
    const values: Record<string, { value: string; confidence: number; source: string }> = {};

    // Collect all identified values from regions
    for (const region of result.regionResults) {
      if (!region.found) continue;

      for (const [field, value] of Object.entries(region.identifiedValues)) {
        if (!targetFields.includes(field)) continue;
        if (!value || typeof value !== 'string') continue;

        // Keep the highest confidence value for each field
        if (!values[field] || values[field].confidence < region.confidence) {
          values[field] = {
            value: value.trim(),
            confidence: region.confidence,
            source: `guided_vision:${region.regionName}`,
          };
        }
      }
    }

    // Add values from extracted identifiers
    for (const identifier of result.extractedIdentifiers) {
      // Map identifier types to fields
      const fieldMap: Record<string, string> = {
        model_number: 'model',
        style_number: 'model',
        serial_number: 'serial',
        date_code: 'year',
        upc: 'upc',
        sku: 'sku',
      };

      const field = fieldMap[identifier.type];
      if (!field || !targetFields.includes(field)) continue;

      // Keep the highest confidence value
      if (!values[field] || values[field].confidence < identifier.confidence) {
        values[field] = {
          value: identifier.value,
          confidence: identifier.confidence,
          source: `guided_vision:${identifier.source}`,
        };
      }

      // If date_code, also try to extract year
      if (identifier.type === 'date_code' && identifier.decoded?.year && targetFields.includes('year')) {
        values['year'] = {
          value: String(identifier.decoded.year),
          confidence: identifier.confidence * 0.9,
          source: `guided_vision:${identifier.source}:decoded`,
        };
      }
    }

    return values;
  }
}
