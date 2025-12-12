import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  CategoryId,
  CategoryDetectionResult,
} from '@listforge/core-types';
import {
  CATEGORY_INSPECTION_GUIDES,
  getAllCategoryKeywords,
} from '../data/category-inspection-guides';

// ============================================================================
// Constants - Extracted for maintainability and configurability
// ============================================================================

/** Default OpenAI model for category detection (mini for cost efficiency) */
const DEFAULT_DETECTION_MODEL = 'gpt-4o-mini';

/** Maximum number of images to process */
const MAX_IMAGES = 4;

/** Maximum tokens for response */
const MAX_TOKENS = 300;

/** Temperature for classification (low for consistency) */
const TEMPERATURE = 0.2;

/** Confidence thresholds */
const KEYWORD_CONFIDENCE_THRESHOLD = 0.7;
const CONFIDENCE_BOOST_AGREEMENT = 0.1;
const CONFIDENCE_MAX = 0.95;
const CONFIDENCE_DEFAULT = 0.5;
const CONFIDENCE_FALLBACK = 0.3;

/** Maximum URL length to prevent abuse */
const MAX_URL_LENGTH = 2048;

/** Maximum text length for user inputs */
const MAX_TEXT_LENGTH = 500;

/** Maximum alternatives to return */
const MAX_ALTERNATIVES = 3;

/** JSON extraction regex pattern */
const JSON_EXTRACT_PATTERN = /\{[\s\S]*\}/;

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * Validate URL for SSRF prevention
 */
