import { StateGraph, START, END } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ResearchGraphAnnotation, ResearchGraphState } from './research-graph.state';
import { loadContextNode } from './nodes/load-context.node';
import { analyzeMediaNode } from './nodes/analyze-media.node';
import { extractIdentifiersNode } from './nodes/extract-identifiers.node';
import { deepIdentifyNode, shouldContinueIdentification } from './nodes/deep-identify.node';
import { updateItemNode } from './nodes/update-item.node';
import { detectMarketplaceSchemaNode } from './nodes/detect-marketplace-schema.node';
import { searchCompsNode } from './nodes/search-comps.node';
import { analyzeCompsNode } from './nodes/analyze-comps.node';
import { calculatePriceNode } from './nodes/calculate-price.node';
import { assembleListingNode } from './nodes/assemble-listing.node';
import { assessMissingNode } from './nodes/assess-missing.node';
import { shouldRefineNode } from './nodes/should-refine.node';
import { refineSearchNode } from './nodes/refine-search.node';
import { persistResultsNode } from './nodes/persist-results.node';
// Field-driven research nodes
import { initializeFieldStatesNode } from './nodes/initialize-field-states.node';
import { extractFromImagesNode } from './nodes/extract-from-images.node';
import { quickLookupsNode } from './nodes/quick-lookups.node';
import { evaluateFieldsNode, shouldContinueResearch } from './nodes/evaluate-fields.node';
import { planNextResearchNode } from './nodes/plan-next-research.node';
import { executeResearchNode } from './nodes/execute-research.node';
import { validateReadinessNode } from './nodes/validate-readiness.node';
// Goal-driven research nodes (Slice 1)
import { initializeGoalsNode } from './nodes/initialize-goals.node';
import {
  goalRouter,
  identificationPhaseRouter,
  completeIdentificationGoalNode,
  completeMetadataGoalNode,
  completeMarketGoalNode,
  completeAssemblyGoalNode,
} from './nodes/goal-router.node';
// Planning Phase (Slice 2)
import { planResearchNode } from './nodes/plan-research.node';
// Slice 6: Identification Validation Checkpoint
import {
  validateIdentificationNode,
  validationCheckpointRouter,
} from './nodes/validate-identification.node';

/**
 * Build Research Graph (DEPRECATED)
 *
 * @deprecated Use buildFieldDrivenResearchGraph instead.
 * This function is kept for backward compatibility and test migration.
 * The new field-driven graph provides:
 * - Per-field confidence tracking
 * - Adaptive research with budget constraints
 * - Better research prioritization
 *
 * Phase 7 Slice 2 + Slice 4 + Deep Identification + Slice 2 Enhanced ID + Slice 4 Marketplace Schema + Slice 6 Listing Assembly
 *
 * Creates a LangGraph workflow for AI-powered item research.
 * Includes deep product identification with web search (loops until 90% confidence).
 * Includes marketplace category detection and field requirement analysis.
 * Includes full listing assembly with optimized titles and descriptions (Slice 6).
 * Optionally accepts a checkpointer for state persistence.
 *
 * Graph Flow:
 * START -> load_context -> analyze_media -> extract_identifiers -> deep_identify (loops until 90% confidence)
 *       -> update_item -> detect_marketplace_schema -> search_comps -> analyze_comps -> calculate_price
 *       -> assemble_listing -> assess_missing -> [refine_search loop OR persist_results] -> END
 */
