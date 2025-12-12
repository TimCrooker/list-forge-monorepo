/**
 * Advanced Research Tools - Slice 2
 *
 * Tools for deep research access:
 * - UPC/barcode lookup
 * - Web search for product information
 * - Reverse image search for product identification
 * - Category detection for marketplace categorization
 * - OCR text extraction from item photos
 * - Image comparison for visual similarity
 *
 * These tools allow users to leverage advanced AI research capabilities.
 */

import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext } from './index';

// ============================================================================
// Schemas
// ============================================================================

export const LookupUpcSchema = z.object({
  code: z
    .string()
    .min(8, 'UPC/EAN code must be at least 8 digits')
    .max(14, 'UPC/EAN code must be at most 14 digits')
    .regex(/^[\d\s\-]+$/, 'UPC/EAN code must contain only digits, spaces, or hyphens')
    .describe('The UPC or EAN barcode to look up (8-14 digits)'),
});

export const WebSearchProductSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .optional()
    .describe('Optional item ID to get attributes from'),
  query: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(200, 'Query too long')
    .optional()
    .describe('Custom search query (overrides item attributes)'),
  brand: z.string().max(100, 'Brand too long').optional().describe('Brand name to search for'),
  model: z.string().max(100, 'Model too long').optional().describe('Model number to search for'),
  category: z.string().max(100, 'Category too long').optional().describe('Product category'),
}).refine(
  (data) => data.itemId || data.query || data.brand || data.model,
  { message: 'At least one of itemId, query, brand, or model must be provided', path: ['query'] },
);

export const ReverseImageSearchSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .optional()
    .describe('Item ID to get photos from'),
  imageUrl: z
    .string()
    .url('Must be a valid URL')
    .max(2048, 'URL too long')
    .optional()
    .describe('Direct image URL to search (if not using itemId)'),
}).refine(
  (data) => data.itemId || data.imageUrl,
  { message: 'Either itemId or imageUrl must be provided', path: ['imageUrl'] },
);

export const DetectCategorySchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .optional()
    .describe('Item ID to detect category for'),
  title: z.string().max(500, 'Title too long').optional().describe('Product title'),
  description: z.string().max(2000, 'Description too long').optional().describe('Product description'),
  brand: z.string().max(100, 'Brand too long').optional().describe('Brand name'),
  imageUrls: z
    .array(z.string().url('Must be a valid URL'))
    .max(4, 'Maximum 4 images')
    .optional()
    .describe('Image URLs to analyze'),
}).refine(
  (data) => data.itemId || data.title || data.imageUrls?.length,
  { message: 'At least one of itemId, title, or imageUrls must be provided', path: ['title'] },
);

export const ExtractTextFromImageSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .optional()
    .describe('Item ID to get photos from'),
  imageUrls: z
    .array(z.string().url('Must be a valid URL'))
    .max(5, 'Maximum 5 images')
    .optional()
    .describe('Direct image URLs to extract text from'),
  photoIndex: z
    .number()
    .int('Must be an integer')
    .min(0, 'Index must be non-negative')
    .optional()
    .describe('Specific photo index to extract from (for itemId)'),
}).refine(
  (data) => data.itemId || (data.imageUrls && data.imageUrls.length > 0),
  { message: 'Either itemId or imageUrls must be provided', path: ['imageUrls'] },
);

export const CompareImagesSchema = z.object({
  itemId: z
    .string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .describe('Item ID to compare'),
  compImageUrl: z
    .string()
    .url('Must be a valid URL')
    .max(2048, 'URL too long')
    .describe('URL of the comparable listing image'),
  compId: z.string().optional().describe('Optional comp ID for reference'),
});

// ============================================================================
// Extended ChatToolDependencies Interface
// ============================================================================

/**
 * Additional dependencies for advanced research tools
 */
export interface AdvancedResearchToolDependencies {
  /** Look up product info from UPC/EAN barcode */
  lookupUpc: (code: string) => Promise<{
    found: boolean;
    upc: string;
    brand?: string;
    name?: string;
    description?: string;
    category?: string;
    imageUrl?: string;
    cached?: boolean;
  }>;

  /** Search the web for product information */
  webSearchProduct: (params: {
    brand?: string;
    model?: string;
    category?: string;
    upc?: string;
    extractedText?: string;
    attributes?: Record<string, string>;
    color?: string;
    size?: string;
    mpn?: string;
  }) => Promise<{
    results: Array<{
      query: string;
      content: string;
      sources: string[];
      timestamp: string;
      error?: string;
    }>;
    successCount: number;
    failedCount: number;
  }>;

