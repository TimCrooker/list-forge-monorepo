/**
 * Socket.IO event name constants
 *
 * Phase 6: All events use the unified Item model.
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
} as const;

/**
 * Type for event names
 */
export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];
