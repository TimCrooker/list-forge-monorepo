import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  IterativeSearchStrategy,
  RefinementSignal,
  SearchIteration,
  IterativeSearchIdentification,
  IterativeSearchResult,
  IterativeSearchContext,
  WebSearchResult,
} from '@listforge/core-types';
import { WebSearchService } from './web-search.service';
import { getRateLimiter, RATE_LIMITER_CONFIGS } from '../utils/rate-limiter';

// ============================================================================
// Constants - Extracted for maintainability and configurability
// ============================================================================

/**
 * Default maximum iterations to prevent infinite loops
 */
const DEFAULT_MAX_ITERATIONS = 4;

/**
 * Confidence threshold for considering a match "strong"
 * When reached, we stop searching
 */
const STRONG_MATCH_CONFIDENCE = 0.85;

/**
 * Minimum confidence to use a signal for refinement
 */
const MIN_SIGNAL_CONFIDENCE = 0.6;

/**
 * Cost per search in USD (approximate)
 */
const COST_PER_SEARCH = 0.02;

/** Default OpenAI model for synthesis (uses larger model for quality) */
const DEFAULT_SYNTHESIS_MODEL = 'gpt-4o';

/** Default OpenAI model for signal extraction (mini for cost) */
const DEFAULT_SIGNAL_MODEL = 'gpt-4o-mini';

/** Maximum content length for AI processing */
const MAX_CONTENT_LENGTH_SIGNALS = 4000;
const MAX_CONTENT_LENGTH_SYNTHESIS = 5000;

/** Maximum tokens for responses */
const MAX_TOKENS_SIGNALS = 500;
const MAX_TOKENS_SYNTHESIS = 1000;

/** Temperature for factual extraction */
const TEMPERATURE = 0.2;

/** Maximum text length for various fields */
const MAX_QUERY_LENGTH = 200;
const MAX_IDENTIFIER_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SIGNAL_VALUE_LENGTH = 200;

/** Maximum number of results/signals to process */
const MAX_SIGNALS_TO_PROCESS = 20;
const MAX_SOURCE_URLS = 50;

/** JSON extraction regex patterns */
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;
const JSON_ARRAY_PATTERN = /\[[\s\S]*\]/;

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * Safely parse JSON with error handling
 */