function isUrlSafe(url: string): { safe: boolean; reason?: string } {
  if (!url || typeof url !== 'string') {
    return { safe: false, reason: 'Invalid URL' };
  }

  if (url.length > MAX_URL_LENGTH) {
    return { safe: false, reason: 'URL too long' };
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const parsed = new URL(decodedUrl);
    const hostname = parsed.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { safe: false, reason: 'Invalid protocol' };
    }

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
 * Sanitize user-provided text input to prevent prompt injection
 */
function sanitizeUserInput(input: string | undefined, maxLength: number = MAX_TEXT_LENGTH): string {
  if (!input || typeof input !== 'string') return '';
  // Remove potential injection characters and limit length
  return input
    .replace(/[<>{}]/g, '') // Remove angle brackets and braces
    .replace(/\n{2,}/g, '\n') // Collapse multiple newlines
    .trim()
    .slice(0, maxLength);
}

/**
 * Context for category detection
 */
export interface CategoryDetectionContext {
  /** Image URLs to analyze */
  imageUrls: string[];
  /** Any existing title or description */
  title?: string;
  description?: string;
  /** Any already-identified fields */
  brand?: string;
  category?: string;
  /** User-provided hints */
  userHints?: string;
}

/**
 * CategoryDetectionService
 *
 * Detects the product category to select the appropriate inspection guide.
 * Uses a combination of:
 * 1. Keyword matching from existing data
 * 2. AI vision analysis for visual category detection
 *
 * This enables category-specific guided inspection that knows
 * exactly where to look for identifying information.
 */
@Injectable()
export class CategoryDetectionService {
  private readonly logger = new Logger(CategoryDetectionService.name);
  private openai: OpenAI | null = null;
  private keywordMap: Map<string, CategoryId>;
  private readonly detectionModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    // Allow model to be configured
    this.detectionModel = this.configService.get<string>('OPENAI_CATEGORY_MODEL') || DEFAULT_DETECTION_MODEL;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - vision-based category detection unavailable');
    }

    // Build keyword lookup map
    this.keywordMap = getAllCategoryKeywords();
    this.logger.log(`CategoryDetectionService initialized with ${this.keywordMap.size} keywords`);
  }

  /**
   * Detect the category for a product
   * Uses keyword matching first, then falls back to AI vision
   */
  async detectCategory(context: CategoryDetectionContext): Promise<CategoryDetectionResult> {
    // Step 1: Try keyword-based detection from existing data
    const keywordResult = this.detectFromKeywords(context);
    if (keywordResult && keywordResult.confidence >= KEYWORD_CONFIDENCE_THRESHOLD) {
      this.logger.debug(`Category detected from keywords: ${keywordResult.categoryId} (${keywordResult.confidence})`);
      return keywordResult;
    }

    // Step 2: Validate URLs and filter to valid ones only
    const validatedUrls = context.imageUrls.filter(url => {
      const urlCheck = isUrlSafe(url);
      if (!urlCheck.safe) {
        this.logger.debug(`Skipping invalid URL: ${urlCheck.reason}`);
        return false;
      }
      return true;
    });

    // Step 3: Use AI vision for detection if we have valid URLs
    if (this.openai && validatedUrls.length > 0) {
      try {
        const visionResult = await this.detectFromVision({ ...context, imageUrls: validatedUrls });
        if (visionResult) {
          // Combine with keyword result if available
          if (keywordResult && keywordResult.categoryId === visionResult.categoryId) {
            // Both agree - boost confidence
            return {
              ...visionResult,
              confidence: Math.min(CONFIDENCE_MAX, visionResult.confidence + CONFIDENCE_BOOST_AGREEMENT),
              reasoning: `${visionResult.reasoning} (confirmed by keyword match)`,
            };
          }
          return visionResult;
        }
      } catch (error) {
        this.logger.warn(`Vision-based category detection failed: ${sanitizeErrorMessage(error)}`);
      }
    }

    // Step 4: Return keyword result or fallback to general
    if (keywordResult) {
      return keywordResult;
    }

    return {
      categoryId: 'general',
      confidence: CONFIDENCE_FALLBACK,
      reasoning: 'No category indicators found, using general inspection guide',
    };
  }

  /**
   * Quick category detection from keywords only (no AI)
   * Useful when we need fast detection without API calls
   */
  detectFromKeywordsOnly(context: CategoryDetectionContext): CategoryDetectionResult {
    const result = this.detectFromKeywords(context);
    return result || {
      categoryId: 'general',
      confidence: CONFIDENCE_FALLBACK,
      reasoning: 'No keyword matches found',
    };
  }

  /**
   * Detect category from text keywords
   */
  private detectFromKeywords(context: CategoryDetectionContext): CategoryDetectionResult | null {
    // Sanitize all user-provided inputs before searching
    const textToSearch = [
      sanitizeUserInput(context.title),
      sanitizeUserInput(context.description),
      sanitizeUserInput(context.brand, 100),
      sanitizeUserInput(context.category, 100),
      sanitizeUserInput(context.userHints, 200),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!textToSearch || textToSearch.length < 2) {
      return null;
    }

    // Count matches per category
    const categoryScores = new Map<CategoryId, number>();

    for (const [keyword, categoryId] of this.keywordMap) {
      if (textToSearch.includes(keyword)) {
        const currentScore = categoryScores.get(categoryId) || 0;
        // Weight longer keywords more heavily
        const weight = keyword.length > 5 ? 2 : 1;
        categoryScores.set(categoryId, currentScore + weight);
      }
    }

    if (categoryScores.size === 0) {
      return null;
    }

    // Find best match
    let bestCategory: CategoryId = 'general';
    let bestScore = 0;
    const alternatives: Array<{ categoryId: CategoryId; confidence: number }> = [];

    for (const [categoryId, score] of categoryScores) {
      if (score > bestScore) {
        if (bestScore > 0) {
          alternatives.push({
            categoryId: bestCategory,
            confidence: this.scoreToConfidence(bestScore),
          });
        }
        bestCategory = categoryId;
        bestScore = score;
      } else if (score > 0) {
        alternatives.push({
          categoryId,
          confidence: this.scoreToConfidence(score),
        });
      }
    }

    const confidence = this.scoreToConfidence(bestScore);
    const guide = CATEGORY_INSPECTION_GUIDES[bestCategory];

    return {
      categoryId: bestCategory,
      confidence,
      reasoning: `Matched keywords for ${guide.categoryName}`,
      alternatives: alternatives.slice(0, 3),
    };
  }

  /**
   * Detect category using AI vision analysis
   */
  private async detectFromVision(context: CategoryDetectionContext): Promise<CategoryDetectionResult | null> {
    if (!this.openai) {
      return null;
    }

    // Build category list for the prompt
    const categoryList = Object.values(CATEGORY_INSPECTION_GUIDES)
      .filter(g => g.categoryId !== 'general')
      .map(g => `- ${g.categoryId}: ${g.categoryName}`)
      .join('\n');

    const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = context.imageUrls
      .slice(0, MAX_IMAGES)
      .map(url => ({
        type: 'image_url' as const,
        image_url: { url, detail: 'low' as const },
      }));

    const systemPrompt = `You are a product categorization expert for a resale platform. Your job is to identify what category of product is shown in the images.

Available categories:
${categoryList}
- general: For products that don't fit other categories

Analyze the images and return JSON:
{
  "categoryId": "category_id_from_list",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this category",
  "alternatives": [
    {"categoryId": "alt_category", "confidence": 0.0-1.0}
  ]
}

Be specific - if it's clearly a luxury handbag, say "luxury_handbags". If it's sneakers, say "sneakers".
Only use "general" if the product truly doesn't fit any specific category.`;

    try {
      // Sanitize title input to prevent prompt injection
      const sanitizedTitle = sanitizeUserInput(context.title, 200);

      const response = await this.openai.chat.completions.create({
        model: this.detectionModel, // Use configurable model
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: sanitizedTitle
                  ? `Product: "${sanitizedTitle}". What category is this product?`
                  : 'What category is this product?',
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      // Use safe JSON parsing
      interface ParsedResponse {
        categoryId?: string;
        confidence?: number;
        reasoning?: string;
        alternatives?: Array<{ categoryId: string; confidence?: number }>;
      }

      const parsed = safeJsonParse<ParsedResponse>(content);
      if (!parsed) {
        this.logger.warn('Failed to parse category detection JSON response');
        return null;
      }

      // Validate categoryId
      if (!parsed.categoryId || !this.isValidCategoryId(parsed.categoryId)) {
        this.logger.warn(`Invalid categoryId from vision: ${parsed.categoryId}`);
        return null;
      }

      return {
        categoryId: parsed.categoryId as CategoryId,
        confidence: Math.min(1, Math.max(0, typeof parsed.confidence === 'number' ? parsed.confidence : CONFIDENCE_DEFAULT)),
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, MAX_TEXT_LENGTH) : 'Detected from image analysis',
        alternatives: (parsed.alternatives || [])
          .filter((a) => a && typeof a.categoryId === 'string' && this.isValidCategoryId(a.categoryId))
          .slice(0, MAX_ALTERNATIVES)
          .map(a => ({
            categoryId: a.categoryId as CategoryId,
            confidence: typeof a.confidence === 'number' ? Math.min(1, Math.max(0, a.confidence)) : CONFIDENCE_DEFAULT,
          })),
      };
    } catch (error) {
      this.logger.error(`Vision category detection error: ${sanitizeErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Convert keyword match score to confidence
   */
  private scoreToConfidence(score: number): number {
    // 1 match = 0.5, 2 matches = 0.65, 3+ matches = 0.75+
    if (score <= 1) return CONFIDENCE_DEFAULT;
    if (score <= 2) return 0.65;
    if (score <= 4) return 0.75;
    if (score <= 6) return 0.85;
    return Math.min(CONFIDENCE_MAX, 0.85 + (score - 6) * 0.02);
  }

  /**
   * Validate that a string is a valid CategoryId
   */
  private isValidCategoryId(id: string): id is CategoryId {
    return id in CATEGORY_INSPECTION_GUIDES;
  }

  /**
   * Get all available category IDs
   */
  getAvailableCategories(): CategoryId[] {
    return Object.keys(CATEGORY_INSPECTION_GUIDES) as CategoryId[];
  }
}
