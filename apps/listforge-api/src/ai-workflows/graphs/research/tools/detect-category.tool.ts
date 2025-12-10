import { z } from 'zod';
import type {
  MarketplaceCategory,
  FieldRequirement,
  FieldCompletion,
  ProductIdentification,
} from '@listforge/core-types';
import type {
  MarketplaceSchemaService,
  CategoryDetection,
  ProductInfo,
} from '../../../services/marketplace-schema.service';
import type { ItemSnapshot, MediaAnalysisResult } from '../research-graph.state';

/**
 * Input for category detection
 */
export interface DetectCategoryInput {
  item: ItemSnapshot | null;
  productId: ProductIdentification | null;
  mediaAnalysis: MediaAnalysisResult | null;
}

/**
 * Output from category detection
 */
export interface DetectCategoryOutput {
  marketplaceCategory: MarketplaceCategory | null;
  requiredFields: FieldRequirement[];
  recommendedFields: FieldRequirement[];
  fieldCompletion: FieldCompletion | null;
  detection: CategoryDetection | null;
}

/**
 * Build product info from available sources
 */
function buildProductInfo(input: DetectCategoryInput): ProductInfo {
  const productInfo: ProductInfo = {};

  // Prefer product identification over media analysis
  if (input.productId) {
    productInfo.brand = input.productId.brand;
    productInfo.model = input.productId.model;
    productInfo.category = input.productId.category;
    productInfo.attributes = input.productId.attributes;
  }

  // Fill gaps from media analysis
  if (input.mediaAnalysis) {
    if (!productInfo.brand && input.mediaAnalysis.brand) {
      productInfo.brand = input.mediaAnalysis.brand;
    }
    if (!productInfo.model && input.mediaAnalysis.model) {
      productInfo.model = input.mediaAnalysis.model;
    }
    if (!productInfo.category && input.mediaAnalysis.category) {
      productInfo.category = [input.mediaAnalysis.category];
    }
  }

  // Fill from item attributes
  if (input.item) {
    productInfo.title = input.item.title || undefined;

    if (input.item.attributes) {
      const attrs: Record<string, string | number | boolean> = {};
      for (const attr of input.item.attributes) {
        attrs[attr.key] = attr.value;
        // Also extract brand/model from attributes if not already set
        if (!productInfo.brand && attr.key.toLowerCase() === 'brand') {
          productInfo.brand = attr.value;
        }
        if (!productInfo.model && attr.key.toLowerCase() === 'model') {
          productInfo.model = attr.value;
        }
      }
      productInfo.attributes = { ...productInfo.attributes, ...attrs };
    }
  }

  return productInfo;
}

/**
 * Build item attributes map for field completion calculation
 */
function buildItemAttributesMap(input: DetectCategoryInput): Record<string, string | number | boolean> {
  const attrs: Record<string, string | number | boolean> = {};

  // Add from item attributes
  if (input.item?.attributes) {
    for (const attr of input.item.attributes) {
      attrs[attr.key] = attr.value;
    }
  }

  // Add from product identification
  if (input.productId) {
    if (input.productId.brand) attrs['Brand'] = input.productId.brand;
    if (input.productId.model) attrs['Model'] = input.productId.model;
    if (input.productId.mpn) attrs['MPN'] = input.productId.mpn;
    if (input.productId.upc) attrs['UPC'] = input.productId.upc;

    // Add identified attributes
    for (const [key, value] of Object.entries(input.productId.attributes)) {
      attrs[key] = value;
    }
  }

  // Add from media analysis
  if (input.mediaAnalysis) {
    if (input.mediaAnalysis.brand && !attrs['Brand']) {
      attrs['Brand'] = input.mediaAnalysis.brand;
    }
    if (input.mediaAnalysis.model && !attrs['Model']) {
      attrs['Model'] = input.mediaAnalysis.model;
    }
    if (input.mediaAnalysis.color) {
      attrs['Color'] = input.mediaAnalysis.color;
    }
    if (input.mediaAnalysis.size) {
      attrs['Size'] = input.mediaAnalysis.size;
    }

    // Add media analysis attributes
    for (const [key, value] of Object.entries(input.mediaAnalysis.attributes)) {
      if (!attrs[key]) {
        attrs[key] = value;
      }
    }
  }

  return attrs;
}

/**
 * Detect eBay category for an item
 * Uses MarketplaceSchemaService to detect category and get field requirements
 */
export async function detectCategory(
  input: DetectCategoryInput,
  schemaService: MarketplaceSchemaService
): Promise<DetectCategoryOutput> {
  // Build product info from available sources
  const productInfo = buildProductInfo(input);

  // Detect category using the schema service
  const detection = await schemaService.detectCategory(productInfo);

  if (!detection) {
    return {
      marketplaceCategory: null,
      requiredFields: [],
      recommendedFields: [],
      fieldCompletion: null,
      detection: null,
    };
  }

  // Build marketplace category object
  const condition = input.item?.condition || input.mediaAnalysis?.condition || 'used_good';
  const marketplaceCategory = schemaService.buildMarketplaceCategory(detection, condition);

  // Build item attributes map for field completion
  const itemAttributes = buildItemAttributesMap(input);

  // Calculate field completion
  const fieldCompletion = schemaService.calculateFieldCompletion(
    itemAttributes,
    detection.requiredFields,
    detection.recommendedFields
  );

  return {
    marketplaceCategory,
    requiredFields: detection.requiredFields,
    recommendedFields: detection.recommendedFields,
    fieldCompletion,
    detection,
  };
}

/**
 * LangChain tool for category detection
 * Can be used in agentic flows
 * Note: Simplified implementation to avoid excessive type depth issues
 */
export function createDetectCategoryTool(schemaService: MarketplaceSchemaService) {
  const detectCategoryFunc = async (input: { brand?: string; model?: string; title?: string; category?: string }) => {
    const productInfo: ProductInfo = {
      brand: input.brand,
      model: input.model,
      title: input.title,
    };
    if (input.category) {
      productInfo.category = [input.category];
    }

    const detection = await schemaService.detectCategory(productInfo);

    if (!detection) {
      return JSON.stringify({
        success: false,
        message: 'Could not detect category - insufficient product information',
      });
    }

    return JSON.stringify({
      success: true,
      categoryId: detection.categoryId,
      categoryPath: detection.categoryPath,
      categoryName: detection.categoryName,
      confidence: detection.confidence,
      requiredFieldCount: detection.requiredFields.length,
      recommendedFieldCount: detection.recommendedFields.length,
    });
  };

  // Return a simplified tool interface to avoid type issues
  return {
    name: 'detect_ebay_category',
    description: 'Detect the best eBay category for a product based on brand, model, and title',
    func: detectCategoryFunc,
    schema: z.object({
      brand: z.string().optional().describe('The product brand name'),
      model: z.string().optional().describe('The product model name'),
      title: z.string().optional().describe('The product title or description'),
      category: z.string().optional().describe('An initial category guess'),
    }),
  };
}
