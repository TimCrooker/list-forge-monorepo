import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  MarketplaceListingPayload,
  ListingPayloadContent,
  ListingValidation,
  ListingReadinessStatus,
  ListingShipping,
  ProductIdentification,
  PriceBand,
  PricingStrategyOption,
  MarketplaceCategory,
  FieldCompletion,
  FieldRequirement,
} from '@listforge/core-types';
import { MarketplaceSchemaService } from './marketplace-schema.service';

/**
 * Input data for listing assembly
 */
export interface ListingAssemblyInput {
  // Item data
  itemId: string;
  title: string | null;
  description: string | null;
  condition: string | null;
  attributes: Array<{ key: string; value: string }>;
  media: Array<{ id: string; url: string; type: string }>;
  defaultPrice: number | null;

  // Research data
  productIdentification: ProductIdentification | null;
  priceBands: PriceBand[];
  pricingStrategies: PricingStrategyOption[];
  marketplaceCategory: MarketplaceCategory | null;
  fieldCompletion: FieldCompletion | null;
  requiredFields: FieldRequirement[];
  recommendedFields: FieldRequirement[];
}

/**
 * Generated content from AI
 */
interface GeneratedListingContent {
  title: string;
  description: string;
  bulletPoints: string[];
}

/**
 * ListingAssemblyService - Slice 6: Full Listing Assembly
 *
 * Generates complete, marketplace-ready listing payloads with:
 * - Optimized titles (eBay 80-char limit, keyword optimization)
 * - Structured descriptions (features, condition disclosure, specs)
 * - All required attributes populated
 * - Status determination (READY_FOR_PUBLISH / READY_FOR_REVIEW / NEEDS_INFO)
 */
@Injectable()
export class ListingAssemblyService {
  private readonly logger = new Logger(ListingAssemblyService.name);
  private openai: OpenAI;

  // eBay title character limit
  private readonly EBAY_TITLE_MAX_LENGTH = 80;

  // Minimum requirements for auto-publish
  private readonly MIN_PHOTOS_FOR_PUBLISH = 1;
  private readonly MIN_CONFIDENCE_FOR_PUBLISH = 0.85;
  private readonly MIN_COMPS_FOR_PUBLISH = 3;

