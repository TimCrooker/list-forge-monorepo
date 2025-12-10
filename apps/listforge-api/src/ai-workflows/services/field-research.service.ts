import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ResearchTask,
  ResearchTaskResult,
  ResearchToolType,
  FieldDataSource,
} from '@listforge/core-types';
import { OCRService } from './ocr.service';
import { UPCLookupService } from './upc-lookup.service';
import { KeepaService } from './keepa.service';
import { WebSearchService } from './web-search.service';
import { OpenAIService } from './openai.service';
import OpenAI from 'openai';

/**
 * Simplified image type for research context
 */
export interface ResearchImage {
  id: string;
  url: string;
  type: string;
}

/**
 * Context needed to execute research
 */
export interface ResearchExecutionContext {
  // Item identifiers
  itemId: string;
  organizationId: string;

  // Available data
  images: ResearchImage[];
  upc?: string;
  brand?: string;
  model?: string;
  mpn?: string;
  category?: string;
  extractedText?: string;

  // Current field values (for context)
  currentFields: Record<string, unknown>;
}

/**
 * Result of extracting a specific field from research
 */
interface ExtractedFieldValue {
  value: unknown;
  confidence: number;
  source: FieldDataSource;
}

/**
 * FieldResearchService
 *
 * Executes targeted research for specific fields using various tools.
 * Each tool has specialized logic for extracting field values.
 *
 * This service is the "execution engine" for the research planner.
 * It takes research tasks and returns field updates with confidence scores.
 */