  /** Synthesize product data from search results */
  synthesizeProductData?: (
    searchResults: Array<{ query: string; content: string; sources: string[] }>,
    existingData: { brand?: string; model?: string; category?: string; attributes?: Record<string, string> },
  ) => Promise<{
    confidence: number;
    brand: string | null;
    model: string | null;
    mpn: string | null;
    upc: string | null;
    title: string | null;
    description: string | null;
    category: string[];
    condition: string | null;
    specifications: Record<string, string | number | boolean>;
    sources: string[];
  }>;

  /** Perform reverse image search */
  reverseImageSearch: (imageUrl: string) => Promise<{
    provider: string;
    searchedImageUrl: string;
    matches: Array<{
      title: string;
      brand?: string;
      model?: string;
      category?: string;
      price?: number;
      currency?: string;
      sourceUrl: string;
      sourceDomain?: string;
      matchingImageUrl?: string;
      confidence: number;
      attributes?: Record<string, string>;
    }>;
    bestMatch?: {
      title: string;
      brand?: string;
      model?: string;
      confidence: number;
    };
    confidence: number;
    success: boolean;
    error?: string;
    cached?: boolean;
  }>;

  /** Detect product category */
  detectCategory: (context: {
    imageUrls: string[];
    title?: string;
    description?: string;
    brand?: string;
    category?: string;
    userHints?: string;
  }) => Promise<{
    categoryId: string;
    confidence: number;
    reasoning: string;
    alternatives?: Array<{ categoryId: string; confidence: number }>;
  }>;

  /** Extract text from images using OCR */
  extractTextFromImage: (imageUrls: string[]) => Promise<{
    upc?: string;
    ean?: string;
    modelNumber?: string;
    serialNumber?: string;
    mpn?: string;
    rawText: string[];
    labels: Record<string, string>;
    confidence: number;
    textChunks?: Array<{
      text: string;
      isLikelyIdentifier: boolean;
      suggestedType?: string;
    }>;
  }>;

  /** Compare images for visual similarity */
  compareImages: (
    itemImages: string[],
    compImages: string[],
  ) => Promise<{
    similarityScore: number;
    isSameProduct: boolean;
    reasoning: string;
    cached: boolean;
  }>;
}

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Lookup UPC Tool
 *
 * Looks up product information from a UPC or EAN barcode.
 */
