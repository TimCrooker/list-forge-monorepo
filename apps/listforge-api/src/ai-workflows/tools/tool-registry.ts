import { StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies } from './index';
import {
  getItemSnapshotTool,
  getItemFacetTool,
  updateItemFieldTool,
} from './item.tools';
import {
  getResearchDataTool,
  searchCompsTool,
  triggerResearchTool,
} from './research.tools';
import { suggestActionTool } from './action.tools';
import {
  searchItemsTool,
  searchResearchTool,
  searchEvidenceTool,
} from './search.tools';
import {
  getDashboardStatsTool,
  getReviewQueueSummaryTool,
  getInventoryValueTool,
} from './aggregate.tools';
import {
  decodeIdentifierTool,
  checkAuthenticityTool,
  getValueDriversTool,
  explainPricingTool,
  validateCompTool,
} from './domain.tools';
import {
  lookupUpcTool,
  webSearchProductTool,
  reverseImageSearchTool,
  detectCategoryTool,
  extractTextFromImageTool,
  compareImagesTool,
} from './research-advanced.tools';

/**
 * Tool Metadata for Context-Aware Tool Selection
 *
 * Defines which tools are available based on:
 * - Page context (item_detail, dashboard, review, etc.)
 * - Required context (itemId, organizationId)
 * - Category (item, research, search, aggregate, action)
 */
export interface ToolMetadata {
  /** Tool name (matches tool.name) */
  name: string;

  /** Factory function that creates the tool */
  factory: (deps: ChatToolDependencies) => StructuredTool;

  /** Category for organizing tools */
  category: 'item' | 'research' | 'search' | 'aggregate' | 'action' | 'domain' | 'research-advanced';

  /** Required context for this tool to function */
  requiredContext: {
    /** Requires itemId in context */
    itemId?: boolean;
    /** Requires organizationId in context */
    organizationId?: boolean;
  };

  /**
   * Page types where this tool should be available
   * Empty array = available on all pages
   */
  availableInPages: Array<
    'item_detail' | 'items' | 'dashboard' | 'review' | 'capture' | 'settings' | 'other'
  >;

  /** If true, tool is always available regardless of page context */
  alwaysAvailable?: boolean;
}

/**
 * Tool Registry - Complete list of all chat tools with metadata
 *
 * This registry enables context-aware tool selection:
 * - On item pages: item + research tools available
 * - On dashboard: aggregate + search tools available
 * - On general pages: search + aggregate tools available
 * - Actions always available for UI integration
 */
