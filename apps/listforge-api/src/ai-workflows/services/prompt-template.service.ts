import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Prompt variant for A/B testing
 */
export interface PromptVariant {
  id: string;
  name: string;
  content: string;
  /** Weight for random selection (0-100) */
  weight: number;
  /** Whether this variant is active */
  active: boolean;
  /** Metadata for tracking */
  metadata?: Record<string, string>;
}

/**
 * Prompt template definition
 */
export interface PromptTemplate {
  key: string;
  name: string;
  description?: string;
  /** Default content if no variants are active */
  defaultContent: string;
  /** Variables that can be interpolated */
  variables: string[];
  /** A/B test variants */
  variants: PromptVariant[];
  /** Category for organization */
  category: 'research' | 'pricing' | 'listing' | 'validation' | 'other';
}

/**
 * Prompt rendering result
 */
export interface RenderedPrompt {
  content: string;
  templateKey: string;
  variantId?: string;
  variables: Record<string, string>;
}

/**
 * A/B test assignment tracking
 */
interface ABTestAssignment {
  templateKey: string;
  variantId: string;
  assignedAt: Date;
}

/**
 * Prompt Template Service
 *
 * Centralizes AI prompts for the research agent with support for:
 * - Externalized prompt management
 * - Variable interpolation
 * - A/B testing variants
 * - Usage tracking
 */
