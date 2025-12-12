/**
 * Advanced Research Tools Tests - Slice 2
 *
 * Tests for advanced research tools that provide external lookups and AI analysis:
 * - lookup_upc: Look up product info from UPC/EAN barcode
 * - web_search_product: Search the web for product information
 * - reverse_image_search: Find products using reverse image search
 * - detect_category: Detect product category for marketplace categorization
 * - extract_text_from_image: Extract text from images using OCR
 * - compare_images: Compare item images with comparable listing images
 */

import {
  lookupUpcTool,
  webSearchProductTool,
  reverseImageSearchTool,
  detectCategoryTool,
  extractTextFromImageTool,
  compareImagesTool,
  LookupUpcSchema,
  WebSearchProductSchema,
  ReverseImageSearchSchema,
  DetectCategorySchema,
  ExtractTextFromImageSchema,
  CompareImagesSchema,
} from '../research-advanced.tools';
import { ChatToolDependencies, runWithToolContext } from '../index';
import { StructuredTool } from '@langchain/core/tools';

describe('Advanced Research Tools', () => {
  // ============================================================================
  // Mock Dependencies
  // ============================================================================
  const createMockDeps = (overrides: Partial<ChatToolDependencies> = {}): ChatToolDependencies => ({
    getItem: jest.fn(),
    updateItem: jest.fn(),
    searchItems: jest.fn(),
    getLatestResearch: jest.fn(),
    searchComps: jest.fn(),
    startResearchJob: jest.fn(),
    searchEvidence: jest.fn(),
    getDashboardStats: jest.fn(),
    getReviewQueueStats: jest.fn(),
    emitAction: jest.fn(),
    ...overrides,
  });

  const mockContext = {
    userId: 'user-123',
    organizationId: 'org-123',
    sessionId: 'session-123',
    itemId: 'item-123',
  };

  // Helper to run tool with context
  async function invokeWithContext<T>(tool: StructuredTool, input: T): Promise<string> {
    return runWithToolContext(mockContext, async () => {
      return tool.invoke(input as any);
    });
  }

  // ============================================================================
  // Schema Validation Tests
  // ============================================================================
  describe('Schema Validation', () => {
    describe('LookupUpcSchema', () => {
      it('should accept valid 12-digit UPC', () => {
        const result = LookupUpcSchema.safeParse({ code: '012345678901' });
        expect(result.success).toBe(true);
      });

      it('should accept valid 13-digit EAN', () => {
        const result = LookupUpcSchema.safeParse({ code: '0123456789012' });
        expect(result.success).toBe(true);
      });

      it('should accept 8-digit UPC-E', () => {
        const result = LookupUpcSchema.safeParse({ code: '01234567' });
        expect(result.success).toBe(true);
      });

      it('should accept code with spaces or hyphens', () => {
        const result = LookupUpcSchema.safeParse({ code: '012-3456-78901' });
        expect(result.success).toBe(true);
      });

      it('should reject code shorter than 8 digits', () => {
        const result = LookupUpcSchema.safeParse({ code: '1234567' });
        expect(result.success).toBe(false);
      });

      it('should reject code longer than 14 digits', () => {
        const result = LookupUpcSchema.safeParse({ code: '123456789012345' });
        expect(result.success).toBe(false);
      });

      it('should reject code with letters', () => {
        const result = LookupUpcSchema.safeParse({ code: '012345ABC901' });
        expect(result.success).toBe(false);
      });
    });

    describe('WebSearchProductSchema', () => {
      it('should accept itemId only', () => {
        const result = WebSearchProductSchema.safeParse({ itemId: 'item-123' });
        expect(result.success).toBe(true);
      });

      it('should accept query only', () => {
        const result = WebSearchProductSchema.safeParse({ query: 'Nike Air Jordan' });
        expect(result.success).toBe(true);
      });

      it('should accept brand and model combination', () => {
        const result = WebSearchProductSchema.safeParse({
          brand: 'Apple',
          model: 'iPhone 15 Pro',
        });
        expect(result.success).toBe(true);
      });

      it('should reject when no search criteria provided', () => {
        const result = WebSearchProductSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject query shorter than 2 characters', () => {
        const result = WebSearchProductSchema.safeParse({ query: 'a' });
        expect(result.success).toBe(false);
      });

      it('should reject query exceeding max length', () => {
        const result = WebSearchProductSchema.safeParse({ query: 'a'.repeat(201) });
        expect(result.success).toBe(false);
      });

      it('should accept all optional fields together', () => {
        const result = WebSearchProductSchema.safeParse({
          itemId: 'item-123',
          query: 'custom search',
          brand: 'Sony',
          model: 'WH-1000XM4',
          category: 'headphones',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('ReverseImageSearchSchema', () => {
      it('should accept itemId only', () => {
        const result = ReverseImageSearchSchema.safeParse({ itemId: 'item-123' });
        expect(result.success).toBe(true);
      });

      it('should accept imageUrl only', () => {
        const result = ReverseImageSearchSchema.safeParse({
          imageUrl: 'https://example.com/image.jpg',
        });
        expect(result.success).toBe(true);
      });

      it('should accept both itemId and imageUrl', () => {
        const result = ReverseImageSearchSchema.safeParse({
          itemId: 'item-123',
          imageUrl: 'https://example.com/image.jpg',
        });
        expect(result.success).toBe(true);
      });

      it('should reject when neither itemId nor imageUrl provided', () => {
        const result = ReverseImageSearchSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject invalid URL', () => {
        const result = ReverseImageSearchSchema.safeParse({
          imageUrl: 'not-a-valid-url',
        });
        expect(result.success).toBe(false);
      });

      it('should reject URL exceeding max length', () => {
        const result = ReverseImageSearchSchema.safeParse({
          imageUrl: 'https://example.com/' + 'a'.repeat(2050),
        });
        expect(result.success).toBe(false);
      });
    });

    describe('DetectCategorySchema', () => {
      it('should accept itemId only', () => {
        const result = DetectCategorySchema.safeParse({ itemId: 'item-123' });
        expect(result.success).toBe(true);
      });

      it('should accept title only', () => {
        const result = DetectCategorySchema.safeParse({ title: 'Nike Air Jordan 1 Retro High' });
        expect(result.success).toBe(true);
      });

      it('should accept imageUrls only', () => {
        const result = DetectCategorySchema.safeParse({
          imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        });
        expect(result.success).toBe(true);
      });

      it('should reject when no context provided', () => {
        const result = DetectCategorySchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject more than 4 images', () => {
        const result = DetectCategorySchema.safeParse({
          imageUrls: [
            'https://ex.com/1.jpg',
            'https://ex.com/2.jpg',
            'https://ex.com/3.jpg',
            'https://ex.com/4.jpg',
            'https://ex.com/5.jpg',
          ],
        });
        expect(result.success).toBe(false);
      });

      it('should accept all fields together', () => {
        const result = DetectCategorySchema.safeParse({
          itemId: 'item-123',
          title: 'Sony Headphones',
          description: 'Wireless noise canceling headphones',
          brand: 'Sony',
          imageUrls: ['https://example.com/img.jpg'],
        });
        expect(result.success).toBe(true);
      });
    });

    describe('ExtractTextFromImageSchema', () => {
      it('should accept itemId only', () => {
        const result = ExtractTextFromImageSchema.safeParse({ itemId: 'item-123' });
        expect(result.success).toBe(true);
      });

      it('should accept imageUrls only', () => {
        const result = ExtractTextFromImageSchema.safeParse({
          imageUrls: ['https://example.com/label.jpg'],
        });
        expect(result.success).toBe(true);
      });

      it('should accept itemId with photoIndex', () => {
        const result = ExtractTextFromImageSchema.safeParse({
          itemId: 'item-123',
          photoIndex: 2,
        });
        expect(result.success).toBe(true);
      });

      it('should reject when neither itemId nor imageUrls provided', () => {
        const result = ExtractTextFromImageSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject more than 5 images', () => {
        const result = ExtractTextFromImageSchema.safeParse({
          imageUrls: [
            'https://ex.com/1.jpg',
            'https://ex.com/2.jpg',
            'https://ex.com/3.jpg',
            'https://ex.com/4.jpg',
            'https://ex.com/5.jpg',
            'https://ex.com/6.jpg',
          ],
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative photoIndex', () => {
        const result = ExtractTextFromImageSchema.safeParse({
          itemId: 'item-123',
          photoIndex: -1,
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-integer photoIndex', () => {
        const result = ExtractTextFromImageSchema.safeParse({
          itemId: 'item-123',
          photoIndex: 1.5,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('CompareImagesSchema', () => {
      it('should accept required fields', () => {
        const result = CompareImagesSchema.safeParse({
          itemId: 'item-123',
          compImageUrl: 'https://example.com/comp.jpg',
        });
        expect(result.success).toBe(true);
      });

      it('should accept optional compId', () => {
        const result = CompareImagesSchema.safeParse({
          itemId: 'item-123',
          compImageUrl: 'https://example.com/comp.jpg',
          compId: 'comp-456',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing itemId', () => {
        const result = CompareImagesSchema.safeParse({
          compImageUrl: 'https://example.com/comp.jpg',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing compImageUrl', () => {
        const result = CompareImagesSchema.safeParse({
          itemId: 'item-123',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid compImageUrl', () => {
        const result = CompareImagesSchema.safeParse({
          itemId: 'item-123',
          compImageUrl: 'not-a-url',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // lookupUpcTool Tests
  // ============================================================================
  describe('lookupUpcTool', () => {
    it('should return error when lookupUpc dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = lookupUpcTool(deps);

      const result = await invokeWithContext(tool, { code: '012345678901' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should return product info on successful lookup', async () => {
      const mockLookupUpc = jest.fn().mockResolvedValue({
        found: true,
        upc: '012345678901',
        brand: 'Sony',
        name: 'WH-1000XM4 Wireless Headphones',
        description: 'Industry-leading noise canceling',
        category: 'Electronics > Audio > Headphones',
        imageUrl: 'https://example.com/product.jpg',
        cached: false,
      });

      const deps = createMockDeps({ lookupUpc: mockLookupUpc });
      const tool = lookupUpcTool(deps);

      const result = await invokeWithContext(tool, { code: '012345678901' });

      const parsed = JSON.parse(result);
      expect(parsed.found).toBe(true);
      expect(parsed.product.brand).toBe('Sony');
      expect(parsed.product.name).toBe('WH-1000XM4 Wireless Headphones');
      expect(parsed.message).toContain('Sony');
    });

    it('should handle not found UPC', async () => {
      const mockLookupUpc = jest.fn().mockResolvedValue({
        found: false,
        upc: '999999999999',
      });

      const deps = createMockDeps({ lookupUpc: mockLookupUpc });
      const tool = lookupUpcTool(deps);

      const result = await invokeWithContext(tool, { code: '999999999999' });

      const parsed = JSON.parse(result);
      expect(parsed.found).toBe(false);
      expect(parsed.suggestion).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const mockLookupUpc = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const deps = createMockDeps({ lookupUpc: mockLookupUpc });
      const tool = lookupUpcTool(deps);

      const result = await invokeWithContext(tool, { code: '012345678901' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('Database connection failed');
    });

    it('should have correct tool metadata', () => {
      const deps = createMockDeps();
      const tool = lookupUpcTool(deps);

      expect(tool.name).toBe('lookup_upc');
      expect(tool.description).toContain('UPC');
      expect(tool.description).toContain('EAN');
      expect(tool.description).toContain('barcode');
    });
  });

  // ============================================================================
  // webSearchProductTool Tests
  // ============================================================================
  describe('webSearchProductTool', () => {
    it('should return error when webSearchProduct dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = webSearchProductTool(deps);

      const result = await invokeWithContext(tool, { query: 'Sony headphones' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should search and return results', async () => {
      const mockWebSearch = jest.fn().mockResolvedValue({
        results: [
          {
            query: 'Sony WH-1000XM4',
            content: 'Premium wireless noise canceling headphones...',
            sources: ['https://sony.com', 'https://amazon.com'],
            timestamp: '2024-01-15T10:00:00Z',
          },
        ],
        successCount: 1,
        failedCount: 0,
      });

      const deps = createMockDeps({ webSearchProduct: mockWebSearch });
      const tool = webSearchProductTool(deps);

      const result = await invokeWithContext(tool, {
        brand: 'Sony',
        model: 'WH-1000XM4',
      });

      const parsed = JSON.parse(result);
      expect(parsed.found).toBe(true);
      expect(parsed.searchCount).toBe(1);
      expect(parsed.rawResults).toHaveLength(1);
    });

    it('should get item attributes when itemId provided', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        title: 'Sony Headphones',
        attributes: [
          { key: 'brand', value: 'Sony' },
          { key: 'model', value: 'WH-1000XM4' },
        ],
        media: [],
      });

      const mockWebSearch = jest.fn().mockResolvedValue({
        results: [{ query: 'Sony', content: 'Results', sources: [], timestamp: '' }],
        successCount: 1,
        failedCount: 0,
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        webSearchProduct: mockWebSearch,
      });
      const tool = webSearchProductTool(deps);

      await invokeWithContext(tool, { itemId: 'item-123' });

      expect(mockGetItem).toHaveBeenCalledWith('org-123', 'item-123');
      expect(mockWebSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Sony',
          model: 'WH-1000XM4',
        }),
      );
    });

    it('should handle no results', async () => {
      const mockWebSearch = jest.fn().mockResolvedValue({
        results: [],
        successCount: 0,
        failedCount: 1,
      });

      const deps = createMockDeps({ webSearchProduct: mockWebSearch });
      const tool = webSearchProductTool(deps);

      const result = await invokeWithContext(tool, { query: 'obscure product xyz' });

      const parsed = JSON.parse(result);
      expect(parsed.found).toBe(false);
      expect(parsed.suggestion).toBeDefined();
    });

    it('should synthesize data when synthesizeProductData available', async () => {
      const mockWebSearch = jest.fn().mockResolvedValue({
        results: [{ query: 'test', content: 'data', sources: [], timestamp: '' }],
        successCount: 1,
        failedCount: 0,
      });

      const mockSynthesize = jest.fn().mockResolvedValue({
        confidence: 0.85,
        brand: 'Sony',
        model: 'WH-1000XM4',
        mpn: 'WH1000XM4B',
        upc: '027242919057',
        title: 'Sony WH-1000XM4 Wireless Headphones',
        description: 'Industry-leading noise canceling',
        category: ['Electronics', 'Audio'],
        condition: null,
        specifications: { weight: '254g', battery: '30h' },
        sources: ['sony.com'],
      });

      const deps = createMockDeps({
        webSearchProduct: mockWebSearch,
        synthesizeProductData: mockSynthesize,
      });
      const tool = webSearchProductTool(deps);

      const result = await invokeWithContext(tool, { brand: 'Sony' });

      const parsed = JSON.parse(result);
      expect(parsed.synthesizedData).toBeDefined();
      expect(parsed.synthesizedData.brand).toBe('Sony');
      expect(parsed.synthesizedData.confidence).toBe('85%');
    });

    it('should have correct tool metadata', () => {
      const deps = createMockDeps();
      const tool = webSearchProductTool(deps);

      expect(tool.name).toBe('web_search_product');
      expect(tool.description).toContain('web');
      expect(tool.description).toContain('search');
    });
  });

  // ============================================================================
  // reverseImageSearchTool Tests
  // ============================================================================
  describe('reverseImageSearchTool', () => {
    it('should return error when reverseImageSearch dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = reverseImageSearchTool(deps);

      const result = await invokeWithContext(tool, {
        imageUrl: 'https://example.com/image.jpg',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should search and return matches', async () => {
      const mockReverseSearch = jest.fn().mockResolvedValue({
        provider: 'google-cloud-vision',
        searchedImageUrl: 'https://example.com/image.jpg',
        matches: [
          {
            title: 'Nike Air Jordan 1 Retro High OG',
            brand: 'Nike',
            model: 'Air Jordan 1',
            price: 180,
            currency: 'USD',
            sourceUrl: 'https://nike.com/product',
            sourceDomain: 'nike.com',
            confidence: 0.92,
          },
        ],
        bestMatch: {
          title: 'Nike Air Jordan 1 Retro High OG',
          brand: 'Nike',
          model: 'Air Jordan 1',
          confidence: 0.92,
        },
        confidence: 0.92,
        success: true,
        cached: false,
      });

      const deps = createMockDeps({ reverseImageSearch: mockReverseSearch });
      const tool = reverseImageSearchTool(deps);

      const result = await invokeWithContext(tool, {
        imageUrl: 'https://example.com/image.jpg',
      });

      const parsed = JSON.parse(result);
      expect(parsed.found).toBe(true);
      expect(parsed.matchCount).toBe(1);
      expect(parsed.bestMatch.brand).toBe('Nike');
      expect(parsed.overallConfidence).toBe('92%');
    });

    it('should get image from item when itemId provided', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [{ id: 'm1', url: 'https://example.com/item-photo.jpg' }],
      });

      const mockReverseSearch = jest.fn().mockResolvedValue({
        provider: 'test',
        searchedImageUrl: 'https://example.com/item-photo.jpg',
        matches: [],
        confidence: 0,
        success: true,
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        reverseImageSearch: mockReverseSearch,
      });
      const tool = reverseImageSearchTool(deps);

      await invokeWithContext(tool, { itemId: 'item-123' });

      expect(mockReverseSearch).toHaveBeenCalledWith('https://example.com/item-photo.jpg');
    });

    it('should return error when item has no images', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [],
      });

      const mockReverseSearch = jest.fn();

      const deps = createMockDeps({
        getItem: mockGetItem,
        reverseImageSearch: mockReverseSearch,
      });
      const tool = reverseImageSearchTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('no images');
    });

    it('should handle no matches gracefully', async () => {
      const mockReverseSearch = jest.fn().mockResolvedValue({
        provider: 'test',
        searchedImageUrl: 'https://example.com/image.jpg',
        matches: [],
        confidence: 0,
        success: true,
      });

      const deps = createMockDeps({ reverseImageSearch: mockReverseSearch });
      const tool = reverseImageSearchTool(deps);

      const result = await invokeWithContext(tool, {
        imageUrl: 'https://example.com/image.jpg',
      });

      const parsed = JSON.parse(result);
      expect(parsed.found).toBe(false);
      expect(parsed.suggestion).toBeDefined();
    });

    it('should have correct tool metadata', () => {
      const deps = createMockDeps();
      const tool = reverseImageSearchTool(deps);

      expect(tool.name).toBe('reverse_image_search');
      expect(tool.description).toContain('reverse image');
      expect(tool.description).toContain('Google Lens');
    });
  });

  // ============================================================================
  // detectCategoryTool Tests
  // ============================================================================
  describe('detectCategoryTool', () => {
    it('should return error when detectCategory dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = detectCategoryTool(deps);

      const result = await invokeWithContext(tool, { title: 'Sony Headphones' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should detect category successfully', async () => {
      const mockDetectCategory = jest.fn().mockResolvedValue({
        categoryId: '293:Electronics > Audio > Headphones',
        confidence: 0.95,
        reasoning: 'Title contains "headphones" and brand "Sony" is known for audio equipment',
        alternatives: [
          { categoryId: '294:Electronics > Audio > Earbuds', confidence: 0.15 },
        ],
      });

      const deps = createMockDeps({ detectCategory: mockDetectCategory });
      const tool = detectCategoryTool(deps);

      const result = await invokeWithContext(tool, {
        title: 'Sony WH-1000XM4 Wireless Headphones',
        brand: 'Sony',
      });

      const parsed = JSON.parse(result);
      expect(parsed.categoryId).toContain('Headphones');
      expect(parsed.confidence).toBe('95%');
      expect(parsed.alternatives).toHaveLength(1);
    });

    it('should get item data when itemId provided', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        title: 'Nike Sneakers',
        description: 'Air Jordan 1 Basketball Shoes',
        attributes: [{ key: 'brand', value: 'Nike' }],
        media: [{ id: 'm1', url: 'https://example.com/shoe.jpg' }],
      });

      const mockDetectCategory = jest.fn().mockResolvedValue({
        categoryId: '1001:Clothing > Shoes > Sneakers',
        confidence: 0.88,
        reasoning: 'Sneakers detected from image and title',
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        detectCategory: mockDetectCategory,
      });
      const tool = detectCategoryTool(deps);

      await invokeWithContext(tool, { itemId: 'item-123' });

      expect(mockDetectCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nike Sneakers',
          description: 'Air Jordan 1 Basketball Shoes',
          brand: 'Nike',
          imageUrls: ['https://example.com/shoe.jpg'],
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      const mockDetectCategory = jest.fn().mockRejectedValue(new Error('Vision API error'));

      const deps = createMockDeps({ detectCategory: mockDetectCategory });
      const tool = detectCategoryTool(deps);

      const result = await invokeWithContext(tool, { title: 'Test Product' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('Vision API error');
    });

    it('should have correct tool metadata', () => {
      const deps = createMockDeps();
      const tool = detectCategoryTool(deps);

      expect(tool.name).toBe('detect_category');
      expect(tool.description).toContain('category');
      expect(tool.description).toContain('marketplace');
    });
  });

  // ============================================================================
  // extractTextFromImageTool Tests
  // ============================================================================
  describe('extractTextFromImageTool', () => {
    it('should return error when extractTextFromImage dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = extractTextFromImageTool(deps);

      const result = await invokeWithContext(tool, {
        imageUrls: ['https://example.com/label.jpg'],
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should extract text and identifiers', async () => {
      const mockExtractText = jest.fn().mockResolvedValue({
        upc: '012345678901',
        modelNumber: 'WH-1000XM4',
        mpn: 'WH1000XM4B',
        rawText: ['Sony', 'WH-1000XM4', 'Made in Malaysia', '012345678901'],
        labels: { 'Made in': 'Malaysia', Model: 'WH-1000XM4' },
        confidence: 0.85,
        textChunks: [
          { text: '012345678901', isLikelyIdentifier: true, suggestedType: 'upc' },
          { text: 'WH-1000XM4', isLikelyIdentifier: true, suggestedType: 'model' },
        ],
      });

      const deps = createMockDeps({ extractTextFromImage: mockExtractText });
      const tool = extractTextFromImageTool(deps);

      const result = await invokeWithContext(tool, {
        imageUrls: ['https://example.com/label.jpg'],
      });

      const parsed = JSON.parse(result);
      expect(parsed.identifiers.upc).toBe('012345678901');
      expect(parsed.identifiers.modelNumber).toBe('WH-1000XM4');
      expect(parsed.labels).toBeDefined();
      expect(parsed.confidence).toBe('85%');
      expect(parsed.likelyIdentifiers).toHaveLength(2);
    });

    it('should get images from item when itemId provided', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [
          { id: 'm1', url: 'https://example.com/photo1.jpg' },
          { id: 'm2', url: 'https://example.com/photo2.jpg' },
        ],
      });

      const mockExtractText = jest.fn().mockResolvedValue({
        rawText: ['Test'],
        labels: {},
        confidence: 0.5,
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        extractTextFromImage: mockExtractText,
      });
      const tool = extractTextFromImageTool(deps);

      await invokeWithContext(tool, { itemId: 'item-123' });

      expect(mockExtractText).toHaveBeenCalledWith([
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ]);
    });

    it('should extract from specific photo when photoIndex provided', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [
          { id: 'm1', url: 'https://example.com/photo1.jpg' },
          { id: 'm2', url: 'https://example.com/photo2.jpg' },
          { id: 'm3', url: 'https://example.com/photo3.jpg' },
        ],
      });

      const mockExtractText = jest.fn().mockResolvedValue({
        rawText: [],
        labels: {},
        confidence: 0.5,
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        extractTextFromImage: mockExtractText,
      });
      const tool = extractTextFromImageTool(deps);

      await invokeWithContext(tool, { itemId: 'item-123', photoIndex: 1 });

      expect(mockExtractText).toHaveBeenCalledWith(['https://example.com/photo2.jpg']);
    });

    it('should return error when item has no images', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [],
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        extractTextFromImage: jest.fn(),
      });
      const tool = extractTextFromImageTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('no images');
    });

    it('should handle no identifiers found', async () => {
      const mockExtractText = jest.fn().mockResolvedValue({
        rawText: ['Random text', 'More text'],
        labels: {},
        confidence: 0.3,
      });

      const deps = createMockDeps({ extractTextFromImage: mockExtractText });
      const tool = extractTextFromImageTool(deps);

      const result = await invokeWithContext(tool, {
        imageUrls: ['https://example.com/blurry.jpg'],
      });

      const parsed = JSON.parse(result);
      expect(parsed.identifiers).toBeNull();
      expect(parsed.message).toContain('No product identifiers');
    });

    it('should have correct tool metadata', () => {
      const deps = createMockDeps();
      const tool = extractTextFromImageTool(deps);

      expect(tool.name).toBe('extract_text_from_image');
      expect(tool.description).toContain('OCR');
      expect(tool.description).toContain('text');
    });
  });

  // ============================================================================
  // compareImagesTool Tests
  // ============================================================================
  describe('compareImagesTool', () => {
    it('should return error when compareImages dependency not provided', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [{ id: 'm1', url: 'https://example.com/item.jpg' }],
      });

      const deps = createMockDeps({ getItem: mockGetItem });
      const tool = compareImagesTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compImageUrl: 'https://example.com/comp.jpg',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should compare images and return similarity', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [{ id: 'm1', url: 'https://example.com/item.jpg' }],
      });

      const mockCompareImages = jest.fn().mockResolvedValue({
        similarityScore: 0.92,
        isSameProduct: true,
        reasoning: 'Same sneaker model, matching colorway and silhouette',
        cached: false,
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        compareImages: mockCompareImages,
      });
      const tool = compareImagesTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compImageUrl: 'https://example.com/comp.jpg',
        compId: 'comp-456',
      });

      const parsed = JSON.parse(result);
      expect(parsed.similarityScore).toBe('92%');
      expect(parsed.isSameProduct).toBe(true);
      expect(parsed.verdict).toContain('Very likely match');
      expect(parsed.compId).toBe('comp-456');
    });

    it('should return error when item has no images', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [],
      });

      const deps = createMockDeps({
        getItem: mockGetItem,
        compareImages: jest.fn(),
      });
      const tool = compareImagesTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compImageUrl: 'https://example.com/comp.jpg',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('no images');
    });

    it('should return appropriate verdicts for different similarity scores', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [{ id: 'm1', url: 'https://example.com/item.jpg' }],
      });

      const testCases = [
        { score: 0.98, expectedVerdict: 'Definite match' },
        { score: 0.85, expectedVerdict: 'Very likely match' },
        { score: 0.60, expectedVerdict: 'Possible match' },
        { score: 0.30, expectedVerdict: 'Probably different' },
        { score: 0.10, expectedVerdict: 'Not a match' },
      ];

      for (const { score, expectedVerdict } of testCases) {
        const mockCompareImages = jest.fn().mockResolvedValue({
          similarityScore: score,
          isSameProduct: score >= 0.8,
          reasoning: 'Test comparison',
          cached: false,
        });

        const deps = createMockDeps({
          getItem: mockGetItem,
          compareImages: mockCompareImages,
        });
        const tool = compareImagesTool(deps);

        const result = await invokeWithContext(tool, {
          itemId: 'item-123',
          compImageUrl: 'https://example.com/comp.jpg',
        });

        const parsed = JSON.parse(result);
        expect(parsed.verdict).toContain(expectedVerdict);
      }
    });

    it('should handle errors gracefully', async () => {
      const mockGetItem = jest.fn().mockResolvedValue({
        id: 'item-123',
        media: [{ id: 'm1', url: 'https://example.com/item.jpg' }],
      });

      const mockCompareImages = jest.fn().mockRejectedValue(new Error('OpenAI rate limit'));

      const deps = createMockDeps({
        getItem: mockGetItem,
        compareImages: mockCompareImages,
      });
      const tool = compareImagesTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compImageUrl: 'https://example.com/comp.jpg',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('OpenAI rate limit');
    });

    it('should have correct tool metadata', () => {
      const deps = createMockDeps();
      const tool = compareImagesTool(deps);

      expect(tool.name).toBe('compare_images');
      expect(tool.description).toContain('Compare');
      expect(tool.description).toContain('similar');
    });
  });
});