export function lookupUpcTool(
  deps: ChatToolDependencies & Partial<AdvancedResearchToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof LookupUpcSchema>) => {
      try {
        if (!deps.lookupUpc) {
          return JSON.stringify({
            error: true,
            message: 'UPC lookup not available. This feature requires UPC database integration.',
          });
        }

        const result = await deps.lookupUpc(input.code);

        if (!result.found) {
          return JSON.stringify({
            found: false,
            code: input.code,
            message: `No product found for UPC/EAN: ${input.code}`,
            suggestion: 'The barcode may be invalid, damaged, or not in the database. Try entering manually.',
          });
        }

        return JSON.stringify(
          {
            found: true,
            code: result.upc,
            product: {
              brand: result.brand,
              name: result.name,
              description: result.description,
              category: result.category,
              imageUrl: result.imageUrl,
            },
            cached: result.cached,
            message: result.name
              ? `Found: ${result.brand ? result.brand + ' ' : ''}${result.name}`
              : 'Product found but limited information available.',
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to lookup UPC: ${message}`,
        });
      }
    },
    {
      name: 'lookup_upc',
      description: `Look up product information from a UPC or EAN barcode.

Supports:
- UPC-A (12 digits)
- UPC-E (8 digits)
- EAN-13 (13 digits)
- EAN-8 (8 digits)

Returns product information including:
- Brand name
- Product name
- Description
- Category
- Product image

Use this when users mention a barcode, UPC, or when you see numbers that look like barcodes (8-14 digits).`,
      schema: LookupUpcSchema,
    },
  );
}

/**
 * Web Search Product Tool
 *
 * Searches the web for product information using AI-powered search.
 */
export function webSearchProductTool(
  deps: ChatToolDependencies & Partial<AdvancedResearchToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof WebSearchProductSchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.webSearchProduct) {
          return JSON.stringify({
            error: true,
            message: 'Web search not available. This feature requires OpenAI API integration.',
          });
        }

        // Build search params
        const searchParams: Parameters<typeof deps.webSearchProduct>[0] = {
          brand: input.brand,
          model: input.model,
          category: input.category,
        };

        // If itemId provided, get item attributes
        if (input.itemId) {
          const item = await deps.getItem(ctx.organizationId, input.itemId);
          if (item) {
            searchParams.brand = searchParams.brand || item.attributes?.find((a: any) => a.key.toLowerCase() === 'brand')?.value;
            searchParams.model = searchParams.model || item.attributes?.find((a: any) => a.key.toLowerCase() === 'model')?.value;
            searchParams.category = searchParams.category || item.category;
            // Add other useful attributes
            const attrs: Record<string, string> = {};
            for (const attr of (item.attributes || [])) {
              attrs[attr.key.toLowerCase()] = attr.value;
            }
            searchParams.attributes = attrs;
          }
        }

        // Add custom query if provided (for direct search)
        if (input.query) {
          // Parse query into potential brand/model
          const words = input.query.split(' ');
          if (!searchParams.brand && words.length > 0) {
            searchParams.brand = words[0];
          }
          if (!searchParams.model && words.length > 1) {
            searchParams.model = words.slice(1).join(' ');
          }
        }

        const searchResult = await deps.webSearchProduct(searchParams);

        if (searchResult.successCount === 0) {
          return JSON.stringify({
            found: false,
            message: 'No search results found.',
            failedCount: searchResult.failedCount,
            suggestion: 'Try providing more specific information like brand name or model number.',
          });
        }

        // If synthesize is available, use it to extract structured data
        let synthesized = null;
        if (deps.synthesizeProductData && searchResult.results.length > 0) {
          synthesized = await deps.synthesizeProductData(
            searchResult.results,
            { brand: searchParams.brand, model: searchParams.model, category: searchParams.category },
          );
        }

        return JSON.stringify(
          {
            found: true,
            searchCount: searchResult.successCount,
            failedCount: searchResult.failedCount,
            synthesizedData: synthesized
              ? {
                  confidence: `${Math.round(synthesized.confidence * 100)}%`,
                  brand: synthesized.brand,
                  model: synthesized.model,
                  mpn: synthesized.mpn,
                  upc: synthesized.upc,
                  title: synthesized.title,
                  description: synthesized.description?.substring(0, 300),
                  category: synthesized.category,
                  specifications: synthesized.specifications,
                }
              : null,
            rawResults: searchResult.results.slice(0, 3).map((r) => ({
              query: r.query,
              contentPreview: r.content.substring(0, 200),
              sources: r.sources.slice(0, 3),
            })),
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to search web: ${message}`,
        });
      }
    },
    {
      name: 'web_search_product',
      description: `Search the web for product information using AI-powered search.

Options:
- itemId: Use item's attributes for search
- query: Custom search query
- brand: Brand name to search
- model: Model number to search
- category: Product category

Returns:
- Synthesized product data (brand, model, UPC, description, specifications)
- Raw search results with content previews
- Source URLs for verification

Use this when users ask to "search for", "find info on", or when you need more product details.`,
      schema: WebSearchProductSchema,
    },
  );
}

/**
 * Reverse Image Search Tool
 *
 * Uses Google Lens-style visual search to identify products from images.
 */