@Injectable()
export class PromptTemplateService implements OnModuleInit {
  private readonly logger = new Logger(PromptTemplateService.name);
  private templates = new Map<string, PromptTemplate>();
  private abAssignments = new Map<string, ABTestAssignment>(); // userId+templateKey -> variant

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.loadDefaultPrompts();
    this.logger.log(`Loaded ${this.templates.size} prompt templates`);
  }

  /**
   * Load default prompts from code
   * In production, these could be loaded from database or config
   */
  private loadDefaultPrompts() {
    // Photo Analysis Prompt
    this.registerTemplate({
      key: 'analyze_photos',
      name: 'Photo Analysis',
      description: 'Analyze product photos to extract attributes',
      category: 'research',
      defaultContent: `You are an expert at analyzing product photos for resale listings. Extract key information including category, brand, model, condition, and attributes. Return structured JSON data.

Analyze these product photos and extract:
- category (e.g., "Electronics", "Clothing", "Home & Garden")
- brand (if visible)
- model (if visible)
- condition (e.g., "New", "Like New", "Good", "Fair", "Poor")
- key attributes (color, size, material, etc.)
- a brief description

Return as JSON.`,
      variables: [],
      variants: [
        {
          id: 'default',
          name: 'Default',
          content: `You are an expert at analyzing product photos for resale listings. Extract key information including category, brand, model, condition, and attributes. Return structured JSON data.`,
          weight: 80,
          active: true,
        },
        {
          id: 'detailed',
          name: 'Detailed Analysis',
          content: `You are a professional product analyst specializing in marketplace listings. Your goal is to extract maximum information from product images to create accurate, sellable listings.

Carefully examine each image and extract:
1. Product Category - Use marketplace-standard categories
2. Brand - Look for logos, text, distinctive styling
3. Model - Check for model numbers on the product
4. Condition - Assess wear, damage, completeness
5. Physical Attributes - Color, size, material, dimensions
6. Notable Features - Anything that adds value

Be thorough but accurate - only include what you can confidently determine.
Return as structured JSON.`,
          weight: 20,
          active: true,
        },
      ],
    });

    // Fast Intake Prompt
    this.registerTemplate({
      key: 'fast_intake',
      name: 'Fast Intake Analysis',
      description: 'Quick placeholder analysis for initial item intake',
      category: 'research',
      defaultContent: `You are a product intake specialist. Look at these images and provide a quick placeholder analysis. Return JSON only with: category, brand (if visible), model (if visible), condition (one of: "new", "used_like_new", "used_very_good", "used_good", "used_acceptable"), and a provisional title. Be fast and approximate - this is just a placeholder.`,
      variables: ['userHint'],
      variants: [],
    });

    // Comp Relevance Scoring Prompt
    this.registerTemplate({
      key: 'comp_relevance',
      name: 'Comparable Relevance Scoring',
      description: 'Score relevance of comparable listings',
      category: 'validation',
      defaultContent: `You are a market research analyst. Score the relevance of each comparable listing to the target item.

Target Item:
{{targetItem}}

For each comparable listing below, analyze how well it matches the target item.
Consider:
- Brand match (exact vs similar vs different)
- Model match (same model vs same product line vs different)
- Condition similarity
- Size/variant differences
- Age/recency of sale

Return a JSON array with this structure for EACH comparable:
{
  "index": number,
  "relevanceScore": number (0-100),
  "matchFactors": {
    "brand": "exact" | "similar" | "different",
    "model": "exact" | "similar" | "different",
    "condition": "better" | "same" | "worse",
    "variant": "exact" | "similar" | "different"
  },
  "reasoning": "Brief explanation of score"
}

Comparable Listings:
{{comparables}}`,
      variables: ['targetItem', 'comparables'],
      variants: [],
    });

    // Product Synthesis Prompt
    this.registerTemplate({
      key: 'product_synthesis',
      name: 'Product Data Synthesis',
      description: 'Synthesize product information from web search results',
      category: 'research',
      defaultContent: `You are a product identification expert. Analyze the web search results and extract accurate product information.

Be precise and only include information you are confident about based on the search results.
Calculate a confidence score (0-1) based on:
- Brand identified and verified: +0.20
- Model number found and verified: +0.25
- UPC/MPN confirmed: +0.20
- Category determined: +0.15
- Specifications extracted: +0.20

Return JSON with this exact structure:
{
  "confidence": number (0-1),
  "brand": string | null,
  "model": string | null,
  "mpn": string | null,
  "upc": string | null,
  "title": string | null (suggested product title),
  "description": string | null (detailed product description),
  "category": string[] (category hierarchy),
  "condition": string | null (if determinable),
  "specifications": { [key: string]: string | number | boolean }
}`,
      variables: ['searchResults', 'existingData'],
      variants: [],
    });

    // Listing Content Generation Prompt
    this.registerTemplate({
      key: 'generate_listing',
      name: 'Generate Listing Content',
      description: 'Generate title, description, and bullet points for a listing',
      category: 'listing',
      defaultContent: `You are an expert at writing compelling product listings for resale marketplaces. Generate titles, descriptions, and bullet points that are clear, accurate, and optimized for search.

Product Information:
- Category: {{category}}
- Brand: {{brand}}
- Model: {{model}}
- Condition: {{condition}}
- Attributes: {{attributes}}
- Suggested Price: {{price}}

Generate:
1. A compelling title (max 80 characters)
2. A detailed description (2-3 paragraphs)
3. 3-5 bullet points highlighting key features

Return as JSON with keys: title, description, bulletPoints (array).`,
      variables: ['category', 'brand', 'model', 'condition', 'attributes', 'price'],
      variants: [
        {
          id: 'default',
          name: 'Default',
          content: `You are an expert at writing compelling product listings for resale marketplaces. Generate titles, descriptions, and bullet points that are clear, accurate, and optimized for search.`,
          weight: 70,
          active: true,
        },
        {
          id: 'seo_focused',
          name: 'SEO Focused',
          content: `You are an SEO-optimized listing copywriter. Create listings that rank well in marketplace search while compelling buyers to purchase.

Key principles:
- Front-load important keywords in titles
- Use natural keyword density in descriptions
- Include common search terms buyers use
- Emphasize unique selling points
- Create scannable bullet points`,
          weight: 30,
          active: true,
        },
      ],
    });

    // Pricing Analysis Prompt
    this.registerTemplate({
      key: 'pricing_analysis',
      name: 'Pricing Analysis',
      description: 'Analyze market data to suggest optimal pricing',
      category: 'pricing',
      defaultContent: `You are a pricing analyst specializing in marketplace economics. Analyze the comparable sales data and recommend optimal pricing strategies.

Consider:
- Recent sales trends
- Condition adjustments
- Market saturation
- Time-to-sell tradeoffs
- Seasonal factors

Product: {{productInfo}}
Comparable Sales: {{comps}}

Provide pricing recommendations with rationale.`,
      variables: ['productInfo', 'comps'],
      variants: [],
    });
  }

  /**
   * Register a prompt template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.key, template);
    this.logger.debug(`Registered prompt template: ${template.key}`);
  }

  /**
   * Get a prompt template by key
   */
  getTemplate(key: string): PromptTemplate | undefined {
    return this.templates.get(key);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Select a variant based on weights (for A/B testing)
   */
  private selectVariant(template: PromptTemplate, userId?: string): PromptVariant | null {
    const activeVariants = template.variants.filter(v => v.active);
    if (activeVariants.length === 0) {
      return null;
    }

    // Check for existing assignment (sticky assignment for A/B tests)
    if (userId) {
      const assignmentKey = `${userId}:${template.key}`;
      const existing = this.abAssignments.get(assignmentKey);
      if (existing) {
        const variant = activeVariants.find(v => v.id === existing.variantId);
        if (variant) {
          return variant;
        }
      }
    }

    // Weighted random selection
    const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of activeVariants) {
      random -= variant.weight;
      if (random <= 0) {
        // Store assignment for sticky behavior
        if (userId) {
          const assignmentKey = `${userId}:${template.key}`;
          this.abAssignments.set(assignmentKey, {
            templateKey: template.key,
            variantId: variant.id,
            assignedAt: new Date(),
          });
        }
        return variant;
      }
    }

    return activeVariants[0]; // Fallback
  }

  /**
   * Render a prompt with variable interpolation
   */
  render(
    key: string,
    variables: Record<string, string | number | object> = {},
    options: { userId?: string; useVariant?: boolean } = {},
  ): RenderedPrompt {
    const template = this.templates.get(key);
    if (!template) {
      this.logger.warn(`Prompt template not found: ${key}`);
      return {
        content: '',
        templateKey: key,
        variables: {},
      };
    }

    // Select content source
    let content = template.defaultContent;
    let variantId: string | undefined;

    if (options.useVariant !== false && template.variants.length > 0) {
      const variant = this.selectVariant(template, options.userId);
      if (variant) {
        content = variant.content;
        variantId = variant.id;
      }
    }

    // Interpolate variables
    const stringVariables: Record<string, string> = {};
    for (const [varKey, value] of Object.entries(variables)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      stringVariables[varKey] = stringValue;

      // Replace {{variable}} patterns
      const pattern = new RegExp(`\\{\\{${varKey}\\}\\}`, 'g');
      content = content.replace(pattern, stringValue);
    }

    return {
      content,
      templateKey: key,
      variantId,
      variables: stringVariables,
    };
  }

  /**
   * Get system prompt for a specific operation
   */
  getSystemPrompt(
    key: string,
    options: { userId?: string; useVariant?: boolean } = {},
  ): string {
    const rendered = this.render(key, {}, options);
    return rendered.content;
  }

  /**
   * Get user prompt with variables
   */
  getUserPrompt(
    key: string,
    variables: Record<string, string | number | object>,
    options: { userId?: string; useVariant?: boolean } = {},
  ): string {
    const rendered = this.render(key, variables, options);
    return rendered.content;
  }

  /**
   * Update a template (for runtime updates)
   */
  updateTemplate(key: string, updates: Partial<PromptTemplate>): boolean {
    const template = this.templates.get(key);
    if (!template) {
      return false;
    }

    const updated = { ...template, ...updates };
    this.templates.set(key, updated);
    this.logger.log(`Updated prompt template: ${key}`);
    return true;
  }

  /**
   * Add or update a variant
   */
  upsertVariant(templateKey: string, variant: PromptVariant): boolean {
    const template = this.templates.get(templateKey);
    if (!template) {
      return false;
    }

    const existingIndex = template.variants.findIndex(v => v.id === variant.id);
    if (existingIndex >= 0) {
      template.variants[existingIndex] = variant;
    } else {
      template.variants.push(variant);
    }

    this.logger.log(`Upserted variant ${variant.id} for template ${templateKey}`);
    return true;
  }

  /**
   * Set variant active state
   */
  setVariantActive(templateKey: string, variantId: string, active: boolean): boolean {
    const template = this.templates.get(templateKey);
    if (!template) {
      return false;
    }

    const variant = template.variants.find(v => v.id === variantId);
    if (!variant) {
      return false;
    }

    variant.active = active;
    this.logger.log(`Set variant ${variantId} active=${active} for template ${templateKey}`);
    return true;
  }

  /**
   * Get A/B test statistics (for monitoring)
   */
  getABTestStats(): Record<string, { variantId: string; count: number }[]> {
    const stats: Record<string, Map<string, number>> = {};

    for (const assignment of this.abAssignments.values()) {
      if (!stats[assignment.templateKey]) {
        stats[assignment.templateKey] = new Map();
      }
      const current = stats[assignment.templateKey].get(assignment.variantId) || 0;
      stats[assignment.templateKey].set(assignment.variantId, current + 1);
    }

    // Convert to array format
    const result: Record<string, { variantId: string; count: number }[]> = {};
    for (const [key, variantCounts] of Object.entries(stats)) {
      result[key] = Array.from(variantCounts.entries()).map(([variantId, count]) => ({
        variantId,
        count,
      }));
    }

    return result;
  }

  /**
   * Clear A/B test assignments (for testing)
   */
  clearABAssignments(): void {
    this.abAssignments.clear();
  }
}