@Injectable()
export class FieldResearchService {
  private readonly logger = new Logger(FieldResearchService.name);
  private readonly openaiClient: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ocrService: OCRService,
    private readonly upcLookupService: UPCLookupService,
    private readonly keepaService: KeepaService,
    private readonly webSearchService: WebSearchService,
    private readonly openaiService: OpenAIService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openaiClient = new OpenAI({ apiKey });
    }
  }

  /**
   * Execute a research task and return field updates
   */
  async executeTask(
    task: ResearchTask,
    context: ResearchExecutionContext,
  ): Promise<ResearchTaskResult> {
    const startTime = Date.now();
    this.logger.debug(
      `Executing task ${task.id}: ${task.tool} for fields [${task.targetFields.join(', ')}]`,
    );

    try {
      const fieldUpdatesMap = await this.executeToolForFields(
        task.tool,
        task.targetFields,
        context,
      );

      const timeMs = Date.now() - startTime;

      // Convert Record to Array format
      const fieldUpdates = Object.entries(fieldUpdatesMap).map(([fieldName, update]) => ({
        fieldName,
        value: update.value,
        source: update.source,
      }));

      return {
        task,
        success: true,
        fieldUpdates,
        cost: task.estimatedCost,
        timeMs,
      };
    } catch (error) {
      const timeMs = Date.now() - startTime;
      this.logger.error(`Task ${task.id} failed:`, error);

      return {
        task,
        success: false,
        fieldUpdates: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: task.estimatedCost * 0.5, // Partial cost for failed attempts
        timeMs,
      };
    }
  }

  /**
   * Execute a tool and extract field values
   */
  private async executeToolForFields(
    tool: ResearchToolType,
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    switch (tool) {
      case 'ocr_extraction':
        return this.executeOCRExtraction(targetFields, context);

      case 'upc_lookup':
        return this.executeUPCLookup(targetFields, context);

      case 'keepa_lookup':
        return this.executeKeepaLookup(targetFields, context);

      case 'amazon_catalog':
        return this.executeAmazonCatalog(targetFields, context);

      case 'vision_analysis':
        return this.executeVisionAnalysis(targetFields, context);

      case 'web_search_targeted':
        return this.executeWebSearchTargeted(targetFields, context);

      case 'web_search_general':
        return this.executeWebSearchBroad(targetFields, context);

      case 'ebay_taxonomy':
        return this.executeEbayCategorySuggest(targetFields, context);

      case 'ebay_comps':
        // eBay comps are handled by search-comps node, not field research
        // This tool type should not be used in field-driven research
        this.logger.warn('ebay_comps should be handled by search-comps node');
        return {};

      default:
        this.logger.warn(`Unknown tool type: ${tool}`);
        return {};
    }
  }

  // ============================================================================
  // Tool Implementations
  // ============================================================================

  /**
   * OCR Extraction - Extract text and identifiers from images
   */
  private async executeOCRExtraction(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (context.images.length === 0) {
      return updates;
    }

    const imageUrls = context.images
      .filter(m => m.type === 'image')
      .map(m => m.url)
      .slice(0, 4); // Limit to 4 images

    if (imageUrls.length === 0) {
      return updates;
    }

    const ocrResult = await this.ocrService.extractText(imageUrls);

    // Map OCR results to target fields
    if (targetFields.includes('upc') && ocrResult.upc) {
      updates.upc = {
        value: ocrResult.upc,
        confidence: ocrResult.confidence * 0.9, // OCR confidence slightly reduced
        source: {
          type: 'ocr',
          timestamp: new Date().toISOString(),
          confidence: ocrResult.confidence * 0.9,
          rawValue: { ocrResult },
        },
      };
    }

    if (targetFields.includes('brand') && ocrResult.labels?.brand) {
      updates.brand = {
        value: ocrResult.labels.brand,
        confidence: ocrResult.confidence * 0.85,
        source: {
          type: 'ocr',
          timestamp: new Date().toISOString(),
          confidence: ocrResult.confidence * 0.85,
          rawValue: { label: 'brand', value: ocrResult.labels.brand },
        },
      };
    }

    if (targetFields.includes('model') && ocrResult.modelNumber) {
      updates.model = {
        value: ocrResult.modelNumber,
        confidence: ocrResult.confidence * 0.85,
        source: {
          type: 'ocr',
          timestamp: new Date().toISOString(),
          confidence: ocrResult.confidence * 0.85,
          rawValue: { modelNumber: ocrResult.modelNumber },
        },
      };
    }

    if (targetFields.includes('mpn') && ocrResult.mpn) {
      updates.mpn = {
        value: ocrResult.mpn,
        confidence: ocrResult.confidence * 0.9,
        source: {
          type: 'ocr',
          timestamp: new Date().toISOString(),
          confidence: ocrResult.confidence * 0.85,
          rawValue: { mpn: ocrResult.mpn },
        },
      };
    }

    // Extract additional fields from labels
    const labelMappings: Record<string, string> = {
      size: 'size',
      material: 'material',
      color: 'color',
      capacity: 'capacity',
      'made in': 'country_of_manufacture',
    };

    for (const [labelKey, fieldName] of Object.entries(labelMappings)) {
      if (targetFields.includes(fieldName)) {
        const labelValue = Object.entries(ocrResult.labels || {}).find(
          ([k]) => k.toLowerCase().includes(labelKey),
        );
        if (labelValue) {
          updates[fieldName] = {
            value: labelValue[1],
            confidence: ocrResult.confidence * 0.7,
            source: {
              type: 'ocr',
              timestamp: new Date().toISOString(),
              confidence: ocrResult.confidence * 0.7,
              rawValue: { label: labelKey, value: labelValue[1] },
            },
          };
        }
      }
    }

    return updates;
  }

  /**
   * UPC Lookup - Get product data from UPC database
   */
  private async executeUPCLookup(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!context.upc) {
      return updates;
    }

    const result = await this.upcLookupService.lookup(context.upc);

    if (!result.found) {
      return updates;
    }

    const source: FieldDataSource = {
      type: 'upc_lookup',
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      rawValue: result,
    };

    // UPC lookups are highly reliable
    const baseConfidence = 0.95;

    if (targetFields.includes('brand') && result.brand) {
      updates.brand = {
        value: result.brand,
        confidence: baseConfidence,
        source,
      };
    }

    if (targetFields.includes('title') && result.name) {
      updates.title = {
        value: result.name,
        confidence: baseConfidence * 0.9, // Titles may need refinement
        source,
      };
    }

    if (targetFields.includes('description') && result.description) {
      updates.description = {
        value: result.description,
        confidence: baseConfidence * 0.85,
        source,
      };
    }

    if (targetFields.includes('category') && result.category) {
      updates.category = {
        value: result.category,
        confidence: baseConfidence * 0.8,
        source,
      };
    }

    return updates;
  }

  /**
   * Keepa Lookup - Get Amazon historical data
   */
  private async executeKeepaLookup(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.keepaService.isServiceConfigured()) {
      return updates;
    }

    // Try to find ASIN via UPC first
    let asin: string | null = null;

    if (context.upc) {
      const searchResult = await this.keepaService.searchByUpc(context.upc);
      if (searchResult) {
        asin = searchResult.asin;
      }
    }

    // If no ASIN found via UPC, try keyword search
    if (!asin && context.brand && context.model) {
      const searchResults = await this.keepaService.searchByKeyword(
        `${context.brand} ${context.model}`,
        3,
      );
      if (searchResults.length > 0) {
        asin = searchResults[0].asin;
      }
    }

    if (!asin) {
      return updates;
    }

    const productData = await this.keepaService.getProductByAsin(asin);

    if (!productData) {
      return updates;
    }

    const source: FieldDataSource = {
      type: 'keepa',
      timestamp: new Date().toISOString(),
      confidence: 0.92,
      rawValue: { asin, productData },
    };

    // Keepa data is very reliable
    const baseConfidence = 0.92;

    if (targetFields.includes('brand') && productData.brand) {
      updates.brand = {
        value: productData.brand,
        confidence: baseConfidence,
        source,
      };
    }

    if (targetFields.includes('title') && productData.title) {
      updates.title = {
        value: productData.title,
        confidence: baseConfidence * 0.9,
        source,
      };
    }

    if (targetFields.includes('category') && productData.category?.length > 0) {
      updates.category = {
        value: productData.category,
        confidence: baseConfidence * 0.85,
        source,
      };
    }

    // Extract pricing data
    if (targetFields.includes('price_reference')) {
      const priceStats = this.keepaService.calculatePriceStats(productData);
      if (priceStats.current || priceStats.avg90) {
        updates.price_reference = {
          value: {
            current: priceStats.current,
            avg30: priceStats.avg30,
            avg90: priceStats.avg90,
            min90: priceStats.min90,
            max90: priceStats.max90,
          },
          confidence: baseConfidence,
          source,
        };
      }
    }

    // Sales rank for demand assessment
    if (targetFields.includes('demand_indicator') && productData.salesRank) {
      const bsrTrend = this.keepaService.calculateBsrTrend(productData.salesRankHistory || []);
      updates.demand_indicator = {
        value: {
          salesRank: productData.salesRank,
          trend: bsrTrend,
          reviewCount: productData.reviewCount,
          rating: productData.rating,
        },
        confidence: baseConfidence,
        source,
      };
    }

    return updates;
  }

  /**
   * Amazon Catalog - Direct Amazon API lookup (placeholder)
   */
  private async executeAmazonCatalog(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    // For now, delegate to Keepa which provides similar data
    // In future, implement direct Amazon SP-API integration
    return this.executeKeepaLookup(targetFields, context);
  }

  /**
   * Vision Analysis - Deep image analysis for attributes
   */
  private async executeVisionAnalysis(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (context.images.length === 0 || !this.openaiService.isServiceConfigured()) {
      return updates;
    }

    const imageUrls = context.images
      .filter(m => m.type === 'image')
      .map(m => m.url)
      .slice(0, 4);

    if (imageUrls.length === 0) {
      return updates;
    }

    // Use targeted vision prompt for specific fields
    const prompt = this.buildVisionPrompt(targetFields, context);
    const result = await this.executeVisionPrompt(imageUrls, prompt);

    if (!result) {
      return updates;
    }

    const source: FieldDataSource = {
      type: 'vision_ai',
      timestamp: new Date().toISOString(),
      confidence: 0.70,
      rawValue: result,
    };

    // Vision analysis has moderate confidence
    const baseConfidence = 0.70;

    // Map extracted values to target fields
    const fieldMappings: Record<string, string> = {
      brand: 'brand',
      model: 'model',
      color: 'color',
      material: 'material',
      condition: 'condition',
      size: 'size',
      style: 'style',
      pattern: 'pattern',
    };

    for (const [resultKey, fieldName] of Object.entries(fieldMappings)) {
      if (targetFields.includes(fieldName) && result[resultKey]) {
        updates[fieldName] = {
          value: result[resultKey],
          confidence: baseConfidence,
          source,
        };
      }
    }

    // Special handling for condition
    if (targetFields.includes('condition') && result.condition) {
      updates.condition = {
        value: this.normalizeCondition(String(result.condition)),
        confidence: baseConfidence * 0.9, // Condition is subjective
        source,
      };
    }

    return updates;
  }

  /**
   * Targeted Web Search - Search for specific field information
   */
  private async executeWebSearchTargeted(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.webSearchService.isServiceConfigured()) {
      return updates;
    }

    // Build targeted search queries based on what we know
    const searchResult = await this.webSearchService.searchProduct({
      brand: context.brand,
      model: context.model,
      category: context.category,
      upc: context.upc,
      mpn: context.mpn,
    });

    if (searchResult.successCount === 0) {
      return updates;
    }

    // Synthesize product data from search results
    const synthesized = await this.webSearchService.synthesizeProductData(
      searchResult.results,
      {
        brand: context.brand,
        model: context.model,
        category: context.category,
      },
    );

    if (synthesized.confidence < 0.3) {
      return updates;
    }

    const source: FieldDataSource = {
      type: 'web_search',
      timestamp: new Date().toISOString(),
      confidence: 0.65,
      rawValue: { searchResult, synthesized },
    };

    const baseConfidence = 0.65;

    if (targetFields.includes('brand') && synthesized.brand) {
      updates.brand = {
        value: synthesized.brand,
        confidence: baseConfidence * synthesized.confidence,
        source,
      };
    }

    if (targetFields.includes('model') && synthesized.model) {
      updates.model = {
        value: synthesized.model,
        confidence: baseConfidence * synthesized.confidence,
        source,
      };
    }

    if (targetFields.includes('mpn') && synthesized.mpn) {
      updates.mpn = {
        value: synthesized.mpn,
        confidence: baseConfidence * synthesized.confidence,
        source,
      };
    }

    if (targetFields.includes('title') && synthesized.title) {
      updates.title = {
        value: synthesized.title,
        confidence: baseConfidence * synthesized.confidence * 0.9,
        source,
      };
    }

    if (targetFields.includes('description') && synthesized.description) {
      updates.description = {
        value: synthesized.description,
        confidence: baseConfidence * synthesized.confidence * 0.85,
        source,
      };
    }

    if (targetFields.includes('category') && synthesized.category?.length > 0) {
      updates.category = {
        value: synthesized.category,
        confidence: baseConfidence * synthesized.confidence * 0.8,
        source,
      };
    }

    // Handle specifications as individual fields
    if (synthesized.specifications) {
      const specMappings: Record<string, string> = {
        color: 'color',
        material: 'material',
        size: 'size',
        weight: 'weight',
        dimensions: 'dimensions',
        capacity: 'capacity',
      };

      for (const [specKey, fieldName] of Object.entries(specMappings)) {
        if (targetFields.includes(fieldName) && synthesized.specifications[specKey]) {
          updates[fieldName] = {
            value: synthesized.specifications[specKey],
            confidence: baseConfidence * synthesized.confidence * 0.7,
            source,
          };
        }
      }
    }

    return updates;
  }

  /**
   * Broad Web Search - Cast a wider net for hard-to-find products
   */
  private async executeWebSearchBroad(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    // Similar to targeted but with broader queries
    // Uses extracted text, category, and any available hints
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.webSearchService.isServiceConfigured()) {
      return updates;
    }

    const searchResult = await this.webSearchService.searchProduct({
      brand: context.brand,
      model: context.model,
      category: context.category,
      extractedText: context.extractedText,
      attributes: context.currentFields as Record<string, string>,
    });

    if (searchResult.successCount === 0) {
      return updates;
    }

    const synthesized = await this.webSearchService.synthesizeProductData(
      searchResult.results,
      {
        brand: context.brand,
        model: context.model,
        category: context.category,
        attributes: context.currentFields as Record<string, string>,
      },
    );

    if (synthesized.confidence < 0.2) {
      return updates;
    }

    const source: FieldDataSource = {
      type: 'web_search',
      timestamp: new Date().toISOString(),
      confidence: 0.55,
      rawValue: { searchResult, synthesized },
    };

    // Broad search has lower confidence than targeted
    const baseConfidence = 0.55;

    // Same field extraction logic but with lower confidence
    if (targetFields.includes('brand') && synthesized.brand) {
      updates.brand = {
        value: synthesized.brand,
        confidence: baseConfidence * synthesized.confidence,
        source,
      };
    }

    if (targetFields.includes('model') && synthesized.model) {
      updates.model = {
        value: synthesized.model,
        confidence: baseConfidence * synthesized.confidence,
        source,
      };
    }

    if (targetFields.includes('title') && synthesized.title) {
      updates.title = {
        value: synthesized.title,
        confidence: baseConfidence * synthesized.confidence * 0.85,
        source,
      };
    }

    if (targetFields.includes('category') && synthesized.category?.length > 0) {
      updates.category = {
        value: synthesized.category,
        confidence: baseConfidence * synthesized.confidence * 0.75,
        source,
      };
    }

    return updates;
  }

  /**
   * eBay Category Suggest - Use eBay's API to suggest category
   */
  private async executeEbayCategorySuggest(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    // This will be implemented in the MarketplaceSchemaService integration
    // For now, return empty - will be connected in Slice 10

    return updates;
  }

  /**
   * LLM Inference - Use AI to infer field values from context
   */
  private async executeLLMInference(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.openaiClient) {
      return updates;
    }

    const prompt = this.buildInferencePrompt(targetFields, context);

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a product data expert. Based on the provided context, infer the most likely values for the requested fields.

