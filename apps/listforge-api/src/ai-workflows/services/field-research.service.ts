import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ResearchTask,
  ResearchTaskResult,
  ResearchToolType,
  FieldDataSource,
  CategoryId,
  ExtractedIdentifier,
} from '@listforge/core-types';
import { OCRService } from './ocr.service';
import { UPCLookupService } from './upc-lookup.service';
import { KeepaService } from './keepa.service';
import { WebSearchService } from './web-search.service';
import { OpenAIService } from './openai.service';
import { ReverseImageSearchService } from './reverse-image-search.service';
import { GuidedVisionAnalysisService } from './guided-vision-analysis.service';
import { IterativeSearchService } from './iterative-search.service';
import { ProductPageExtractorService } from './product-page-extractor.service';
import { DomainKnowledgeService } from './domain-knowledge.service';
import { getRateLimiter } from '../utils/rate-limiter';
import OpenAI from 'openai';

// ============================================================================
// Constants - Extracted magic numbers for maintainability
// ============================================================================

/** Maximum image size for base64 conversion (10MB) */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Timeout for external fetch requests in milliseconds */
const FETCH_TIMEOUT_MS = 30000;

/** Confidence multiplier for OCR-based UPC extraction */
const OCR_UPC_CONFIDENCE = 0.9;

/** Confidence multiplier for OCR-based brand extraction */
const OCR_BRAND_CONFIDENCE = 0.85;

/** Confidence multiplier for OCR-based model extraction */
const OCR_MODEL_CONFIDENCE = 0.85;

/** Confidence multiplier for OCR-based MPN extraction */
const OCR_MPN_CONFIDENCE = 0.9;

/** Confidence multiplier for OCR label fields */
const OCR_LABEL_CONFIDENCE = 0.7;

/** Base confidence for UPC lookup results */
const UPC_LOOKUP_BASE_CONFIDENCE = 0.95;

/** Base confidence for Keepa lookup results */
const KEEPA_BASE_CONFIDENCE = 0.92;

/** Base confidence for vision analysis */
const VISION_BASE_CONFIDENCE = 0.70;

/** Base confidence for targeted web search */
const WEB_SEARCH_TARGETED_CONFIDENCE = 0.65;

/** Base confidence for broad web search */
const WEB_SEARCH_BROAD_CONFIDENCE = 0.55;

/** Confidence multiplier for OCR search indirection */
const OCR_SEARCH_CONFIDENCE_MULTIPLIER = 0.85;

/** Minimum confidence threshold for OCR search results */
const OCR_SEARCH_MIN_CONFIDENCE = 0.3;

/** Maximum identifier chunks to search */
const MAX_IDENTIFIER_CHUNKS = 5;

/** Delay between search queries in ms */
const SEARCH_INTER_QUERY_DELAY_MS = 200;

/** Maximum length for search query sanitization */
const MAX_SEARCH_QUERY_LENGTH = 200;

