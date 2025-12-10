import {
  Injectable,
  Logger,
  BadGatewayException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  VisionExtractResult,
  GeneratedListingContent,
  ExtractedAttributes,
} from '@listforge/core-types';
import { getRateLimiter, RATE_LIMITER_CONFIGS } from '../utils/rate-limiter';

/**
 * Error thrown when OpenAI service is not properly configured
 */
export class OpenAINotConfiguredError extends Error {
  constructor() {
    super('OpenAI API key is not configured. Set OPENAI_API_KEY environment variable.');
    this.name = 'OpenAINotConfiguredError';
  }
}

/**
 * Error thrown when OpenAI API call fails after retries
 */
export class OpenAIApiError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'OpenAIApiError';
  }
}

@Injectable()
export class OpenAIService implements OnModuleInit {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.isConfigured = !!apiKey;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log('OpenAI service initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - AI features will be unavailable');
    }
  }

  /**
   * Validate configuration on module init
   * In production, fail fast if OpenAI is not configured
   */
  onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (nodeEnv === 'production' && !this.isConfigured) {
      throw new OpenAINotConfiguredError();
    }
  }

  /**
   * Check if the service is properly configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Ensure the client is available before making API calls
   */
  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new OpenAINotConfiguredError();
    }
    return this.client;
  }

  /**
   * Classify OpenAI errors for retry logic
   */
  private classifyError(error: unknown): { isRetryable: boolean; message: string } {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Rate limiting - retryable with backoff
      if (message.includes('rate limit') || message.includes('429')) {
        return { isRetryable: true, message: 'Rate limited by OpenAI. Please try again.' };
      }

      // Network errors - retryable
      if (message.includes('econnrefused') || message.includes('etimedout') || message.includes('network')) {
        return { isRetryable: true, message: 'Network error connecting to OpenAI. Please try again.' };
      }

      // Server errors (5xx) - retryable
      if (message.includes('500') || message.includes('502') || message.includes('503')) {
        return { isRetryable: true, message: 'OpenAI service temporarily unavailable. Please try again.' };
      }

      // Invalid API key - not retryable
      if (message.includes('invalid api key') || message.includes('401')) {
        return { isRetryable: false, message: 'Invalid OpenAI API key configured.' };
      }

      return { isRetryable: false, message: error.message };
    }

    return { isRetryable: false, message: String(error) };
  }

  /**
   * Execute an OpenAI API call with rate limiting and retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    useMinModel: boolean = false,
  ): Promise<T> {
    // Apply rate limiting before making the request
    const rateLimiterKey = useMinModel ? 'openaiMini' : 'openai';
    const rateLimiter = getRateLimiter(rateLimiterKey, RATE_LIMITER_CONFIGS[rateLimiterKey]);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for rate limit token
        await rateLimiter.acquire();

        return await operation();
      } catch (error) {
        const classified = this.classifyError(error);
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!classified.isRetryable || attempt >= maxRetries) {
          this.logger.error(`[${context}] Failed after ${attempt + 1} attempts: ${classified.message}`, lastError.stack);
          throw new OpenAIApiError(classified.message, lastError, classified.isRetryable);
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(`[${context}] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${classified.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new OpenAIApiError('Max retries exceeded', lastError, false);
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
      throw new BadGatewayException(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      })
    );
  }

  async analyzePhotos(imageUrls: string[]): Promise<VisionExtractResult> {
    const client = this.ensureClient();

    // Convert local URLs to base64 so OpenAI can access them
    const preparedUrls = await this.prepareImageUrls(imageUrls);

    const imageContents = preparedUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url },
    }));

    const response = await this.executeWithRetry(
      () => client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at analyzing product photos for resale listings. Extract key information including category, brand, model, condition, and attributes. Return structured JSON data.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze these product photos and extract: category (e.g., "Electronics", "Clothing", "Home & Garden"), brand (if visible), model (if visible), condition (e.g., "New", "Like New", "Good", "Fair", "Poor"), key attributes (color, size, material, etc.), and a brief description. Return as JSON.',
              },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 1000,
      }),
      'analyzePhotos',
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new BadGatewayException('No response from AI service. Please try again.');
    }

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('AI response did not contain valid JSON', { content });
        throw new BadGatewayException('AI response format was unexpected. Please try again.');
      }
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        category: parsed.category || 'Other',
        brand: parsed.brand || null,
        model: parsed.model || null,
        condition: parsed.condition || 'Good',
        attributes: parsed.attributes || {},
        description: parsed.description || '',
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      this.logger.warn('analyzePhotos JSON parsing failed, using fallback', { error, content });
      return {
        category: 'Other',
        brand: null,
        model: null,
        condition: 'Good',
        attributes: {},
        description: content.substring(0, 500),
      };
    }
  }

  /**
   * Fast intake analysis using gpt-4o-mini for speed
   * Returns placeholder data in < 5 seconds
   */
  async fastIntakeAnalysis(
    imageUrls: string[],
    userHint?: string,
  ): Promise<VisionExtractResult> {
    const client = this.ensureClient();

    // Convert local URLs to base64 so OpenAI can access them
    const preparedUrls = await this.prepareImageUrls(imageUrls);

    const imageContents = preparedUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url },
    }));

    const response = await this.executeWithRetry(
      () => client.chat.completions.create({
        model: 'gpt-4o-mini', // Use mini for speed
        messages: [
          {
            role: 'system',
            content:
              'You are a product intake specialist. Look at these images and provide a quick placeholder analysis. Return JSON only with: category, brand (if visible), model (if visible), condition (one of: "new", "used_like_new", "used_very_good", "used_good", "used_acceptable"), and a provisional title. Be fast and approximate - this is just a placeholder.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userHint
                  ? `User hint: ${userHint}\n\nAnalyze these product photos and provide a provisional title, category, brand/model if visible, and condition guess. Return as JSON.`
                  : 'Analyze these product photos and provide a provisional title, category, brand/model if visible, and condition guess. Return as JSON.',
              },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 300, // Reduced for speed
        temperature: 0.3, // Lower temperature for more consistent results
      }),
      'fastIntakeAnalysis',
      2, // Fewer retries for fast intake to maintain speed
      true, // Use mini model rate limiter (higher limits)
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new BadGatewayException('No response from AI service. Please try again.');
    }

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('AI fast intake response did not contain valid JSON', { content });
        throw new BadGatewayException('AI response format was unexpected. Please try again.');
      }
      const parsed = JSON.parse(jsonMatch[0]);

      // Map condition to our format
      const conditionMap: Record<string, string> = {
        new: 'new',
        'like new': 'used_like_new',
        'like_new': 'used_like_new',
        'very good': 'used_very_good',
        'very_good': 'used_very_good',
        good: 'used_good',
        fair: 'used_acceptable',
        acceptable: 'used_acceptable',
        poor: 'used_acceptable',
      };

      const condition = parsed.condition
        ? conditionMap[parsed.condition.toLowerCase()] || 'used_good'
        : 'used_good';

      return {
        category: parsed.category || 'Other',
        brand: parsed.brand || null,
        model: parsed.model || null,
        condition: condition as any,
        attributes: parsed.attributes || {},
        description: parsed.provisionalTitle || parsed.title || parsed.description || '',
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      this.logger.warn('Fast intake JSON parsing failed, using fallback', { error, content });
      return {
        category: 'Other',
        brand: null,
        model: null,
        condition: 'used_good',
        attributes: {},
        description: userHint || 'Product Item',
      };
    }
  }

  async generateListingContent(
    extracted: VisionExtractResult,
    priceSuggested: number,
  ): Promise<GeneratedListingContent> {
    const client = this.ensureClient();

    const response = await this.executeWithRetry(
      () => client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at writing compelling product listings for resale marketplaces. Generate titles, descriptions, and bullet points that are clear, accurate, and optimized for search.',
          },
          {
            role: 'user',
            content: `Generate a listing for:
- Category: ${extracted.category}
- Brand: ${extracted.brand || 'Unknown'}
- Model: ${extracted.model || 'N/A'}
- Condition: ${extracted.condition}
- Attributes: ${JSON.stringify(extracted.attributes)}
- Suggested Price: $${priceSuggested}

Generate:
1. A compelling title (max 80 characters)
2. A detailed description (2-3 paragraphs)
3. 3-5 bullet points highlighting key features

Return as JSON with keys: title, description, bulletPoints (array).`,
          },
        ],
        max_tokens: 800,
      }),
      'generateListingContent',
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new BadGatewayException('No response from AI service. Please try again.');
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('AI listing response did not contain valid JSON', { content });
        throw new BadGatewayException('AI response format was unexpected. Please try again.');
      }
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        title: parsed.title || `${extracted.brand || ''} ${extracted.model || extracted.category}`.trim(),
        description: parsed.description || extracted.description,
        bulletPoints: parsed.bulletPoints || [],
      };
    } catch (error) {
      // Fallback
      this.logger.warn('generateListingContent JSON parsing failed, using fallback', { error, content });
      const title = `${extracted.brand || ''} ${extracted.model || extracted.category}`.trim() || extracted.category;
      return {
        title,
        description: extracted.description,
        bulletPoints: [
          `Category: ${extracted.category}`,
          `Condition: ${extracted.condition}`,
          ...Object.entries(extracted.attributes).map(
            ([key, value]) => `${key}: ${value}`,
          ),
        ],
      };
    }
  }
}

