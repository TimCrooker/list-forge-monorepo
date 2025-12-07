import { Annotation } from '@langchain/langgraph';
import { ItemResearchData } from '@listforge/core-types';
import { ChatActionDto } from '@listforge/api-types';

/**
 * Item snapshot for chat graph state
 */
export interface ItemSnapshot {
  id: string;
  title: string | null;
  description: string | null;
  condition: string | null;
  attributes: Array<{ key: string; value: string }>;
  media: Array<{ id: string; url: string; type: string }>;
  defaultPrice: number | null;
  lifecycleStatus: string;
  aiReviewState: string;
}

/**
 * Chat Graph State Annotation
 * Phase 7 Slice 5
 *
 * Lightweight state for fast chat responses (<2s latency target).
 * No checkpointing - stateless execution for speed.
 */
export const ChatGraphAnnotation = Annotation.Root({
  // Session context
  sessionId: Annotation<string>(),
  itemId: Annotation<string>(),
  userId: Annotation<string>(),
  organizationId: Annotation<string>(),

  // User input
  userMessage: Annotation<string>(),

  // Loaded context (read-only)
  item: Annotation<ItemSnapshot | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  research: Annotation<ItemResearchData | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Routing (Phase 7 Slice 6 + Slice 7)
  intent: Annotation<'question' | 'action' | 'research' | 'unknown'>({
    reducer: (existing, update) => update ?? existing,
    default: () => 'unknown',
  }),

  // Research tracking (Phase 7 Slice 7)
  activeResearchJobId: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  researchStale: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false,
  }),

  // Proposed actions (Phase 7 Slice 6)
  proposedActions: Annotation<ChatActionDto[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),

  // Response
  response: Annotation<string>({
    reducer: (existing, update) => update ?? existing,
    default: () => '',
  }),
});

export type ChatGraphState = typeof ChatGraphAnnotation.State;
