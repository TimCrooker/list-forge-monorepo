/**
 * Socket.IO event name constants
 *
 * Phase 6: All events use the unified Item model.
 * General Chatbot: Added enhanced chat events for tool progress, actions, context
 */

export const SocketEvents = {
  // Item events
  ITEM_CREATED: 'item:created',
  ITEM_UPDATED: 'item:updated',
  ITEM_DELETED: 'item:deleted',
  ITEM_AI_STATUS: 'item:ai-status',
  ITEM_REVIEW_STATUS: 'item:review-status',
  ITEM_REVIEW_QUEUE_CHANGED: 'item-review-queue:changed',

  // User events
  USER_NOTIFICATION: 'user:notification',

  // Organization events
  ORG_MEMBER_ADDED: 'org:member-added',
  ORG_MEMBER_REMOVED: 'org:member-removed',
  ORG_UPDATED: 'org:updated',

  // Research events (Phase 7 Slice 3)
  RESEARCH_NODE_STARTED: 'research:node-started',
  RESEARCH_NODE_COMPLETED: 'research:node-completed',
  RESEARCH_JOB_COMPLETED: 'research:job-completed',
  RESEARCH_ACTIVITY: 'research:activity',
  // Research Flow Control events
  RESEARCH_PAUSED: 'research:paused',
  RESEARCH_RESUMED: 'research:resumed',
  RESEARCH_CANCELLED: 'research:cancelled',

  // Chat events (Phase 7 Slice 5)
  CHAT_MESSAGE: 'chat:message',
  CHAT_TOKEN: 'chat:token',
  CHAT_ERROR: 'chat:error',
  // Chat events (Phase 7 Slice 6)
  CHAT_ACTION_APPLIED: 'chat:action_applied',
  // Chat events (Phase 7 Slice 7)
  CHAT_RESEARCH_STARTED: 'chat:research_started',
  CHAT_RESEARCH_COMPLETED: 'chat:research_completed',

  // General Chatbot: Enhanced chat events
  CHAT_TOOL_PROGRESS: 'chat:tool_progress',      // Tool execution updates
  CHAT_ACTION_SUGGESTED: 'chat:action_suggested', // New action button available
  CHAT_CONTEXT_UPDATE: 'chat:context_update',     // Frontend sends page context
  CHAT_PROACTIVE_SUGGESTION: 'chat:proactive_suggestion', // Proactive assistant suggestion
} as const;

/**
 * Type for event names
 */
export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];
