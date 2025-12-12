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
export * from './domain.tools';
export * from './research-advanced.tools';

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
  triggerResearchTool,
  researchFieldTool
} from './research.tools';
import { suggestActionTool } from './action.tools';
import { searchItemsTool, searchResearchTool, searchEvidenceTool } from './search.tools';
import { getDashboardStatsTool, getReviewQueueSummaryTool } from './aggregate.tools';
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
    researchFieldTool(deps),

    // Action tools
    suggestActionTool(deps),

    // Search tools
    searchItemsTool(deps),
    searchResearchTool(deps),
    searchEvidenceTool(deps),

    // Aggregate tools (for app-wide queries)
    getDashboardStatsTool(deps),
    getReviewQueueSummaryTool(deps),

    // Domain knowledge tools (Slice 1)
    decodeIdentifierTool(deps),
    checkAuthenticityTool(deps),
    getValueDriversTool(deps),
    explainPricingTool(deps),
    validateCompTool(deps),

    // Advanced research tools (Slice 2)
    lookupUpcTool(deps),
    webSearchProductTool(deps),
    reverseImageSearchTool(deps),
    detectCategoryTool(deps),
    extractTextFromImageTool(deps),
    compareImagesTool(deps),
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

  // Field-driven research (optional - falls back to full research if not provided)
  researchField?: (params: {
    itemId: string;
    organizationId: string;
    fieldName: string;
    researchMode: 'fast' | 'balanced' | 'thorough';
    hint?: string;
  }) => Promise<{
    value: unknown;
    confidence?: number;
    source?: string;
    costUsd?: number;
  }>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Domain Knowledge Tools (Slice 1)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Decode product identifiers (date codes, style numbers, etc.) */
  decodeIdentifier?: (params: {
    type: string;
    value: string;
    brand?: string;
    category?: string;
  }) => Promise<{
    success: boolean;
    identifierType?: string;
    decoded?: Record<string, unknown>;
    confidence?: number;
    details?: string;
  } | null>;

  /** Check authenticity markers for an item */
  checkAuthenticity?: (
    itemId: string,
    orgId: string,
  ) => Promise<{
    assessment: 'likely_authentic' | 'likely_fake' | 'uncertain' | 'insufficient_data';
    confidence: number;
    markersChecked: Array<{
      name: string;
      passed: boolean;
      confidence: number;
      details?: string;
    }>;
    summary: string;
    warnings: string[];
  } | null>;

  /** Get value drivers that affect pricing for an item */
  getValueDrivers?: (
    itemId: string,
    orgId: string,
  ) => Promise<
    Array<{
      driverId: string;
      name: string;
      matchedValue: string;
      priceMultiplier: number;
      confidence: number;
      reasoning: string;
    }>
  >;

  /** Explain how pricing was calculated for an item */
  explainPricing?: (
    itemId: string,
    orgId: string,
  ) => Promise<{
    hasResearch: boolean;
    priceBands?: Array<{
      label: string;
      amount: number;
      currency: string;
      confidence: number;
      reasoning: string;
    }>;
    compsUsed?: number;
    validComps?: number;
    outlierFiltering?: {
      removed: number;
      q1: number;
      q3: number;
    };
    valueDriversApplied?: Array<{
      name: string;
      multiplier: number;
    }>;
    marketConditions?: {
      sellThroughRate?: number;
      competition?: number;
      priceTrend?: string;
    };
    summary: string;
  } | null>;

  /** Validate a comparable listing against an item */
  validateComp?: (
    itemId: string,
    compId: string,
    orgId: string,
    compData?: {
      title?: string;
      price?: number;
      condition?: string;
      soldDate?: string;
      brand?: string;
      model?: string;
    },
  ) => Promise<{
    isValid: boolean;
    overallScore: number;
    criteria: {
      brandMatch: { matches: boolean; confidence: number; itemBrand?: string; compBrand?: string };
      modelMatch: { matches: boolean; confidence: number; itemModel?: string; compModel?: string };
      conditionMatch: { matches: boolean; withinGrade: number; itemCondition?: string; compCondition?: string };
      variantMatch: { matches: boolean; confidence: number; details?: string };
      recency: { valid: boolean; daysSinceSold?: number | null; threshold: number };
      priceOutlier: { isOutlier: boolean; zScore?: number };
    };
    reasoning: string;
  } | null>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Advanced Research Tools (Slice 2)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Look up product info from UPC/EAN barcode */
  lookupUpc?: (code: string) => Promise<{
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
  webSearchProduct?: (params: {
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
  reverseImageSearch?: (imageUrl: string) => Promise<{
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
  detectCategory?: (context: {
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
  extractTextFromImage?: (imageUrls: string[]) => Promise<{
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
  compareImages?: (
    itemImages: string[],
    compImages: string[],
  ) => Promise<{
    similarityScore: number;
    isSameProduct: boolean;
    reasoning: string;
    cached: boolean;
  }>;
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
  research_field: {
    displayName: 'Field Research',
    progressMessages: {
      starting: 'Researching field...',
      completed: 'Field research complete',
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
  // Domain knowledge tools (Slice 1)
  decode_identifier: {
    displayName: 'Decode Identifier',
    progressMessages: {
      starting: 'Decoding identifier...',
      completed: 'Identifier decoded',
    },
  },
  check_authenticity: {
    displayName: 'Authenticity Check',
    progressMessages: {
      starting: 'Checking authenticity markers...',
      completed: 'Authenticity check complete',
    },
  },
  get_value_drivers: {
    displayName: 'Value Drivers',
    progressMessages: {
      starting: 'Detecting value drivers...',
      completed: 'Value drivers detected',
    },
  },
  explain_pricing: {
    displayName: 'Pricing Explanation',
    progressMessages: {
      starting: 'Analyzing pricing methodology...',
      completed: 'Pricing explained',
    },
  },
  validate_comp: {
    displayName: 'Comp Validation',
    progressMessages: {
      starting: 'Validating comparable...',
      completed: 'Comparable validated',
    },
  },
  // Advanced research tools (Slice 2)
  lookup_upc: {
    displayName: 'UPC Lookup',
    progressMessages: {
      starting: 'Looking up barcode...',
      completed: 'Barcode lookup complete',
    },
  },
  web_search_product: {
    displayName: 'Web Search',
    progressMessages: {
      starting: 'Searching the web...',
      completed: 'Web search complete',
    },
  },
  reverse_image_search: {
    displayName: 'Image Search',
    progressMessages: {
      starting: 'Searching by image...',
      completed: 'Image search complete',
    },
  },
  detect_category: {
    displayName: 'Category Detection',
    progressMessages: {
      starting: 'Detecting category...',
      completed: 'Category detected',
    },
  },
  extract_text_from_image: {
    displayName: 'OCR Extraction',
    progressMessages: {
      starting: 'Extracting text from images...',
      completed: 'Text extracted',
    },
  },
  compare_images: {
    displayName: 'Image Comparison',
    progressMessages: {
      starting: 'Comparing images...',
      completed: 'Images compared',
    },
  },
};