function safeJsonParse<T>(text: string, isArray: boolean = false): T | null {
  try {
    const pattern = isArray ? JSON_ARRAY_PATTERN : JSON_OBJECT_PATTERN;
    const jsonMatch = text.match(pattern);
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
 * Sanitize search query to prevent injection
 */
function sanitizeQuery(query: string, maxLength: number = MAX_QUERY_LENGTH): string {
  if (!query || typeof query !== 'string') return '';
  // Remove potential injection characters and normalize whitespace
  return query
    .replace(/[<>{}|\\]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a string field with length limit
 */
function sanitizeStringField(value: unknown, maxLength: number = MAX_DESCRIPTION_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, maxLength);
}

/**
 * IterativeSearchService
 *
 * Slice 3: Research Quality Improvement - Iterative Search Refinement
 *
 * This service implements intelligent multi-strategy search with query refinement.
 * Instead of running a fixed set of queries, it:
 *
 * 1. Tries different search strategies based on available data
 * 2. Analyzes results to extract "refinement signals" (brand hints, model patterns, etc.)
 * 3. Generates refined queries based on partial matches
 * 4. Stops when a confident match is found or max iterations reached
 *
 * Search strategies (in priority order):
 * - exact_identifier: Search with extracted model numbers/SKUs (highest precision)
 * - brand_model: Search with brand + model combination
 * - ocr_text: Search with raw OCR text chunks
 * - descriptive: Search with category + attributes (broadest)
 * - refined: Search with signals from previous iterations
 */
@Injectable()
export class IterativeSearchService {
  private readonly logger = new Logger(IterativeSearchService.name);
  private openai: OpenAI | null = null;
  private rateLimiter = getRateLimiter('webSearch', RATE_LIMITER_CONFIGS.webSearch);
  private readonly synthesisModel: string;
  private readonly signalModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly webSearchService: WebSearchService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    // Allow models to be configured
    this.synthesisModel = this.configService.get<string>('OPENAI_SYNTHESIS_MODEL') || DEFAULT_SYNTHESIS_MODEL;
    this.signalModel = this.configService.get<string>('OPENAI_SIGNAL_MODEL') || DEFAULT_SIGNAL_MODEL;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('IterativeSearchService initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - iterative search unavailable');
    }
  }

  /**
   * Check if the service is configured and ready
   */
  isConfigured(): boolean {
    return this.openai !== null && this.webSearchService.isServiceConfigured();
  }

  /**
   * Perform iterative search with query refinement
   *
   * @param context - Search context with all available data
   * @param maxIterations - Maximum search iterations (default: 4)
   * @returns Search result with identification and all iterations
   */
  async searchWithRefinement(
    context: IterativeSearchContext,
    maxIterations: number = DEFAULT_MAX_ITERATIONS,
  ): Promise<IterativeSearchResult> {
    const startTime = Date.now();
    const iterations: SearchIteration[] = [];
    let accumulatedSignals: RefinementSignal[] = [];
    let bestIdentification: IterativeSearchIdentification | null = null;
    let bestConfidence = 0;
    let bestStrategy: IterativeSearchStrategy | undefined;

    if (!this.isConfigured()) {
      return {
        identification: null,
        iterations: [],
        totalSearches: 0,
        confidence: 0,
        success: false,
        error: 'IterativeSearchService not configured',
        totalDurationMs: 0,
        totalCost: 0,
      };
    }

    this.logger.debug(`Starting iterative search for item ${context.itemId}`);

    // Determine which strategies to try based on available data
    const strategiesToTry = this.determineStrategies(context);
    this.logger.debug(`Will try strategies: ${strategiesToTry.join(', ')}`);

    let iterationNumber = 0;

    for (const strategy of strategiesToTry) {
      if (iterationNumber >= maxIterations) {
        this.logger.debug(`Max iterations (${maxIterations}) reached, stopping`);
        break;
      }

      if (bestConfidence >= STRONG_MATCH_CONFIDENCE) {
        this.logger.debug(`Strong match found (${bestConfidence.toFixed(2)}), stopping`);
        break;
      }

      iterationNumber++;
      const iterationStart = Date.now();

      try {
        // Build query for this strategy
        const query = this.buildQueryForStrategy(strategy, context, accumulatedSignals);
        if (!query) {
          this.logger.debug(`Skipping strategy ${strategy} - no viable query`);
          continue;
        }

        this.logger.debug(`Iteration ${iterationNumber}: strategy=${strategy}, query="${query}"`);

        // Execute search
        const searchResult = await this.webSearchService.search(query);
        const results = searchResult.content ? [searchResult] : [];

        // Extract refinement signals from results
        const signals = await this.extractRefinementSignals(results, context);
        accumulatedSignals = this.mergeSignals(accumulatedSignals, signals);

        // Check for strong match
        const hasStrongMatch = this.hasStrongMatch(results, signals);

        // Create iteration record
        const iteration: SearchIteration = {
          strategy,
          query,
          results,
          refinementSignals: signals,
          hasStrongMatch,
          iterationNumber,
          durationMs: Date.now() - iterationStart,
        };
        iterations.push(iteration);

        // If we have good results, try to synthesize identification
        if (results.length > 0 && results[0].content) {
          const identification = await this.synthesizeIdentification(
            results,
            context,
            accumulatedSignals,
          );

          if (identification && identification.confidence > bestConfidence) {
            bestIdentification = identification.identification;
            bestConfidence = identification.confidence;
            bestStrategy = strategy;
          }
        }

        // Small delay between iterations to avoid rate limiting
        if (iterationNumber < strategiesToTry.length && iterationNumber < maxIterations) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        this.logger.warn(
          `Iteration ${iterationNumber} (${strategy}) failed: ${sanitizeErrorMessage(error)}`
        );
      }
    }

    // Final synthesis if we have accumulated signals but no identification
    if (!bestIdentification && accumulatedSignals.length > 0) {
      const allResults = iterations.flatMap(i => i.results);
      if (allResults.length > 0) {
        const finalSynthesis = await this.synthesizeIdentification(
          allResults,
          context,
          accumulatedSignals,
        );
        if (finalSynthesis) {
          bestIdentification = finalSynthesis.identification;
          bestConfidence = finalSynthesis.confidence;
        }
      }
    }

    const totalSearches = iterations.length;
    const totalDurationMs = Date.now() - startTime;

    this.logger.log(
      `Iterative search complete: ${totalSearches} searches, ` +
      `confidence=${bestConfidence.toFixed(2)}, ` +
      `duration=${totalDurationMs}ms`
    );

    return {
      identification: bestIdentification,
      iterations,
      totalSearches,
      confidence: bestConfidence,
      bestStrategy,
      success: bestConfidence > 0.5,
      totalDurationMs,
      totalCost: totalSearches * COST_PER_SEARCH,
    };
  }

  /**
   * Determine which strategies to try based on available data
   * Returns strategies in priority order
   */
  private determineStrategies(context: IterativeSearchContext): IterativeSearchStrategy[] {
    const strategies: IterativeSearchStrategy[] = [];

    // Priority 1: Exact identifiers (highest precision)
    if (context.extractedIdentifiers.length > 0 || context.upc || context.mpn) {
      strategies.push('exact_identifier');
    }

    // Priority 2: Brand + Model (if both known)
    if (context.brand && context.model) {
      strategies.push('brand_model');
    }

    // Priority 3: OCR text (if available)
    if (context.ocrTextChunks && context.ocrTextChunks.length > 0) {
      strategies.push('ocr_text');
    }

    // Priority 4: Descriptive (broadest, use if others fail)
    if (context.category || context.visualDescription) {
      strategies.push('descriptive');
    }

    // Priority 5: Refined (uses accumulated signals)
    // Always add refined as it can use signals from previous iterations
    strategies.push('refined');

    return strategies;
  }

  /**
   * Build search query for a specific strategy
   */
  private buildQueryForStrategy(
    strategy: IterativeSearchStrategy,
    context: IterativeSearchContext,
    accumulatedSignals: RefinementSignal[],
  ): string | null {
    switch (strategy) {
      case 'exact_identifier':
        return this.buildExactIdentifierQuery(context);

      case 'brand_model':
        return this.buildBrandModelQuery(context);

      case 'ocr_text':
        return this.buildOcrTextQuery(context);

      case 'descriptive':
        return this.buildDescriptiveQuery(context);

      case 'refined':
        return this.buildRefinedQuery(context, accumulatedSignals);

      default:
        return null;
    }
  }

  /**
   * Build query from exact identifiers (model numbers, SKUs, UPCs)
   */
  private buildExactIdentifierQuery(context: IterativeSearchContext): string | null {
    const parts: string[] = [];

    // UPC gets highest priority - very reliable
    if (context.upc) {
      return `"${context.upc}" product specifications`;
    }

    // MPN second
    if (context.mpn) {
      parts.push(`"${context.mpn}"`);
    }

    // Extracted identifiers (model numbers, SKUs from OCR)
    for (const identifier of context.extractedIdentifiers.slice(0, 2)) {
      if (!parts.includes(`"${identifier}"`)) {
        parts.push(`"${identifier}"`);
      }
    }

    if (parts.length === 0) {
      return null;
    }

    // Add brand if known for context
    if (context.brand && parts.length > 0) {
      return `${context.brand} ${parts.join(' ')} specifications`;
    }

    return `${parts.join(' ')} product specifications`;
  }

  /**
   * Build query from brand + model combination
   */
  private buildBrandModelQuery(context: IterativeSearchContext): string | null {
    if (!context.brand || !context.model) {
      return null;
    }

    let query = `"${context.brand}" "${context.model}"`;

    // Add variant info if available
    const variants: string[] = [];
    if (context.color) variants.push(context.color);
    if (context.size) variants.push(context.size);

    if (variants.length > 0) {
      query += ` ${variants.join(' ')}`;
    }

    return `${query} specifications features`;
  }

  /**
   * Build query from OCR text chunks
   */
  private buildOcrTextQuery(context: IterativeSearchContext): string | null {
    if (!context.ocrTextChunks || context.ocrTextChunks.length === 0) {
      return null;
    }

    // Find the most promising text chunk (looks like model number or brand)
    const modelNumberPattern = /[A-Z]{1,3}[-\s]?\d{3,5}[A-Z]{0,3}/i;
    let bestChunk = context.ocrTextChunks[0];

    for (const chunk of context.ocrTextChunks) {
      if (modelNumberPattern.test(chunk)) {
        bestChunk = chunk;
        break;
      }
    }

    // Clean and quote the chunk
    const cleanChunk = bestChunk.slice(0, 80).trim();
    if (cleanChunk.length < 3) {
      return null;
    }

    return `"${cleanChunk}" product identify specifications`;
  }

  /**
   * Build descriptive query from category and attributes
   */
  private buildDescriptiveQuery(context: IterativeSearchContext): string | null {
    const parts: string[] = [];

    if (context.brand) parts.push(context.brand);
    if (context.category) parts.push(context.category);
    if (context.visualDescription) {
      // Take first 50 chars of visual description
      parts.push(context.visualDescription.slice(0, 50).trim());
    }
    if (context.color) parts.push(context.color);
    if (context.size) parts.push(context.size);

    if (parts.length === 0) {
      return null;
    }

    return `${parts.join(' ')} product specifications`;
  }

  /**
   * Build refined query using accumulated signals
   */
  private buildRefinedQuery(
    context: IterativeSearchContext,
    signals: RefinementSignal[],
  ): string | null {
    if (signals.length === 0) {
      return null;
    }

    const parts: string[] = [];

    // Use high-confidence signals
    const brandSignal = signals.find(s => s.type === 'found_brand' && s.confidence >= MIN_SIGNAL_CONFIDENCE);
    const modelSignal = signals.find(s => s.type === 'found_model' && s.confidence >= MIN_SIGNAL_CONFIDENCE);
    const categorySignal = signals.find(s => s.type === 'found_category' && s.confidence >= MIN_SIGNAL_CONFIDENCE);
    const variantSignal = signals.find(s => s.type === 'found_variant' && s.confidence >= MIN_SIGNAL_CONFIDENCE);

    // Prefer signals over original context when confident
    const brand = brandSignal?.value || context.brand;
    const model = modelSignal?.value || context.model;
    const category = categorySignal?.value || context.category;
    const variant = variantSignal?.value;

    if (brand) parts.push(`"${brand}"`);
    if (model) parts.push(`"${model}"`);
    if (category) parts.push(category);
    if (variant) parts.push(variant);

    if (parts.length === 0) {
      return null;
    }

    return `${parts.join(' ')} product specifications`;
  }

  /**
   * Extract refinement signals from search results
   * Uses AI to analyze results and extract hints for better queries
   */
  private async extractRefinementSignals(
    results: WebSearchResult[],
    context: IterativeSearchContext,
  ): Promise<RefinementSignal[]> {
    const signals: RefinementSignal[] = [];

    // Check for no results
    if (results.length === 0 || !results[0].content) {
      signals.push({
        type: 'no_results',
        value: 'No results found',
        confidence: 1.0,
      });
      return signals;
    }

    // Use AI to extract signals from results
    if (!this.openai) {
      return signals;
    }

    try {
      await this.rateLimiter.acquire();

      const content = results.map(r => r.content || '').join('\n\n---\n\n').slice(0, MAX_CONTENT_LENGTH_SIGNALS);

      // Sanitize context values to prevent prompt injection
      const sanitizedBrand = sanitizeQuery(context.brand || 'unknown', MAX_IDENTIFIER_LENGTH);
      const sanitizedModel = sanitizeQuery(context.model || 'unknown', MAX_IDENTIFIER_LENGTH);
      const sanitizedCategory = sanitizeQuery(context.category || 'unknown', MAX_IDENTIFIER_LENGTH);

      const response = await this.openai.chat.completions.create({
        model: this.signalModel, // Use configurable model
        messages: [
          {
            role: 'system',
            content: `You are a product identification expert. Analyze search results and extract signals that could help refine product identification.

Extract any of these signal types if found with confidence:
- found_brand: A specific brand name clearly identified
- found_model: A specific model number/name clearly identified
- found_variant: Product variant info (color, size, edition)
- found_category: Product category identified
- price_cluster: Multiple similar prices found (suggests correct product)
- ambiguous_results: Results point to multiple different products

Return JSON array:
[{"type": "signal_type", "value": "extracted_value", "confidence": 0.0-1.0, "context": "brief explanation"}]

Only include signals you're confident about. Return [] if no clear signals.`,
          },
          {
            role: 'user',
            content: `Search results to analyze:\n\n${content}\n\nExisting context:\n- Brand: ${sanitizedBrand}\n- Model: ${sanitizedModel}\n- Category: ${sanitizedCategory}`,
          },
        ],
        max_tokens: MAX_TOKENS_SIGNALS,
        temperature: TEMPERATURE,
      });

      const responseContent = response.choices[0]?.message?.content;
      if (responseContent) {
        // Use safe JSON parsing
        const parsed = safeJsonParse<RefinementSignal[]>(responseContent, true);
        if (parsed && Array.isArray(parsed)) {
          // Validate and sanitize each signal
          for (const signal of parsed.slice(0, MAX_SIGNALS_TO_PROCESS)) {
            if (
              signal &&
              typeof signal.type === 'string' &&
              typeof signal.value === 'string' &&
              typeof signal.confidence === 'number'
            ) {
              signals.push({
                type: signal.type as RefinementSignal['type'],
                value: signal.value.slice(0, MAX_SIGNAL_VALUE_LENGTH),
                confidence: Math.min(1, Math.max(0, signal.confidence)),
                context: typeof signal.context === 'string' ? signal.context.slice(0, MAX_DESCRIPTION_LENGTH) : undefined,
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to extract refinement signals: ${sanitizeErrorMessage(error)}`);
    }

    return signals;
  }

  /**
   * Merge new signals with accumulated signals
   * Higher confidence signals replace lower confidence ones
   */
  private mergeSignals(
    existing: RefinementSignal[],
    newSignals: RefinementSignal[],
  ): RefinementSignal[] {
    const merged = new Map<string, RefinementSignal>();

    // Add existing signals
    for (const signal of existing) {
      const key = signal.type;
      const current = merged.get(key);
      if (!current || signal.confidence > current.confidence) {
        merged.set(key, signal);
      }
    }

    // Add/update with new signals
    for (const signal of newSignals) {
      const key = signal.type;
      const current = merged.get(key);
      if (!current || signal.confidence > current.confidence) {
        merged.set(key, signal);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Check if results indicate a strong match
   */
  private hasStrongMatch(
    results: WebSearchResult[],
    signals: RefinementSignal[],
  ): boolean {
    // No results = no match
    if (results.length === 0 || !results[0].content) {
      return false;
    }

    // Check signals for strong indicators
    const brandSignal = signals.find(s => s.type === 'found_brand');
    const modelSignal = signals.find(s => s.type === 'found_model');
    const priceCluster = signals.find(s => s.type === 'price_cluster');

    // Strong match if we have brand + model with good confidence
    if (brandSignal && modelSignal) {
      const avgConfidence = (brandSignal.confidence + modelSignal.confidence) / 2;
      if (avgConfidence >= STRONG_MATCH_CONFIDENCE) {
        return true;
      }
    }

    // Strong match if we have price cluster (suggests correct product)
    if (priceCluster && priceCluster.confidence >= 0.8) {
      return true;
    }

    return false;
  }

  /**
   * Synthesize product identification from search results and signals
   */
  private async synthesizeIdentification(
    results: WebSearchResult[],
    context: IterativeSearchContext,
    signals: RefinementSignal[],
  ): Promise<{ identification: IterativeSearchIdentification; confidence: number } | null> {
    if (!this.openai || results.length === 0) {
      return null;
    }

    try {
      await this.rateLimiter.acquire();

      const content = results.map(r => r.content || '').join('\n\n---\n\n').slice(0, MAX_CONTENT_LENGTH_SYNTHESIS);
      const signalSummary = signals
        .filter(s => s.confidence >= MIN_SIGNAL_CONFIDENCE)
        .slice(0, MAX_SIGNALS_TO_PROCESS)
        .map(s => `${s.type}: ${s.value.slice(0, 50)} (${(s.confidence * 100).toFixed(0)}%)`)
        .join(', ');

      // Sanitize context values to prevent prompt injection
      const sanitizedBrand = sanitizeQuery(context.brand || 'unknown', MAX_IDENTIFIER_LENGTH);
      const sanitizedModel = sanitizeQuery(context.model || 'unknown', MAX_IDENTIFIER_LENGTH);
      const sanitizedCategory = sanitizeQuery(context.category || 'unknown', MAX_IDENTIFIER_LENGTH);

      const response = await this.openai.chat.completions.create({
        model: this.synthesisModel, // Use configurable model
        messages: [
          {
            role: 'system',
            content: `You are a product identification expert. Synthesize product information from search results.

Return JSON with confidence score (0-1):
{
  "confidence": 0.0-1.0,
  "brand": "brand name or null",
  "model": "model name/number or null",
  "mpn": "manufacturer part number or null",
  "upc": "UPC/barcode or null",
  "title": "suggested product title or null",
  "description": "brief product description or null",
  "category": ["category", "path"] or null,
  "specifications": {"key": "value"} or null
}

Be precise - only include fields you're confident about.
Calculate confidence based on: brand verified (+0.2), model verified (+0.25), multiple sources agree (+0.2), specifications found (+0.15), category determined (+0.1).`,
          },
          {
            role: 'user',
            content: `Search results:\n${content}\n\nExtracted signals: ${signalSummary || 'none'}\n\nExisting context:\n- Brand: ${sanitizedBrand}\n- Model: ${sanitizedModel}\n- Category: ${sanitizedCategory}`,
          },
        ],
        max_tokens: MAX_TOKENS_SYNTHESIS,
        temperature: TEMPERATURE,
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        return null;
      }

      // Use safe JSON parsing
      interface SynthesisResponse {
        confidence?: number;
        brand?: string;
        model?: string;
        mpn?: string;
        upc?: string;
        title?: string;
        description?: string;
        category?: string[];
        specifications?: Record<string, string>;
      }

      const parsed = safeJsonParse<SynthesisResponse>(responseContent);
      if (!parsed) {
        return null;
      }

      const confidence = Math.min(1, Math.max(0, typeof parsed.confidence === 'number' ? parsed.confidence : 0));

      // Collect and limit source URLs
      const sourceUrls = results
        .flatMap(r => r.sources || [])
        .filter((url): url is string => typeof url === 'string')
        .slice(0, MAX_SOURCE_URLS);

      return {
        identification: {
          brand: sanitizeStringField(parsed.brand, MAX_IDENTIFIER_LENGTH),
          model: sanitizeStringField(parsed.model, MAX_IDENTIFIER_LENGTH),
          mpn: sanitizeStringField(parsed.mpn, MAX_IDENTIFIER_LENGTH),
          upc: sanitizeStringField(parsed.upc, MAX_IDENTIFIER_LENGTH),
          title: sanitizeStringField(parsed.title, MAX_DESCRIPTION_LENGTH),
          description: sanitizeStringField(parsed.description, MAX_DESCRIPTION_LENGTH),
          category: Array.isArray(parsed.category)
            ? parsed.category.filter((c): c is string => typeof c === 'string').slice(0, 5).map(c => c.slice(0, 100))
            : undefined,
          specifications: typeof parsed.specifications === 'object' && parsed.specifications !== null
            ? this.sanitizeSpecifications(parsed.specifications)
            : undefined,
          sourceUrls,
        },
        confidence,
      };
    } catch (error) {
      this.logger.warn(`Failed to synthesize identification: ${sanitizeErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Sanitize specifications object
   */
  private sanitizeSpecifications(specs: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    let count = 0;
    for (const [key, value] of Object.entries(specs)) {
      if (count >= 50) break;
      if (typeof key === 'string' && key.length <= 100) {
        const sanitizedValue = typeof value === 'string' ? value.slice(0, 500) : String(value).slice(0, 500);
        sanitized[key.slice(0, 100)] = sanitizedValue;
        count++;
      }
    }
    return sanitized;
  }
}
