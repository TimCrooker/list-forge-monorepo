import {
  Injectable,
  Logger,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';
import {
  VisionExtractResult,
  GeneratedListingContent,
  ExtractedAttributes,
} from '@listforge/core-types';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - AI features will be unavailable');
      // Initialize with empty key - will fail gracefully when used
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
    // Convert local URLs to base64 so OpenAI can access them
    const preparedUrls = await this.prepareImageUrls(imageUrls);

    const imageContents = preparedUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url },
    }));

    const response = await this.client.chat.completions.create({
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
    });

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

  async generateListingContent(
    extracted: VisionExtractResult,
    priceSuggested: number,
  ): Promise<GeneratedListingContent> {
    const response = await this.client.chat.completions.create({
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
    });

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

