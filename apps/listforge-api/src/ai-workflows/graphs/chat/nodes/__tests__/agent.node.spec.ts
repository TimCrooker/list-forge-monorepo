import { agentNode, shouldContinue, AgentNodeTools } from '../agent.node';
import { ChatGraphState } from '../../chat-graph.state';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StructuredTool } from '@langchain/core/tools';
import { RunnableConfig } from '@langchain/core/runnables';
import { FLOW_CONTROL } from '../../../../config/research.constants';

/**
 * Agent Node Tests
 *
 * Critical safety feature - this is the circuit breaker that prevents infinite loops
 * in the agent → tools cycle. Tests cover:
 *
 * 1. shouldContinue router logic (iteration limit, tool_calls detection)
 * 2. Agent node validation (tools, llm, buildSystemPrompt required)
 * 3. System prompt injection (only on first iteration)
 */

describe('shouldContinue', () => {
  describe('tool_calls detection', () => {
    it('should return "continue" when last message has tool_calls', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new AIMessage({
            content: 'Let me search for that information.',
            tool_calls: [
              {
                id: 'call_1',
                name: 'search_tool',
                args: { query: 'test' },
              },
            ],
          }),
        ],
        iterationCount: 1,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('continue');
    });

    it('should return "end" when last message has no tool_calls', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new AIMessage({
            content: 'Here is your answer.',
          }),
        ],
        iterationCount: 1,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });

    it('should return "end" when last message has empty tool_calls array', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new AIMessage({
            content: 'Here is your answer.',
            tool_calls: [],
          }),
        ],
        iterationCount: 1,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });
  });

  describe('max iterations safety', () => {
    it('should return "end" when iterationCount >= MAX_CHAT_ITERATIONS', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new AIMessage({
            content: 'Still working...',
          }),
        ],
        iterationCount: FLOW_CONTROL.MAX_CHAT_ITERATIONS,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });

    it('should return "end" when max iterations even if tool_calls pending', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new AIMessage({
            content: 'Let me continue searching.',
            tool_calls: [
              {
                id: 'call_1',
                name: 'search_tool',
                args: { query: 'test' },
              },
            ],
          }),
        ],
        iterationCount: FLOW_CONTROL.MAX_CHAT_ITERATIONS,
        response: '', // No response yet
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });

    it('should continue when iterationCount is below MAX_CHAT_ITERATIONS', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new AIMessage({
            content: 'Let me search.',
            tool_calls: [
              {
                id: 'call_1',
                name: 'search_tool',
                args: { query: 'test' },
              },
            ],
          }),
        ],
        iterationCount: FLOW_CONTROL.MAX_CHAT_ITERATIONS - 1,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('continue');
    });

    it('should continue when iterationCount is 0', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new AIMessage({
            content: 'Let me search.',
            tool_calls: [
              {
                id: 'call_1',
                name: 'search_tool',
                args: { query: 'test' },
              },
            ],
          }),
        ],
        iterationCount: 0,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('continue');
    });
  });

  describe('edge cases', () => {
    it('should handle empty messages array gracefully', () => {
      const state: Partial<ChatGraphState> = {
        messages: [],
        iterationCount: 1,
      };

      // This will throw because we're accessing messages[messages.length - 1] on empty array
      expect(() => shouldContinue(state as ChatGraphState)).toThrow();
    });

    it('should return "end" when last message is HumanMessage (non-AI)', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('What is the weather?'),
        ],
        iterationCount: 1,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });

    it('should return "end" when last message is SystemMessage', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new SystemMessage('You are a helpful assistant.'),
        ],
        iterationCount: 1,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });

    it('should return "end" when last message is ToolMessage', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new ToolMessage({
            content: 'Search results...',
            tool_call_id: 'call_1',
          }),
        ],
        iterationCount: 1,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });

    it('should handle multiple messages and check only the last one', () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
          new AIMessage({
            content: 'Let me search.',
            tool_calls: [
              {
                id: 'call_1',
                name: 'search_tool',
                args: { query: 'test' },
              },
            ],
          }),
          new ToolMessage({
            content: 'Results found.',
            tool_call_id: 'call_1',
          }),
          new AIMessage({
            content: 'Here are the results.',
          }),
        ],
        iterationCount: 2,
      };

      const result = shouldContinue(state as ChatGraphState);

      expect(result).toBe('end');
    });
  });
});

