import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import {
  ItemResearchData,
  ProductIdentification,
  PriceBand,
  PricingStrategyOption,
  DemandSignal,
  MissingInfoHint,
  ResearchEvidenceRecord,
  WebSearchResult,
  DiscoveredProductData,
  OCRExtractionResult,
  UPCLookupResult,
  // Slice 4: Marketplace Schema Awareness
  MarketplaceCategory,
  FieldRequirement,
  FieldCompletion,
  // Slice 6: Full Listing Assembly
  MarketplaceListingPayload,
  // Amazon/Keepa Integration
  AmazonProductMatch,
  KeepaProductData,
  // Field-Driven Research
  ItemFieldStates,
  ResearchConstraints,
  ResearchTask,
  FieldEvaluationResult,
  // Goal-Driven Research (Slice 1)
  ResearchGoal,
  ValidatedComparable,
  TieredPricingAnalysis,
  // Planning Phase (Slice 2)
  ResearchPlan,
} from '@listforge/core-types';

// ============================================================================
// Array Bounds Configuration
// ============================================================================

/**
 * Maximum number of warnings to keep in memory
 * Prevents unbounded memory growth during long research runs
 */
const MAX_WARNINGS = 50;

/**
 * Maximum number of web search results to keep
 * Keeps most recent results, older ones are pruned
 */
const MAX_WEB_SEARCH_RESULTS = 50;

/**
 * Maximum number of Amazon matches to keep
 * Keeps highest relevance matches only
 */
const MAX_AMAZON_MATCHES = 20;

/**
 * Maximum number of comps (evidence records) to keep
 * Keeps highest quality comps based on validation score
 */
const MAX_COMPS = 100;

/**
 * Maximum number of validated comps to keep
 * These are the comps that have passed validation and are used for pricing
 */
const MAX_VALIDATED_COMPS = 50;

/**
 * Warning about non-fatal issues during research
 */
export interface ResearchWarning {
  /** Warning severity */
  severity: 'low' | 'medium' | 'high';
  /** Warning category */
  category: 'data_missing' | 'api_failure' | 'low_confidence' | 'rate_limit' | 'other';
  /** Human-readable message */
  message: string;
  /** Source of the warning (node name) */
  source: string;
  /** Impact on research quality */
  impact?: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Create a bounded warnings reducer that limits array length
 * Keeps most recent warnings up to MAX_WARNINGS
 */
function boundedWarningsReducer(
  existing: ResearchWarning[] | undefined,
  update: ResearchWarning[],
): ResearchWarning[] {
  const merged = [...(existing || []), ...(update || [])];

  // If we exceed max length, keep only the most recent warnings
  if (merged.length > MAX_WARNINGS) {
    return merged.slice(-MAX_WARNINGS);
  }

  return merged;
}

/**
 * Bounded reducer for web search results
 * Keeps most recent results up to MAX_WEB_SEARCH_RESULTS
 */
function boundedWebSearchResultsReducer(
  existing: WebSearchResult[] | undefined,
  update: WebSearchResult[],
): WebSearchResult[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_WEB_SEARCH_RESULTS) {
    return merged.slice(-MAX_WEB_SEARCH_RESULTS);
  }

  return merged;
}

/**
 * Bounded reducer for Amazon matches
 * Keeps highest confidence matches up to MAX_AMAZON_MATCHES
 */
function boundedAmazonMatchesReducer(
  existing: AmazonProductMatch[] | undefined,
  update: AmazonProductMatch[],
): AmazonProductMatch[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_AMAZON_MATCHES) {
    // Sort by confidence score (descending) and keep top matches
    return merged
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, MAX_AMAZON_MATCHES);
  }

  return merged;
}

/**
 * Bounded reducer for comps (evidence records)
 * Keeps highest quality comps based on validation score
 */
function boundedCompsReducer(
  existing: ResearchEvidenceRecord[] | undefined,
  update: ResearchEvidenceRecord[],
): ResearchEvidenceRecord[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_COMPS) {
    // Sort by validation overall score (descending) and keep top comps
    return merged
      .sort((a, b) => {
        const scoreA = a.validation?.overallScore || 0;
        const scoreB = b.validation?.overallScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, MAX_COMPS);
  }

  return merged;
}

/**
 * Bounded reducer for validated comps
 * Keeps highest confidence validated comps up to MAX_VALIDATED_COMPS
 */
function boundedValidatedCompsReducer(
  existing: ValidatedComparable[] | undefined,
  update: ValidatedComparable[],
): ValidatedComparable[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_VALIDATED_COMPS) {
    // Sort by confidence score (descending) and keep top comps
    return merged
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, MAX_VALIDATED_COMPS);
  }

  return merged;
}

/**
 * Goals reducer - replaces the entire goals array
 * No merging needed as goals are managed as a complete DAG
 */
function goalsReducer(
  existing: ResearchGoal[] | undefined,
  update: ResearchGoal[],
): ResearchGoal[] {
  // If update is provided, replace entirely
  if (update && update.length > 0) {
    return update;
  }
  return existing || [];
}

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
 * Slice 2: Added variant fields (color, size, edition)
 */
