import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ItemResearchData } from '@listforge/core-types';
import { ChatActionDto } from '@listforge/api-types';
import { PAGE_TYPES, RESEARCH_STATUS, USER_TYPES, MAX_AGENT_ITERATIONS } from '../../config/chat.constants';

// ============================================================================
// Array Bounds Configuration
// ============================================================================

/**
 * Maximum number of messages to keep in memory
 * Prevents unbounded memory growth in long-running sessions
 * Keeps last N messages (includes system, user, assistant, and tool messages)
 */
const MAX_MESSAGES = 100;

/**
 * Create a bounded message reducer that limits array length
 * Uses LangGraph's built-in messagesStateReducer, then trims if needed
 */
function boundedMessagesReducer(existing: BaseMessage[] | undefined, update: BaseMessage[]): BaseMessage[] {
  // First, apply the standard messages reducer
  const merged = messagesStateReducer(existing, update);

  // If we exceed max length, keep only the most recent messages
  if (merged.length > MAX_MESSAGES) {
    return merged.slice(-MAX_MESSAGES);
  }

  return merged;
}

// ============================================================================
// Context Types - MAX Pattern
// ============================================================================

/**
 * User context - who is asking
 */
export interface UserContext {
  userId: string;
  name: string;
  email: string;
  role: string;
  userType: typeof USER_TYPES[keyof typeof USER_TYPES];
  organizationId: string;
  organizationName: string;
}

/**
 * Chat context - application state from frontend
 */
export interface ChatContext {
  pageType: typeof PAGE_TYPES[keyof typeof PAGE_TYPES];
  currentRoute: string;
  itemId?: string;
  activeTab?: string;
  activeModal?: string;
  researchStatus?: typeof RESEARCH_STATUS[keyof typeof RESEARCH_STATUS];
  visibleErrors?: string[];
  formDirtyFields?: string[];
}

/**
 * Item snapshot for chat graph state
 */
export interface ItemSnapshot {
  id: string;
  title: string | null;
  description: string | null;
  condition: string | null;
  attributes: Array<{ key: string; value: string; source?: string }>;
  media: Array<{ id: string; url: string; type: string }>;
  defaultPrice: number | null;
  currency: string;
  quantity: number;
  lifecycleStatus: string;
  aiReviewState: string;
  categoryPath?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ============================================================================
// Chat Graph State Annotation - MAX Pattern
// ============================================================================

/**
 * Chat Graph State Annotation
 *
 * Implements MAX architecture patterns:
 * - Messages with proper reducer for append behavior
 * - User context for personalization
 * - Chat context for application state awareness
 * - Token tracking for observability
 * - Iteration counting for loop safety
 */
export const ChatGraphAnnotation = Annotation.Root({
  // -------------------------------------------------------------------------
  // Session Identifiers
  // -------------------------------------------------------------------------
  sessionId: Annotation<string>(),

  // -------------------------------------------------------------------------
  // Conversation Messages - uses bounded reducer to prevent memory leaks
  // This is the core of the agent loop - messages accumulate here
  // Limited to MAX_MESSAGES (100) to prevent unbounded growth
  // -------------------------------------------------------------------------
  messages: Annotation<BaseMessage[]>({
    reducer: boundedMessagesReducer,
    default: () => [],
  }),

  // -------------------------------------------------------------------------
  // User Context - who is asking (injected from auth)
  // -------------------------------------------------------------------------
  userContext: Annotation<UserContext | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // -------------------------------------------------------------------------
  // Chat Context - application state from frontend
  // -------------------------------------------------------------------------
  chatContext: Annotation<ChatContext | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // -------------------------------------------------------------------------
  // Item Context - loaded from database when in item context
  // -------------------------------------------------------------------------
  itemId: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  item: Annotation<ItemSnapshot | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  research: Annotation<ItemResearchData | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // -------------------------------------------------------------------------
  // Research Tracking
  // -------------------------------------------------------------------------
  activeResearchJobId: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  researchStale: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false,
  }),

  // -------------------------------------------------------------------------
  // Proposed Actions - actions the agent suggests to the user
  // -------------------------------------------------------------------------
  proposedActions: Annotation<ChatActionDto[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),

  // -------------------------------------------------------------------------
  // Response - final text response to user
  // -------------------------------------------------------------------------
  response: Annotation<string>({
    reducer: (existing, update) => update ?? existing,
    default: () => '',
  }),

  // -------------------------------------------------------------------------
  // Token Usage - accumulates across iterations
  // -------------------------------------------------------------------------
  tokenUsage: Annotation<TokenUsage>({
    reducer: (prev, next) => ({
      promptTokens: (prev?.promptTokens || 0) + (next?.promptTokens || 0),
      completionTokens: (prev?.completionTokens || 0) + (next?.completionTokens || 0),
      totalTokens: (prev?.totalTokens || 0) + (next?.totalTokens || 0),
    }),
    default: () => ({ promptTokens: 0, completionTokens: 0, totalTokens: 0 }),
  }),

  // -------------------------------------------------------------------------
  // Iteration Count - tracks agent loop iterations (for safety limits)
  // -------------------------------------------------------------------------
  iterationCount: Annotation<number>({
    reducer: (prev, next) => (prev || 0) + (next || 0),
    default: () => 0,
  }),
});

export type ChatGraphState = typeof ChatGraphAnnotation.State;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create initial state for a chat session
 */
export function createInitialChatState(params: {
  sessionId: string;
  userContext: UserContext;
  chatContext?: ChatContext;
  itemId?: string;
}): Partial<ChatGraphState> {
  return {
    sessionId: params.sessionId,
    userContext: params.userContext,
    chatContext: params.chatContext ?? null,
    itemId: params.itemId ?? null,
    messages: [],
    proposedActions: [],
    response: '',
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    iterationCount: 0,
  };
}

/**
 * Add a user message to the state
 */
export function addUserMessage(state: Partial<ChatGraphState>, content: string): Partial<ChatGraphState> {
  return {
    ...state,
    messages: [...(state.messages || []), new HumanMessage(content)],
  };
}
