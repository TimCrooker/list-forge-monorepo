import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { JSONSchema7 } from 'json-schema';

// Import schemas from tool files
import {
  GetItemSnapshotSchema,
  GetItemFacetSchema,
  UpdateItemFieldSchema,
} from './item.tools';
import {
  GetResearchDataSchema,
  SearchCompsSchema,
  TriggerResearchSchema,
  GetPricingAnalysisSchema,
  ResearchFieldSchema,
} from './research.tools';
import {
  SearchItemsSchema,
  SearchResearchSchema,
  SearchEvidenceSchema,
} from './search.tools';
import {
  GetDashboardStatsSchema,
  GetReviewQueueSummarySchema,
  GetInventoryValueSchema,
} from './aggregate.tools';
import { SuggestActionSchema } from './action.tools';
import {
  DecodeIdentifierSchema,
  CheckAuthenticitySchema,
  GetValueDriversSchema,
  ExplainPricingSchema,
  ValidateCompSchema,
} from './domain.tools';
import {
  LookupUpcSchema,
  WebSearchProductSchema,
  ReverseImageSearchSchema,
  DetectCategorySchema,
  ExtractTextFromImageSchema,
  CompareImagesSchema,
} from './research-advanced.tools';

// Import tool metadata for descriptions
import { TOOL_REGISTRY, ToolMetadata } from './tool-registry';

/**
 * Tool Schema Info - combines Zod schema with metadata for the debugger
 */
export interface ToolSchemaInfo {
  name: string;
  category: ToolMetadata['category'];
  description: string;
  schema: z.ZodType;
  jsonSchema: JSONSchema7;
  requiredContext: {
    itemId?: boolean;
    organizationId?: boolean;
  };
}

/**
 * Map of tool names to their Zod schemas
 */
const TOOL_SCHEMAS: Record<string, z.ZodType> = {
  // Item tools
  get_item_snapshot: GetItemSnapshotSchema,
  get_item_facet: GetItemFacetSchema,
  update_item_field: UpdateItemFieldSchema,

  // Research tools
  get_research_data: GetResearchDataSchema,
  search_comps: SearchCompsSchema,
  trigger_research: TriggerResearchSchema,
  get_pricing_analysis: GetPricingAnalysisSchema,
  research_field: ResearchFieldSchema,

  // Search tools
  search_items: SearchItemsSchema,
  search_research: SearchResearchSchema,
  search_evidence: SearchEvidenceSchema,

  // Aggregate tools
  get_dashboard_stats: GetDashboardStatsSchema,
  get_review_queue_summary: GetReviewQueueSummarySchema,
  get_inventory_value: GetInventoryValueSchema,

  // Action tools
  suggest_action: SuggestActionSchema,

  // Domain tools
  decode_identifier: DecodeIdentifierSchema,
  check_authenticity: CheckAuthenticitySchema,
  get_value_drivers: GetValueDriversSchema,
  explain_pricing: ExplainPricingSchema,
  validate_comp: ValidateCompSchema,

  // Advanced research tools
  lookup_upc: LookupUpcSchema,
  web_search_product: WebSearchProductSchema,
  reverse_image_search: ReverseImageSearchSchema,
  detect_category: DetectCategorySchema,
  extract_text_from_image: ExtractTextFromImageSchema,
  compare_images: CompareImagesSchema,
};

/**
 * Tool descriptions for the debugger UI
 */
const TOOL_DESCRIPTIONS: Record<string, string> = {
  get_item_snapshot: 'Get a quick summary of an item with key metrics and available facets',
  get_item_facet: 'Get detailed data for a specific aspect of an item (general, pricing, attributes, etc.)',
  update_item_field: 'Update a single field on an item',
  get_research_data: 'Get the latest research data for an item including price bands and demand signals',
  search_comps: 'Search for comparable listings on marketplaces (eBay, Amazon)',
  trigger_research: 'Start a new research job for an item',
  get_pricing_analysis: 'Get a comprehensive pricing analysis combining item data with research',
  research_field: 'Research a specific field for an item (brand, model, UPC, etc.)',
  search_items: 'Search the user\'s inventory items with various filters',
  search_research: 'Get research data for a specific item',
  search_evidence: 'Search evidence bundles (comparable listings, product pages)',
  get_dashboard_stats: 'Get aggregate statistics for the user\'s inventory',
  get_review_queue_summary: 'Get summary of items awaiting review',
  get_inventory_value: 'Calculate total inventory value with optional filters',
  suggest_action: 'Suggest an interactive action button for the user',
  // Domain tools
  decode_identifier: 'Decode product identifiers (date codes, style numbers, serial numbers)',
  check_authenticity: 'Run authenticity marker checks for an item',
  get_value_drivers: 'Get value drivers that affect an item\'s price',
  explain_pricing: 'Explain how price bands were calculated for an item',
  validate_comp: 'Validate whether a comparable listing is truly comparable',
  // Advanced research tools
  lookup_upc: 'Look up product information from a UPC or EAN barcode',
  web_search_product: 'Search the web for product information',
  reverse_image_search: 'Find products using reverse image search',
  detect_category: 'Detect the product category for marketplace categorization',
  extract_text_from_image: 'Extract text from product images using OCR',
  compare_images: 'Compare item images with comparable listing images for visual similarity',
};