export const TOOL_REGISTRY: ToolMetadata[] = [
  // ==========================================================================
  // Item Tools (require itemId, work on item pages)
  // ==========================================================================
  {
    name: 'get_item_snapshot',
    factory: getItemSnapshotTool,
    category: 'item',
    requiredContext: { itemId: true, organizationId: true },
    availableInPages: ['item_detail', 'review', 'capture'],
  },
  {
    name: 'get_item_facet',
    factory: getItemFacetTool,
    category: 'item',
    requiredContext: { itemId: true, organizationId: true },
    availableInPages: ['item_detail', 'review', 'capture'],
  },
  {
    name: 'update_item_field',
    factory: updateItemFieldTool,
    category: 'item',
    requiredContext: { itemId: true, organizationId: true },
    availableInPages: ['item_detail', 'review'],
  },

  // ==========================================================================
  // Research Tools (some require itemId, some work generally)
  // ==========================================================================
  {
    name: 'get_research_data',
    factory: getResearchDataTool,
    category: 'research',
    requiredContext: { itemId: true, organizationId: true },
    availableInPages: ['item_detail', 'review'],
  },
  {
    name: 'search_comps',
    factory: searchCompsTool,
    category: 'research',
    requiredContext: { organizationId: true },
    // Can search comps on multiple pages (useful for price research)
    availableInPages: ['item_detail', 'review', 'dashboard', 'items', 'other'],
  },
  {
    name: 'trigger_research',
    factory: triggerResearchTool,
    category: 'research',
    requiredContext: { itemId: true, organizationId: true },
    availableInPages: ['item_detail', 'review'],
  },

  // ==========================================================================
  // Search Tools (org-scoped, no itemId needed, work everywhere)
  // ==========================================================================
  {
    name: 'search_items',
    factory: searchItemsTool,
    category: 'search',
    requiredContext: { organizationId: true },
    // Useful on most pages for finding items
    availableInPages: ['dashboard', 'items', 'review', 'other'],
  },
  {
    name: 'search_research',
    factory: searchResearchTool,
    category: 'search',
    requiredContext: { organizationId: true },
    // Useful for finding past research
    availableInPages: ['dashboard', 'items', 'review', 'other'],
  },
  {
    name: 'search_evidence',
    factory: searchEvidenceTool,
    category: 'search',
    requiredContext: { organizationId: true },
    // Useful for finding evidence bundles
    availableInPages: ['dashboard', 'items', 'review', 'other'],
  },

  // ==========================================================================
  // Aggregate Tools (org-scoped, for inventory overview)
  // ==========================================================================
  {
    name: 'get_dashboard_stats',
    factory: getDashboardStatsTool,
    category: 'aggregate',
    requiredContext: { organizationId: true },
    // Most useful on dashboard and general pages
    availableInPages: ['dashboard', 'other'],
  },
  {
    name: 'get_review_queue_summary',
    factory: getReviewQueueSummaryTool,
    category: 'aggregate',
    requiredContext: { organizationId: true },
    // Useful on review page and dashboard
    availableInPages: ['review', 'dashboard', 'other'],
  },
  {
    name: 'get_inventory_value',
    factory: getInventoryValueTool,
    category: 'aggregate',
    requiredContext: { organizationId: true },
    availableInPages: ['dashboard', 'items', 'other'],
  },

  // ==========================================================================
  // Action Tools (always available for UI integration)
  // ==========================================================================
  {
    name: 'suggest_action',
    factory: suggestActionTool,
    category: 'action',
    requiredContext: { organizationId: true },
    availableInPages: [], // Empty = all pages
    alwaysAvailable: true,
  },

  // ==========================================================================
  // Domain Knowledge Tools (Slice 1 - explain and decode)
  // ==========================================================================
  {
    name: 'decode_identifier',
    factory: decodeIdentifierTool,
    category: 'domain',
    requiredContext: { organizationId: true },
    // Available on item pages and capture (where identifiers are found)
    availableInPages: ['item_detail', 'review', 'capture'],
  },
  {
    name: 'check_authenticity',
    factory: checkAuthenticityTool,
    category: 'domain',
    requiredContext: { itemId: true, organizationId: true },
    // Available on item pages for authenticity assessment
    availableInPages: ['item_detail', 'review'],
  },
  {
    name: 'get_value_drivers',
    factory: getValueDriversTool,
    category: 'domain',
    requiredContext: { itemId: true, organizationId: true },
    // Available where users need to understand value
    availableInPages: ['item_detail', 'review'],
  },
  {
    name: 'explain_pricing',
    factory: explainPricingTool,
    category: 'domain',
    requiredContext: { itemId: true, organizationId: true },
    // Available where users need pricing explanations
    availableInPages: ['item_detail', 'review'],
  },
  {
    name: 'validate_comp',
    factory: validateCompTool,
    category: 'domain',
    requiredContext: { itemId: true, organizationId: true },
    // Available where users review comps
    availableInPages: ['item_detail', 'review'],
  },

  // ==========================================================================
  // Advanced Research Tools (Slice 2 - external lookups and AI analysis)
  // ==========================================================================
  {
    name: 'lookup_upc',
    factory: lookupUpcTool,
    category: 'research-advanced',
    requiredContext: { organizationId: true },
    // Available anywhere - can look up UPC without item context
    availableInPages: ['item_detail', 'review', 'capture', 'other'],
  },
  {
    name: 'web_search_product',
    factory: webSearchProductTool,
    category: 'research-advanced',
    requiredContext: { organizationId: true },
    // Available on item pages and general pages
    availableInPages: ['item_detail', 'review', 'capture', 'other'],
  },
  {
    name: 'reverse_image_search',
    factory: reverseImageSearchTool,
    category: 'research-advanced',
    requiredContext: { organizationId: true },
    // Available where images exist or can be provided
    availableInPages: ['item_detail', 'review', 'capture'],
  },
  {
    name: 'detect_category',
    factory: detectCategoryTool,
    category: 'research-advanced',
    requiredContext: { organizationId: true },
    // Available on item pages for categorization
    availableInPages: ['item_detail', 'review', 'capture'],
  },
  {
    name: 'extract_text_from_image',
    factory: extractTextFromImageTool,
    category: 'research-advanced',
    requiredContext: { organizationId: true },
    // Available where images exist
    availableInPages: ['item_detail', 'review', 'capture'],
  },
  {
    name: 'compare_images',
    factory: compareImagesTool,
    category: 'research-advanced',
    requiredContext: { itemId: true, organizationId: true },
    // Requires item context to compare against
    availableInPages: ['item_detail', 'review'],
  },
];

/**
 * Get tools filtered by page context
 *
 * @param deps - Tool dependencies
 * @param context - Page context for filtering
 * @returns Array of tools available in the current context
 */
export function getToolsForContext(
  deps: ChatToolDependencies,
  context: {
    pageType: string;
    hasItemId: boolean;
    organizationId: string;
  },
): StructuredTool[] {
  return TOOL_REGISTRY.filter((meta) => {
    // Always include universal tools
    if (meta.alwaysAvailable) {
      return true;
    }

    // Filter by page availability
    if (
      meta.availableInPages.length > 0 &&
      !meta.availableInPages.includes(context.pageType as any)
    ) {
      return false;
    }

    // Filter by required context
    if (meta.requiredContext.itemId && !context.hasItemId) {
      return false;
    }

    return true;
  }).map((meta) => meta.factory(deps));
}

/**
 * Get all tools (backward compatibility)
 */
export function getAllChatTools(deps: ChatToolDependencies): StructuredTool[] {
  return TOOL_REGISTRY.map((meta) => meta.factory(deps));
}

/**
 * Get tool metadata by name
 */
export function getToolMetadata(toolName: string): ToolMetadata | undefined {
  return TOOL_REGISTRY.find((meta) => meta.name === toolName);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(
  deps: ChatToolDependencies,
  category: ToolMetadata['category'],
): StructuredTool[] {
  return TOOL_REGISTRY.filter((meta) => meta.category === category).map((meta) => meta.factory(deps));
}