export function reverseImageSearchTool(
  deps: ChatToolDependencies & Partial<AdvancedResearchToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof ReverseImageSearchSchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.reverseImageSearch) {
          return JSON.stringify({
            error: true,
            message: 'Reverse image search not available. This feature requires Google Cloud Vision or SerpAPI integration.',
          });
        }

        let imageUrl = input.imageUrl;

        // If itemId provided, get primary image
        if (input.itemId && !imageUrl) {
          const item = await deps.getItem(ctx.organizationId, input.itemId);
          if (item && item.media && item.media.length > 0) {
            imageUrl = item.media[0].url;
          } else {
            return JSON.stringify({
              error: true,
              message: `Item ${input.itemId} has no images to search.`,
            });
          }
        }

        if (!imageUrl) {
          return JSON.stringify({
            error: true,
            message: 'No image URL available for search.',
          });
        }

        const result = await deps.reverseImageSearch(imageUrl);

        if (!result.success || result.matches.length === 0) {
          return JSON.stringify({
            found: false,
            message: result.error || 'No visual matches found.',
            provider: result.provider,
            suggestion: 'Try with a clearer image or different angle.',
          });
        }

        // Format top matches
        const topMatches = result.matches.slice(0, 5).map((m) => ({
          title: m.title,
          brand: m.brand,
          model: m.model,
          price: m.price ? `$${m.price.toFixed(2)}` : undefined,
          source: m.sourceDomain,
          confidence: `${Math.round(m.confidence * 100)}%`,
          url: m.sourceUrl,
        }));

        return JSON.stringify(
          {
            found: true,
            provider: result.provider,
            matchCount: result.matches.length,
            overallConfidence: `${Math.round(result.confidence * 100)}%`,
            bestMatch: result.bestMatch
              ? {
                  title: result.bestMatch.title,
                  brand: result.bestMatch.brand,
                  model: result.bestMatch.model,
                  confidence: `${Math.round(result.bestMatch.confidence * 100)}%`,
                }
              : null,
            topMatches,
            cached: result.cached,
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to search image: ${message}`,
        });
      }
    },
    {
      name: 'reverse_image_search',
      description: `Find products using reverse image search (Google Lens-style).

Options:
- itemId: Use item's primary photo for search
- imageUrl: Direct URL to search

Returns:
- Best match with brand, model, confidence
- Top matching products from the web
- Prices and source URLs where available

Use this when users ask "find similar items", "what is this product?", or for visual identification.`,
      schema: ReverseImageSearchSchema,
    },
  );
}

/**
 * Detect Category Tool
 *
 * Detects the product category for marketplace categorization.
 */
export function detectCategoryTool(
  deps: ChatToolDependencies & Partial<AdvancedResearchToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof DetectCategorySchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.detectCategory) {
          return JSON.stringify({
            error: true,
            message: 'Category detection not available. This feature requires OpenAI API integration.',
          });
        }

        // Build detection context
        const context: Parameters<typeof deps.detectCategory>[0] = {
          imageUrls: input.imageUrls || [],
          title: input.title,
          description: input.description,
          brand: input.brand,
        };

        // If itemId provided, get item data
        if (input.itemId) {
          const item = await deps.getItem(ctx.organizationId, input.itemId);
          if (item) {
            context.title = context.title || item.title;
            context.description = context.description || item.description;
            context.brand = context.brand || item.attributes?.find((a: any) => a.key.toLowerCase() === 'brand')?.value;
            if (item.media && item.media.length > 0 && context.imageUrls.length === 0) {
              context.imageUrls = item.media.slice(0, 4).map((m: any) => m.url);
            }
          }
        }

        const result = await deps.detectCategory(context);

        // Format alternatives
        const alternatives = result.alternatives?.map((a) => ({
          category: a.categoryId,
          confidence: `${Math.round(a.confidence * 100)}%`,
        }));

        return JSON.stringify(
          {
            categoryId: result.categoryId,
            confidence: `${Math.round(result.confidence * 100)}%`,
            reasoning: result.reasoning,
            alternatives: alternatives?.slice(0, 3),
            message: `Detected category: ${result.categoryId} (${Math.round(result.confidence * 100)}% confidence)`,
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to detect category: ${message}`,
        });
      }
    },
    {
      name: 'detect_category',
      description: `Detect the product category for marketplace categorization.

Options:
- itemId: Detect category from item's data and photos
- title: Product title to analyze
- description: Product description
- brand: Brand name (helps narrow category)
- imageUrls: Product images for visual detection

Returns:
- Detected category ID
- Confidence score
- Reasoning for the detection
- Alternative categories if uncertain

Use this when users ask "what category?", "where should I list this?", or for eBay/Amazon categorization.`,
      schema: DetectCategorySchema,
    },
  );
}

/**
 * Extract Text from Image Tool
 *
 * Uses OCR to extract text from product images.
 */