/**
 * Convert a Zod schema to JSON Schema
 */
function convertToJsonSchema(schema: z.ZodType): JSONSchema7 {
  try {
    const result = zodToJsonSchema(schema, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
    });
    // Remove the $schema property to keep it cleaner
    if (typeof result === 'object' && result !== null) {
      const { $schema, ...rest } = result as Record<string, unknown>;
      return rest as JSONSchema7;
    }
    return result as JSONSchema7;
  } catch (error) {
    // Return a minimal schema if conversion fails
    return { type: 'object', properties: {} };
  }
}

/**
 * Build the complete tool schema registry
 */
function buildToolSchemaRegistry(): Map<string, ToolSchemaInfo> {
  const registry = new Map<string, ToolSchemaInfo>();

  for (const toolMeta of TOOL_REGISTRY) {
    const schema = TOOL_SCHEMAS[toolMeta.name];
    if (!schema) {
      console.warn(`No schema found for tool: ${toolMeta.name}`);
      continue;
    }

    registry.set(toolMeta.name, {
      name: toolMeta.name,
      category: toolMeta.category,
      description: TOOL_DESCRIPTIONS[toolMeta.name] || '',
      schema,
      jsonSchema: convertToJsonSchema(schema),
      requiredContext: toolMeta.requiredContext,
    });
  }

  return registry;
}

// Build the registry once at module load
export const TOOL_SCHEMA_REGISTRY = buildToolSchemaRegistry();

/**
 * Get all tool schemas as an array
 */
export function getAllToolSchemas(): ToolSchemaInfo[] {
  return Array.from(TOOL_SCHEMA_REGISTRY.values());
}

/**
 * Get a specific tool's schema info
 */
export function getToolSchemaInfo(toolName: string): ToolSchemaInfo | undefined {
  return TOOL_SCHEMA_REGISTRY.get(toolName);
}

/**
 * Get tools by category with their schemas
 */
export function getToolSchemasByCategory(
  category: ToolMetadata['category'],
): ToolSchemaInfo[] {
  return getAllToolSchemas().filter((t) => t.category === category);
}

/**
 * Validate inputs against a tool's Zod schema
 */
export function validateToolInputs(
  toolName: string,
  inputs: Record<string, unknown>,
): { valid: boolean; errors?: z.ZodError } {
  const schemaInfo = TOOL_SCHEMA_REGISTRY.get(toolName);
  if (!schemaInfo) {
    return { valid: false, errors: undefined };
  }

  const result = schemaInfo.schema.safeParse(inputs);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, errors: result.error };
}

// Re-export individual schemas for direct access if needed
export {
  GetItemSnapshotSchema,
  GetItemFacetSchema,
  UpdateItemFieldSchema,
  GetResearchDataSchema,
  SearchCompsSchema,
  TriggerResearchSchema,
  GetPricingAnalysisSchema,
  ResearchFieldSchema,
  SearchItemsSchema,
  SearchResearchSchema,
  SearchEvidenceSchema,
  GetDashboardStatsSchema,
  GetReviewQueueSummarySchema,
  GetInventoryValueSchema,
  SuggestActionSchema,
  // Domain tools
  DecodeIdentifierSchema,
  CheckAuthenticitySchema,
  GetValueDriversSchema,
  ExplainPricingSchema,
  ValidateCompSchema,
  // Advanced research tools
  LookupUpcSchema,
  WebSearchProductSchema,
  ReverseImageSearchSchema,
  DetectCategorySchema,
  ExtractTextFromImageSchema,
  CompareImagesSchema,
};
