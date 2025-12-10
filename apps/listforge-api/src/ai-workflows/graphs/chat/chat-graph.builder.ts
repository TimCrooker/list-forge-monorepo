import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatGraphAnnotation, ChatGraphState } from './chat-graph.state';
import { agentNode, shouldContinue } from './nodes/agent.node';
import { toolsNode } from './nodes/tools.node';

/**
 * Build Chat Graph - MAX Pattern Implementation
 *
 * Creates an agentic chat workflow following Anthropic's best practices:
 * 1. Single Agent with Tools - No complex multi-agent orchestration
 * 2. Flat Message History - Simple conversation threading
 * 3. Tool Loop Until Done - Agent → Tools → Agent → ... → END
 * 4. NO Extra LLM Calls in Tools - Tools return data, agent reasons
 * 5. Rich Context Injection - Automatically provide everything the agent needs
 *
 * Graph Structure:
 * ```
 * START → agent → [tools → agent]* → END
 * ```
 *
 * The agent node:
 * - Builds system prompt with context injection
 * - Invokes LLM with tools bound
 * - Returns response (may include tool calls)
 *
 * Conditional routing:
 * - If tool calls present → tools node → back to agent
 * - If no tool calls → END (final response)
 */
export function buildChatGraph() {
  const graph = new StateGraph(ChatGraphAnnotation)
    // Agent node - calls LLM with tools bound
    .addNode('agent', agentNode)
    // Tools node - executes tool calls
    .addNode('tools', toolsNode)

    // Start with agent
    .addEdge(START, 'agent')

    // Conditional edges from agent
    .addConditionalEdges('agent', shouldContinue, {
      continue: 'tools',
      end: END,
    })

    // Tools always return to agent
    .addEdge('tools', 'agent');

  // Compile without checkpointer (fast, stateless per request)
  // Conversation history is managed externally in ChatSession
  return graph.compile();
}

/**
 * Legacy graph builder for backward compatibility during migration
 * @deprecated Use buildChatGraph() instead
 */
export { buildChatGraph as buildAgentChatGraph };
