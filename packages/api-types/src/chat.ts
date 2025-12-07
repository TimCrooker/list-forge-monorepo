/**
 * Chat API Types - Phase 6 Sub-Phase 9 + Phase 7 Slice 5
 *
 * Request and response types for chat endpoints.
 */

// ============================================================================
// Phase 7 Slice 5: New Chat Types
// ============================================================================

/**
 * Chat session DTO
 */
export interface ChatSessionDto {
  id: string;
  itemId: string;
  createdAt: string;
  lastMessageAt?: string;
}

/**
 * Chat action DTO (Phase 7 Slice 6 + Slice 7)
 */
export interface ChatActionDto {
  type: 'update_field' | 'trigger_research' | 'suggest_price' | 'start_research';
  field?: string;
  value?: unknown;
  label: string;
  applied: boolean;
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
