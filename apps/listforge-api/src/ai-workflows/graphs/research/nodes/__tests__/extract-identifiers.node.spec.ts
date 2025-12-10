import { extractIdentifiersNode, ExtractIdentifiersTools } from '../extract-identifiers.node';
import { ResearchGraphState, ItemSnapshot } from '../../research-graph.state';
import { OCRExtractionResult, UPCLookupResult } from '@listforge/core-types';

describe('extractIdentifiersNode', () => {
  const mockItem: ItemSnapshot = {
    id: 'item-123',
    title: 'Test Item',
    description: 'Test description',
    condition: 'new',
    attributes: [],
    media: [
      { id: 'media-1', url: 'https://example.com/image1.jpg', type: 'image' },
      { id: 'media-2', url: 'https://example.com/image2.jpg', type: 'image' },
    ],
    defaultPrice: null,
    lifecycleStatus: 'draft',
    aiReviewState: 'not_reviewed',
  };

  const mockState: Partial<ResearchGraphState> = {
    itemId: 'item-123',
    researchRunId: 'run-123',
    organizationId: 'org-123',
    item: mockItem,
    productIdentification: null,
    identificationConfidence: 0,
  };

  describe('OCR extraction', () => {
    it('should extract identifiers from images', async () => {
      const mockOCRResult: OCRExtractionResult = {
        upc: '012345678905',
        modelNumber: 'WH-1000XM4',
        rawText: ['Sony', 'Wireless Headphones'],
        labels: { 'Made in': 'Japan' },
        confidence: 0.85,
      };

      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn().mockResolvedValue(mockOCRResult),
        lookupUPC: jest.fn().mockResolvedValue({ found: false, upc: '012345678905' }),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await extractIdentifiersNode(mockState as ResearchGraphState, config);

      expect(result.ocrResult).toEqual(mockOCRResult);
      expect(mockTools.extractOCR).toHaveBeenCalledWith([
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ]);
      expect(result.productIdentification?.upc).toBe('012345678905');
      expect(result.productIdentification?.model).toBe('WH-1000XM4');
    });

    it('should handle no images gracefully', async () => {
      const stateWithNoImages: Partial<ResearchGraphState> = {
        ...mockState,
        item: { ...mockItem, media: [] },
      };

      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn(),
        lookupUPC: jest.fn(),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await extractIdentifiersNode(stateWithNoImages as ResearchGraphState, config);

      expect(result.ocrResult).toBeNull();
      expect(mockTools.extractOCR).not.toHaveBeenCalled();
    });
  });

  describe('UPC lookup', () => {
    it('should look up UPC when found in OCR', async () => {
      const mockOCRResult: OCRExtractionResult = {
        upc: '012345678905',
        rawText: [],
        labels: {},
        confidence: 0.9,
      };

      const mockUPCResult: UPCLookupResult = {
        found: true,
        upc: '012345678905',
        brand: 'Sony',
        name: 'WH-1000XM4 Wireless Headphones',
        category: 'Electronics > Audio > Headphones',
      };

      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn().mockResolvedValue(mockOCRResult),
        lookupUPC: jest.fn().mockResolvedValue(mockUPCResult),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await extractIdentifiersNode(mockState as ResearchGraphState, config);

      expect(result.upcLookupResult).toEqual(mockUPCResult);
      expect(mockTools.lookupUPC).toHaveBeenCalledWith('012345678905');
      expect(result.productIdentification?.brand).toBe('Sony');
      expect(result.productIdentification?.upc).toBe('012345678905');
      expect(result.identificationConfidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should not call UPC lookup when no UPC found', async () => {
      const mockOCRResult: OCRExtractionResult = {
        modelNumber: 'ABC-123',
        rawText: ['Some text'],
        labels: {},
        confidence: 0.7,
      };

      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn().mockResolvedValue(mockOCRResult),
        lookupUPC: jest.fn(),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await extractIdentifiersNode(mockState as ResearchGraphState, config);

      expect(mockTools.lookupUPC).not.toHaveBeenCalled();
      expect(result.upcLookupResult).toBeNull();
    });

    it('should handle UPC lookup failure gracefully', async () => {
      const mockOCRResult: OCRExtractionResult = {
        upc: '012345678905',
        rawText: [],
        labels: {},
        confidence: 0.9,
      };

      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn().mockResolvedValue(mockOCRResult),
        lookupUPC: jest.fn().mockRejectedValue(new Error('API unavailable')),
      };

      const config = { configurable: { tools: mockTools } };

      // Should not throw, just continue without UPC data
      const result = await extractIdentifiersNode(mockState as ResearchGraphState, config);

      expect(result.ocrResult).toEqual(mockOCRResult);
      expect(result.productIdentification?.upc).toBe('012345678905');
    });
  });

  describe('error handling', () => {
    it('should throw error if tools not provided', async () => {
      await expect(
        extractIdentifiersNode(mockState as ResearchGraphState, {}),
      ).rejects.toThrow('ExtractIdentifiersTools not provided');
    });

    it('should throw error if OCR extraction fails', async () => {
      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn().mockRejectedValue(new Error('OCR service error')),
        lookupUPC: jest.fn(),
      };

      const config = { configurable: { tools: mockTools } };

      await expect(
        extractIdentifiersNode(mockState as ResearchGraphState, config),
      ).rejects.toThrow('OCR service error');
    });
  });

  describe('product identification merging', () => {
    it('should merge with existing product identification', async () => {
      const stateWithExisting: Partial<ResearchGraphState> = {
        ...mockState,
        productIdentification: {
          confidence: 0.5,
          brand: 'Existing Brand',
          model: 'Existing Model',
          attributes: { color: 'black' },
        },
      };

      const mockOCRResult: OCRExtractionResult = {
        mpn: 'NEW-MPN-123',
        rawText: [],
        labels: { size: 'Large' },
        confidence: 0.8,
      };

      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn().mockResolvedValue(mockOCRResult),
        lookupUPC: jest.fn(),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await extractIdentifiersNode(stateWithExisting as ResearchGraphState, config);

      // Should preserve existing values and add new ones
      expect(result.productIdentification?.brand).toBe('Existing Brand');
      expect(result.productIdentification?.model).toBe('Existing Model');
      expect(result.productIdentification?.mpn).toBe('NEW-MPN-123');
      expect(result.productIdentification?.attributes).toMatchObject({
        color: 'black',
        size: 'Large',
      });
    });

    it('should override with UPC lookup data when found', async () => {
      const stateWithExisting: Partial<ResearchGraphState> = {
        ...mockState,
        productIdentification: {
          confidence: 0.5,
          brand: 'Wrong Brand',
          attributes: {},
        },
      };

      const mockOCRResult: OCRExtractionResult = {
        upc: '012345678905',
        rawText: [],
        labels: {},
        confidence: 0.7,
      };

      const mockUPCResult: UPCLookupResult = {
        found: true,
        upc: '012345678905',
        brand: 'Correct Brand',
        name: 'Correct Product Name',
        category: 'Electronics',
      };

      const mockTools: ExtractIdentifiersTools = {
        extractOCR: jest.fn().mockResolvedValue(mockOCRResult),
        lookupUPC: jest.fn().mockResolvedValue(mockUPCResult),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await extractIdentifiersNode(stateWithExisting as ResearchGraphState, config);

      // UPC lookup data should override existing
      expect(result.productIdentification?.brand).toBe('Correct Brand');
      expect(result.productIdentification?.category).toEqual(['Electronics']);
    });
  });
});
