/**
 * Room naming helpers for Socket.IO rooms
 *
 * Rooms are used to scope events to specific contexts:
 * - Organization-wide events
 * - Entity-specific events (e.g., a single listing draft)
 * - User-specific events
 * - Queue-specific events
 */

/**
 * Room naming utilities
 */
export const Rooms = {
  /**
   * Organization-wide room for events affecting the entire org
   * Example: org:abc123
   */
  org: (orgId: string) => `org:${orgId}`,

  /**
   * Room for a specific item
   * Example: item:xyz789
   */
  item: (id: string) => `item:${id}`,

  /**
   * Review queue room for an organization (Phase 6)
   * Example: review-queue:abc123
   */
  reviewQueue: (orgId: string) => `review-queue:${orgId}`,

  /**
   * Item review queue room for an organization (Phase 6)
   * Example: item-review-queue:abc123
   */
  itemReviewQueue: (orgId: string) => `item-review-queue:${orgId}`,

  /**
   * User-specific room for personal notifications
   * Example: user:user456
   */
  user: (userId: string) => `user:${userId}`,
} as const;
