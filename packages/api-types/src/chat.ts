/**
 * Chat API Types - Phase 6 Sub-Phase 9 + Phase 7 Slice 5
 *
 * Request and response types for chat endpoints.
 */

// ============================================================================
// Phase 7 Slice 5: New Chat Types
// ============================================================================

/**
 * Chat session DTO - Updated for general-purpose chat
 */
export interface ChatSessionDto {
  id: string;
  conversationType: 'item_scoped' | 'general' | 'dashboard' | 'review_queue' | 'custom';
  title: string | null;
  itemId: string | null;
  item?: {
    id: string;
    title: string;
  };
  userId: string;
  organizationId: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

/**
 * Chat action DTO (Phase 7 Slice 6 + Slice 7 + General Chatbot)
 */
export interface ChatActionDto {
  type:
    | 'update_field'
    | 'trigger_research'
    | 'suggest_price'
    | 'start_research'
    // Extended action types for general chatbot
    | 'navigate'
    | 'open_item'
    | 'copy'
    | 'run_tool'
    | 'external_link';
  field?: string;
  value?: unknown;
  label: string;
  applied: boolean;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  autoExecute?: boolean;
  payload?: Record<string, unknown>;
}

/**
 * Chat message DTO (matches entity structure)
 */
export interface ChatMessageDto {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: ChatActionDto[]; // Phase 7 Slice 6: Actions associated with message
  createdAt: string;
}

/**
 * Request to create a chat session
 */
export interface CreateChatSessionRequest {
  itemId: string;
}

/**
 * Response after creating a chat session
 */
export interface CreateChatSessionResponse {
  session: ChatSessionDto;
}

/**
 * Response for getting chat messages
 */
export interface GetChatMessagesResponse {
  messages: ChatMessageDto[];
  total: number;
}

// ============================================================================
// General Purpose Chat Types (New)
// ============================================================================

/**
 * Request to create a general chat session
 */
export interface CreateGeneralChatSessionRequest {
  conversationType?: 'item_scoped' | 'general' | 'dashboard' | 'review_queue' | 'custom';
  itemId?: string;
  title?: string;
  contextSnapshot?: Record<string, unknown>;
}

/**
 * Request to update a chat session
 */
export interface UpdateChatSessionRequest {
  title?: string;
  contextSnapshot?: Record<string, unknown>;
}

/**
 * Response for listing chat sessions
 */
export interface ListChatSessionsResponse {
  sessions: ChatSessionDto[];
}

/**
 * Send message payload (for WebSocket)
 */
export interface SendMessagePayload {
  sessionId: string;
  content: string;
  context?: {
    pageType?: string;
    currentRoute?: string;
    currentItemId?: string;
    activeTab?: string;
    activeModal?: string;
  };
}

// ============================================================================
// Phase 6 Sub-Phase 9: Legacy Types (kept for backward compatibility)
// ============================================================================

/**
 * Chat message for item context (legacy format)
 * @deprecated Use ChatMessageDto instead
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: Array<{
    type: string;
    label: string;
    data?: Record<string, any>;
  }>;
}

/**
 * Request to send a chat message to the item chat agent
 */
export interface SendChatMessageRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

/**
 * Response from sending a chat message
 */
export interface SendChatMessageResponse {
  message: ChatMessage;
}

/**
 * Response for getting chat history
 */
export interface GetChatHistoryResponse {
  messages: ChatMessage[];
}