export interface MediaAnalysisResult {
  category?: string;
  brand?: string;
  model?: string;
  condition?: string;
  // Slice 2: Variant fields
  color?: string | null;
  size?: string | null;
  edition?: string | null;
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

  // Deep identification tracking
  identificationAttempts: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0,
  }),
  identificationConfidence: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0,
  }),
  lowConfidenceFlag: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false,
  }),
  webSearchResults: Annotation<WebSearchResult[]>({
    reducer: boundedWebSearchResultsReducer,
    default: () => [],
  }),
  discoveredProductData: Annotation<DiscoveredProductData | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  itemUpdated: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false,
  }),

  // Slice 2: OCR and UPC lookup results
  ocrResult: Annotation<OCRExtractionResult | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  upcLookupResult: Annotation<UPCLookupResult | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Amazon/Keepa Integration
  amazonMatches: Annotation<AmazonProductMatch[]>({
    reducer: boundedAmazonMatchesReducer,
    default: () => [],
  }),
  keepaData: Annotation<Record<string, KeepaProductData>>({
    reducer: (existing, update) => ({ ...(existing || {}), ...(update || {}) }),
    default: () => ({}),
  }),
  amazonAsin: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Slice 4: Marketplace Schema Awareness
  marketplaceCategory: Annotation<MarketplaceCategory | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  requiredFields: Annotation<FieldRequirement[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),
  recommendedFields: Annotation<FieldRequirement[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),
  fieldCompletion: Annotation<FieldCompletion | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Evidence collection
  comps: Annotation<ResearchEvidenceRecord[]>({
    reducer: boundedCompsReducer,
    default: () => [],
  }),
  searchQueries: Annotation<string[]>({
    reducer: (existing, update) => [...new Set([...(existing || []), ...(update || [])])],
    default: () => [],
  }),
  availableDataSources: Annotation<string[]>({
    reducer: (existing, update) => [...new Set([...(existing || []), ...(update || [])])],
    default: () => [],
  }),

  // Calculated outputs
  priceBands: Annotation<PriceBand[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),
  // Slice 5: Pricing strategies with time-to-sell estimates
  pricingStrategies: Annotation<PricingStrategyOption[]>({
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

  // Slice 6: Assembled marketplace listings
  listings: Annotation<MarketplaceListingPayload[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),

  // ============================================================================
  // Goal-Driven Research System (Slice 1)
  // ============================================================================

  // Research goals DAG - IDENTIFY_PRODUCT must complete before parallel goals
  goals: Annotation<ResearchGoal[]>({
    reducer: goalsReducer,
    default: () => [],
  }),

  // Currently active goal ID
  activeGoal: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // IDs of completed goals (for dependency checking)
  completedGoals: Annotation<string[]>({
    reducer: (existing, update) => {
      const combined = [...new Set([...(existing || []), ...(update || [])])];
      return combined;
    },
    default: () => [],
  }),

  // Current phase of the hybrid graph: 'identification' | 'parallel' | 'assembly'
  researchPhase: Annotation<'identification' | 'parallel' | 'assembly'>({
    reducer: (existing, update) => update ?? existing,
    default: () => 'identification',
  }),

  // Validated comps that have passed validation checks
  validatedComps: Annotation<ValidatedComparable[]>({
    reducer: boundedValidatedCompsReducer,
    default: () => [],
  }),

  // Tiered pricing analysis with confidence based on comp quality
  tieredPricing: Annotation<TieredPricingAnalysis | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // ============================================================================
  // Planning Phase (Slice 2 - Pre-Act Pattern)
  // ============================================================================

  // Research plan generated by the planning node
  // Contains visual assessment, identification strategy, tool sequence, etc.
  researchPlan: Annotation<ResearchPlan | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // ============================================================================
  // Field-Driven Research State
  // ============================================================================

  // Per-field confidence tracking and research state
  fieldStates: Annotation<ItemFieldStates | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Research mode and constraints
  researchMode: Annotation<'fast' | 'balanced' | 'thorough'>({
    reducer: (existing, update) => update ?? existing,
    default: () => 'balanced',
  }),
  researchConstraints: Annotation<ResearchConstraints | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Research cost tracking
  currentResearchCost: Annotation<number>({
    reducer: (existing, update) => update ?? existing,
    default: () => 0,
  }),

  // Research task queue and current task
  researchTasks: Annotation<ResearchTask[]>({
    reducer: (existing, update) => update ?? existing,
    default: () => [],
  }),
  currentTask: Annotation<ResearchTask | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Field evaluation result for decision making
  fieldEvaluation: Annotation<FieldEvaluationResult | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),

  // Research context (available data sources and identifiers)
  researchContext: Annotation<{
    hasUpc: boolean;
    hasBrand: boolean;
    hasModel: boolean;
    hasCategory: boolean;
    hasImages: boolean;
    imageCount: number;
    keepaConfigured: boolean;
    amazonConfigured: boolean;
    upcDatabaseConfigured: boolean;
  } | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
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

  // Warnings and non-fatal issues - bounded to prevent memory leaks
  warnings: Annotation<ResearchWarning[]>({
    reducer: boundedWarningsReducer,
    default: () => [],
  }),
});

export type ResearchGraphState = typeof ResearchGraphAnnotation.State;
