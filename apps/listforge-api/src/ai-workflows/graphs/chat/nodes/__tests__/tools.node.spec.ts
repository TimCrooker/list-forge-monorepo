import { toolsNode, ToolsNodeTools } from '../tools.node';
import { ChatGraphState } from '../../chat-graph.state';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import * as timeoutModule from '../../../../utils/timeout';

// Mock the timeout module
jest.mock('../../../../utils/timeout', () => ({
  executeToolWithTimeout: jest.fn(),
}));

// Mock the node logger
jest.mock('../../../../utils/node-logger', () => ({
  logNodeDebug: jest.fn(),
  logNodeError: jest.fn(),
}));

// Helper to create a mock StructuredTool
class MockTool extends StructuredTool {
  name: string;
  description: string;
  schema = z.object({ input: z.string() });
  private implementation: (args: { input: string }) => Promise<string>;

  constructor(name: string, implementation: (args: { input: string }) => Promise<string>) {
    super();
    this.name = name;
    this.description = `Mock tool: ${name}`;
    this.implementation = implementation;
  }

  async _call(args: { input: string }): Promise<string> {
    return this.implementation(args);
  }
}

describe('toolsNode', () => {
  let mockExecuteToolWithTimeout: jest.MockedFunction<typeof timeoutModule.executeToolWithTimeout>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteToolWithTimeout = timeoutModule.executeToolWithTimeout as jest.MockedFunction<
      typeof timeoutModule.executeToolWithTimeout
    >;
    // Default: pass through to actual tool execution
    mockExecuteToolWithTimeout.mockImplementation(async (_, fn) => fn());
  });

  // ============================================================================
  // Test Cases: Tool Execution
  // ============================================================================

  describe('Tool Execution', () => {
    it('should execute single tool call successfully', async () => {
      const mockTool = new MockTool('test_tool', async ({ input }) => `Result: ${input}`);
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'test_tool',
            args: { input: 'test input' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toHaveLength(1);
      expect(result.messages![0]).toBeInstanceOf(ToolMessage);
      const toolMessage = result.messages![0] as ToolMessage;
      expect(toolMessage.content).toBe('Result: test input');
      expect(toolMessage.tool_call_id).toBe('call_123');
      expect(toolMessage.name).toBe('test_tool');
    });

    it('should execute multiple tool calls in parallel', async () => {
      const tool1 = new MockTool('tool_1', async ({ input }) => `Result 1: ${input}`);
      const tool2 = new MockTool('tool_2', async ({ input }) => `Result 2: ${input}`);
      const tools = [tool1, tool2];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'tool_1',
            args: { input: 'input 1' },
            id: 'call_1',
          },
          {
            name: 'tool_2',
            args: { input: 'input 2' },
            id: 'call_2',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toHaveLength(2);
      const toolMessage1 = result.messages![0] as ToolMessage;
      const toolMessage2 = result.messages![1] as ToolMessage;

      expect(toolMessage1.content).toBe('Result 1: input 1');
      expect(toolMessage1.tool_call_id).toBe('call_1');
      expect(toolMessage2.content).toBe('Result 2: input 2');
      expect(toolMessage2.tool_call_id).toBe('call_2');
    });

    it('should return ToolMessage with correct tool_call_id', async () => {
      const mockTool = new MockTool('test_tool', async () => 'success');
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'test_tool',
            args: { input: 'test' },
            id: 'custom_call_id_456',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      const toolMessage = result.messages![0] as ToolMessage;
      expect(toolMessage.tool_call_id).toBe('custom_call_id_456');
    });

    it('should return ToolMessage with stringified result for non-string values', async () => {
      const mockTool = new MockTool('test_tool', async () => {
        return JSON.stringify({ data: 'value', count: 42, nested: { key: 'value' } });
      });
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'test_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      const toolMessage = result.messages![0] as ToolMessage;
      const parsedContent = JSON.parse(toolMessage.content as string);
      expect(parsedContent).toEqual({ data: 'value', count: 42, nested: { key: 'value' } });
    });
  });

  // ============================================================================
  // Test Cases: Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('should return error ToolMessage when tool not found', async () => {
      const mockTool = new MockTool('existing_tool', async () => 'success');
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'nonexistent_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toHaveLength(1);
      const toolMessage = result.messages![0] as ToolMessage;
      expect(toolMessage.content).toBe('Error: Tool "nonexistent_tool" not found');
      expect(toolMessage.tool_call_id).toBe('call_123');
      expect(toolMessage.name).toBe('nonexistent_tool');
    });

    it('should return error ToolMessage when tool throws', async () => {
      const mockTool = new MockTool('error_tool', async () => {
        throw new Error('Tool execution failed');
      });
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'error_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toHaveLength(1);
      const toolMessage = result.messages![0] as ToolMessage;
      expect(toolMessage.content).toBe('Error executing error_tool: Tool execution failed');
      expect(toolMessage.tool_call_id).toBe('call_123');
    });

    it('should continue executing other tools when one fails', async () => {
      const successTool = new MockTool('success_tool', async ({ input }) => `Success: ${input}`);
      const errorTool = new MockTool('error_tool', async () => {
        throw new Error('This tool failed');
      });
      const tools = [successTool, errorTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'error_tool',
            args: { input: 'test' },
            id: 'call_1',
          },
          {
            name: 'success_tool',
            args: { input: 'test' },
            id: 'call_2',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toHaveLength(2);
      const errorMessage = result.messages![0] as ToolMessage;
      const successMessage = result.messages![1] as ToolMessage;

      expect(errorMessage.content).toContain('Error executing error_tool');
      expect(successMessage.content).toBe('Success: test');
    });

    it('should handle timeout errors gracefully', async () => {
      const mockTool = new MockTool('slow_tool', async () => 'never called');
      const tools = [mockTool];

      // Mock timeout behavior
      mockExecuteToolWithTimeout.mockRejectedValueOnce(
        new Error('Tool "slow_tool" timed out after 30000ms'),
      );

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'slow_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toHaveLength(1);
      const toolMessage = result.messages![0] as ToolMessage;
      expect(toolMessage.content).toContain('timed out after 30000ms');
    });

    it('should call onToolError callback on failure', async () => {
      const onToolError = jest.fn();
      const mockTool = new MockTool('error_tool', async () => {
        throw new Error('Tool failed');
      });
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'error_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
          toolsNode: { onToolError } as ToolsNodeTools,
        },
      };

      await toolsNode(state as ChatGraphState, config);

      expect(onToolError).toHaveBeenCalledWith('error_tool', expect.any(Error));
      expect(onToolError).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Test Cases: Callbacks
  // ============================================================================

  describe('Callbacks', () => {
    it('should call onToolStart before execution', async () => {
      const onToolStart = jest.fn();
      const mockTool = new MockTool('test_tool', async ({ input }) => `Result: ${input}`);
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'test_tool',
            args: { input: 'test input' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
          toolsNode: { onToolStart } as ToolsNodeTools,
        },
      };

      await toolsNode(state as ChatGraphState, config);

      expect(onToolStart).toHaveBeenCalledWith('test_tool', { input: 'test input' });
      expect(onToolStart).toHaveBeenCalledTimes(1);
    });

    it('should call onToolEnd after successful execution', async () => {
      const onToolEnd = jest.fn();
      const mockTool = new MockTool('test_tool', async ({ input }) => `Result: ${input}`);
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'test_tool',
            args: { input: 'test input' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
          toolsNode: { onToolEnd } as ToolsNodeTools,
        },
      };

      await toolsNode(state as ChatGraphState, config);

      expect(onToolEnd).toHaveBeenCalledWith('test_tool', 'Result: test input');
      expect(onToolEnd).toHaveBeenCalledTimes(1);
    });

    it('should not call onToolEnd when tool fails', async () => {
      const onToolEnd = jest.fn();
      const onToolError = jest.fn();
      const mockTool = new MockTool('error_tool', async () => {
        throw new Error('Tool failed');
      });
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'error_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
          toolsNode: { onToolEnd, onToolError } as ToolsNodeTools,
        },
      };

      await toolsNode(state as ChatGraphState, config);

      expect(onToolEnd).not.toHaveBeenCalled();
      expect(onToolError).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Test Cases: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should return empty messages when no tool_calls', async () => {
      const mockTool = new MockTool('test_tool', async () => 'success');
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: 'I will not use any tools',
        tool_calls: [],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toEqual([]);
    });

    it('should return empty messages when last message is not AI', async () => {
      const mockTool = new MockTool('test_tool', async () => 'success');
      const tools = [mockTool];

      const humanMessage = new HumanMessage('Hello');

      const state: Partial<ChatGraphState> = {
        messages: [humanMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toEqual([]);
    });

    it('should handle null/undefined tool_calls array', async () => {
      const mockTool = new MockTool('test_tool', async () => 'success');
      const tools = [mockTool];

      // Create AIMessage without tool_calls
      const aiMessage = new AIMessage({
        content: 'No tools',
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      expect(result.messages).toEqual([]);
    });

    it('should handle tool returning non-string result (JSON stringify)', async () => {
      const mockTool = new MockTool('json_tool', async () => {
        // Return a complex object that will be stringified
        return JSON.stringify({
          status: 'success',
          data: {
            items: [1, 2, 3],
            metadata: { count: 3, total: 100 },
          },
        });
      });
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'json_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      const toolMessage = result.messages![0] as ToolMessage;
      const parsedContent = JSON.parse(toolMessage.content as string);
      expect(parsedContent).toEqual({
        status: 'success',
        data: {
          items: [1, 2, 3],
          metadata: { count: 3, total: 100 },
        },
      });
    });

    it('should generate fallback tool_call_id when id is missing', async () => {
      const mockTool = new MockTool('test_tool', async () => 'success');
      const tools = [mockTool];

      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'test_tool',
            args: { input: 'test' },
            // id is missing/undefined
          } as any,
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {
          tools: { tools },
        },
      };

      const result = await toolsNode(state as ChatGraphState, config);

      const toolMessage = result.messages![0] as ToolMessage;
      expect(toolMessage.tool_call_id).toMatch(/^test_tool-\d+$/);
    });

    it('should throw error when tools not provided in config', async () => {
      const aiMessage = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'test_tool',
            args: { input: 'test' },
            id: 'call_123',
          },
        ],
      });

      const state: Partial<ChatGraphState> = {
        messages: [aiMessage],
      };

      const config = {
        configurable: {},
      };

      await expect(toolsNode(state as ChatGraphState, config)).rejects.toThrow(
        'Tools not provided in config.configurable.tools',
      );
    });
  });
});