describe('agentNode', () => {
  // Mock LLM that returns a simple response
  class MockLLM extends BaseChatModel {
    _llmType(): string {
      return 'mock';
    }

    async _generate(): Promise<any> {
      return {
        generations: [
          {
            text: 'Mock response',
            message: new AIMessage('Mock response'),
          },
        ],
      };
    }

    bindTools(tools: StructuredTool[]): BaseChatModel {
      // Return self for chaining
      return this;
    }

    async invoke(): Promise<AIMessage> {
      return new AIMessage({
        content: 'Mock response without tool calls',
      });
    }

    async *stream() {
      yield new AIMessage({ content: 'Mock ' });
      yield new AIMessage({ content: 'response' });
    }
  }

  // Mock tool
  class MockTool extends StructuredTool {
    name = 'mock_tool';
    description = 'A mock tool';
    schema = {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const },
      },
      required: ['query'],
    };

    async _call(): Promise<string> {
      return 'Mock tool result';
    }
  }

  const mockLLM = new MockLLM({});
  const mockTools = [new MockTool()];
  const mockBuildSystemPrompt = jest.fn((state: ChatGraphState, toolNames?: string[]) => {
    return `You are a helpful assistant. Available tools: ${toolNames?.join(', ')}`;
  });

  const createMockConfig = (tools?: Partial<AgentNodeTools>): RunnableConfig & { configurable?: { tools?: AgentNodeTools } } => ({
    configurable: {
      tools: {
        llm: mockLLM,
        tools: mockTools,
        buildSystemPrompt: mockBuildSystemPrompt,
        ...tools,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validation', () => {
    it('should throw error if tools not provided in config', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [],
        iterationCount: 0,
      };

      await expect(
        agentNode(state as ChatGraphState, {}),
      ).rejects.toThrow('Required tools not provided in config.configurable.tools');
    });

    it('should throw error if llm not provided', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [],
        iterationCount: 0,
      };

      const config = createMockConfig({ llm: undefined as any });

      await expect(
        agentNode(state as ChatGraphState, config),
      ).rejects.toThrow('Required tools not provided in config.configurable.tools');
    });

    it('should throw error if tools array not provided', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [],
        iterationCount: 0,
      };

      const config = createMockConfig({ tools: undefined as any });

      await expect(
        agentNode(state as ChatGraphState, config),
      ).rejects.toThrow('Required tools not provided in config.configurable.tools');
    });

    it('should throw error if buildSystemPrompt not provided', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [],
        iterationCount: 0,
      };

      const config = createMockConfig({ buildSystemPrompt: undefined as any });

      await expect(
        agentNode(state as ChatGraphState, config),
      ).rejects.toThrow('Required tools not provided in config.configurable.tools');
    });
  });

  describe('system prompt injection', () => {
    it('should inject system prompt on first iteration (no existing system message)', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig();

      await agentNode(state as ChatGraphState, config);

      expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
        state,
        ['mock_tool'],
      );
    });

    it('should NOT inject system prompt if already present', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new SystemMessage('Existing system prompt'),
          new HumanMessage('Hello'),
        ],
        iterationCount: 1,
        response: '',
      };

      const config = createMockConfig();

      await agentNode(state as ChatGraphState, config);

      expect(mockBuildSystemPrompt).not.toHaveBeenCalled();
    });

    it('should include tool names in system prompt build', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig();

      await agentNode(state as ChatGraphState, config);

      expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
        expect.anything(),
        ['mock_tool'],
      );
    });

    it('should pass multiple tool names when multiple tools available', async () => {
      class AnotherMockTool extends StructuredTool {
        name = 'another_tool';
        description = 'Another mock tool';
        schema = {
          type: 'object' as const,
          properties: {},
          required: [],
        };

        async _call(): Promise<string> {
          return 'Another result';
        }
      }

      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig({
        tools: [new MockTool(), new AnotherMockTool()],
      });

      await agentNode(state as ChatGraphState, config);

      expect(mockBuildSystemPrompt).toHaveBeenCalledWith(
        expect.anything(),
        ['mock_tool', 'another_tool'],
      );
    });
  });

  describe('response handling', () => {
    it('should return AIMessage in messages array', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig();

      const result = await agentNode(state as ChatGraphState, config);

      expect(result.messages).toBeDefined();
      expect(result.messages).toHaveLength(1);
      expect(result.messages![0]).toBeInstanceOf(AIMessage);
    });

    it('should increment iterationCount by 1', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig();

      const result = await agentNode(state as ChatGraphState, config);

      expect(result.iterationCount).toBe(1);
    });

    it('should not update response field when tool_calls present', async () => {
      class MockLLMWithToolCalls extends MockLLM {
        async invoke(): Promise<AIMessage> {
          return new AIMessage({
            content: 'Let me search for that.',
            tool_calls: [
              {
                id: 'call_1',
                name: 'mock_tool',
                args: { query: 'test' },
              },
            ],
          });
        }
      }

      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: 'existing response',
      };

      const config = createMockConfig({
        llm: new MockLLMWithToolCalls({}),
      });

      const result = await agentNode(state as ChatGraphState, config);

      // When tool_calls present, response should remain as state.response
      expect(result.response).toBe('existing response');
    });

    it('should update response field when no tool_calls', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig();

      const result = await agentNode(state as ChatGraphState, config);

      expect(result.response).toBe('Mock response without tool calls');
    });
  });

  describe('streaming behavior', () => {
    it('should stream when onToken callback provided', async () => {
      const tokens: string[] = [];
      const onToken = jest.fn((token: string) => {
        tokens.push(token);
      });

      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig({ onToken });

      await agentNode(state as ChatGraphState, config);

      expect(onToken).toHaveBeenCalled();
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should not stream when no onToken callback', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig();

      const result = await agentNode(state as ChatGraphState, config);

      // Should use invoke instead of stream
      expect(result.messages).toBeDefined();
    });

    it('should collect tool_calls from stream chunks', async () => {
      class MockLLMWithStreamingToolCalls extends MockLLM {
        async *stream() {
          yield new AIMessage({ content: 'Let me ' });
          yield new AIMessage({
            content: 'search',
            tool_calls: [
              {
                id: 'call_1',
                name: 'mock_tool',
                args: { query: 'test' },
              },
            ],
          });
        }
      }

      const onToken = jest.fn();

      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('Hello'),
        ],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig({
        llm: new MockLLMWithStreamingToolCalls({}),
        onToken,
      });

      const result = await agentNode(state as ChatGraphState, config);

      const aiMessage = result.messages![0] as AIMessage;
      expect(aiMessage.tool_calls).toBeDefined();
      expect(aiMessage.tool_calls).toHaveLength(1);
      expect(aiMessage.tool_calls![0].name).toBe('mock_tool');
    });
  });

  describe('message array handling', () => {
    it('should preserve existing messages from state', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [
          new HumanMessage('First message'),
          new AIMessage('First response'),
          new HumanMessage('Second message'),
        ],
        iterationCount: 1,
        response: '',
      };

      const config = createMockConfig();

      const result = await agentNode(state as ChatGraphState, config);

      // Result should only contain the new AI message
      expect(result.messages).toHaveLength(1);
      expect(result.messages![0]).toBeInstanceOf(AIMessage);
    });

    it('should work with empty messages array on first iteration', async () => {
      const state: Partial<ChatGraphState> = {
        messages: [],
        iterationCount: 0,
        response: '',
      };

      const config = createMockConfig();

      const result = await agentNode(state as ChatGraphState, config);

      expect(result.messages).toBeDefined();
      expect(result.messages).toHaveLength(1);
    });
  });
});