/** LLM inference confidence cap */
const LLM_INFERENCE_CONFIDENCE_CAP = 0.75;

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

  // Category detection result (for guided vision)
  detectedCategoryId?: CategoryId;

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
  private readonly visionModel: string;
  private readonly ocrSearchRateLimiter = getRateLimiter('ocrSearch');

  constructor(
    private readonly configService: ConfigService,
    private readonly ocrService: OCRService,
    private readonly upcLookupService: UPCLookupService,
    private readonly keepaService: KeepaService,
    private readonly webSearchService: WebSearchService,
    private readonly openaiService: OpenAIService,
    private readonly reverseImageSearchService: ReverseImageSearchService,
    private readonly guidedVisionAnalysisService: GuidedVisionAnalysisService,
    private readonly iterativeSearchService: IterativeSearchService,
    private readonly productPageExtractorService: ProductPageExtractorService,
    private readonly domainKnowledgeService: DomainKnowledgeService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openaiClient = new OpenAI({ apiKey });
    }
    // Make model configurable with sensible default
    this.visionModel = this.configService.get<string>('VISION_MODEL') || 'gpt-4o';
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
      // Sanitize error message to prevent information leakage
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Task ${task.id} failed: ${errorMessage}`);

      return {
        task,
        success: false,
        fieldUpdates: [],
        error: errorMessage,
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

      case 'ocr_search':
        return this.executeOcrSearch(targetFields, context);

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

      case 'reverse_image_search':
        return this.executeReverseImageSearch(targetFields, context);

      case 'vision_analysis_guided':
        return this.executeGuidedVisionAnalysis(targetFields, context);

      case 'web_search_iterative':
        return this.executeIterativeWebSearch(targetFields, context);

      case 'product_page_extraction':
        return this.executeProductPageExtraction(targetFields, context);

      case 'domain_knowledge_lookup':
        return this.executeDomainKnowledgeLookup(targetFields, context);

      // NOTE: ebay_comps is NOT a field research tool - it's handled by
      // the search_comps node in the Core Operations phase of the graph.
      // See buildFieldDrivenResearchGraph() in research-graph.builder.ts.

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
   * Sanitize a search query to prevent injection and ensure safe searching
   */
  private sanitizeSearchQuery(query: string): string {
    // Trim and limit length
    let sanitized = query.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);

    // Remove potentially dangerous characters while keeping alphanumeric and common separators
    sanitized = sanitized.replace(/[<>'"`;$\\]/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * OCR Search - Search with OCR-extracted text that looks like identifiers
   * Slice 4: OCR-to-Search Pipeline
   *
   * Instead of just parsing OCR text into known fields, this tool searches
   * the web with identifier-like text chunks (model numbers, SKUs, etc.)
   * to find product information.
   *
   * Includes rate limiting to prevent abuse and query sanitization for security.
   */
  private async executeOcrSearch(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    // Apply rate limiting
    await this.ocrSearchRateLimiter.acquire();

    if (context.images.length === 0) {
      this.logger.debug('No images available for OCR search');
      return updates;
    }

    // First, run OCR if we don't have extracted text
    let extractedText = context.extractedText;
    let textChunks: Array<{ text: string; isLikelyIdentifier: boolean; confidence: number }> = [];

    if (!extractedText) {
      const imageUrls = context.images
        .filter(m => m.type === 'image')
        .map(m => m.url)
        .slice(0, 4);

      if (imageUrls.length === 0) {
        return updates;
      }

      const ocrResult = await this.ocrService.extractText(imageUrls);

      if (ocrResult.textChunks && ocrResult.textChunks.length > 0) {
        textChunks = ocrResult.textChunks;
      } else if (ocrResult.rawText.length > 0) {
        // Fallback: classify raw text if textChunks not available
        const { classifyTextChunks } = await import('../utils/identifier-classifier');
        textChunks = classifyTextChunks(ocrResult.rawText, ocrResult.confidence);
      }
    } else {
      // Classify the existing extracted text
      const { classifyTextChunks } = await import('../utils/identifier-classifier');
      textChunks = classifyTextChunks(extractedText.split('\n'), 0.75);
    }

    // Get identifier-like chunks (limited for performance and security)
    const identifierChunks = textChunks
      .filter(c => c.isLikelyIdentifier)
      .slice(0, MAX_IDENTIFIER_CHUNKS);

    if (identifierChunks.length === 0) {
      this.logger.debug('No identifier-like text found for OCR search');
      return updates;
    }

    // Sanitize chunk texts for logging (prevent log injection)
    const sanitizedChunkTexts = identifierChunks.map(c => this.sanitizeSearchQuery(c.text));
    this.logger.debug(
      `Searching with ${identifierChunks.length} identifier chunks: ${sanitizedChunkTexts.join(', ')}`
    );

    // Search with each identifier chunk
    const allSearchResults: Array<{ query: string; content: string; sources: string[] }> = [];

    for (const chunk of identifierChunks) {
      try {
        // Sanitize the query before searching
        const sanitizedQuery = this.sanitizeSearchQuery(chunk.text);
        if (sanitizedQuery.length < 3) {
          continue; // Skip very short queries after sanitization
        }

        // Search with the sanitized identifier text
        const searchResult = await this.webSearchService.search(
          `"${sanitizedQuery}" product specifications`,
        );

        if (searchResult.content && !searchResult.error) {
          allSearchResults.push({
            query: sanitizedQuery,
            content: searchResult.content,
            sources: searchResult.sources,
          });
        }

        // Small delay between searches to respect rate limits
        if (identifierChunks.indexOf(chunk) < identifierChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, SEARCH_INTER_QUERY_DELAY_MS));
        }
      } catch (error) {
        // Sanitize error logging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`OCR search query failed: ${errorMessage}`);
      }
    }

    if (allSearchResults.length === 0) {
      this.logger.debug('No results from OCR text searches');
      return updates;
    }

    // Synthesize product data from search results
    const synthesizedData = await this.webSearchService.synthesizeProductData(
      allSearchResults.map(r => ({
        query: r.query,
        content: r.content,
        sources: r.sources,
        timestamp: new Date().toISOString(),
      })),
      {
        brand: context.brand,
        model: context.model,
        category: context.category,
      },
    );

    if (synthesizedData.confidence < OCR_SEARCH_MIN_CONFIDENCE) {
      this.logger.debug(`OCR search confidence too low: ${synthesizedData.confidence.toFixed(2)}`);
      return updates;
    }

    // Apply confidence discount for indirect search (OCR -> Search -> Synthesis)
    const adjustedConfidence = synthesizedData.confidence * OCR_SEARCH_CONFIDENCE_MULTIPLIER;

    // Map synthesized data to field updates
    const fieldMappings: Array<{ fieldName: string; value: string | null }> = [
      { fieldName: 'brand', value: synthesizedData.brand },
      { fieldName: 'model', value: synthesizedData.model },
      { fieldName: 'mpn', value: synthesizedData.mpn },
      { fieldName: 'title', value: synthesizedData.title },
      { fieldName: 'category', value: synthesizedData.category?.[0] || null },
    ];

    for (const mapping of fieldMappings) {
      if (mapping.value && targetFields.includes(mapping.fieldName)) {
        const source: FieldDataSource = {
          type: 'web_search',
          timestamp: new Date().toISOString(),
          confidence: adjustedConfidence,
          rawValue: {
            method: 'ocr_search',
            queries: sanitizedChunkTexts,
            sourceUrls: synthesizedData.sources.slice(0, 5),
          },
        };

        updates[mapping.fieldName] = {
          value: mapping.value,
          confidence: adjustedConfidence,
          source,
        };
      }
    }

    this.logger.log(
      `OCR search found ${Object.keys(updates).length} field updates ` +
      `(queries: ${identifierChunks.length}, confidence: ${adjustedConfidence.toFixed(2)})`
    );

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
        model: this.visionModel,
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

      // Validate parsed structure
      if (typeof parsed !== 'object' || parsed === null) {
        return updates;
      }

      const inferences = parsed.inferences || {};

      for (const [fieldName, inference] of Object.entries(inferences)) {
        if (targetFields.includes(fieldName) && inference && typeof inference === 'object') {
          const inf = inference as { value: unknown; confidence: number; reasoning?: string };
          if (inf.value !== null && inf.value !== undefined && inf.confidence >= 0.5) {
            const cappedConfidence = Math.min(LLM_INFERENCE_CONFIDENCE_CAP, inf.confidence * LLM_INFERENCE_CONFIDENCE_CAP);
            updates[fieldName] = {
              value: inf.value,
              confidence: cappedConfidence,
              source: {
                type: 'vision_ai', // Using vision_ai as proxy for LLM inference
                timestamp: new Date().toISOString(),
                confidence: cappedConfidence,
                rawValue: { fieldName, inference: inf },
              },
            };
          }
        }
      }
    } catch (error) {
      // Sanitize error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`LLM inference failed: ${errorMessage}`);
    }

    return updates;
  }

  /**
   * Reverse Image Search - Find visually similar products (Google Lens style)
   * Slice 1: Research Quality Improvement
   *
   * This is often the most effective identification tool when text-based
   * methods fail. It searches for visually similar products across the web.
   */
  private async executeReverseImageSearch(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.reverseImageSearchService.isServiceConfigured()) {
      this.logger.debug('Reverse image search service not configured');
      return updates;
    }

    if (context.images.length === 0) {
      this.logger.debug('No images available for reverse image search');
      return updates;
    }

    // Use the first/primary image for search
    const primaryImage = context.images.find(m => m.type === 'image');
    if (!primaryImage?.url) {
      return updates;
    }

    this.logger.debug(`Executing reverse image search for item ${context.itemId}`);

    const result = await this.reverseImageSearchService.search(primaryImage.url);

    if (!result.success || !result.bestMatch) {
      this.logger.debug(`Reverse image search returned no matches: ${result.error || 'No matches'}`);
      return updates;
    }

    const match = result.bestMatch;
    const baseConfidence = result.confidence;

    // Create source record - using 'web_search' as closest match for FieldDataSourceType
    // The rawValue contains the full reverse image search result for traceability
    const source: FieldDataSource = {
      type: 'web_search', // Using web_search as it's the closest available type
      timestamp: new Date().toISOString(),
      confidence: baseConfidence,
      rawValue: {
        provider: result.provider,
        matchTitle: match.title,
        matchUrl: match.sourceUrl,
        matchConfidence: match.confidence,
        searchedImageUrl: result.searchedImageUrl,
        durationMs: result.durationMs,
        cached: result.cached,
      },
    };

    // Map match data to target fields
    if (targetFields.includes('brand') && match.brand) {
      updates.brand = {
        value: match.brand,
        confidence: baseConfidence * 0.9,
        source,
      };
    }

    if (targetFields.includes('model') && match.model) {
      updates.model = {
        value: match.model,
        confidence: baseConfidence * 0.85,
        source,
      };
    }

    if (targetFields.includes('title') && match.title) {
      updates.title = {
        value: match.title,
        confidence: baseConfidence * 0.8,
        source,
      };
    }

    if (targetFields.includes('category') && match.category) {
      updates.category = {
        value: match.category,
        confidence: baseConfidence * 0.75,
        source,
      };
    }

    if (targetFields.includes('price') && match.price) {
      updates.price = {
        value: match.price,
        confidence: baseConfidence * 0.6, // Price from visual search is less reliable
        source,
      };
    }

    // Extract any additional attributes from the match
    if (match.attributes) {
      const attrMappings: Record<string, string> = {
        color: 'color',
        material: 'material',
        size: 'size',
      };

      for (const [attrKey, fieldName] of Object.entries(attrMappings)) {
        if (targetFields.includes(fieldName) && match.attributes[attrKey]) {
          updates[fieldName] = {
            value: match.attributes[attrKey],
            confidence: baseConfidence * 0.7,
            source,
          };
        }
      }
    }

    this.logger.log(
      `Reverse image search found ${Object.keys(updates).length} field updates ` +
        `(provider: ${result.provider}, confidence: ${baseConfidence.toFixed(2)})`
    );

    return updates;
  }

  /**
   * Guided Vision Analysis - Category-specific visual inspection
   * Slice 2: Research Quality Improvement
   *
   * Uses category detection and specialized inspection guides to perform
   * expert-level visual analysis. Each product category has a guide that
   * knows exactly where to look for identifying information (labels, tags,
   * hardware, date codes, etc.)
   */
  private async executeGuidedVisionAnalysis(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.guidedVisionAnalysisService.isConfigured()) {
      this.logger.debug('Guided vision analysis service not configured');
      return updates;
    }

    if (context.images.length === 0) {
      this.logger.debug('No images available for guided vision analysis');
      return updates;
    }

    const imageUrls = context.images
      .filter(m => m.type === 'image')
      .map(m => m.url)
      .slice(0, 6);

    if (imageUrls.length === 0) {
      return updates;
    }

    this.logger.debug(`Executing guided vision analysis for item ${context.itemId}`);

    try {
      const result = await this.guidedVisionAnalysisService.analyze({
        imageUrls,
        categoryId: context.detectedCategoryId,
        existingData: {
          title: context.currentFields.title as string | undefined,
          description: context.currentFields.description as string | undefined,
          brand: context.brand,
          model: context.model,
        },
        targetFields,
      });

      if (result.confidence < 0.3) {
        this.logger.debug(
          `Guided vision analysis confidence too low: ${result.confidence.toFixed(2)}`
        );
        return updates;
      }

      // Extract field values from the guided analysis result
      const extractedValues = this.guidedVisionAnalysisService.extractFieldValues(
        result,
        targetFields,
      );

      // Convert to ExtractedFieldValue format
      for (const [fieldName, extraction] of Object.entries(extractedValues)) {
        const source: FieldDataSource = {
          type: 'vision_ai',
          timestamp: new Date().toISOString(),
          confidence: extraction.confidence,
          rawValue: {
            source: extraction.source,
            categoryId: result.categoryId,
            regionResults: result.regionResults.filter(r => r.found),
            extractedIdentifiers: result.extractedIdentifiers,
          },
        };

        updates[fieldName] = {
          value: extraction.value,
          confidence: extraction.confidence,
          source,
        };
      }

      // Also check for extracted identifiers that map to fields
      for (const identifier of result.extractedIdentifiers) {
        const fieldMap: Record<string, string> = {
          model_number: 'model',
          style_number: 'model',
          serial_number: 'serial',
          date_code: 'year',
          upc: 'upc',
          sku: 'sku',
        };

        const fieldName = fieldMap[identifier.type];
        if (fieldName && targetFields.includes(fieldName) && !updates[fieldName]) {
          const source: FieldDataSource = {
            type: 'vision_ai',
            timestamp: new Date().toISOString(),
            confidence: identifier.confidence,
            rawValue: {
              identifierType: identifier.type,
              source: identifier.source,
              decoded: identifier.decoded,
              categoryId: result.categoryId,
            },
          };

          updates[fieldName] = {
            value: identifier.value,
            confidence: identifier.confidence,
            source,
          };
        }
      }

      this.logger.log(
        `Guided vision analysis found ${Object.keys(updates).length} field updates ` +
          `(category: ${result.categoryId}, confidence: ${result.confidence.toFixed(2)})`
      );

      return updates;
    } catch (error) {
      this.logger.warn(
        `Guided vision analysis failed: ${error instanceof Error ? error.message : error}`
      );
      return updates;
    }
  }

  /**
   * Iterative Web Search - Multi-strategy search with query refinement
   * Slice 3: Research Quality Improvement
   *
   * This tool tries different search strategies based on available data,
   * analyzes results for refinement signals, and iteratively improves queries
   * until a confident match is found or max iterations reached.
   */
  private async executeIterativeWebSearch(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.iterativeSearchService.isConfigured()) {
      this.logger.debug('Iterative search service not configured');
      return updates;
    }

    this.logger.debug(`Executing iterative web search for item ${context.itemId}`);

    try {
      // Build search context from research execution context
      const searchContext = {
        itemId: context.itemId,
        organizationId: context.organizationId,
        extractedIdentifiers: this.extractIdentifiersFromText(context.extractedText),
        brand: context.brand,
        model: context.model,
        category: context.category,
        mpn: context.mpn,
        upc: context.upc,
        ocrTextChunks: context.extractedText ? this.splitTextIntoChunks(context.extractedText) : undefined,
        currentFields: context.currentFields,
      };

      // Execute iterative search with refinement
      const result = await this.iterativeSearchService.searchWithRefinement(searchContext, 4);

      if (!result.success || !result.identification) {
        this.logger.debug(
          `Iterative search did not find confident match: confidence=${result.confidence.toFixed(2)}`
        );
        return updates;
      }

      const identification = result.identification;

      // Map identification results to field updates
      const fieldMappings: Array<{
        fieldName: string;
        value: string | string[] | Record<string, unknown> | undefined;
      }> = [
        { fieldName: 'brand', value: identification.brand },
        { fieldName: 'model', value: identification.model },
        { fieldName: 'mpn', value: identification.mpn },
        { fieldName: 'upc', value: identification.upc },
        { fieldName: 'title', value: identification.title },
        { fieldName: 'description', value: identification.description },
        { fieldName: 'category', value: identification.category?.join(' > ') },
      ];

      for (const mapping of fieldMappings) {
        if (
          mapping.value &&
          targetFields.includes(mapping.fieldName) &&
          typeof mapping.value === 'string'
        ) {
          const source: FieldDataSource = {
            type: 'web_search',
            timestamp: new Date().toISOString(),
            confidence: result.confidence,
            rawValue: {
              strategy: result.bestStrategy,
              totalSearches: result.totalSearches,
              sourceUrls: identification.sourceUrls.slice(0, 5),
            },
          };

          updates[mapping.fieldName] = {
            value: mapping.value,
            confidence: result.confidence,
            source,
          };
        }
      }

      // Handle specifications as additional attributes
      if (identification.specifications && targetFields.includes('specifications')) {
        const source: FieldDataSource = {
          type: 'web_search',
          timestamp: new Date().toISOString(),
          confidence: result.confidence * 0.9, // Slightly lower for specs
          rawValue: {
            strategy: result.bestStrategy,
            sourceUrls: identification.sourceUrls.slice(0, 3),
          },
        };

        updates['specifications'] = {
          value: identification.specifications,
          confidence: result.confidence * 0.9,
          source,
        };
      }

      this.logger.log(
        `Iterative web search found ${Object.keys(updates).length} field updates ` +
        `(strategy: ${result.bestStrategy}, searches: ${result.totalSearches}, ` +
        `confidence: ${result.confidence.toFixed(2)})`
      );

      return updates;
    } catch (error) {
      this.logger.warn(
        `Iterative web search failed: ${error instanceof Error ? error.message : error}`
      );
      return updates;
    }
  }

  /**
   * Product Page Extraction - Extract structured data from product page URLs
   *
   * This tool extracts product specifications from URLs found during research.
   * It uses site-specific extractors for major retailers and falls back to
   * LLM-based extraction for generic pages.
   */
  private async executeProductPageExtraction(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    if (!this.productPageExtractorService.isReady()) {
      this.logger.debug('Product page extractor service not configured');
      return updates;
    }

    // Get URLs from context - these would be product page URLs found during research
    // In practice, these would come from web search results or reverse image search
    const productUrls = this.extractProductUrls(context);

    if (productUrls.length === 0) {
      this.logger.debug('No product URLs found in context for extraction');
      return updates;
    }

    this.logger.debug(
      `Executing product page extraction for ${productUrls.length} URLs, ` +
      `item ${context.itemId}`
    );

    // Extract from each URL (limit to first 3 to avoid excessive API usage)
    const urlsToProcess = productUrls.slice(0, 3);

    for (const url of urlsToProcess) {
      try {
        const result = await this.productPageExtractorService.extractFromUrl(url, targetFields);

        if (!result.success || !result.data) {
          this.logger.debug(`Failed to extract from ${url}: ${result.error}`);
          continue;
        }

        // Convert to field updates
        const fieldUpdates = this.productPageExtractorService.toFieldUpdates(result.data, url);

        // Add updates, preferring higher confidence values
        for (const update of fieldUpdates) {
          const existing = updates[update.fieldName];
          if (!existing || update.source.confidence > existing.confidence) {
            updates[update.fieldName] = {
              value: update.value,
              confidence: update.source.confidence,
              source: update.source,
            };
          }
        }

        this.logger.debug(
          `Extracted ${fieldUpdates.length} fields from ${result.data.domain} ` +
          `(method: ${result.data.extractionMethod}, confidence: ${result.data.confidence.toFixed(2)})`
        );
      } catch (error) {
        this.logger.warn(
          `Product page extraction failed for ${url}: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    this.logger.log(
      `Product page extraction found ${Object.keys(updates).length} field updates from ${urlsToProcess.length} URLs`
    );

    return updates;
  }

  /**
   * Domain Knowledge Lookup - Decode identifiers and detect value drivers
   * Slice 9: Domain Knowledge Database
   *
   * This tool decodes category-specific identifiers (date codes, style numbers,
   * reference numbers) and detects value-affecting attributes. It's pure computation
   * with no API calls, making it fast and cheap.
   */
  private async executeDomainKnowledgeLookup(
    targetFields: string[],
    context: ResearchExecutionContext,
  ): Promise<Record<string, ExtractedFieldValue>> {
    const updates: Record<string, ExtractedFieldValue> = {};

    // Get extracted identifiers from currentFields
    const extractedIdentifiers = context.currentFields.extractedIdentifiers as ExtractedIdentifier[] | undefined;

    if (!extractedIdentifiers || extractedIdentifiers.length === 0) {
      this.logger.debug('No extracted identifiers available for domain knowledge lookup');
      return updates;
    }

    const categoryId = context.detectedCategoryId || 'general';
    this.logger.debug(
      `Executing domain knowledge lookup for ${extractedIdentifiers.length} identifiers ` +
      `(category: ${categoryId})`
    );

    // Decode identifiers using domain knowledge
    const decodedIdentifiers = this.domainKnowledgeService.decodeIdentifiers(
      extractedIdentifiers,
      categoryId,
    );

    // Extract year_manufactured from decoded date codes
    for (const identifier of decodedIdentifiers) {
      if (identifier.decoded) {
        // Check for year in decoded data
        const yearValue = identifier.decoded.year;
        if (yearValue && targetFields.includes('year_manufactured')) {
          if (!updates.year_manufactured) {
            const source: FieldDataSource = {
              type: 'ocr', // Using OCR as the identifier came from OCR/vision
              timestamp: new Date().toISOString(),
              confidence: identifier.confidence * 0.95,
              rawValue: {
                identifierType: identifier.decoded._type,
                identifierValue: identifier.value,
                decodedData: identifier.decoded,
              },
            };

            updates.year_manufactured = {
              value: yearValue,
              confidence: identifier.confidence * 0.95,
              source,
            };

            this.logger.debug(
              `Decoded year_manufactured: ${yearValue} from ${identifier.value} ` +
              `(type: ${identifier.decoded._type})`
            );
          }
        }

        // Check for factory/country of origin
        const factoryCountry = identifier.decoded.factoryCountry;
        if (factoryCountry && targetFields.includes('country_of_origin')) {
          if (!updates.country_of_origin) {
            const source: FieldDataSource = {
              type: 'ocr',
              timestamp: new Date().toISOString(),
              confidence: identifier.confidence * 0.9,
              rawValue: {
                identifierType: identifier.decoded._type,
                identifierValue: identifier.value,
                factoryCode: identifier.decoded.factoryCode,
                factoryLocation: identifier.decoded.factoryLocation,
              },
            };

            updates.country_of_origin = {
              value: factoryCountry,
              confidence: identifier.confidence * 0.9,
              source,
            };

            this.logger.debug(
              `Decoded country_of_origin: ${factoryCountry} from ${identifier.value}`
            );
          }
        }
      }
    }

    // Detect value drivers if we have field states
    const fieldStates = context.currentFields.fieldStates as Record<string, unknown> | undefined;
    if (fieldStates && targetFields.includes('value_multiplier')) {
      const brand = context.brand;

      // Create a minimal ItemFieldStates structure for value driver detection
      const itemFieldStates = {
        fields: fieldStates as Record<string, { value: unknown; confidence: { value: number } }>,
        requiredFieldsComplete: 0,
        requiredFieldsTotal: 0,
        recommendedFieldsComplete: 0,
        recommendedFieldsTotal: 0,
        completionScore: 0,
        readyToPublish: false,
        totalCost: 0,
        totalTimeMs: 0,
        iterations: 0,
        version: '1.0',
      };

      const valueDriverMatches = this.domainKnowledgeService.detectValueDrivers(
        itemFieldStates as unknown as import('@listforge/core-types').ItemFieldStates,
        categoryId,
        brand,
      );

      if (valueDriverMatches.length > 0) {
        const multiplier = this.domainKnowledgeService.calculateValueMultiplier(valueDriverMatches);

        const source: FieldDataSource = {
          type: 'ocr', // Domain knowledge is based on extracted data
          timestamp: new Date().toISOString(),
          confidence: valueDriverMatches[0].confidence,
          rawValue: {
            valueDrivers: valueDriverMatches.map(m => ({
              id: m.driver.id,
              name: m.driver.name,
              multiplier: m.driver.priceMultiplier,
              matchedValue: m.matchedValue,
              confidence: m.confidence,
            })),
            combinedMultiplier: multiplier,
          },
        };

        updates.value_multiplier = {
          value: multiplier,
          confidence: valueDriverMatches[0].confidence,
          source,
        };

        this.logger.debug(
          `Detected ${valueDriverMatches.length} value drivers, combined multiplier: ${multiplier.toFixed(2)}`
        );
      }
    }

    // Check authenticity if requested
    if (targetFields.includes('authenticity')) {
      const extractedText = context.extractedText
        ? context.extractedText.split('\n').filter(t => t.trim())
        : [];
      const brand = context.brand;

      const authenticityResult = this.domainKnowledgeService.checkAuthenticity(
        extractedIdentifiers,
        extractedText,
        categoryId,
        brand,
      );

      if (authenticityResult.markersChecked.length > 0) {
        const source: FieldDataSource = {
          type: 'ocr',
          timestamp: new Date().toISOString(),
          confidence: authenticityResult.confidence,
          rawValue: {
            assessment: authenticityResult.assessment,
            summary: authenticityResult.summary,
            markersChecked: authenticityResult.markersChecked.length,
            warnings: authenticityResult.warnings,
          },
        };

        updates.authenticity = {
          value: {
            assessment: authenticityResult.assessment,
            confidence: authenticityResult.confidence,
            summary: authenticityResult.summary,
            warnings: authenticityResult.warnings,
          },
          confidence: authenticityResult.confidence,
          source,
        };

        this.logger.debug(
          `Authenticity check: ${authenticityResult.assessment} ` +
          `(confidence: ${authenticityResult.confidence.toFixed(2)}, ` +
          `markers: ${authenticityResult.markersChecked.length})`
        );
      }
    }

    this.logger.log(
      `Domain knowledge lookup found ${Object.keys(updates).length} field updates ` +
      `(identifiers: ${extractedIdentifiers.length}, category: ${categoryId})`
    );

    return updates;
  }

  /**
   * Extract product page URLs from research context
   * These URLs come from web search results, reverse image search, etc.
   */
  private extractProductUrls(context: ResearchExecutionContext): string[] {
    const urls: string[] = [];

    // Check currentFields for URLs that might be product pages
    const urlFields = ['productUrl', 'sourceUrl', 'referenceUrl', 'matchUrl'];
    for (const field of urlFields) {
      const value = context.currentFields[field];
      if (typeof value === 'string' && this.isProductPageUrl(value)) {
        urls.push(value);
      }
    }

    // Check for URLs in array fields (e.g., from search results)
    const arrayFields = ['productUrls', 'sourceUrls', 'matchedUrls'];
    for (const field of arrayFields) {
      const value = context.currentFields[field];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string' && this.isProductPageUrl(item)) {
            urls.push(item);
          }
        }
      }
    }

    // Extract URLs from nested source objects (common pattern from research tools)
    // Sources store URLs in rawValue.sourceUrls from web search, reverse image search, etc.
    this.extractUrlsFromNestedSources(context.currentFields, urls);

    // Deduplicate
    return [...new Set(urls)];
  }

  /**
   * Recursively extract URLs from nested source objects in field values
   */
  private extractUrlsFromNestedSources(
    obj: Record<string, unknown>,
    urls: string[],
    depth = 0,
  ): void {
    // Prevent infinite recursion
    if (depth > 5) return;

    for (const value of Object.values(obj)) {
      if (!value || typeof value !== 'object') continue;

      const valueObj = value as Record<string, unknown>;

      // Check for sourceUrls array (common pattern)
      if (Array.isArray(valueObj.sourceUrls)) {
        for (const url of valueObj.sourceUrls) {
          if (typeof url === 'string' && this.isProductPageUrl(url)) {
            urls.push(url);
          }
        }
      }

      // Check for sources array containing rawValue with sourceUrls
      if (Array.isArray(valueObj.sources)) {
        for (const source of valueObj.sources) {
          if (source && typeof source === 'object') {
            const sourceObj = source as Record<string, unknown>;
            if (sourceObj.rawValue && typeof sourceObj.rawValue === 'object') {
              const rawValue = sourceObj.rawValue as Record<string, unknown>;
              if (Array.isArray(rawValue.sourceUrls)) {
                for (const url of rawValue.sourceUrls) {
                  if (typeof url === 'string' && this.isProductPageUrl(url)) {
                    urls.push(url);
                  }
                }
              }
            }
          }
        }
      }

      // Check for rawValue directly (in case the field value is a source object)
      if (valueObj.rawValue && typeof valueObj.rawValue === 'object') {
        const rawValue = valueObj.rawValue as Record<string, unknown>;
        if (Array.isArray(rawValue.sourceUrls)) {
          for (const url of rawValue.sourceUrls) {
            if (typeof url === 'string' && this.isProductPageUrl(url)) {
              urls.push(url);
            }
          }
        }
      }

      // Recurse into nested objects
      if (!Array.isArray(value)) {
        this.extractUrlsFromNestedSources(valueObj, urls, depth + 1);
      }
    }
  }

  /**
   * Check if a URL looks like a product page
   */
  private isProductPageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Known product page patterns
      const productPatterns = [
        /amazon\.[^/]+\/dp\//,           // Amazon product pages
        /amazon\.[^/]+\/gp\/product\//,  // Alternative Amazon format
        /ebay\.[^/]+\/itm\//,            // eBay listings
        /walmart\.com\/ip\//,            // Walmart products
        /target\.com\/p\//,              // Target products
        /bestbuy\.com\/site\//,          // Best Buy products
        /homedepot\.com\/p\//,           // Home Depot products
      ];

      for (const pattern of productPatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }

      // Generic product page indicators
      if (
        parsed.pathname.includes('/product/') ||
        parsed.pathname.includes('/item/') ||
        parsed.pathname.includes('/p/') ||
        parsed.pathname.match(/\/[a-z0-9-]+-\d+$/i) // slug-12345 pattern
      ) {
        return true;
      }

      // Known retail domains
      const retailDomains = [
        'amazon.', 'ebay.', 'walmart.', 'target.', 'bestbuy.',
        'homedepot.', 'lowes.', 'costco.', 'newegg.', 'bhphotovideo.',
      ];

      for (const domain of retailDomains) {
        if (hostname.includes(domain)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Extract potential model numbers/identifiers from text
   */
  private extractIdentifiersFromText(text?: string): string[] {
    if (!text) return [];

    const patterns = [
      // Model numbers like WH-1000XM4, A2141, SM-G991B
      /[A-Z]{1,3}[-\s]?\d{3,5}[A-Z]{0,3}/gi,
      // Part numbers like 123-456-789
      /\d{3}[-\s]\d{3}[-\s]\d{3}/g,
      // SKU patterns
      /SKU[:\s]?([A-Z0-9-]+)/gi,
      // UPC/EAN patterns
      /\b\d{12,14}\b/g,
    ];

    const identifiers: string[] = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        identifiers.push(...matches.map(m => m.trim()));
      }
    }

    return [...new Set(identifiers)].slice(0, 5);
  }

  /**
   * Split text into meaningful chunks for search
   */
  private splitTextIntoChunks(text: string): string[] {
    // Split on newlines and filter empty/short
    const chunks = text
      .split(/[\n\r]+/)
      .map(line => line.trim())
      .filter(line => line.length > 3 && line.length < 100);

    // Deduplicate and limit
    return [...new Set(chunks)].slice(0, 10);
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
        model: this.visionModel,
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

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate parsed structure
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      return parsed;
    } catch (error) {
      // Sanitize error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Vision prompt execution failed: ${errorMessage}`);
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
   * Check if URL is local - handles URL-encoded hostnames to prevent bypass attacks
   */
  private isLocalUrl(url: string): boolean {
    try {
      // Decode URL first to prevent encoded bypass attempts
      const decodedUrl = decodeURIComponent(url);
      const parsed = new URL(decodedUrl);

      // Normalize hostname to lowercase
      const hostname = parsed.hostname.toLowerCase();

      // Check for various local/private network indicators
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.') ||
        hostname === 'host.docker.internal' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.localhost') ||
        hostname === '0.0.0.0'
      );
    } catch {
      return false;
    }
  }

  /**
   * Convert image to base64 with timeout and size limits for security
   */
  private async imageToBase64(url: string): Promise<string> {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ListForge-Research/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Image fetch failed with status ${response.status}`);
      }

      // Check Content-Length header if available
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image exceeds maximum allowed size');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // Validate content type is actually an image
      if (!contentType.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      const buffer = await response.arrayBuffer();

      // Check actual size
      if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image exceeds maximum allowed size');
      }

      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      clearTimeout(timeoutId);

      // Sanitize error message
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Image fetch timed out');
        }
        throw new Error(`Image conversion failed: ${error.message}`);
      }
      throw new Error('Image conversion failed');
    }
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
