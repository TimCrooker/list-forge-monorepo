import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import {
  ChatGraphAnnotation,
  createInitialChatState,
  addUserMessage,
  UserContext,
  ChatContext,
  TokenUsage,
  boundedMessagesReducer,
  MAX_MESSAGES,
} from '../chat-graph.state';
import { PAGE_TYPES, USER_TYPES } from '../../../config/chat.constants';

describe('Chat Graph State', () => {
  // ===========================================================================
  // BOUNDED MESSAGES REDUCER
  // ===========================================================================
  describe('boundedMessagesReducer', () => {
    describe('basic merge behavior', () => {
      it('should add new messages to existing messages', () => {
        const existing = [new HumanMessage('Hello'), new AIMessage('Hi there')];
        const update = [new HumanMessage('How are you?')];

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(3);
        expect(result[0].content).toBe('Hello');
        expect(result[1].content).toBe('Hi there');
        expect(result[2].content).toBe('How are you?');
      });

      it('should handle empty existing array', () => {
        const existing: any[] = [];
        const update = [new HumanMessage('First message')];

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('First message');
      });

      it('should handle undefined existing state', () => {
        const existing = undefined;
        const update = [new HumanMessage('First message'), new AIMessage('Response')];

        const result = boundedMessagesReducer(existing, update);

        // When existing is undefined, messagesStateReducer treats it as empty array
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(HumanMessage);
        expect(result[0].content).toBe('First message');
        expect(result[1]).toBeInstanceOf(AIMessage);
        expect(result[1].content).toBe('Response');
      });

      it('should preserve message order (chronological)', () => {
        const existing = [
          new HumanMessage('Message 1'),
          new AIMessage('Response 1'),
          new HumanMessage('Message 2'),
        ];
        const update = [new AIMessage('Response 2'), new HumanMessage('Message 3')];

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(5);
        expect(result[0].content).toBe('Message 1');
        expect(result[1].content).toBe('Response 1');
        expect(result[2].content).toBe('Message 2');
        expect(result[3].content).toBe('Response 2');
        expect(result[4].content).toBe('Message 3');
      });
    });

    describe('boundary conditions', () => {
      it('should keep all messages when exactly at MAX_MESSAGES', () => {
        // Create exactly 100 messages
        const existing = Array.from({ length: MAX_MESSAGES }, (_, i) => new HumanMessage(`Message ${i}`));
        const update: any[] = [];

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(MAX_MESSAGES);
        expect(result[0].content).toBe('Message 0');
        expect(result[MAX_MESSAGES - 1].content).toBe(`Message ${MAX_MESSAGES - 1}`);
      });

      it('should keep last MAX_MESSAGES when exceeding limit by 1', () => {
        // Create 100 messages, then add 1 more
        const existing = Array.from({ length: MAX_MESSAGES }, (_, i) => new HumanMessage(`Message ${i}`));
        const update = [new HumanMessage('Message 100')];

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(MAX_MESSAGES);
        // Should have dropped Message 0, kept Messages 1-100
        expect(result[0].content).toBe('Message 1');
        expect(result[MAX_MESSAGES - 1].content).toBe('Message 100');
      });

      it('should keep last MAX_MESSAGES when exceeding limit by multiple messages', () => {
        // Create 98 messages, then add 5 more (total 103)
        const existing = Array.from({ length: 98 }, (_, i) => new HumanMessage(`Message ${i}`));
        const update = [
          new AIMessage('Response 98'),
          new HumanMessage('Message 99'),
          new AIMessage('Response 99'),
          new HumanMessage('Message 100'),
          new AIMessage('Response 100'),
        ];

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(MAX_MESSAGES);
        // Should have dropped Messages 0, 1, 2 (oldest 3)
        expect(result[0].content).toBe('Message 3');
        expect(result[MAX_MESSAGES - 1].content).toBe('Response 100');
      });

      it('should handle massive overflow (200+ messages)', () => {
        // Create 180 messages, then add 25 more (total 205)
        const existing = Array.from({ length: 180 }, (_, i) => new HumanMessage(`Message ${i}`));
        const update = Array.from({ length: 25 }, (_, i) => new HumanMessage(`Message ${180 + i}`));

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(MAX_MESSAGES);
        // Should keep last 100 messages (Messages 105-204)
        expect(result[0].content).toBe('Message 105');
        expect(result[MAX_MESSAGES - 1].content).toBe('Message 204');
      });
    });

    describe('message type preservation', () => {
      it('should preserve different message types in bounded array', () => {
        const existing = Array.from({ length: 98 }, (_, i) => {
          if (i % 3 === 0) return new SystemMessage(`System ${i}`);
          if (i % 3 === 1) return new HumanMessage(`Human ${i}`);
          return new AIMessage(`AI ${i}`);
        });
        const update = [new HumanMessage('New message 1'), new AIMessage('New message 2')];

        const result = boundedMessagesReducer(existing, update);

        expect(result).toHaveLength(MAX_MESSAGES);
        // Verify message types are preserved
        const systemCount = result.filter((m) => m._getType() === 'system').length;
        const humanCount = result.filter((m) => m._getType() === 'human').length;
        const aiCount = result.filter((m) => m._getType() === 'ai').length;

        expect(systemCount).toBeGreaterThan(0);
        expect(humanCount).toBeGreaterThan(0);
        expect(aiCount).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // TOKEN USAGE ACCUMULATOR
  // ===========================================================================
  describe('tokenUsage accumulator', () => {
    // Helper to get the reducer from the annotation
    const getTokenUsageReducer = () => {
      return ChatGraphAnnotation.spec.tokenUsage.operator;
    };

    describe('accumulation behavior', () => {
      it('should accumulate prompt tokens across iterations', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next: TokenUsage = { promptTokens: 200, completionTokens: 0, totalTokens: 0 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(300);
      });

      it('should accumulate completion tokens across iterations', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next: TokenUsage = { promptTokens: 0, completionTokens: 75, totalTokens: 0 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.completionTokens).toBe(125);
      });

      it('should accumulate total tokens across iterations', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next: TokenUsage = { promptTokens: 200, completionTokens: 75, totalTokens: 275 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(300);
        expect(result.completionTokens).toBe(125);
        expect(result.totalTokens).toBe(425);
      });

      it('should accumulate multiple iterations correctly', () => {
        const reducer = getTokenUsageReducer();

        let accumulated: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

        // Iteration 1
        accumulated = reducer(accumulated, { promptTokens: 100, completionTokens: 50, totalTokens: 150 });
        expect(accumulated.totalTokens).toBe(150);

        // Iteration 2
        accumulated = reducer(accumulated, { promptTokens: 200, completionTokens: 100, totalTokens: 300 });
        expect(accumulated.totalTokens).toBe(450);

        // Iteration 3
        accumulated = reducer(accumulated, { promptTokens: 150, completionTokens: 75, totalTokens: 225 });
        expect(accumulated.totalTokens).toBe(675);
        expect(accumulated.promptTokens).toBe(450);
        expect(accumulated.completionTokens).toBe(225);
      });
    });

    describe('null/undefined handling', () => {
      it('should handle null previous state', () => {
        const prev = null;
        const next: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(100);
        expect(result.completionTokens).toBe(50);
        expect(result.totalTokens).toBe(150);
      });

      it('should handle undefined previous state', () => {
        const prev = undefined;
        const next: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(100);
        expect(result.completionTokens).toBe(50);
        expect(result.totalTokens).toBe(150);
      });

      it('should handle null next state', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next = null;

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        // Should preserve prev values when next is null
        expect(result.promptTokens).toBe(100);
        expect(result.completionTokens).toBe(50);
        expect(result.totalTokens).toBe(150);
      });

      it('should handle undefined next state', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next = undefined;

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(100);
        expect(result.completionTokens).toBe(50);
        expect(result.totalTokens).toBe(150);
      });
    });

    describe('partial updates', () => {
      it('should handle partial update with only promptTokens', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next = { promptTokens: 50, completionTokens: 0, totalTokens: 0 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(150);
        expect(result.completionTokens).toBe(50); // Unchanged
        expect(result.totalTokens).toBe(150); // Unchanged
      });

      it('should handle partial update with only completionTokens', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next = { promptTokens: 0, completionTokens: 25, totalTokens: 0 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(100); // Unchanged
        expect(result.completionTokens).toBe(75);
        expect(result.totalTokens).toBe(150); // Unchanged
      });

      it('should handle zero values in update', () => {
        const prev: TokenUsage = { promptTokens: 100, completionTokens: 50, totalTokens: 150 };
        const next: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

        const reducer = getTokenUsageReducer();
        const result = reducer(prev, next);

        expect(result.promptTokens).toBe(100);
        expect(result.completionTokens).toBe(50);
        expect(result.totalTokens).toBe(150);
      });
    });

    describe('default value', () => {
      it('should have correct default value', () => {
        const defaultFn = ChatGraphAnnotation.spec.tokenUsage.initialValueFactory;
        const defaultValue = defaultFn?.();

        expect(defaultValue).toEqual({
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        });
      });
    });
  });

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================
  describe('createInitialChatState', () => {
    const mockUserContext: UserContext = {
      userId: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      userType: USER_TYPES.REGULAR,
      organizationId: 'org-456',
      organizationName: 'Test Org',
    };

    const mockChatContext: ChatContext = {
      pageType: PAGE_TYPES.ITEM_DETAIL,
      currentRoute: '/items/item-789',
      itemId: 'item-789',
      activeTab: 'details',
    };

    it('should create valid initial state with all required fields', () => {
      const state = createInitialChatState({
        sessionId: 'session-abc',
        userContext: mockUserContext,
        chatContext: mockChatContext,
        itemId: 'item-789',
      });

      expect(state.sessionId).toBe('session-abc');
      expect(state.userContext).toEqual(mockUserContext);
      expect(state.chatContext).toEqual(mockChatContext);
      expect(state.itemId).toBe('item-789');
      expect(state.messages).toEqual([]);
      expect(state.proposedActions).toEqual([]);
      expect(state.response).toBe('');
      expect(state.tokenUsage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
      expect(state.iterationCount).toBe(0);
    });

    it('should create valid state with minimal params', () => {
      const state = createInitialChatState({
        sessionId: 'session-abc',
        userContext: mockUserContext,
      });

      expect(state.sessionId).toBe('session-abc');
      expect(state.userContext).toEqual(mockUserContext);
      expect(state.chatContext).toBeNull();
      expect(state.itemId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.tokenUsage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should create state without chatContext', () => {
      const state = createInitialChatState({
        sessionId: 'session-abc',
        userContext: mockUserContext,
        itemId: 'item-789',
      });

      expect(state.chatContext).toBeNull();
      expect(state.itemId).toBe('item-789');
    });

    it('should create state without itemId', () => {
      const state = createInitialChatState({
        sessionId: 'session-abc',
        userContext: mockUserContext,
        chatContext: mockChatContext,
      });

      expect(state.chatContext).toEqual(mockChatContext);
      expect(state.itemId).toBeNull();
    });

    it('should initialize empty arrays and zero counters', () => {
      const state = createInitialChatState({
        sessionId: 'session-abc',
        userContext: mockUserContext,
      });

      expect(Array.isArray(state.messages)).toBe(true);
      expect(state.messages).toHaveLength(0);
      expect(Array.isArray(state.proposedActions)).toBe(true);
      expect(state.proposedActions).toHaveLength(0);
      expect(state.response).toBe('');
      expect(state.iterationCount).toBe(0);
    });
  });

  describe('addUserMessage', () => {
    it('should append HumanMessage correctly to empty state', () => {
      const state = {
        sessionId: 'session-abc',
        messages: [],
      };

      const result = addUserMessage(state, 'Hello, how can I help?');

      expect(result.messages).toHaveLength(1);
      expect(result.messages![0]).toBeInstanceOf(HumanMessage);
      expect(result.messages![0].content).toBe('Hello, how can I help?');
    });

    it('should append HumanMessage to existing messages', () => {
      const state = {
        sessionId: 'session-abc',
        messages: [new HumanMessage('First message'), new AIMessage('First response')],
      };

      const result = addUserMessage(state, 'Second message');

      expect(result.messages).toHaveLength(3);
      expect(result.messages![0].content).toBe('First message');
      expect(result.messages![1].content).toBe('First response');
      expect(result.messages![2]).toBeInstanceOf(HumanMessage);
      expect(result.messages![2].content).toBe('Second message');
    });

    it('should preserve other state properties', () => {
      const state = {
        sessionId: 'session-abc',
        messages: [new HumanMessage('First message')],
        userContext: {
          userId: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
          userType: USER_TYPES.REGULAR,
          organizationId: 'org-456',
          organizationName: 'Test Org',
        },
        tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      };

      const result = addUserMessage(state, 'Second message');

      expect(result.sessionId).toBe('session-abc');
      expect(result.userContext).toEqual(state.userContext);
      expect(result.tokenUsage).toEqual(state.tokenUsage);
      expect(result.messages).toHaveLength(2);
    });

    it('should handle undefined messages array', () => {
      const state = {
        sessionId: 'session-abc',
      };

      const result = addUserMessage(state, 'First message');

      expect(result.messages).toHaveLength(1);
      expect(result.messages![0]).toBeInstanceOf(HumanMessage);
      expect(result.messages![0].content).toBe('First message');
    });

    it('should handle empty string content', () => {
      const state = {
        sessionId: 'session-abc',
        messages: [],
      };

      const result = addUserMessage(state, '');

      expect(result.messages).toHaveLength(1);
      expect(result.messages![0]).toBeInstanceOf(HumanMessage);
      expect(result.messages![0].content).toBe('');
    });

    it('should handle multiline content', () => {
      const state = {
        sessionId: 'session-abc',
        messages: [],
      };

      const multilineContent = `Line 1
Line 2
Line 3`;

      const result = addUserMessage(state, multilineContent);

      expect(result.messages).toHaveLength(1);
      expect(result.messages![0].content).toBe(multilineContent);
    });

    it('should handle special characters in content', () => {
      const state = {
        sessionId: 'session-abc',
        messages: [],
      };

      const specialContent = 'Hello! @#$%^&*()_+ 你好 🎉';

      const result = addUserMessage(state, specialContent);

      expect(result.messages).toHaveLength(1);
      expect(result.messages![0].content).toBe(specialContent);
    });
  });

  // ===========================================================================
  // ANNOTATION DEFAULT VALUES
  // ===========================================================================
  describe('ChatGraphAnnotation default values', () => {
    it('should have correct default for messages', () => {
      const defaultFn = ChatGraphAnnotation.spec.messages.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(Array.isArray(defaultValue)).toBe(true);
      expect(defaultValue).toHaveLength(0);
    });

    it('should have correct default for userContext', () => {
      const defaultFn = ChatGraphAnnotation.spec.userContext.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBeNull();
    });

    it('should have correct default for chatContext', () => {
      const defaultFn = ChatGraphAnnotation.spec.chatContext.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBeNull();
    });

    it('should have correct default for itemId', () => {
      const defaultFn = ChatGraphAnnotation.spec.itemId.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBeNull();
    });

    it('should have correct default for item', () => {
      const defaultFn = ChatGraphAnnotation.spec.item.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBeNull();
    });

    it('should have correct default for research', () => {
      const defaultFn = ChatGraphAnnotation.spec.research.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBeNull();
    });

    it('should have correct default for activeResearchJobId', () => {
      const defaultFn = ChatGraphAnnotation.spec.activeResearchJobId.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBeNull();
    });

    it('should have correct default for researchStale', () => {
      const defaultFn = ChatGraphAnnotation.spec.researchStale.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBe(false);
    });

    it('should have correct default for proposedActions', () => {
      const defaultFn = ChatGraphAnnotation.spec.proposedActions.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(Array.isArray(defaultValue)).toBe(true);
      expect(defaultValue).toHaveLength(0);
    });

    it('should have correct default for response', () => {
      const defaultFn = ChatGraphAnnotation.spec.response.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBe('');
    });

    it('should have correct default for iterationCount', () => {
      const defaultFn = ChatGraphAnnotation.spec.iterationCount.initialValueFactory;
      const defaultValue = defaultFn?.();

      expect(defaultValue).toBe(0);
    });
  });

  // ===========================================================================
  // ITERATION COUNT REDUCER
  // ===========================================================================
  describe('iterationCount reducer', () => {
    const getIterationCountReducer = () => {
      return ChatGraphAnnotation.spec.iterationCount.operator;
    };

    it('should increment iteration count', () => {
      const reducer = getIterationCountReducer();
      const result = reducer(0, 1);

      expect(result).toBe(1);
    });

    it('should accumulate multiple iterations', () => {
      const reducer = getIterationCountReducer();
      let count = 0;

      count = reducer(count, 1);
      expect(count).toBe(1);

      count = reducer(count, 1);
      expect(count).toBe(2);

      count = reducer(count, 1);
      expect(count).toBe(3);
    });

    it('should handle null previous value', () => {
      const reducer = getIterationCountReducer();
      const result = reducer(null, 1);

      expect(result).toBe(1);
    });

    it('should handle undefined previous value', () => {
      const reducer = getIterationCountReducer();
      const result = reducer(undefined, 1);

      expect(result).toBe(1);
    });

    it('should handle null next value', () => {
      const reducer = getIterationCountReducer();
      const result = reducer(5, null);

      expect(result).toBe(5);
    });

    it('should handle undefined next value', () => {
      const reducer = getIterationCountReducer();
      const result = reducer(5, undefined);

      expect(result).toBe(5);
    });
  });
});
