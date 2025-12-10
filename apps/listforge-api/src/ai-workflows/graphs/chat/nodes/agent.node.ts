import { ChatGraphState } from '../chat-graph.state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredTool } from '@langchain/core/tools';
import { RunnableConfig } from '@langchain/core/runnables';
import { FLOW_CONTROL } from '../../../config/research.constants';
import { logNodeDebug } from '../../../utils/node-logger';

/**
 * Tools interface for the agent node
 */
export interface AgentNodeTools {
  llm: BaseChatModel;
  tools: StructuredTool[];
  buildSystemPrompt: (state: ChatGraphState, availableToolNames?: string[]) => string;
  onToken?: (token: string) => void;
}

/**
 * Agent Node - MAX Pattern Implementation
 *
 * This node is the core of the agent loop. It:
 * 1. Builds the system prompt with context injection
 * 2. Binds tools to the LLM
 * 3. Invokes the model with the full message history
 * 4. Returns the response (which may include tool calls)
 *
 * The graph conditionally routes to either:
 * - tools node (if there are tool calls)
 * - END (if no tool calls - final response)
 */
export async function agentNode(
  state: ChatGraphState,
  config?: RunnableConfig & { configurable?: { tools?: AgentNodeTools } },
): Promise<Partial<ChatGraphState>> {
  logNodeDebug('agent', 'Agent node invoked', {
    messageCount: state.messages.length,
    iteration: state.iterationCount,
  });

  const nodeTools = config?.configurable?.tools;
  if (!nodeTools || !nodeTools.llm || !nodeTools.tools || !nodeTools.buildSystemPrompt) {
    throw new Error('Required tools not provided in config.configurable.tools');
  }

  const { llm, tools, buildSystemPrompt, onToken } = nodeTools;

  // Build messages array
  const messages: BaseMessage[] = [];

  // Inject system prompt if this is the first iteration (no system message yet)
  const hasSystemMessage = state.messages.length > 0 && state.messages[0]._getType() === 'system';
  if (!hasSystemMessage) {
    // Pass tool names for context-aware prompting
    const toolNames = tools.map(t => t.name);
    const systemPrompt = buildSystemPrompt(state, toolNames);
    messages.push(new SystemMessage(systemPrompt));
    logNodeDebug('agent', 'Injected system prompt', { length: systemPrompt.length, toolCount: toolNames.length });
  }

  // Add all existing messages
  messages.push(...state.messages);

  // Bind tools to the model
  const modelWithTools = llm.bindTools(tools);

  logNodeDebug('agent', 'Invoking LLM with tools bound', { toolCount: tools.length });

  let response: AIMessage;

  // Always use streaming when onToken callback is provided
  // This ensures responses stream to the UI even on first iteration (simple questions)
  if (onToken) {
    let fullContent = '';
    const stream = await modelWithTools.stream(messages);

    let toolCalls: AIMessage['tool_calls'] = [];

    for await (const chunk of stream) {
      if (typeof chunk.content === 'string' && chunk.content) {
        fullContent += chunk.content;
        onToken(chunk.content);
      }
      // Collect tool calls if any
      if (chunk.tool_calls && chunk.tool_calls.length > 0) {
        toolCalls = [...toolCalls, ...chunk.tool_calls];
      }
    }

    response = new AIMessage({
      content: fullContent,
      tool_calls: toolCalls,
    });
  } else {
    // No streaming callback - use invoke
    response = await modelWithTools.invoke(messages) as AIMessage;
  }

  const hasToolCalls = response.tool_calls && response.tool_calls.length > 0;
  logNodeDebug('agent', 'Response received', {
    contentLength: typeof response.content === 'string' ? response.content.length : 0,
    hasToolCalls,
    toolCallCount: response.tool_calls?.length || 0,
  });

  // Extract final response content for the response field
  const responseContent = typeof response.content === 'string' ? response.content : '';

  return {
    messages: [response],
    response: hasToolCalls ? state.response : responseContent,
    iterationCount: 1, // Will be accumulated by reducer
  };
}

/**
 * Determine if the agent should continue to tools or end
 */
export function shouldContinue(state: ChatGraphState): 'continue' | 'end' {
  const lastMessage = state.messages[state.messages.length - 1];

  // Check for max iterations to prevent infinite loops
  if (state.iterationCount >= FLOW_CONTROL.MAX_CHAT_ITERATIONS) {
    logNodeDebug('agent', 'Max iterations reached, ending', { maxIterations: FLOW_CONTROL.MAX_CHAT_ITERATIONS });

    // If we have pending tool calls when hitting max iterations, we need to provide
    // a fallback response so the user doesn't get silence
    if (lastMessage._getType() === 'ai') {
      const aiMessage = lastMessage as AIMessage;
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0 && !state.response) {
        // Generate a fallback response indicating the issue
        const fallbackMessage = new AIMessage({
          content: "I apologize, but I'm having trouble completing this request. The system reached its iteration limit while trying to process your request. Please try rephrasing your question or breaking it into smaller parts.",
        });
        // Update state with fallback (this won't work here, need to handle in graph)
        logNodeDebug('agent', 'Max iterations with pending tool calls - fallback needed', {});
      }
    }

    return 'end';
  }

  // If the last message has tool calls, continue to execute them
  if (lastMessage._getType() === 'ai') {
    const aiMessage = lastMessage as AIMessage;
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      logNodeDebug('agent', 'Tool calls detected, continuing to tools node', { toolCallCount: aiMessage.tool_calls.length });
      return 'continue';
    }
  }

  logNodeDebug('agent', 'No tool calls, ending');
  return 'end';
}