  constructor(private readonly marketplaceSchemaService: MarketplaceSchemaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - listing generation will be limited');
      this.openai = new OpenAI({ apiKey: 'not-configured' });
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Assemble a complete marketplace listing payload
   */
  async assembleListingPayload(
    input: ListingAssemblyInput,
    marketplace: 'ebay' | 'amazon' = 'ebay',
  ): Promise<MarketplaceListingPayload> {
    this.logger.log(`Assembling ${marketplace} listing for item ${input.itemId}`);

    // Generate optimized title and description
    const generatedContent = await this.generateListingContent(input, marketplace);

    // Get price from strategies or bands
    const price = this.determinePrice(input.pricingStrategies, input.priceBands, input.defaultPrice);

    // Map condition to marketplace code
    const conditionId = input.marketplaceCategory?.conditionId ||
      this.marketplaceSchemaService.mapCondition(input.condition || 'used_good');

    // Build attributes from item and product identification
    const attributes = this.buildAttributes(input);

    // Build shipping config
    const shipping = this.buildShippingConfig(input, price);

    // Build the payload content
    const payload: ListingPayloadContent = {
      title: generatedContent.title,
      description: generatedContent.description,
      bulletPoints: generatedContent.bulletPoints,
      categoryId: input.marketplaceCategory?.categoryId || '',
      conditionId,
      price,
      currency: 'USD',
      quantity: 1,
      shipping,
      attributes,
      photos: input.media.map((m) => m.url),
    };

    // Validate the listing
    const validation = this.validateListing(payload, input.requiredFields);

    // Calculate confidence
    const confidence = this.calculateConfidence(input, validation);

    // Determine readiness status
    const { status, statusReason, missingRequired } = this.determineStatus(
      validation,
      confidence,
      input.fieldCompletion,
    );

    const listing: MarketplaceListingPayload = {
      marketplace,
      ready: status === 'READY_FOR_PUBLISH',
      status,
      statusReason,
      missingRequired,
      payload,
      validation,
      confidence,
      generatedAt: new Date().toISOString(),
    };

    this.logger.log(`Assembled listing: status=${status}, confidence=${(confidence * 100).toFixed(0)}%`);

    return listing;
  }

  /**
   * Generate optimized title and description using AI
   */
  private async generateListingContent(
    input: ListingAssemblyInput,
    marketplace: 'ebay' | 'amazon',
  ): Promise<GeneratedListingContent> {
    // If we already have a good title and description, enhance them
    // Otherwise, generate from scratch using product identification

    const productInfo = this.buildProductInfoString(input);
    const maxTitleLength = marketplace === 'ebay' ? this.EBAY_TITLE_MAX_LENGTH : 200;

    const systemPrompt = `You are an expert marketplace listing writer specializing in ${marketplace}.
Create compelling, accurate listings that maximize visibility and sales.

Rules for titles:
- Maximum ${maxTitleLength} characters
- Lead with brand name if known
- Include model/product name
- Add key differentiating features (color, size, capacity)
- Use marketplace-friendly keywords
- No excessive punctuation or all caps
- No promotional language ("FREE", "BEST", etc.)

Rules for descriptions:
- Start with a compelling opening sentence
- List key features and specifications
- Include condition disclosure if used
- Use clear formatting with bullet points
- Professional, trustworthy tone
- Include relevant keywords naturally`;

    const userPrompt = `Generate a listing for this product:

${productInfo}

Current title (if any): ${input.title || 'None'}
Current description (if any): ${input.description || 'None'}
Condition: ${input.condition || 'Unknown'}
Price: $${input.defaultPrice || 'Not set'}

Generate:
1. An optimized title (max ${maxTitleLength} characters)
2. A compelling description (2-3 paragraphs with key details)
3. 3-5 bullet points highlighting key features

Return as JSON:
{
  "title": "string",
  "description": "string",
  "bulletPoints": ["string", "string", ...]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);

      // Ensure title fits within limit
      let title = parsed.title || this.buildFallbackTitle(input);
      if (title.length > maxTitleLength) {
        title = title.substring(0, maxTitleLength - 3) + '...';
      }

      return {
        title,
        description: parsed.description || this.buildFallbackDescription(input),
        bulletPoints: parsed.bulletPoints || [],
      };
    } catch (error) {
      this.logger.warn('AI listing generation failed, using fallback:', error);
      return {
        title: this.buildFallbackTitle(input),
        description: this.buildFallbackDescription(input),
        bulletPoints: this.buildFallbackBulletPoints(input),
      };
    }
  }

  /**
   * Build a product info string for the AI prompt
   */
  private buildProductInfoString(input: ListingAssemblyInput): string {
    const parts: string[] = [];

    if (input.productIdentification) {
      const pid = input.productIdentification;
      if (pid.brand) parts.push(`Brand: ${pid.brand}`);
      if (pid.model) parts.push(`Model: ${pid.model}`);
      if (pid.mpn) parts.push(`MPN: ${pid.mpn}`);
      if (pid.upc) parts.push(`UPC: ${pid.upc}`);
      if (pid.category?.length) parts.push(`Category: ${pid.category.join(' > ')}`);

      // Add attributes
      for (const [key, value] of Object.entries(pid.attributes)) {
        parts.push(`${key}: ${value}`);
      }
    }

    // Add item attributes
    for (const attr of input.attributes) {
      if (!parts.some((p) => p.toLowerCase().startsWith(attr.key.toLowerCase()))) {
        parts.push(`${attr.key}: ${attr.value}`);
      }
    }

    return parts.length > 0 ? parts.join('\n') : 'No product information available';
  }

  /**
   * Build fallback title when AI generation fails
   */
  private buildFallbackTitle(input: ListingAssemblyInput): string {
    const parts: string[] = [];

    if (input.productIdentification?.brand) {
      parts.push(input.productIdentification.brand);
    }

    if (input.productIdentification?.model) {
      parts.push(input.productIdentification.model);
    } else if (input.title) {
      parts.push(input.title);
    }

    // Add condition for used items
    if (input.condition && input.condition !== 'new') {
      parts.push('-');
      parts.push(this.formatCondition(input.condition));
    }

    const title = parts.join(' ').trim();
    if (title.length > this.EBAY_TITLE_MAX_LENGTH) {
      return title.substring(0, this.EBAY_TITLE_MAX_LENGTH - 3) + '...';
    }

    return title || 'Product Listing';
  }

  /**
   * Build fallback description when AI generation fails
   */
  private buildFallbackDescription(input: ListingAssemblyInput): string {
    const parts: string[] = [];

    if (input.description) {
      parts.push(input.description);
      parts.push('');
    }

    parts.push('Product Details:');

    if (input.productIdentification?.brand) {
      parts.push(`- Brand: ${input.productIdentification.brand}`);
    }
    if (input.productIdentification?.model) {
      parts.push(`- Model: ${input.productIdentification.model}`);
    }

    for (const attr of input.attributes.slice(0, 10)) {
      parts.push(`- ${attr.key}: ${attr.value}`);
    }

    if (input.condition) {
      parts.push('');
      parts.push(`Condition: ${this.formatCondition(input.condition)}`);
    }

    return parts.join('\n');
  }

  /**
   * Build fallback bullet points
   */
  private buildFallbackBulletPoints(input: ListingAssemblyInput): string[] {
    const bullets: string[] = [];

    if (input.productIdentification?.brand && input.productIdentification?.model) {
      bullets.push(`${input.productIdentification.brand} ${input.productIdentification.model}`);
    }

    if (input.condition) {
      bullets.push(`Condition: ${this.formatCondition(input.condition)}`);
    }

    for (const attr of input.attributes.slice(0, 3)) {
      bullets.push(`${attr.key}: ${attr.value}`);
    }

    return bullets;
  }

  /**
   * Format condition for display
   */
  private formatCondition(condition: string): string {
    const mapping: Record<string, string> = {
      new: 'New',
      used_like_new: 'Like New',
      used_very_good: 'Very Good',
      used_good: 'Good',
      used_acceptable: 'Acceptable',
      for_parts: 'For Parts/Not Working',
    };
    return mapping[condition] || condition;
  }

  /**
   * Determine the price to use
   */
  private determinePrice(
    strategies: PricingStrategyOption[],
    priceBands: PriceBand[],
    defaultPrice: number | null,
  ): number {
    // Prefer balanced strategy if available
    const balancedStrategy = strategies.find((s) => s.strategy === 'balanced');
    if (balancedStrategy) {
      return balancedStrategy.price;
    }

    // Fall back to target price band
    const targetBand = priceBands.find((b) => b.label === 'target');
    if (targetBand) {
      return targetBand.amount;
    }

    // Use default price
    return defaultPrice || 0;
  }

  /**
   * Build attributes record from input data
   */
  private buildAttributes(input: ListingAssemblyInput): Record<string, string | number> {
    const attrs: Record<string, string | number> = {};

    // Add from product identification
    if (input.productIdentification) {
      const pid = input.productIdentification;
      if (pid.brand) attrs['Brand'] = pid.brand;
      if (pid.model) attrs['Model'] = pid.model;
      if (pid.mpn) attrs['MPN'] = pid.mpn;
      if (pid.upc) attrs['UPC'] = pid.upc;

      for (const [key, value] of Object.entries(pid.attributes)) {
        if (typeof value === 'string' || typeof value === 'number') {
          attrs[key] = value;
        } else if (typeof value === 'boolean') {
          attrs[key] = value ? 'Yes' : 'No';
        }
      }
    }

    // Add from item attributes
    for (const attr of input.attributes) {
      if (!(attr.key in attrs)) {
        attrs[attr.key] = attr.value;
      }
    }

    return attrs;
  }

  /**
   * Build shipping configuration
   */
  private buildShippingConfig(input: ListingAssemblyInput, price: number): ListingShipping {
    // Default shipping logic - can be enhanced based on category, weight, etc.
    const isHighValue = price >= 100;
    const isLowValue = price < 20;

    if (isHighValue) {
      // Free shipping for high-value items (absorbed into price)
      return {
        type: 'free',
        freeShipping: true,
        handlingTime: 1,
      };
    }

    if (isLowValue) {
      // Flat rate for low-value items
      return {
        type: 'flat',
        cost: 5.99,
        freeShipping: false,
        handlingTime: 2,
      };
    }

    // Default: calculated shipping
    return {
      type: 'calculated',
      freeShipping: false,
      handlingTime: 1,
    };
  }

  /**
   * Validate a listing payload
   */
  validateListing(
    payload: ListingPayloadContent,
    requiredFields: FieldRequirement[],
  ): ListingValidation {
    const titleIssues: string[] = [];
    const descriptionIssues: string[] = [];
    const missingAttributes: string[] = [];

    // Validate title
    let titleValid = true;
    if (!payload.title || payload.title.length === 0) {
      titleValid = false;
      titleIssues.push('Title is required');
    } else if (payload.title.length > this.EBAY_TITLE_MAX_LENGTH) {
      titleValid = false;
      titleIssues.push(`Title exceeds ${this.EBAY_TITLE_MAX_LENGTH} characters`);
    } else if (payload.title.length < 10) {
      titleIssues.push('Title is very short - consider adding more details');
    }

    // Validate description
    let descriptionValid = true;
    if (!payload.description || payload.description.length === 0) {
      descriptionValid = false;
      descriptionIssues.push('Description is required');
    } else if (payload.description.length < 50) {
      descriptionIssues.push('Description is very short - consider adding more details');
    }

    // Validate category
    const categoryValid = Boolean(payload.categoryId && payload.categoryId.length > 0);

    // Validate condition
    const conditionMapped = Boolean(payload.conditionId && payload.conditionId.length > 0);

    // Validate price
    const priceSet = payload.price > 0;

    // Validate photos
    const photosValid = payload.photos.length >= this.MIN_PHOTOS_FOR_PUBLISH;
    const photoCount = payload.photos.length;

    // Check required attributes
    const payloadAttrKeys = new Set(
      Object.keys(payload.attributes).map((k) => k.toLowerCase()),
    );
    for (const field of requiredFields) {
      if (!payloadAttrKeys.has(field.name.toLowerCase())) {
        missingAttributes.push(field.name);
      }
    }
    const attributesComplete = missingAttributes.length === 0;

    // Overall validation
    const overallValid =
      titleValid &&
      descriptionValid &&
      categoryValid &&
      conditionMapped &&
      priceSet &&
      photosValid &&
      attributesComplete;

    return {
      titleValid,
      titleIssues,
      descriptionValid,
      descriptionIssues,
      categoryValid,
      attributesComplete,
      missingAttributes,
      conditionMapped,
      priceSet,
      photosValid,
      photoCount,
      overallValid,
    };
  }

  /**
   * Calculate overall confidence for the listing
   */
  private calculateConfidence(
    input: ListingAssemblyInput,
    validation: ListingValidation,
  ): number {
    let confidence = 0.5; // Base confidence

    // Product identification confidence
    if (input.productIdentification) {
      confidence += input.productIdentification.confidence * 0.2;
    }

    // Category confidence
    if (input.marketplaceCategory) {
      confidence += input.marketplaceCategory.confidence * 0.1;
    }

    // Field completion
    if (input.fieldCompletion) {
      confidence += input.fieldCompletion.readinessScore * 0.1;
    }

    // Validation bonuses
    if (validation.overallValid) {
      confidence += 0.1;
    }

    // Photo bonus
    if (validation.photoCount >= 3) {
      confidence += 0.05;
    }
    if (validation.photoCount >= 6) {
      confidence += 0.05;
    }

    return Math.min(1, confidence);
  }

  /**
   * Determine the listing readiness status
   */
  private determineStatus(
    validation: ListingValidation,
    confidence: number,
    fieldCompletion: FieldCompletion | null,
  ): {
    status: ListingReadinessStatus;
    statusReason: string;
    missingRequired: string[];
  } {
    const missingRequired: string[] = [];
    const issues: string[] = [];

    // Check critical requirements
    if (!validation.titleValid) {
      issues.push('Invalid title');
      missingRequired.push('title');
    }
    if (!validation.descriptionValid) {
      issues.push('Invalid description');
      missingRequired.push('description');
    }
    if (!validation.categoryValid) {
      issues.push('Category not set');
      missingRequired.push('category');
    }
    if (!validation.priceSet) {
      issues.push('Price not set');
      missingRequired.push('price');
    }
    if (!validation.photosValid) {
      issues.push(`Need at least ${this.MIN_PHOTOS_FOR_PUBLISH} photo`);
      missingRequired.push('photos');
    }

    // Add missing required attributes
    for (const attr of validation.missingAttributes) {
      missingRequired.push(attr);
    }

    // NEEDS_INFO: Critical requirements missing
    if (missingRequired.length > 0) {
      return {
        status: 'NEEDS_INFO',
        statusReason: `Missing required: ${missingRequired.slice(0, 3).join(', ')}${missingRequired.length > 3 ? ` (+${missingRequired.length - 3} more)` : ''}`,
        missingRequired,
      };
    }

    // READY_FOR_PUBLISH: High confidence and all requirements met
    if (confidence >= this.MIN_CONFIDENCE_FOR_PUBLISH && validation.overallValid) {
      return {
        status: 'READY_FOR_PUBLISH',
        statusReason: 'All requirements met with high confidence',
        missingRequired: [],
      };
    }

    // READY_FOR_REVIEW: Requirements met but needs human review
    const reviewReasons: string[] = [];
    if (confidence < this.MIN_CONFIDENCE_FOR_PUBLISH) {
      reviewReasons.push(`Low confidence (${(confidence * 100).toFixed(0)}%)`);
    }
    if (validation.titleIssues.length > 0) {
      reviewReasons.push('Title needs review');
    }
    if (validation.descriptionIssues.length > 0) {
      reviewReasons.push('Description needs review');
    }
    if (fieldCompletion && fieldCompletion.recommended.missing.length > 2) {
      reviewReasons.push('Missing recommended fields');
    }

    return {
      status: 'READY_FOR_REVIEW',
      statusReason: reviewReasons.length > 0 ? reviewReasons.join('; ') : 'Human review recommended',
      missingRequired: [],
    };
  }
}


