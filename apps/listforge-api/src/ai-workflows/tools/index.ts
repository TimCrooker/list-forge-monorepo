/**
 * Tool Registry - Unified tools for chat and research agents
 *
 * This module provides a centralized registry of tools that can be used
 * by both the chat agent and research agent. Tools follow these principles:
 *
 * 1. Tools return data, agent reasons - No LLM calls inside tools
 * 2. Clear, descriptive Zod schemas - Rich descriptions for LLM understanding
 * 3. Graceful error handling - Return error messages the agent can understand
 * 4. Context injection via setters - Tools that need context use setter pattern
 */

// Re-export tool implementations
export * from './item.tools';
export * from './research.tools';
export * from './action.tools';
export * from './search.tools';
export * from './aggregate.tools';

// Re-export tool registry for context-aware tool selection
export * from './tool-registry';

// Re-export legacy chat tools for backward compat
export * from './chat.tools';

import { StructuredTool } from '@langchain/core/tools';
import {
  getItemSnapshotTool,
  getItemFacetTool,
  updateItemFieldTool
} from './item.tools';
import {
  getResearchDataTool,
  searchCompsTool,
  triggerResearchTool
} from './research.tools';
import { suggestActionTool } from './action.tools';
import { searchItemsTool, searchResearchTool, searchEvidenceTool } from './search.tools';
import { getDashboardStatsTool, getReviewQueueSummaryTool } from './aggregate.tools';

import { AsyncLocalStorage } from 'async_hooks';

/**
 * Tool context - injected into tools that need it
 * Uses AsyncLocalStorage for request-scoped isolation
 */
export interface ToolContext {
  userId: string;
  organizationId: string;
  sessionId?: string;
  itemId?: string;
}

/**
 * AsyncLocalStorage for request-scoped tool context
 * Prevents race conditions in concurrent request handling
 */
const toolContextStorage = new AsyncLocalStorage<ToolContext>();

/**
 * Run a function with tool context in isolated async scope
 * This ensures context doesn't leak between concurrent requests
 *
 * @param context - The tool context for this request
 * @param fn - The async function to execute with this context
 * @returns Promise resolving to the function's return value
 */
export async function runWithToolContext<T>(
  context: ToolContext,
  fn: () => Promise<T>,
): Promise<T> {
  return toolContextStorage.run(context, fn);
}

/**
 * Get the current tool context from AsyncLocalStorage
 * Used by tools that need access to user/org context
 *
 * @throws Error if called outside of runWithToolContext
 */
export function getToolContext(): ToolContext {
  const context = toolContextStorage.getStore();
  if (!context) {
    throw new Error('Tool context not available. Ensure tools are called within runWithToolContext.');
  }
  return context;
}

/**
 * Legacy exports for backward compatibility
 * @deprecated Use runWithToolContext instead
 */
export function setToolContext(context: ToolContext): void {
  throw new Error('setToolContext is deprecated. Use runWithToolContext instead.');
}

export function clearToolContext(): void {
  // No-op for backward compatibility
}

/**
 * Get all chat tools as an array
 * Used when binding tools to the LLM
 */
export function getChatTools(deps: ChatToolDependencies): StructuredTool[] {
  return [
    // Item tools
    getItemSnapshotTool(deps),
    getItemFacetTool(deps),
    updateItemFieldTool(deps),

    // Research tools
    getResearchDataTool(deps),
    searchCompsTool(deps),
    triggerResearchTool(deps),

    // Action tools
    suggestActionTool(deps),

    // Search tools
    searchItemsTool(deps),
    searchResearchTool(deps),
    searchEvidenceTool(deps),

    // Aggregate tools (for app-wide queries)
    getDashboardStatsTool(deps),
    getReviewQueueSummaryTool(deps),
  ];
}

/**
 * Item update payload
 */
export interface ItemUpdatePayload {
  title?: string;
  description?: string;
  condition?: string;
  defaultPrice?: number;
  quantity?: number;
  [key: string]: unknown;
}

/**
 * Item search query
 */
