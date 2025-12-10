/**
 * Chat Types - General Chatbot Implementation
 *
 * Types for the AI chat agent integration following MAX architecture patterns.
 * Supports rich actions, context injection, and app-wide assistance.
 */

/**
 * Role of a chat message participant
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Types of actions the chat agent can suggest
 * Extended to support navigation, clipboard, and more
 */
export type ChatActionType =
  | 'update_field'      // Update an item field
  | 'navigate'          // Navigate to a route in the app
  | 'open_item'         // Open a specific item's detail page
  | 'copy'              // Copy text to clipboard
  | 'trigger_research'  // Start research for an item
  | 'run_tool'          // Execute another tool
  | 'external_link'     // Open external URL
  // Legacy types (kept for backward compat)
  | 'edit_field'        // @deprecated use update_field
  | 'suggest_price';    // @deprecated use update_field with defaultPrice

/**
 * Priority level for action display
 */
export type ChatActionPriority = 'low' | 'normal' | 'high';

/**
 * An action that the chat agent can suggest to the user
 */
export interface ChatAction {
  id: string;
  type: ChatActionType;
  label: string;
  description?: string;
  priority?: ChatActionPriority;
  autoExecute?: boolean; // Execute immediately (for explicit navigation requests)
  payload: ChatActionPayload;
  applied?: boolean;
}

/**
 * Type-specific payloads for actions
 */
export type ChatActionPayload =
  | NavigateActionPayload
  | OpenItemActionPayload
  | UpdateFieldActionPayload
  | CopyActionPayload
  | TriggerResearchActionPayload
  | RunToolActionPayload
  | ExternalLinkActionPayload
  | Record<string, unknown>; // Fallback for legacy

export interface NavigateActionPayload {
  type: 'navigate';
  routeName: string;
  path: string;
  params?: Record<string, string>;
}

export interface OpenItemActionPayload {
  type: 'open_item';
  itemId: string;
  path: string;
  tab?: string;
}

export interface UpdateFieldActionPayload {
  type: 'update_field';
  itemId?: string;
  field: string;
  value: unknown;
}

export interface CopyActionPayload {
  type: 'copy';
  text: string;
}

export interface TriggerResearchActionPayload {
  type: 'trigger_research';
  itemId?: string;
}

export interface RunToolActionPayload {
  type: 'run_tool';
  toolName: string;
  args: Record<string, unknown>;
}

export interface ExternalLinkActionPayload {
  type: 'external_link';
  url: string;
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

/**
 * Chat context sent from frontend (page state)
 */
export interface ChatPageContext {
  pageType: 'items' | 'item_detail' | 'review' | 'capture' | 'settings' | 'dashboard' | 'other';
  currentRoute: string;
  currentItemId?: string;
  activeTab?: string;
  activeModal?: string;
  researchStatus?: 'none' | 'running' | 'complete' | 'stale';
  visibleErrors?: string[];
  formDirtyFields?: string[];
}

/**
 * Tool progress event for UI
 */
export interface ChatToolProgress {
  toolName: string;
  status: 'starting' | 'completed' | 'error';
  displayName?: string;
  message?: string;
  result?: unknown;
}
