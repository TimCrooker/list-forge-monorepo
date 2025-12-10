import { ChatGraphState } from '../chat-graph.state';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { StructuredTool } from '@langchain/core/tools';
import { RunnableConfig } from '@langchain/core/runnables';
import { logNodeDebug, logNodeError } from '../../../utils/node-logger';
import { executeToolWithTimeout } from '../../../utils/timeout';

/**
 * Tools interface for the tools node
 */
export interface ToolsNodeTools {
  tools: StructuredTool[];
  onToolStart?: (toolName: string, args: Record<string, unknown>) => void;
  onToolEnd?: (toolName: string, result: unknown) => void;
  onToolError?: (toolName: string, error: Error) => void;
}

/**
 * Tools Node - MAX Pattern Implementation
 *
 * This node executes tool calls from the agent's response:
 * 1. Extracts tool calls from the last AI message
 * 2. Executes each tool with its arguments
 * 3. Returns ToolMessages with results
 *
 * After execution, the graph routes back to the agent node
 * so it can process the tool results and decide next steps.
 */
export async function toolsNode(
  state: ChatGraphState,
  config?: RunnableConfig & { configurable?: { tools?: { tools: StructuredTool[] }; toolsNode?: ToolsNodeTools } },
): Promise<Partial<ChatGraphState>> {
  logNodeDebug('tools', 'Tools node invoked');

  // Get tools from agent config and callbacks from tools node config
  const agentConfig = config?.configurable?.tools;
  const nodeConfig = config?.configurable?.toolsNode;

  if (!agentConfig || !agentConfig.tools) {
    throw new Error('Tools not provided in config.configurable.tools');
  }

  const tools = agentConfig.tools;
  const { onToolStart, onToolEnd, onToolError } = nodeConfig || {};

  // Get the last message (should be an AI message with tool calls)
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage._getType() !== 'ai') {
    logNodeDebug('tools', 'Last message is not an AI message, returning empty');
    return { messages: [] };
  }

  const aiMessage = lastMessage as AIMessage;
  const toolCalls = aiMessage.tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    logNodeDebug('tools', 'No tool calls to execute');
    return { messages: [] };
  }

  logNodeDebug('tools', 'Executing tool calls', { toolCallCount: toolCalls.length });

  // Build a map of tools by name for quick lookup
  const toolMap = new Map<string, StructuredTool>();
  for (const tool of tools) {
    toolMap.set(tool.name, tool);
  }

  // Execute tool calls in parallel for better performance
  const toolResults: ToolMessage[] = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const tool = toolMap.get(toolCall.name);

      if (!tool) {
        logNodeError('tools', 'Tool not found', toolCall.name, { toolName: toolCall.name });
        return new ToolMessage({
          tool_call_id: toolCall.id || `${toolCall.name}-${Date.now()}`,
          content: `Error: Tool "${toolCall.name}" not found`,
          name: toolCall.name,
        });
      }

      logNodeDebug('tools', 'Executing tool', { toolName: toolCall.name, args: toolCall.args });
      onToolStart?.(toolCall.name, toolCall.args as Record<string, unknown>);

      try {
        // Execute tool with timeout protection (30s default)
        const result = await executeToolWithTimeout(
          toolCall.name,
          () => tool.invoke(toolCall.args),
        );

        // Convert result to string if needed
        const resultString = typeof result === 'string'
          ? result
          : JSON.stringify(result, null, 2);

        logNodeDebug('tools', 'Tool result', {
          toolName: toolCall.name,
          resultPreview: resultString.substring(0, 200),
        });
        onToolEnd?.(toolCall.name, result);

        return new ToolMessage({
          tool_call_id: toolCall.id || `${toolCall.name}-${Date.now()}`,
          content: resultString,
          name: toolCall.name,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logNodeError('tools', 'Tool error', error, { toolName: toolCall.name });
        onToolError?.(toolCall.name, error instanceof Error ? error : new Error(errorMessage));

        return new ToolMessage({
          tool_call_id: toolCall.id || `${toolCall.name}-${Date.now()}`,
          content: `Error executing ${toolCall.name}: ${errorMessage}`,
          name: toolCall.name,
        });
      }
    }),
  );

  logNodeDebug('tools', 'Executed tools, returning results', { toolResultCount: toolResults.length });

  return {
    messages: toolResults,
  };
}