export interface ItemSearchQuery {
  title?: string;
  condition?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Evidence search query
 */
export interface EvidenceSearchQuery {
  itemId?: string;
  type?: string;
  source?: string;
  limit?: number;
}

/**
 * Comp search parameters
 */
export interface CompSearchParams {
  query?: string;
  keywords?: string;
  imageUrl?: string;
  source?: string;
  limit?: number;
}

/**
 * Research job parameters
 */
export interface ResearchJobParams {
  itemId: string;
  priority?: 'low' | 'normal' | 'high';
  options?: Record<string, unknown>;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalItems: number;
  pendingReview: number;
  readyToList: number;
  listed: number;
  totalValue?: number;
  currency?: string;
  byStatus?: Record<string, number>;
  byAIReview?: Record<string, number>;
  recentActivity?: Record<string, number>;
  staleResearch?: number;
  items?: unknown[];
  [key: string]: unknown;
}

/**
 * Review queue statistics
 */
export interface ReviewQueueStats {
  totalPending: number;
  byStatus: Record<string, number>;
  needsWork?: number;
  avgConfidence?: number;
  byConfidence?: Record<string, number>;
  oldestPending?: {
    id: string;
    title: string;
    createdAt: string;
    [key: string]: unknown;
  };
  items?: unknown[];
  [key: string]: unknown;
}

/**
 * Basic item shape (minimal type to avoid circular dependencies)
 */
export interface ItemData {
  id: string;
  title: string | null;
  description: string | null;
  condition: string | null;
  defaultPrice: number | null;
  currency: string;
  quantity: number;
  lifecycleStatus: string;
  aiReviewState: string;
  categoryPath?: string[];
  media?: Array<{ id: string; url: string; type?: string; [key: string]: any }>;
  attributes?: Array<{ key: string; value: string; [key: string]: any }>;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

/**
 * Research data shape
 */
export interface ResearchData {
  id: string;
  itemId: string;
  status?: string;
  confidence?: number;
  productIdentification?: Record<string, any>;
  comps?: Array<Record<string, any>>;
  priceBands?: Array<Record<string, any>>;
  demandSignals?: Array<Record<string, any>>;
  listings?: Array<Record<string, any>>;
  [key: string]: any;
}

/**
 * Dependencies required by chat tools
 * These are services that tools call to perform operations
 */
export interface ChatToolDependencies {
  // Item operations
  getItem: (orgId: string, itemId: string) => Promise<ItemData | null>;
  updateItem: (orgId: string, itemId: string, updates: ItemUpdatePayload) => Promise<ItemData | null>;
  searchItems: (orgId: string, query: ItemSearchQuery) => Promise<ItemData[]>;

  // Research operations
  getLatestResearch: (itemId: string, orgId: string) => Promise<ResearchData | null>;
  searchComps: (params: CompSearchParams) => Promise<Array<Record<string, any>>>;
  startResearchJob: (params: ResearchJobParams) => Promise<{ jobId: string; status: string; [key: string]: any }>;

  // Evidence operations
  searchEvidence: (orgId: string, query: EvidenceSearchQuery) => Promise<Array<Record<string, any>>>;

  // Aggregate operations
  getDashboardStats: (orgId: string) => Promise<DashboardStats>;
  getReviewQueueStats: (orgId: string) => Promise<ReviewQueueStats>;

  // Action emission (for suggest_action)
  emitAction?: (sessionId: string, action: unknown) => void;
}

/**
 * Tool display info for UI progress indicators
 */
export const toolDisplayInfo: Record<string, { displayName: string; icon?: string; progressMessages: { starting: string; completed: string } }> = {
  get_item_snapshot: {
    displayName: 'Item Data',
    progressMessages: {
      starting: 'Loading item data...',
      completed: 'Item data loaded',
    },
  },
  get_item_facet: {
    displayName: 'Item Details',
    progressMessages: {
      starting: 'Loading item details...',
      completed: 'Details loaded',
    },
  },
  update_item_field: {
    displayName: 'Update Field',
    progressMessages: {
      starting: 'Updating item...',
      completed: 'Item updated',
    },
  },
  get_research_data: {
    displayName: 'Research Data',
    progressMessages: {
      starting: 'Loading research...',
      completed: 'Research loaded',
    },
  },
  search_comps: {
    displayName: 'Comparable Search',
    progressMessages: {
      starting: 'Searching comparables...',
      completed: 'Comparables found',
    },
  },
  trigger_research: {
    displayName: 'Start Research',
    progressMessages: {
      starting: 'Starting research job...',
      completed: 'Research job started',
    },
  },
  suggest_action: {
    displayName: 'Action Suggestion',
    progressMessages: {
      starting: 'Preparing action...',
      completed: 'Action ready',
    },
  },
  search_items: {
    displayName: 'Item Search',
    progressMessages: {
      starting: 'Searching items...',
      completed: 'Items found',
    },
  },
  search_research: {
    displayName: 'Research Search',
    progressMessages: {
      starting: 'Searching research data...',
      completed: 'Research data found',
    },
  },
  get_dashboard_stats: {
    displayName: 'Dashboard Stats',
    progressMessages: {
      starting: 'Loading dashboard...',
      completed: 'Dashboard loaded',
    },
  },
  get_review_queue_summary: {
    displayName: 'Review Queue',
    progressMessages: {
      starting: 'Loading review queue...',
      completed: 'Review queue loaded',
    },
  },
};
