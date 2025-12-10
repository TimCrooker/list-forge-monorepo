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
} from './aggregate.tools';

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
  category: 'item' | 'research' | 'search' | 'aggregate' | 'action';

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
