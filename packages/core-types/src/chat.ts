/**
 * Chat Types - Phase 6 Sub-Phase 9
 *
 * Types for the AI chat agent integration point.
 * These define the contract for future AI chat functionality.
 */

/**
 * Role of a chat message participant
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Types of actions the chat agent can suggest
 */
export type ChatActionType = 'edit_field' | 'trigger_research' | 'suggest_price' | 'update_field';

/**
 * An action that the chat agent can suggest to the user
 */
export interface ChatAction {
  id: string;
  type: ChatActionType;
  label: string;
  payload: Record<string, unknown>;
  applied?: boolean; // Phase 7 Slice 6: Track if action has been applied
}

/**
 * A single message in a chat conversation
 */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

/**
 * Context for an item-specific chat conversation
 */
export interface ItemChatContext {
  itemId: string;
  conversationHistory: ChatMessage[];
}
