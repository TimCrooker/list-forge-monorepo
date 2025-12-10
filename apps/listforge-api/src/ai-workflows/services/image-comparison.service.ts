import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { createHash } from 'crypto';
import { LRUCache } from 'lru-cache';

/**
 * Result of an image comparison
 */
export interface ImageComparisonResult {
  /** Similarity score 0-1 */
  similarityScore: number;
  /** Whether the images appear to show the same product */
  isSameProduct: boolean;
  /** Brief reasoning for the comparison */
  reasoning: string;
  /** Whether this result came from cache */
  cached: boolean;
}

/**
 * Image Comparison Service (Slice 4)
 *
 * Uses OpenAI Vision to compare product images and determine similarity.
 * This is used to validate keyword-matched comps by verifying they show
 * the same product as the item being researched.
 *
 * Features:
 * - LRU cache to avoid duplicate comparisons (same image pairs)
 * - Structured prompt for consistent scoring
 * - Fast, cost-effective comparison using gpt-4o-mini
 */
@Injectable()
export class ImageComparisonService {
  private readonly logger = new Logger(ImageComparisonService.name);
  private readonly openai: OpenAI;

  /**
   * Cache for image comparison results
   * Key: hash of sorted image URLs
   * TTL: 24 hours (comparisons don't change)
   */
  private readonly cache: LRUCache<string, ImageComparisonResult>;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    this.cache = new LRUCache<string, ImageComparisonResult>({
      max: 1000, // Max 1000 cached comparisons
      ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
    });
  }

  /**
   * Compare item images with comp images to determine similarity
   *
   * @param itemImages - URLs of the item's images (our product)
   * @param compImages - URLs of the comp's images (potential match)
   * @returns Similarity result with score 0-1
   */
  async compareImages(
    itemImages: string[],
    compImages: string[],
  ): Promise<ImageComparisonResult> {
    // Filter to valid URLs
    const validItemImages = itemImages.filter((url) => url && url.startsWith('http'));
    const validCompImages = compImages.filter((url) => url && url.startsWith('http'));

    if (validItemImages.length === 0 || validCompImages.length === 0) {
      this.logger.debug('Missing images for comparison');
      return {
        similarityScore: 0,
        isSameProduct: false,
        reasoning: 'Missing images for comparison',
        cached: false,
      };
    }

    // Generate cache key from image URLs (use primary images only for efficiency)
    const cacheKey = this.generateCacheKey(validItemImages[0], validCompImages[0]);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Image comparison cache hit: ${cacheKey.substring(0, 8)}`);
      return { ...cached, cached: true };
    }

    try {
      const result = await this.performComparison(validItemImages[0], validCompImages[0]);

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      this.logger.error(`Image comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Return neutral score on error (don't penalize or boost)
      return {
        similarityScore: 0.5,
        isSameProduct: false,
        reasoning: `Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cached: false,
      };
    }
  }

  /**
   * Perform the actual image comparison using OpenAI Vision
   */
  private async performComparison(
    itemImageUrl: string,
    compImageUrl: string,
  ): Promise<ImageComparisonResult> {
    const prompt = `You are a product matching expert. Compare these two product images and determine if they show the SAME product (not just similar products).

Consider:
1. Is it the exact same product model?
2. Are the brand, color, size variants the same?
3. Minor differences in angle/lighting are OK - focus on whether it's the same product SKU.

IMPORTANT: Be strict. Two similar products from the same brand are NOT the same product.

Respond in JSON format:
{
  "similarityScore": <number 0.0-1.0>,
  "isSameProduct": <boolean>,
  "reasoning": "<brief explanation>"
}

Scoring guide:
- 0.95-1.0: Definitely same product (exact match)
- 0.80-0.94: Very likely same product (same model, minor variant differences)
- 0.50-0.79: Possibly same product (needs verification)
- 0.20-0.49: Probably different products (same category but different model)
- 0.0-0.19: Definitely different products`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for image comparison
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: itemImageUrl, detail: 'low' }, // Low detail for speed/cost
            },
            {
              type: 'image_url',
              image_url: { url: compImageUrl, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as {
      similarityScore: number;
      isSameProduct: boolean;
      reasoning: string;
    };

    // Validate and clamp score
    const score = Math.max(0, Math.min(1, parsed.similarityScore || 0));

    return {
      similarityScore: score,
      isSameProduct: parsed.isSameProduct ?? score >= 0.80,
      reasoning: parsed.reasoning || 'No reasoning provided',
      cached: false,
    };
  }

  /**
   * Generate a deterministic cache key for an image pair
   * Sorts URLs to ensure same key regardless of order
   */
  private generateCacheKey(imageUrl1: string, imageUrl2: string): string {
    const sorted = [imageUrl1, imageUrl2].sort();
    const combined = sorted.join('|');
    return createHash('md5').update(combined).digest('hex');
  }

  /**
   * Batch compare multiple comps against item images
   * Returns map of compId -> comparison result
   */
  async batchCompare(
    itemImages: string[],
    comps: Array<{ id: string; imageUrl?: string }>,
  ): Promise<Map<string, ImageComparisonResult>> {
    const results = new Map<string, ImageComparisonResult>();

    // Filter comps that have images to compare
    const compsWithImages = comps.filter((c) => c.imageUrl);

    if (compsWithImages.length === 0 || itemImages.length === 0) {
      return results;
    }

    // Compare each comp's image against the item's primary image
    // Use Promise.allSettled for parallel execution with error tolerance
    const comparisons = await Promise.allSettled(
      compsWithImages.map(async (comp) => {
        const result = await this.compareImages(itemImages, [comp.imageUrl!]);
        return { id: comp.id, result };
      }),
    );

    for (const outcome of comparisons) {
      if (outcome.status === 'fulfilled') {
        results.set(outcome.value.id, outcome.value.result);
      }
    }

    return results;
  }
}
