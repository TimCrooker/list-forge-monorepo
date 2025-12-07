/**
 * Chat API Types - Phase 6 Sub-Phase 9
 *
 * Request and response types for chat endpoints.
 */

/**
 * Chat message for item context
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