export function buildResearchGraph(checkpointer?: PostgresSaver) {
  const graph = new StateGraph(ResearchGraphAnnotation)
    // Phase 1: Load and analyze
    .addNode('load_context', loadContextNode)
    .addNode('analyze_media', analyzeMediaNode)

    // Slice 2: Extract identifiers (OCR + UPC lookup)
    .addNode('extract_identifiers', extractIdentifiersNode)

    // Phase 2: Deep product identification (with web search)
    .addNode('deep_identify', deepIdentifyNode)
    .addNode('update_item', updateItemNode)

    // Slice 4: Marketplace schema awareness
    .addNode('detect_marketplace_schema', detectMarketplaceSchemaNode)

    // Phase 3: Market research
    .addNode('search_comps', searchCompsNode)
    .addNode('analyze_comps', analyzeCompsNode)
    .addNode('calculate_price', calculatePriceNode)

    // Slice 6: Full listing assembly
    .addNode('assemble_listing', assembleListingNode)

    // Phase 4: Assessment and refinement
    .addNode('assess_missing', assessMissingNode)
    .addNode('refine_search', refineSearchNode)
    .addNode('persist_results', persistResultsNode)

    // Define edges - Phase 1
    .addEdge(START, 'load_context')
    .addEdge('load_context', 'analyze_media')
    .addEdge('analyze_media', 'extract_identifiers')
    .addEdge('extract_identifiers', 'deep_identify')

    // Deep identification loop (continues until 90% confidence or max attempts)
    .addConditionalEdges(
      'deep_identify',
      shouldContinueIdentification,
      {
        continue: 'deep_identify', // Loop back to try again
        proceed: 'update_item', // Move to item update
      },
    )

    // After item update, detect marketplace category (Slice 4)
    .addEdge('update_item', 'detect_marketplace_schema')
    .addEdge('detect_marketplace_schema', 'search_comps')

    // Phase 3 edges
    .addEdge('search_comps', 'analyze_comps')
    .addEdge('analyze_comps', 'calculate_price')
    .addEdge('calculate_price', 'assemble_listing')
    .addEdge('assemble_listing', 'assess_missing')

    // Assessment conditional edges
    .addConditionalEdges(
      'assess_missing',
      shouldRefineNode,
      {
        refine: 'refine_search',
        persist: 'persist_results',
      },
    )
    .addEdge('refine_search', 'analyze_comps') // Loop back to analyze new comps
    .addEdge('persist_results', END);

  // Compile with checkpointer if provided
  if (checkpointer) {
    return graph.compile({ checkpointer });
  }

  return graph.compile();
}

/**
 * Build Field-Driven Research Graph
 *
 * World-class research system that combines:
 * 1. Adaptive field-driven research (brand, model, attributes)
 * 2. Core market research operations (ALWAYS run)
 * 3. Graceful failure handling (never crash, always provide results)
 *
 * Graph Flow:
 * START -> load_context -> detect_marketplace_schema -> initialize_field_states
 *       -> extract_from_images -> quick_lookups
 *       -> [ADAPTIVE LOOP: evaluate_fields -> plan_next_research -> execute_research]
 *       -> validate_readiness
 *       -> [CORE OPERATIONS: search_comps -> analyze_comps -> calculate_price -> assemble_listing]
 *       -> persist_results -> END
 */
