/**
 * Chat Configuration Constants
 *
 * Centralizes all magic numbers and strings used in chat graph
 */

// ============================================================================
// Page Types
// ============================================================================

export const PAGE_TYPES = {
  ITEMS: 'items' as const,
  ITEM_DETAIL: 'item_detail' as const,
  REVIEW: 'review' as const,
  CAPTURE: 'capture' as const,
  SETTINGS: 'settings' as const,
  DASHBOARD: 'dashboard' as const,
  OTHER: 'other' as const,
};

export type PageType = typeof PAGE_TYPES[keyof typeof PAGE_TYPES];

// ============================================================================
// Research Status
// ============================================================================

export const RESEARCH_STATUS = {
  NONE: 'none' as const,
  RUNNING: 'running' as const,
  COMPLETE: 'complete' as const,
  STALE: 'stale' as const,
};

export type ResearchStatus = typeof RESEARCH_STATUS[keyof typeof RESEARCH_STATUS];

// ============================================================================
// User Roles
// ============================================================================

export const USER_TYPES = {
  ADMIN: 'admin' as const,
  MEMBER: 'member' as const,
};

export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];

// ============================================================================
// Iteration Limits
// ============================================================================

/**
 * Maximum number of iterations in the agent/tools loop
 * Prevents infinite loops if the agent can't converge
 */
export const MAX_AGENT_ITERATIONS = 10;

/**
 * Research staleness threshold in days
 * Research older than this is considered stale and should be refreshed
 */
export const RESEARCH_STALE_DAYS = 7;

// ============================================================================
// LLM Routing
// ============================================================================

/**
 * LLM model configuration keys for different use cases
 */
export const LLM_CONFIG_KEYS = {
  CHAT: 'chat' as const,
  RESEARCH: 'research' as const,
  VISION: 'vision' as const,
};
