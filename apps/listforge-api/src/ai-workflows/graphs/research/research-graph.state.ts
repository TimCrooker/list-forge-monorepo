import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import {
  ItemResearchData,
  ProductIdentification,
  PriceBand,
  DemandSignal,
  MissingInfoHint,
  ResearchEvidenceRecord,
} from '@listforge/core-types';

/**
 * Item snapshot for graph state
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
 * Media analysis result from vision model
 */
export interface MediaAnalysisResult {
  category?: string;
  brand?: string;
  model?: string;
  condition?: string;
  attributes: Record<string, string | number | boolean>;
  extractedText?: Record<string, string>;
  confidence: number;
}

/**
 * Research Graph State Annotation
 * Phase 7 Slice 2
 */
export const ResearchGraphAnnotation = Annotation.Root({
  // Core identifiers
  itemId: Annotation<string>(),
  researchRunId: Annotation<string>(),
  organizationId: Annotation<string>(),

  // LLM conversation
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Loaded data
  item: Annotation<ItemSnapshot | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  existingResearch: Annotation<ItemResearchData | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Analysis results
  mediaAnalysis: Annotation<MediaAnalysisResult | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  productIdentification: Annotation<ProductIdentification | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Evidence collection
  comps: Annotation<ResearchEvidenceRecord[]>({
    reducer: (existing, update) => [...(existing || []), ...(update || [])],
    default: () => [],
  }),
  searchQueries: Annotation<string[]>({
    reducer: (existing, update) => [...new Set([...(existing || []), ...(update || [])])],
    default: () => [],
  }),

  // Calculated outputs
  priceBands: Annotation<PriceBand[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),
  demandSignals: Annotation<DemandSignal[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),
  missingInfo: Annotation<MissingInfoHint[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),

  // Control flow
  iteration: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 3,
  }),
  confidenceThreshold: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0.7,
  }),
  overallConfidence: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0,
  }),
  done: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false,
  }),
  error: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
});

export type ResearchGraphState = typeof ResearchGraphAnnotation.State;