export function buildFieldDrivenResearchGraph(checkpointer?: PostgresSaver) {
  const graph = new StateGraph(ResearchGraphAnnotation)
    // Phase 0: Setup
    .addNode('load_context', loadContextNode)
    .addNode('detect_marketplace_schema', detectMarketplaceSchemaNode)
    .addNode('initialize_field_states', initializeFieldStatesNode)

    // Phase 1: Fast Extraction
    .addNode('extract_from_images', extractFromImagesNode)
    .addNode('quick_lookups', quickLookupsNode)

    // Phase 2: Adaptive Research Loop
    .addNode('evaluate_fields', evaluateFieldsNode)
    .addNode('plan_next_research', planNextResearchNode)
    .addNode('execute_research', executeResearchNode)

    // Phase 3: Validation
    .addNode('validate_readiness', validateReadinessNode)

    // Phase 4: Core Market Research (ALWAYS runs)
    .addNode('search_comps', searchCompsNode)
    .addNode('analyze_comps', analyzeCompsNode)
    .addNode('calculate_price', calculatePriceNode)
    .addNode('assemble_listing', assembleListingNode)

    // Phase 5: Persistence
    .addNode('persist_results', persistResultsNode)

    // ========================================================================
    // Define Edges
    // ========================================================================

    // Phase 0: Setup
    .addEdge(START, 'load_context')
    .addEdge('load_context', 'detect_marketplace_schema')
    .addEdge('detect_marketplace_schema', 'initialize_field_states')

    // Phase 1: Fast Extraction (parallel in concept, sequential in graph)
    .addEdge('initialize_field_states', 'extract_from_images')
    .addEdge('extract_from_images', 'quick_lookups')

    // Entry to adaptive loop
    .addEdge('quick_lookups', 'evaluate_fields')

    // Phase 2: Adaptive Research Loop
    .addConditionalEdges(
      'evaluate_fields',
      shouldContinueResearch,
      {
        plan_next_research: 'plan_next_research',
        validate_readiness: 'validate_readiness',
      },
    )
    .addConditionalEdges(
      'plan_next_research',
      shouldExecuteTask,
      {
        execute_research: 'execute_research',
        validate_readiness: 'validate_readiness',
      },
    )
    .addEdge('execute_research', 'evaluate_fields') // Loop back

    // Phase 3: Validation (field readiness check)
    .addEdge('validate_readiness', 'search_comps')

    // Phase 4: Core Market Research Operations (ALWAYS run, fail gracefully)
    .addEdge('search_comps', 'analyze_comps')
    .addEdge('analyze_comps', 'calculate_price')
    .addEdge('calculate_price', 'assemble_listing')

    // Phase 5: Persistence
    .addEdge('assemble_listing', 'persist_results')
    .addEdge('persist_results', END);

  // Compile with checkpointer if provided
  if (checkpointer) {
    return graph.compile({ checkpointer });
  }

  return graph.compile();
}

/**
 * Conditional edge function for plan_next_research
 * Returns the next node based on whether a task was planned
 */
function shouldExecuteTask(state: ResearchGraphState): string {
  if (state.currentTask) {
    return 'execute_research';
  }
  return 'validate_readiness';
}

// =============================================================================
// GOAL-DRIVEN RESEARCH GRAPH (Slice 1)
// =============================================================================

/**
 * Build Goal-Driven Research Graph
 *
 * Implements a hybrid approach with:
 * - Phase 1 (Strict): IDENTIFY_PRODUCT must complete before anything else
 * - Phase 2 (Parallel): GATHER_METADATA and RESEARCH_MARKET can run in parallel
 * - Phase 3 (Assembly): ASSEMBLE_LISTING brings everything together
 *
 * Graph Flow:
 * START -> initialize_goals -> load_context -> analyze_media -> extract_identifiers
 *       -> deep_identify (loops until confidence >= 0.85 or max attempts)
 *       -> complete_identification_goal
 *       -> [PARALLEL PHASE]
 *          -> gather_metadata_branch (field evaluation + quick lookups)
 *          -> market_research_branch (search_comps + analyze_comps + validate_comps)
 *       -> [ASSEMBLY PHASE]
 *       -> calculate_price -> assemble_listing -> complete_assembly_goal
 *       -> persist_results -> END
 *
 * Key improvements:
 * 1. Goals track progress and can be resumed
 * 2. Identification must complete before parallel work
 * 3. Validated comps are tracked separately with match types
 * 4. Tiered pricing confidence based on comp quality
 */