export function extractTextFromImageTool(
  deps: ChatToolDependencies & Partial<AdvancedResearchToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof ExtractTextFromImageSchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.extractTextFromImage) {
          return JSON.stringify({
            error: true,
            message: 'OCR not available. This feature requires OpenAI API integration.',
          });
        }

        let imageUrls = input.imageUrls || [];

        // If itemId provided, get item images
        if (input.itemId && imageUrls.length === 0) {
          const item = await deps.getItem(ctx.organizationId, input.itemId);
          if (item && item.media && item.media.length > 0) {
            if (input.photoIndex !== undefined && input.photoIndex < item.media.length) {
              // Specific photo
              imageUrls = [item.media[input.photoIndex].url];
            } else {
              // All photos (limit to 5)
              imageUrls = item.media.slice(0, 5).map((m: any) => m.url);
            }
          } else {
            return JSON.stringify({
              error: true,
              message: `Item ${input.itemId} has no images.`,
            });
          }
        }

        if (imageUrls.length === 0) {
          return JSON.stringify({
            error: true,
            message: 'No image URLs provided.',
          });
        }

        const result = await deps.extractTextFromImage(imageUrls);

        // Format identifiers found
        const identifiers: Record<string, string | undefined> = {
          upc: result.upc,
          ean: result.ean,
          modelNumber: result.modelNumber,
          serialNumber: result.serialNumber,
          mpn: result.mpn,
        };

        // Filter out undefined
        const foundIdentifiers = Object.entries(identifiers)
          .filter(([_, v]) => v)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

        // Format likely identifiers from text chunks
        const likelyIdentifiers = result.textChunks
          ?.filter((c) => c.isLikelyIdentifier)
          .map((c) => ({
            text: c.text,
            type: c.suggestedType || 'unknown',
          }));

        return JSON.stringify(
          {
            imagesProcessed: imageUrls.length,
            confidence: `${Math.round(result.confidence * 100)}%`,
            identifiers: Object.keys(foundIdentifiers).length > 0 ? foundIdentifiers : null,
            labels: Object.keys(result.labels).length > 0 ? result.labels : null,
            rawText: result.rawText.slice(0, 20), // Limit raw text
            likelyIdentifiers: likelyIdentifiers?.slice(0, 5),
            message:
              Object.keys(foundIdentifiers).length > 0
                ? `Found ${Object.keys(foundIdentifiers).length} identifier(s)`
                : 'No product identifiers found in images.',
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to extract text: ${message}`,
        });
      }
    },
    {
      name: 'extract_text_from_image',
      description: `Extract text from product images using OCR.

Options:
- itemId: Extract from item's photos
- imageUrls: Direct image URLs to process
- photoIndex: Specific photo index (for itemId)

Extracts:
- UPC/EAN barcodes
- Model numbers
- Serial numbers
- MPN (Manufacturer Part Number)
- Label text (key-value pairs)
- All visible text

Use this when users ask "what text is in photo X?", "can you read the label?", or to find hidden identifiers.`,
      schema: ExtractTextFromImageSchema,
    },
  );
}

/**
 * Compare Images Tool
 *
 * Compares item images with comparable listing images for visual similarity.
 */
export function compareImagesTool(
  deps: ChatToolDependencies & Partial<AdvancedResearchToolDependencies>,
): StructuredTool {
  return tool(
    async (input: z.infer<typeof CompareImagesSchema>) => {
      const ctx = getToolContext();

      try {
        if (!deps.compareImages) {
          return JSON.stringify({
            error: true,
            message: 'Image comparison not available. This feature requires OpenAI API integration.',
          });
        }

        // Get item images
        const item = await deps.getItem(ctx.organizationId, input.itemId);
        if (!item || !item.media || item.media.length === 0) {
          return JSON.stringify({
            error: true,
            message: `Item ${input.itemId} has no images to compare.`,
          });
        }

        const itemImages = item.media.map((m: any) => m.url);
        const result = await deps.compareImages(itemImages, [input.compImageUrl]);

        // Interpret score
        let verdict: string;
        if (result.similarityScore >= 0.95) {
          verdict = 'Definite match - Same product';
        } else if (result.similarityScore >= 0.80) {
          verdict = 'Very likely match - Same model';
        } else if (result.similarityScore >= 0.50) {
          verdict = 'Possible match - Verify manually';
        } else if (result.similarityScore >= 0.20) {
          verdict = 'Probably different - Different model';
        } else {
          verdict = 'Not a match - Different product';
        }

        return JSON.stringify(
          {
            similarityScore: `${Math.round(result.similarityScore * 100)}%`,
            isSameProduct: result.isSameProduct,
            verdict,
            reasoning: result.reasoning,
            cached: result.cached,
            compId: input.compId,
          },
          null,
          2,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to compare images: ${message}`,
        });
      }
    },
    {
      name: 'compare_images',
      description: `Compare item images with comparable listing images for visual similarity.

Required:
- itemId: Item to compare
- compImageUrl: URL of the comparable listing image
- compId: Optional comp ID for reference

Returns:
- Similarity score (0-100%)
- Whether images show the same product
- Verdict (definite match, likely match, possible, probably different, not a match)
- AI reasoning

Use this when users ask "how similar?", "is this the same product?", or to verify comp relevance.`,
      schema: CompareImagesSchema,
    },
  );
}
