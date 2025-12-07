import { LifecycleStatus, AiReviewState, ItemSource } from '@listforge/core-types';
import { ItemDto, ItemSummaryDto, ChatMessageDto } from '@listforge/api-types';
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

// ============================================================================
// Research Events (Phase 7 Slice 3)
// ============================================================================

/**
 * Payload for research:node-started event
 */
export interface ResearchNodeStartedPayload {
  researchRunId: string;
  itemId: string;
  node: string;
  timestamp: string;
}

/**
 * Payload for research:node-completed event
 */
export interface ResearchNodeCompletedPayload {
  researchRunId: string;
  itemId: string;
  node: string;
  status: 'success' | 'error';
  timestamp: string;
  error?: string;
}

/**
 * Payload for research:job-completed event
 */
export interface ResearchJobCompletedPayload {
  researchRunId: string;
  itemId: string;
  status: 'success' | 'error';
  summary?: string;
  error?: string;
  timestamp: string;
}

// ============================================================================
// Chat Events (Phase 7 Slice 5)
// ============================================================================

/**
 * Payload for chat:message event
 */
export interface ChatMessagePayload {
  sessionId: string;
  message: ChatMessageDto;
}

/**
 * Payload for chat:token event
 */
export interface ChatTokenPayload {
  sessionId: string;
  token: string;
}

/**
 * Payload for chat:error event
 */
export interface ChatErrorPayload {
  sessionId: string;
  error: string;
}

/**
 * Payload for chat:action_applied event (Phase 7 Slice 6)
 */
export interface ChatActionAppliedPayload {
  sessionId: string;
  messageId: string;
  actionIndex: number;
  success: boolean;
  field?: string;
  newValue?: unknown;
  error?: string;
}

/**
 * Payload for chat:research_started event (Phase 7 Slice 7)
 */
export interface ChatResearchStartedPayload {
  sessionId: string;
  itemId: string;
  researchRunId: string;
  timestamp: string;
}

/**
 * Payload for chat:research_completed event (Phase 7 Slice 7)
 */
export interface ChatResearchCompletedPayload {
  sessionId: string;
  itemId: string;
  researchRunId: string;
  status: 'success' | 'error';
  timestamp: string;
  error?: string;
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
  | OrgUpdatedPayload
  | ResearchNodeStartedPayload
  | ResearchNodeCompletedPayload
  | ResearchJobCompletedPayload
  | ChatMessagePayload
  | ChatTokenPayload
  | ChatErrorPayload
  | ChatActionAppliedPayload
  | ChatResearchStartedPayload
  | ChatResearchCompletedPayload;

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
  [SocketEvents.RESEARCH_NODE_STARTED]: ResearchNodeStartedPayload;
  [SocketEvents.RESEARCH_NODE_COMPLETED]: ResearchNodeCompletedPayload;
  [SocketEvents.RESEARCH_JOB_COMPLETED]: ResearchJobCompletedPayload;
  [SocketEvents.CHAT_MESSAGE]: ChatMessagePayload;
  [SocketEvents.CHAT_TOKEN]: ChatTokenPayload;
  [SocketEvents.CHAT_ERROR]: ChatErrorPayload;
  [SocketEvents.CHAT_ACTION_APPLIED]: ChatActionAppliedPayload;
  [SocketEvents.CHAT_RESEARCH_STARTED]: ChatResearchStartedPayload;
  [SocketEvents.CHAT_RESEARCH_COMPLETED]: ChatResearchCompletedPayload;
}