export function buildGoalDrivenResearchGraph(checkpointer?: PostgresSaver) {
  const graph = new StateGraph(ResearchGraphAnnotation)
    // ========================================================================
    // Phase 0: Setup, Goal Initialization & Planning (Pre-Act Pattern)
    // ========================================================================
    .addNode('initialize_goals', initializeGoalsNode)
    .addNode('load_context', loadContextNode)
    .addNode('analyze_media', analyzeMediaNode)
    .addNode('plan_research', planResearchNode) // Slice 2: Planning before acting
    .addNode('detect_marketplace_schema', detectMarketplaceSchemaNode)
    .addNode('initialize_field_states', initializeFieldStatesNode)

    // ========================================================================
    // Phase 1: Identification (Strict - must complete before parallel)
    // ========================================================================
    .addNode('extract_identifiers', extractIdentifiersNode)
    .addNode('deep_identify', deepIdentifyNode)
    .addNode('update_item', updateItemNode)
    .addNode('complete_identification_goal', completeIdentificationGoalNode)

    // ========================================================================
    // Phase 2: Parallel Goals
    // ========================================================================
    // Metadata gathering branch
    .addNode('extract_from_images', extractFromImagesNode)
    .addNode('quick_lookups', quickLookupsNode)
    .addNode('evaluate_fields', evaluateFieldsNode)
    .addNode('plan_next_research', planNextResearchNode)
    .addNode('execute_research', executeResearchNode)
    .addNode('complete_metadata_goal', completeMetadataGoalNode)

    // Market research branch
    .addNode('search_comps', searchCompsNode)
    .addNode('analyze_comps', analyzeCompsNode)
    // Slice 6: Validation checkpoint before completing market research
    .addNode('validate_identification', validateIdentificationNode)
    .addNode('complete_market_goal', completeMarketGoalNode)

    // ========================================================================
    // Phase 3: Assembly
    // ========================================================================
    .addNode('calculate_price', calculatePriceNode)
    .addNode('assemble_listing', assembleListingNode)
    .addNode('complete_assembly_goal', completeAssemblyGoalNode)

    // ========================================================================
    // Phase 4: Persistence
    // ========================================================================
    .addNode('persist_results', persistResultsNode)

    // ========================================================================
    // Define Edges
    // ========================================================================

    // Phase 0: Setup & Planning
    .addEdge(START, 'initialize_goals')
    .addEdge('initialize_goals', 'load_context')
    .addEdge('load_context', 'analyze_media')
    .addEdge('analyze_media', 'plan_research') // Slice 2: Plan after media analysis
    .addEdge('plan_research', 'detect_marketplace_schema')
    .addEdge('detect_marketplace_schema', 'initialize_field_states')
    .addEdge('initialize_field_states', 'extract_identifiers')

    // Phase 1: Identification
    .addEdge('extract_identifiers', 'deep_identify')
    .addConditionalEdges(
      'deep_identify',
      identificationPhaseRouter,
      {
        continue_identification: 'deep_identify',
        complete_identification: 'update_item',
      },
    )
    .addEdge('update_item', 'complete_identification_goal')

    // Transition from identification to parallel phase
    // After identification, we fork to both metadata and market research
    .addEdge('complete_identification_goal', 'extract_from_images')

    // Phase 2a: Metadata gathering path
    .addEdge('extract_from_images', 'quick_lookups')
    .addEdge('quick_lookups', 'evaluate_fields')
    .addConditionalEdges(
      'evaluate_fields',
      shouldContinueResearch,
      {
        plan_next_research: 'plan_next_research',
        validate_readiness: 'complete_metadata_goal',
      },
    )
    .addConditionalEdges(
      'plan_next_research',
      shouldExecuteTask,
      {
        execute_research: 'execute_research',
        validate_readiness: 'complete_metadata_goal',
      },
    )
    .addEdge('execute_research', 'evaluate_fields')

    // After metadata, go to market research
    .addEdge('complete_metadata_goal', 'search_comps')

    // Phase 2b: Market research path
    .addEdge('search_comps', 'analyze_comps')
    // Slice 6: Validation checkpoint after analyzing comps
    .addEdge('analyze_comps', 'validate_identification')
    .addConditionalEdges(
      'validate_identification',
      validationCheckpointRouter,
      {
        complete_market_goal: 'complete_market_goal',  // Valid - proceed to pricing
        reidentify: 'deep_identify',                   // Re-identification needed
      },
    )

    // Phase 3: Assembly (after market research completes)
    .addEdge('complete_market_goal', 'calculate_price')
    .addEdge('calculate_price', 'assemble_listing')
    .addEdge('assemble_listing', 'complete_assembly_goal')

    // Phase 4: Persistence
    .addEdge('complete_assembly_goal', 'persist_results')
    .addEdge('persist_results', END);

  // Compile with checkpointer if provided
  if (checkpointer) {
    return graph.compile({ checkpointer });
  }

  return graph.compile();
}
