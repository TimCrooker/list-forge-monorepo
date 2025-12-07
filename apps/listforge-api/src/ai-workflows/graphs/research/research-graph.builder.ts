import { StateGraph, START, END } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ResearchGraphAnnotation } from './research-graph.state';
import { loadContextNode } from './nodes/load-context.node';
import { analyzeMediaNode } from './nodes/analyze-media.node';
import { identifyProductNode } from './nodes/identify-product.node';
import { searchCompsNode } from './nodes/search-comps.node';
import { analyzeCompsNode } from './nodes/analyze-comps.node';
import { calculatePriceNode } from './nodes/calculate-price.node';
import { assessMissingNode } from './nodes/assess-missing.node';
import { shouldRefineNode } from './nodes/should-refine.node';
import { refineSearchNode } from './nodes/refine-search.node';
import { persistResultsNode } from './nodes/persist-results.node';

/**
 * Build Research Graph
 * Phase 7 Slice 2 + Slice 4
 *
 * Creates a LangGraph workflow for AI-powered item research.
 * Optionally accepts a checkpointer for state persistence.
 */
export function buildResearchGraph(checkpointer?: PostgresSaver) {
  const graph = new StateGraph(ResearchGraphAnnotation)
    .addNode('load_context', loadContextNode)
    .addNode('analyze_media', analyzeMediaNode)
    .addNode('identify_product', identifyProductNode)
    .addNode('search_comps', searchCompsNode)
    .addNode('analyze_comps', analyzeCompsNode)
    .addNode('calculate_price', calculatePriceNode)
    .addNode('assess_missing', assessMissingNode)
    .addNode('refine_search', refineSearchNode)
    .addNode('persist_results', persistResultsNode)

    // Define edges
    .addEdge(START, 'load_context')
    .addEdge('load_context', 'analyze_media')
    .addEdge('analyze_media', 'identify_product')
    .addEdge('identify_product', 'search_comps')
    .addEdge('search_comps', 'analyze_comps')
    .addEdge('analyze_comps', 'calculate_price')
    .addEdge('calculate_price', 'assess_missing')
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
