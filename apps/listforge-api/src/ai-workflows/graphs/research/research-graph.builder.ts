import { StateGraph, START, END } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ResearchGraphAnnotation } from './research-graph.state';
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

/**
 * Build Research Graph
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
