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

  async analyzePhotos(imageUrls: string[]): Promise<VisionExtractResult> {
    const imageContents = imageUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url },
    }));

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-vision-preview',
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
      model: 'gpt-4',
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

