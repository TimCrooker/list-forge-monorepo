import {
  LifecycleStatus,
  AiReviewState,
  ItemSource,
  AgentOperationEvent,
} from '@listforge/core-types';
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
  status: 'success' | 'error' | 'paused';
  summary?: string;
  error?: string;
  timestamp: string;
}

/**
 * Payload for research:paused event
 */
export interface ResearchPausedPayload {
  researchRunId: string;
  itemId: string;
  timestamp: string;
}

/**
 * Payload for research:resumed event
 */
export interface ResearchResumedPayload {
  researchRunId: string;
  itemId: string;
  timestamp: string;
}

/**
 * Payload for research:cancelled event
 */
export interface ResearchCancelledPayload {
  researchRunId: string;
  itemId: string;
  timestamp: string;
}

/**
 * Legacy entry format for research:activity event
 * @deprecated Use AgentOperationEvent format instead
 */
export interface LegacyResearchActivityEntry {
  id: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  status: 'success' | 'error' | 'warning' | 'info' | 'processing';
  stepId?: string;
  timestamp: string;
}

/**
 * Payload for research:activity event
 * Streams granular activity log entries in real-time
 *
 * Supports both legacy format and new AgentOperationEvent format.
 * New format includes operationId, operationType, eventType for grouping into widgets.
 */
export interface ResearchActivityPayload {
  researchRunId: string;
  itemId: string;
  /**
   * Activity entry - can be either legacy format or new AgentOperationEvent format.
   * Check for presence of operationId to determine format.
   */
  entry: LegacyResearchActivityEntry | AgentOperationEvent;
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

// ============================================================================
// General Chatbot: Enhanced Chat Events
// ============================================================================

/**
 * Payload for chat:tool_progress event
 * Streams tool execution updates during agent processing
 */
export interface ChatToolProgressPayload {
  sessionId: string;
  toolName: string;
  status: 'starting' | 'completed' | 'error';
  displayName?: string;
  message?: string;
  timestamp: string;
}

/**
 * Payload for chat:action_suggested event
 * Streams action buttons as they're generated
 */
export interface ChatActionSuggestedPayload {
  sessionId: string;
  action: {
    id: string;
    type: string;
    label: string;
    description?: string;
    priority?: 'low' | 'normal' | 'high';
    autoExecute?: boolean;
    payload: Record<string, unknown>;
  };
  timestamp: string;
}

/**
 * Payload for chat:context_update event (client → server)
 * Frontend sends current page context
 */
export interface ChatContextUpdatePayload {
  sessionId: string;
  context: {
    pageType: string;
    currentRoute: string;
    currentItemId?: string;
    activeTab?: string;
    activeModal?: string;
    researchStatus?: string;
    visibleErrors?: string[];
    formDirtyFields?: string[];
  };
}

/**
 * Payload for chat:proactive_suggestion event
 * Server sends proactive suggestions based on context
 */
export interface ChatProactiveSuggestionPayload {
  userId: string;
  suggestion: {
    id: string;
    type: string;
    label: string;
    description?: string;
    payload: Record<string, unknown>;
  };
  context?: {
    routeName?: string;
    itemId?: string;
    ruleId?: string;
  };
  expiresInSeconds?: number;
  timestamp: string;
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
  | ResearchActivityPayload
  | ChatMessagePayload
  | ChatTokenPayload
  | ChatErrorPayload
  | ChatActionAppliedPayload
  | ChatResearchStartedPayload
  | ChatResearchCompletedPayload
  | ChatToolProgressPayload
  | ChatActionSuggestedPayload
  | ChatContextUpdatePayload
  | ChatProactiveSuggestionPayload;

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
  [SocketEvents.RESEARCH_ACTIVITY]: ResearchActivityPayload;
  [SocketEvents.RESEARCH_PAUSED]: ResearchPausedPayload;
  [SocketEvents.RESEARCH_RESUMED]: ResearchResumedPayload;
  [SocketEvents.RESEARCH_CANCELLED]: ResearchCancelledPayload;
  [SocketEvents.CHAT_MESSAGE]: ChatMessagePayload;
  [SocketEvents.CHAT_TOKEN]: ChatTokenPayload;
  [SocketEvents.CHAT_ERROR]: ChatErrorPayload;
  [SocketEvents.CHAT_ACTION_APPLIED]: ChatActionAppliedPayload;
  [SocketEvents.CHAT_RESEARCH_STARTED]: ChatResearchStartedPayload;
  [SocketEvents.CHAT_RESEARCH_COMPLETED]: ChatResearchCompletedPayload;
  // General Chatbot: Enhanced events
  [SocketEvents.CHAT_TOOL_PROGRESS]: ChatToolProgressPayload;
  [SocketEvents.CHAT_ACTION_SUGGESTED]: ChatActionSuggestedPayload;
  [SocketEvents.CHAT_CONTEXT_UPDATE]: ChatContextUpdatePayload;
  [SocketEvents.CHAT_PROACTIVE_SUGGESTION]: ChatProactiveSuggestionPayload;
}