Return JSON with:
{
  "inferences": {
    "fieldName": {
      "value": "inferred value",
      "confidence": 0.0-1.0,
      "reasoning": "brief explanation"
    }
  }
}

Only include fields you can reasonably infer. If uncertain, omit the field.
Be conservative with confidence scores - only high confidence (>0.7) for clear inferences.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return updates;
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return updates;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const inferences = parsed.inferences || {};

      for (const [fieldName, inference] of Object.entries(inferences)) {
        if (targetFields.includes(fieldName) && inference && typeof inference === 'object') {
          const inf = inference as { value: unknown; confidence: number; reasoning?: string };
          if (inf.value !== null && inf.value !== undefined && inf.confidence >= 0.5) {
            updates[fieldName] = {
              value: inf.value,
              confidence: Math.min(0.75, inf.confidence * 0.75), // Cap LLM inference confidence
              source: {
                type: 'vision_ai', // Using vision_ai as proxy for LLM inference
                timestamp: new Date().toISOString(),
                confidence: Math.min(0.75, inf.confidence * 0.75),
                rawValue: { fieldName, inference: inf },
              },
            };
          }
        }
      }
    } catch (error) {
      this.logger.warn('LLM inference failed:', error);
    }

    return updates;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Build a targeted vision analysis prompt
   */
  private buildVisionPrompt(targetFields: string[], context: ResearchExecutionContext): string {
    const fieldDescriptions: Record<string, string> = {
      brand: 'Brand name visible on the product or packaging',
      model: 'Model number or name',
      color: 'Primary color(s) of the item',
      material: 'What material is the item made of (e.g., leather, plastic, metal, fabric)',
      condition: 'Visible condition: new, like_new, very_good, good, acceptable',
      size: 'Size if visible (e.g., Small, Medium, Large, or dimensions)',
      style: 'Style or design type',
      pattern: 'Pattern if any (e.g., solid, striped, floral)',
    };

    const fieldsToExtract = targetFields
      .filter(f => fieldDescriptions[f])
      .map(f => `- ${f}: ${fieldDescriptions[f]}`)
      .join('\n');

    return `Analyze these product images and extract the following information:

${fieldsToExtract}

Context:
- Category: ${context.category || 'Unknown'}
- Brand (if known): ${context.brand || 'Unknown'}
- Model (if known): ${context.model || 'Unknown'}

Return JSON with the extracted fields. Only include fields you can confidently identify.`;
  }

  /**
   * Execute a vision prompt and get structured results
   */
  private async executeVisionPrompt(
    imageUrls: string[],
    prompt: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.openaiClient) {
      return null;
    }

    try {
      // Convert local URLs to base64 if needed
      const preparedUrls = await this.prepareImageUrls(imageUrls);

      const imageContents = preparedUrls.map(url => ({
        type: 'image_url' as const,
        image_url: { url },
      }));

      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a product analysis expert. Extract the requested information from the images accurately. Return JSON only.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.warn('Vision prompt execution failed:', error);
      return null;
    }
  }

  /**
   * Prepare image URLs (convert local URLs to base64)
   */
  private async prepareImageUrls(urls: string[]): Promise<string[]> {
    return Promise.all(
      urls.map(async url => {
        if (this.isLocalUrl(url)) {
          return this.imageToBase64(url);
        }
        return url;
      }),
    );
  }

  /**
   * Check if URL is local
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
   * Convert image to base64
   */
  private async imageToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  }

  /**
   * Build inference prompt from context
   */
  private buildInferencePrompt(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): string {
    return `Given this product context, infer the following fields: ${targetFields.join(', ')}

Known Information:
- Brand: ${context.brand || 'Unknown'}
- Model: ${context.model || 'Unknown'}
- Category: ${context.category || 'Unknown'}
- UPC: ${context.upc || 'None'}
- MPN: ${context.mpn || 'None'}
- Extracted Text: ${context.extractedText || 'None'}
- Current Fields: ${JSON.stringify(context.currentFields, null, 2)}

Based on this information, what can you reasonably infer about the target fields?`;
  }

  /**
   * Normalize condition values to standard format
   */
  private normalizeCondition(condition: string): string {
    const conditionMap: Record<string, string> = {
      new: 'new',
      'brand new': 'new',
      sealed: 'new',
      'like new': 'used_like_new',
      'like_new': 'used_like_new',
      'open box': 'used_like_new',
      excellent: 'used_very_good',
      'very good': 'used_very_good',
      'very_good': 'used_very_good',
      good: 'used_good',
      fair: 'used_acceptable',
      acceptable: 'used_acceptable',
      poor: 'used_acceptable',
    };

    const normalized = condition.toLowerCase().trim();
    return conditionMap[normalized] || 'used_good';
  }
}
