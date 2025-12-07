import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGraphAnnotation, ChatGraphState } from './chat-graph.state';
import { loadContextNode } from './nodes/load-context.node';
import { generateResponseNode } from './nodes/generate-response.node';
import { routeIntentNode } from './nodes/route-intent.node';
import { handleActionNode } from './nodes/handle-action.node';
import { handleResearchNode } from './nodes/handle-research.node';

/**
 * Build Chat Graph
 * Phase 7 Slice 5 + Slice 6 + Slice 7
 *
 * Creates a lightweight LangGraph workflow for chat Q&A with action and research support.
 * No checkpointing - optimized for fast responses (<2s latency target).
 */
export function buildChatGraph() {
  // Conditional routing function
  const routeAfterIntent = (state: ChatGraphState): string => {
    if (state.intent === 'action') {
      return 'handle_action';
    }
    if (state.intent === 'research') {
      return 'handle_research';
    }
    return 'generate_response';
  };

  const graph = new StateGraph(ChatGraphAnnotation)
    .addNode('load_context', loadContextNode)
    .addNode('route_intent', routeIntentNode)
    .addNode('handle_action', handleActionNode)
    .addNode('handle_research', handleResearchNode)
    .addNode('generate_response', generateResponseNode)

    // Define edges - routing flow
    .addEdge(START, 'load_context')
    .addEdge('load_context', 'route_intent')
    .addConditionalEdges('route_intent', routeAfterIntent, {
      handle_action: 'handle_action',
      handle_research: 'handle_research',
      generate_response: 'generate_response',
    })
    .addEdge('handle_action', 'generate_response') // handle_action always goes to generate_response to format the response
    .addEdge('handle_research', 'generate_response') // handle_research always goes to generate_response to format the response
    .addEdge('generate_response', END);

  // Compile without checkpointer (fast, stateless)
  return graph.compile();
}
