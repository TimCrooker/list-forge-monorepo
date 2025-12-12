import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatGraphService } from '../chat-graph.service';
import { ChatService } from '../../../chat/chat.service';
import { ResearchService } from '../../../research/research.service';
import { LLMConfigService } from '../../config/llm.config';
import { ChatContextService } from '../chat-context.service';
import { ActionEmitterService } from '../action-emitter.service';
import { Item } from '../../../items/entities/item.entity';
import { ChatMessage } from '../../../chat/entities/chat-message.entity';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

describe('ChatGraphService - Conversation History Loading', () => {
  let service: ChatGraphService;
  let chatService: ChatService;

  const mockItemRepository = {
    findOne: jest.fn(),
  };

  const mockResearchService = {
    findLatestResearch: jest.fn(),
  };

  const mockChatService = {
    getRecentMessages: jest.fn(),
  };

  const mockLLMConfigService = {
    getLLM: jest.fn(),
  };

  const mockChatContextService = {
    buildItemSnapshot: jest.fn(),
    isResearchStale: jest.fn(),
    determineResearchStatus: jest.fn(),
  };

  const mockActionEmitterService = {
    emitToolProgress: jest.fn(),
    flushPendingActions: jest.fn(),
    clearPendingActions: jest.fn(),
    emitAction: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGraphService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
        {
          provide: ResearchService,
          useValue: mockResearchService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: LLMConfigService,
          useValue: mockLLMConfigService,
        },
        {
          provide: ChatContextService,
          useValue: mockChatContextService,
        },
        {
          provide: ActionEmitterService,
          useValue: mockActionEmitterService,
        },
        {
          provide: getQueueToken(QUEUE_AI_WORKFLOW),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<ChatGraphService>(ChatGraphService);
    chatService = module.get<ChatService>(ChatService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const createChatMessage = (
    role: 'user' | 'assistant' | 'system',
    content: string,
    createdAt: Date = new Date(),
  ): ChatMessage => ({
    id: `msg-${Math.random()}`,
    sessionId: 'session-123',
    role,
    content,
    createdAt,
    session: null as any,
  });

  /**
   * Access private method for testing
   * This uses TypeScript's type assertion to access private methods
   */
  const loadConversationHistory = async (sessionId: string) => {
    return (service as any).loadConversationHistory(sessionId);
  };

  // ============================================================================
  // TEST CASES: Message Conversion
  // ============================================================================

  describe('Message Conversion', () => {
    it('should convert user messages to HumanMessage', async () => {
      const messages = [
        createChatMessage('user', 'Hello, can you help me?'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(HumanMessage);
      expect(result[0].content).toBe('Hello, can you help me?');
    });

    it('should convert assistant messages to AIMessage', async () => {
      const messages = [
        createChatMessage('assistant', 'Yes, I can help you with that.'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(AIMessage);
      expect(result[0].content).toBe('Yes, I can help you with that.');
    });

    it('should skip system messages', async () => {
      // getRecentMessages returns DESC order (newest first)
      const messages = [
        createChatMessage('assistant', 'Hi there'),
        createChatMessage('user', 'Hello'),
        createChatMessage('system', 'System initialization message'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      // System message should be skipped, only user and assistant should remain
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(HumanMessage);
      expect(result[1]).toBeInstanceOf(AIMessage);
    });

    it('should handle mixed message types correctly', async () => {
      // getRecentMessages returns DESC order (newest first)
      const messages = [
        createChatMessage('assistant', 'I can help with that.'),
        createChatMessage('user', 'Can you update the price?'),
        createChatMessage('system', 'System checkpoint'),
        createChatMessage('assistant', 'The title is "Vintage Camera"'),
        createChatMessage('user', 'What is the title?'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      // Should have 4 messages (2 user, 2 assistant, 0 system)
      expect(result).toHaveLength(4);
      expect(result[0]).toBeInstanceOf(HumanMessage);
      expect(result[0].content).toBe('What is the title?');
      expect(result[1]).toBeInstanceOf(AIMessage);
      expect(result[1].content).toBe('The title is "Vintage Camera"');
      expect(result[2]).toBeInstanceOf(HumanMessage);
      expect(result[2].content).toBe('Can you update the price?');
      expect(result[3]).toBeInstanceOf(AIMessage);
      expect(result[3].content).toBe('I can help with that.');
    });
  });

  // ============================================================================
  // TEST CASES: Message Ordering
  // ============================================================================

  describe('Message Ordering', () => {
    it('should reverse messages to chronological order', async () => {
      // getRecentMessages returns DESC order (newest first)
      const messages = [
        createChatMessage('assistant', 'Response 3', new Date('2024-01-01T12:30:00')),
        createChatMessage('user', 'Question 2', new Date('2024-01-01T12:20:00')),
        createChatMessage('assistant', 'Response 1', new Date('2024-01-01T12:10:00')),
        createChatMessage('user', 'Question 1', new Date('2024-01-01T12:00:00')),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      // Should be in chronological order (oldest first)
      expect(result).toHaveLength(4);
      expect(result[0].content).toBe('Question 1');
      expect(result[1].content).toBe('Response 1');
      expect(result[2].content).toBe('Question 2');
      expect(result[3].content).toBe('Response 3');
    });

    it('should preserve conversation flow (user, assistant, user, assistant)', async () => {
      const messages = [
        createChatMessage('assistant', 'Sure, I updated it.', new Date('2024-01-01T12:40:00')),
        createChatMessage('user', 'Please update the price to $50', new Date('2024-01-01T12:30:00')),
        createChatMessage('assistant', 'The current price is $45', new Date('2024-01-01T12:20:00')),
        createChatMessage('user', 'What is the current price?', new Date('2024-01-01T12:10:00')),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(4);
      expect(result[0]).toBeInstanceOf(HumanMessage);
      expect(result[0].content).toBe('What is the current price?');
      expect(result[1]).toBeInstanceOf(AIMessage);
      expect(result[1].content).toBe('The current price is $45');
      expect(result[2]).toBeInstanceOf(HumanMessage);
      expect(result[2].content).toBe('Please update the price to $50');
      expect(result[3]).toBeInstanceOf(AIMessage);
      expect(result[3].content).toBe('Sure, I updated it.');
    });

    it('should maintain most recent messages come last', async () => {
      const oldDate = new Date('2024-01-01T10:00:00');
      const recentDate = new Date('2024-01-01T14:00:00');

      const messages = [
        createChatMessage('user', 'Recent question', recentDate),
        createChatMessage('user', 'Old question', oldDate),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Old question');
      expect(result[1].content).toBe('Recent question');
    });
  });

  // ============================================================================
  // TEST CASES: Message Limiting
  // ============================================================================

  describe('Message Limiting', () => {
    it('should request exactly 20 messages from ChatService', async () => {
      mockChatService.getRecentMessages.mockResolvedValue([]);

      await loadConversationHistory('session-123');

      expect(mockChatService.getRecentMessages).toHaveBeenCalledWith('session-123', 20);
    });

    it('should handle exactly 20 messages', async () => {
      const messages = Array.from({ length: 20 }, (_, i) =>
        createChatMessage(i % 2 === 0 ? 'user' : 'assistant', `Message ${i + 1}`)
      );

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(20);
    });

    it('should handle fewer than 20 messages', async () => {
      const messages = [
        createChatMessage('user', 'Message 1'),
        createChatMessage('assistant', 'Message 2'),
        createChatMessage('user', 'Message 3'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(3);
    });

    it('should handle a very long conversation by limiting to 20', async () => {
      // Simulate ChatService correctly limiting to 20
      const messages = Array.from({ length: 20 }, (_, i) =>
        createChatMessage(i % 2 === 0 ? 'user' : 'assistant', `Message ${i + 1}`)
      );

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(20);
      expect(mockChatService.getRecentMessages).toHaveBeenCalledWith('session-123', 20);
    });
  });

  // ============================================================================
  // TEST CASES: Empty History
  // ============================================================================

  describe('Empty History', () => {
    it('should return empty array when no history exists', async () => {
      mockChatService.getRecentMessages.mockResolvedValue([]);

      const result = await loadConversationHistory('session-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when only system messages exist', async () => {
      const messages = [
        createChatMessage('system', 'System message 1'),
        createChatMessage('system', 'System message 2'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ============================================================================
  // TEST CASES: Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('should return empty array on ChatService error (graceful fallback)', async () => {
      mockChatService.getRecentMessages.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await loadConversationHistory('session-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should log warning on error but not throw', async () => {
      const logSpy = jest.spyOn((service as any).logger, 'warn');

      mockChatService.getRecentMessages.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(loadConversationHistory('session-123')).resolves.toEqual([]);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load conversation history')
      );
    });

    it('should handle null or undefined responses gracefully', async () => {
      mockChatService.getRecentMessages.mockResolvedValue(null as any);

      // Should gracefully handle null by catching the error and returning []
      const result = await loadConversationHistory('session-123');
      expect(result).toEqual([]);
    });

    it('should handle database errors without crashing', async () => {
      mockChatService.getRecentMessages.mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );

      const result = await loadConversationHistory('session-123');

      expect(result).toEqual([]);
    });

    it('should handle timeout errors gracefully', async () => {
      mockChatService.getRecentMessages.mockRejectedValue(
        new Error('Query timeout exceeded')
      );

      const result = await loadConversationHistory('session-123');

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // TEST CASES: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle messages with empty content', async () => {
      // getRecentMessages returns DESC order (newest first)
      const messages = [
        createChatMessage('assistant', 'Response'),
        createChatMessage('user', ''),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('');
      expect(result[1].content).toBe('Response');
    });

    it('should handle messages with special characters', async () => {
      // getRecentMessages returns DESC order (newest first)
      const messages = [
        createChatMessage('assistant', 'I can handle \n newlines \t tabs'),
        createChatMessage('user', 'What about "quotes" and <tags>?'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('What about "quotes" and <tags>?');
      expect(result[1].content).toBe('I can handle \n newlines \t tabs');
    });

    it('should handle very long message content', async () => {
      const longContent = 'a'.repeat(10000);
      const messages = [
        createChatMessage('user', longContent),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(longContent);
      expect(result[0].content.length).toBe(10000);
    });

    it('should handle unicode and emoji content', async () => {
      // getRecentMessages returns DESC order (newest first)
      const messages = [
        createChatMessage('assistant', 'Yes! 👍 Unicode works fine.'),
        createChatMessage('user', 'Can you help? 😊 中文 العربية'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Can you help? 😊 中文 العربية');
      expect(result[1].content).toBe('Yes! 👍 Unicode works fine.');
    });

    it('should handle consecutive messages from same role', async () => {
      // Sometimes users send multiple messages in a row
      const messages = [
        createChatMessage('user', 'Wait, one more thing'),
        createChatMessage('user', 'Actually, two more things'),
        createChatMessage('user', 'Can you help?'),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(HumanMessage);
      expect(result[1]).toBeInstanceOf(HumanMessage);
      expect(result[2]).toBeInstanceOf(HumanMessage);
    });
  });

  // ============================================================================
  // TEST CASES: Integration Scenarios
  // ============================================================================

  describe('Integration Scenarios', () => {
    it('should load realistic conversation history', async () => {
      const messages = [
        createChatMessage('assistant', "I've updated the title for you.", new Date('2024-01-01T12:50:00')),
        createChatMessage('user', 'Please update the title to "Vintage Camera"', new Date('2024-01-01T12:40:00')),
        createChatMessage('assistant', 'The current title is "Old Camera"', new Date('2024-01-01T12:30:00')),
        createChatMessage('user', 'What is the current title?', new Date('2024-01-01T12:20:00')),
        createChatMessage('system', 'Session started', new Date('2024-01-01T12:10:00')),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      // System message should be filtered out
      expect(result).toHaveLength(4);
      expect(result[0].content).toBe('What is the current title?');
      expect(result[1].content).toBe('The current title is "Old Camera"');
      expect(result[2].content).toBe('Please update the title to "Vintage Camera"');
      expect(result[3].content).toBe("I've updated the title for you.");
    });

    it('should handle multi-turn item attribute discussion', async () => {
      const messages = [
        createChatMessage('assistant', 'Done! The price is now $75.', new Date('2024-01-01T12:50:00')),
        createChatMessage('user', 'Set it to $75', new Date('2024-01-01T12:40:00')),
        createChatMessage('assistant', 'Based on comps, I suggest $75-$85', new Date('2024-01-01T12:30:00')),
        createChatMessage('user', 'What price should I set?', new Date('2024-01-01T12:20:00')),
        createChatMessage('assistant', "It's a vintage Nikon camera from the 1970s", new Date('2024-01-01T12:10:00')),
        createChatMessage('user', 'What is this item?', new Date('2024-01-01T12:00:00')),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(6);
      // Verify chronological order
      expect(result[0].content).toBe('What is this item?');
      expect(result[5].content).toBe('Done! The price is now $75.');
    });

    it('should handle research discussion with tools', async () => {
      const messages = [
        createChatMessage('assistant', 'Research complete. Found 5 comparable items.', new Date('2024-01-01T12:40:00')),
        createChatMessage('user', 'Please research this item', new Date('2024-01-01T12:30:00')),
        createChatMessage('system', 'Tool execution: start_research', new Date('2024-01-01T12:25:00')),
        createChatMessage('assistant', 'I can help research this item.', new Date('2024-01-01T12:20:00')),
        createChatMessage('user', 'Can you research comparable items?', new Date('2024-01-01T12:10:00')),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      // System message filtered out
      expect(result).toHaveLength(4);
      expect(result[0].content).toBe('Can you research comparable items?');
      expect(result[3].content).toBe('Research complete. Found 5 comparable items.');
    });
  });

  // ============================================================================
  // TEST CASES: Context Retention
  // ============================================================================

  describe('Context Retention', () => {
    it('should ensure older context is preserved when returning messages', async () => {
      const messages = [
        createChatMessage('user', 'Latest message', new Date('2024-01-01T13:00:00')),
        createChatMessage('assistant', 'Response 2', new Date('2024-01-01T12:30:00')),
        createChatMessage('user', 'Question 2', new Date('2024-01-01T12:20:00')),
        createChatMessage('assistant', 'Response 1', new Date('2024-01-01T12:10:00')),
        createChatMessage('user', 'Original context question', new Date('2024-01-01T12:00:00')),
      ];

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      // Original context should be first (oldest)
      expect(result[0].content).toBe('Original context question');
      // Latest context should be last
      expect(result[4].content).toBe('Latest message');
    });

    it('should preserve enough context for multi-turn field updates', async () => {
      // Simulate a conversation where context from earlier messages is needed
      // getRecentMessages returns DESC order (newest first), so reverse the creation order
      const messages = Array.from({ length: 15 }, (_, i) => {
        const reversedIndex = 14 - i; // Reverse the order
        const isUser = reversedIndex % 2 === 0;
        return createChatMessage(
          isUser ? 'user' : 'assistant',
          `Message ${reversedIndex + 1}`,
          new Date(`2024-01-01T${12 + Math.floor(reversedIndex / 2)}:${(reversedIndex % 2) * 30}:00`)
        );
      });

      mockChatService.getRecentMessages.mockResolvedValue(messages);

      const result = await loadConversationHistory('session-123');

      expect(result).toHaveLength(15);
      // First message should be oldest
      expect(result[0].content).toBe('Message 1');
      // Last message should be newest
      expect(result[14].content).toBe('Message 15');
    });
  });
});
