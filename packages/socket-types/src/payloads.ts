import { LifecycleStatus, AiReviewState, ItemSource } from '@listforge/core-types';
import { ItemDto, ItemSummaryDto } from '@listforge/api-types';
import { SocketEvents } from './events';

/**
 * Payload interfaces for Socket.IO events
 *
 * Each event has a corresponding payload type that defines
 * the structure of data sent with that event.
 */

// ============================================================================
// Item Events (Phase 6)
// ============================================================================

/**
 * Payload for item:created event
 */
export interface ItemCreatedPayload {
  id: string;
  organizationId: string;
  createdByUserId: string;
  lifecycleStatus: LifecycleStatus;
  aiReviewState: AiReviewState;
  source: ItemSource;
  title: string | null;
  defaultPrice: number | null;
  currency: string;
  primaryImageUrl: string | null;
  createdAt: string;
}

/**
 * Payload for item:updated event
 */
export interface ItemUpdatedPayload {
  item: ItemDto;
}

/**
 * Payload for item:deleted event
 */
export interface ItemDeletedPayload {
  id: string;
  organizationId: string;
}

/**
 * Payload for item:review-status event
 */
export interface ItemReviewStatusPayload {
  id: string;
  organizationId: string;
  aiReviewState: AiReviewState;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
}

/**
 * Payload for item-review-queue:changed event
 */
export interface ItemReviewQueueChangedPayload {
  organizationId: string;
  action: 'added' | 'removed' | 'updated';
  itemId: string;
  item?: ItemSummaryDto;
}

/**
 * Payload for user:notification event
 */
export interface UserNotificationPayload {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  data?: Record<string, unknown>;
}

/**
 * Payload for org:member-added event
 */
export interface OrgMemberAddedPayload {
  organizationId: string;
  userId: string;
  role: string;
}

/**
 * Payload for org:member-removed event
 */
export interface OrgMemberRemovedPayload {
  organizationId: string;
  userId: string;
}

/**
 * Payload for org:updated event
 */
export interface OrgUpdatedPayload {
  organizationId: string;
  changes: Record<string, unknown>;
}

/**
 * Union type of all payload types
 */
export type SocketEventPayload =
  | ItemCreatedPayload
  | ItemUpdatedPayload
  | ItemDeletedPayload
  | ItemReviewStatusPayload
  | ItemReviewQueueChangedPayload
  | UserNotificationPayload
  | OrgMemberAddedPayload
  | OrgMemberRemovedPayload
  | OrgUpdatedPayload;

/**
 * Type map for event name to payload type
 */
export interface SocketEventPayloads {
  [SocketEvents.ITEM_CREATED]: ItemCreatedPayload;
  [SocketEvents.ITEM_UPDATED]: ItemUpdatedPayload;
  [SocketEvents.ITEM_DELETED]: ItemDeletedPayload;
  [SocketEvents.ITEM_REVIEW_STATUS]: ItemReviewStatusPayload;
  [SocketEvents.ITEM_REVIEW_QUEUE_CHANGED]: ItemReviewQueueChangedPayload;
  [SocketEvents.USER_NOTIFICATION]: UserNotificationPayload;
  [SocketEvents.ORG_MEMBER_ADDED]: OrgMemberAddedPayload;
  [SocketEvents.ORG_MEMBER_REMOVED]: OrgMemberRemovedPayload;
  [SocketEvents.ORG_UPDATED]: OrgUpdatedPayload;
}
