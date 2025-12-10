export { loadContextNode } from './load-context.node';
export { analyzeMediaNode } from './analyze-media.node';
export { extractIdentifiersNode } from './extract-identifiers.node';
export { deepIdentifyNode, shouldContinueIdentification } from './deep-identify.node';
export { updateItemNode } from './update-item.node';
// Slice 4: Marketplace Schema Awareness
export { detectMarketplaceSchemaNode } from './detect-marketplace-schema.node';
export { searchCompsNode } from './search-comps.node';
export { analyzeCompsNode } from './analyze-comps.node';
export { calculatePriceNode } from './calculate-price.node';
// Slice 6: Full Listing Assembly
export { assembleListingNode } from './assemble-listing.node';
export { assessMissingNode } from './assess-missing.node';
export { shouldRefineNode } from './should-refine.node';
export { refineSearchNode } from './refine-search.node';
export { persistResultsNode } from './persist-results.node';

// ============================================================================
// Goal-Driven Research System (Slice 1)
// ============================================================================
export {
  initializeGoalsNode,
  areGoalDependenciesSatisfied,
  getReadyGoals,
  updateGoalStatus,
  determineResearchPhase,
} from './initialize-goals.node';

export {
  goalRouter,
  identificationPhaseRouter,
  parallelPhaseRouter,
  isIdentificationComplete,
  completeIdentificationGoalNode,
  completeMetadataGoalNode,
  completeMarketGoalNode,
  completeAssemblyGoalNode,
} from './goal-router.node';

// Planning Phase (Slice 2 - Pre-Act Pattern)
export { planResearchNode } from './plan-research.node';

// ============================================================================
// Field-Driven Research Nodes
// ============================================================================

// Phase 0: Setup
export { initializeFieldStatesNode } from './initialize-field-states.node';

// Phase 1: Fast Extraction
export { extractFromImagesNode } from './extract-from-images.node';
export { quickLookupsNode } from './quick-lookups.node';

// Phase 2: Adaptive Research Loop
export { evaluateFieldsNode, shouldContinueResearch } from './evaluate-fields.node';
export { planNextResearchNode } from './plan-next-research.node';
export { executeResearchNode } from './execute-research.node';

// Phase 3: Validation
export { validateReadinessNode } from './validate-readiness.node';
