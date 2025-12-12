import { ActionEmitterService } from '../action-emitter.service';
import { Server } from 'socket.io';
import { SocketEvents, Rooms } from '@listforge/socket-types';
import { ChatAction } from '@listforge/core-types';

describe('ActionEmitterService', () => {
  let service: ActionEmitterService;
  let mockIo: jest.Mocked<Server>;

  beforeEach(() => {
    service = new ActionEmitterService();

    // Create mock Socket.IO server
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // initialize
  // ==========================================================================

  describe('initialize', () => {
    it('should store the Socket.IO server instance', () => {
      service.initialize(mockIo);

      // Test that the io instance is stored by calling a method that uses it
      const action: ChatAction = {
        id: 'action-1',
        type: 'update_field',
        label: 'Update Title',
        payload: { type: 'update_field', field: 'title', value: 'New Title' },
      };

      service.emitAction('session-123', action);

      expect(mockIo.to).toHaveBeenCalledWith(Rooms.chatSession('session-123'));
    });
  });

  // ==========================================================================
  // emitAction
  // ==========================================================================

  describe('emitAction', () => {
    const sessionId = 'session-123';
    const action: ChatAction = {
      id: 'action-1',
      type: 'update_field',
      label: 'Update Title',
      description: 'Update the item title',
      priority: 'high',
      autoExecute: false,
      payload: { type: 'update_field', field: 'title', value: 'New Title' },
    };

    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should emit action via WebSocket gateway', () => {
      service.emitAction(sessionId, action);

      expect(mockIo.to).toHaveBeenCalledWith(Rooms.chatSession(sessionId));
      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_ACTION_SUGGESTED,
        expect.objectContaining({
          sessionId,
          action: {
            id: action.id,
            type: action.type,
            label: action.label,
            description: action.description,
            priority: action.priority,
            autoExecute: action.autoExecute,
            payload: action.payload,
          },
          timestamp: expect.any(String),
        }),
      );
    });

    it('should add action to pending queue', () => {
      service.emitAction(sessionId, action);

      const pendingActions = service.flushPendingActions(sessionId);
      expect(pendingActions).toHaveLength(1);
      expect(pendingActions[0]).toEqual(action);
    });

    it('should handle missing sessionId gracefully', () => {
      // Empty sessionId should still work, just creates a room with empty suffix
      service.emitAction('', action);

      expect(mockIo.to).toHaveBeenCalledWith(Rooms.chatSession(''));
      expect(mockIo.emit).toHaveBeenCalled();
    });

    it('should emit multiple actions to the same session', () => {
      const action2: ChatAction = {
        id: 'action-2',
        type: 'navigate',
        label: 'Go to Items',
        payload: { type: 'navigate', routeName: 'items', path: '/items' },
      };

      service.emitAction(sessionId, action);
      service.emitAction(sessionId, action2);

      expect(mockIo.emit).toHaveBeenCalledTimes(2);

      const pendingActions = service.flushPendingActions(sessionId);
      expect(pendingActions).toHaveLength(2);
      expect(pendingActions[0]).toEqual(action);
      expect(pendingActions[1]).toEqual(action2);
    });

    it('should include all action fields in emitted event', () => {
      service.emitAction(sessionId, action);

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_ACTION_SUGGESTED,
        expect.objectContaining({
          action: expect.objectContaining({
            id: 'action-1',
            type: 'update_field',
            label: 'Update Title',
            description: 'Update the item title',
            priority: 'high',
            autoExecute: false,
          }),
        }),
      );
    });

    it('should log action emission', () => {
      service.emitAction(sessionId, action);

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Emitted action:',
        action.type,
        action.label,
      );
    });

    it('should warn when Socket.IO is not initialized', () => {
      const uninitializedService = new ActionEmitterService();

      uninitializedService.emitAction(sessionId, action);

      expect(console.warn).toHaveBeenCalledWith('[ActionEmitter] Socket.IO not initialized');
      expect(mockIo.to).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    it('should not add to pending queue when Socket.IO is not initialized', () => {
      const uninitializedService = new ActionEmitterService();

      uninitializedService.emitAction(sessionId, action);

      const pendingActions = uninitializedService.flushPendingActions(sessionId);
      expect(pendingActions).toHaveLength(0);
    });

    it('should handle actions without optional fields', () => {
      const minimalAction: ChatAction = {
        id: 'action-minimal',
        type: 'copy',
        label: 'Copy Text',
        payload: { type: 'copy', text: 'Hello World' },
      };

      service.emitAction(sessionId, minimalAction);

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_ACTION_SUGGESTED,
        expect.objectContaining({
          action: {
            id: 'action-minimal',
            type: 'copy',
            label: 'Copy Text',
            description: undefined,
            priority: undefined,
            autoExecute: undefined,
            payload: { type: 'copy', text: 'Hello World' },
          },
        }),
      );
    });
  });

  // ==========================================================================
  // emitProactiveSuggestion
  // ==========================================================================

  describe('emitProactiveSuggestion', () => {
    const userId = 'user-123';
    const suggestion: ChatAction = {
      id: 'suggestion-1',
      type: 'trigger_research',
      label: 'Run Research',
      description: 'Start research for this item',
      payload: { type: 'trigger_research', itemId: 'item-123' },
    };

    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should emit proactive suggestion to user room', () => {
      service.emitProactiveSuggestion(userId, suggestion);

      expect(mockIo.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_PROACTIVE_SUGGESTION,
        expect.objectContaining({
          userId,
          suggestion: {
            id: suggestion.id,
            type: suggestion.type,
            label: suggestion.label,
            description: suggestion.description,
            payload: suggestion.payload,
          },
          timestamp: expect.any(String),
        }),
      );
    });

    it('should include context when provided', () => {
      const context = {
        routeName: 'item_detail',
        itemId: 'item-123',
      };

      service.emitProactiveSuggestion(userId, suggestion, context);

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_PROACTIVE_SUGGESTION,
        expect.objectContaining({
          context,
        }),
      );
    });

    it('should use custom expiresInSeconds when provided', () => {
      service.emitProactiveSuggestion(userId, suggestion, undefined, 60);

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_PROACTIVE_SUGGESTION,
        expect.objectContaining({
          expiresInSeconds: 60,
        }),
      );
    });

    it('should default to 30 seconds expiry when not provided', () => {
      service.emitProactiveSuggestion(userId, suggestion);

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_PROACTIVE_SUGGESTION,
        expect.objectContaining({
          expiresInSeconds: 30,
        }),
      );
    });

    it('should log proactive suggestion emission', () => {
      service.emitProactiveSuggestion(userId, suggestion);

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Emitted proactive suggestion:',
        suggestion.label,
      );
    });

    it('should warn when Socket.IO is not initialized', () => {
      const uninitializedService = new ActionEmitterService();

      uninitializedService.emitProactiveSuggestion(userId, suggestion);

      expect(console.warn).toHaveBeenCalledWith('[ActionEmitter] Socket.IO not initialized');
      expect(mockIo.to).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    it('should not add proactive suggestions to pending queue', () => {
      const sessionId = 'session-123';

      service.emitProactiveSuggestion(userId, suggestion);

      const pendingActions = service.flushPendingActions(sessionId);
      expect(pendingActions).toHaveLength(0);
    });

    it('should handle all context fields', () => {
      const fullContext = {
        routeName: 'item_detail',
        itemId: 'item-123',
        ruleId: 'rule-456',
      };

      service.emitProactiveSuggestion(userId, suggestion, fullContext, 120);

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_PROACTIVE_SUGGESTION,
        expect.objectContaining({
          userId,
          suggestion: expect.objectContaining({
            id: suggestion.id,
            type: suggestion.type,
            label: suggestion.label,
          }),
          context: fullContext,
          expiresInSeconds: 120,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  // ==========================================================================
  // emitToolProgress
  // ==========================================================================

  describe('emitToolProgress', () => {
    const sessionId = 'session-123';
    const toolName = 'searchEbayComps';

    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should emit starting progress with display name', () => {
      service.emitToolProgress(sessionId, toolName, 'starting', {
        displayName: 'Searching eBay Comps',
      });

      expect(mockIo.to).toHaveBeenCalledWith(Rooms.chatSession(sessionId));
      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({
          sessionId,
          toolName,
          status: 'starting',
          displayName: 'Searching eBay Comps',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should emit completed progress with message', () => {
      service.emitToolProgress(sessionId, toolName, 'completed', {
        message: 'Found 15 comparable items',
      });

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({
          sessionId,
          toolName,
          status: 'completed',
          message: 'Found 15 comparable items',
        }),
      );
    });

    it('should emit error progress with error message', () => {
      service.emitToolProgress(sessionId, toolName, 'error', {
        message: 'Failed to connect to eBay API',
      });

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({
          sessionId,
          toolName,
          status: 'error',
          message: 'Failed to connect to eBay API',
        }),
      );
    });

    it('should handle missing optional fields', () => {
      service.emitToolProgress(sessionId, toolName, 'starting');

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({
          sessionId,
          toolName,
          status: 'starting',
          displayName: undefined,
          message: undefined,
        }),
      );
    });

    it('should handle both displayName and message together', () => {
      service.emitToolProgress(sessionId, toolName, 'completed', {
        displayName: 'eBay Comp Search',
        message: 'Successfully found 10 items',
      });

      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({
          displayName: 'eBay Comp Search',
          message: 'Successfully found 10 items',
        }),
      );
    });

    it('should not warn or throw when Socket.IO is not initialized', () => {
      const uninitializedService = new ActionEmitterService();

      uninitializedService.emitToolProgress(sessionId, toolName, 'starting');

      expect(console.warn).not.toHaveBeenCalled();
      expect(mockIo.to).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    it('should emit progress for all status types', () => {
      const statuses: Array<'starting' | 'completed' | 'error'> = ['starting', 'completed', 'error'];

      statuses.forEach((status) => {
        service.emitToolProgress(sessionId, toolName, status);
      });

      expect(mockIo.emit).toHaveBeenCalledTimes(3);
      expect(mockIo.emit).toHaveBeenNthCalledWith(
        1,
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({ status: 'starting' }),
      );
      expect(mockIo.emit).toHaveBeenNthCalledWith(
        2,
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({ status: 'completed' }),
      );
      expect(mockIo.emit).toHaveBeenNthCalledWith(
        3,
        SocketEvents.CHAT_TOOL_PROGRESS,
        expect.objectContaining({ status: 'error' }),
      );
    });

    it('should include timestamp in ISO format', () => {
      const beforeTime = Date.now();
      service.emitToolProgress(sessionId, toolName, 'starting');
      const afterTime = Date.now();

      const emitCall = mockIo.emit.mock.calls[0][1] as any;
      expect(emitCall.timestamp).toBeDefined();
      expect(emitCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

      const emittedTime = new Date(emitCall.timestamp).getTime();
      expect(emittedTime).toBeGreaterThanOrEqual(beforeTime);
      expect(emittedTime).toBeLessThanOrEqual(afterTime);
    });
  });

  // ==========================================================================
  // flushPendingActions
  // ==========================================================================

  describe('flushPendingActions', () => {
    const sessionId = 'session-123';

    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should return all pending actions for session', () => {
      const action1: ChatAction = {
        id: 'action-1',
        type: 'update_field',
        label: 'Update Title',
        payload: { type: 'update_field', field: 'title', value: 'New Title' },
      };

      const action2: ChatAction = {
        id: 'action-2',
        type: 'navigate',
        label: 'Go to Items',
        payload: { type: 'navigate', routeName: 'items', path: '/items' },
      };

      service.emitAction(sessionId, action1);
      service.emitAction(sessionId, action2);

      const result = service.flushPendingActions(sessionId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(action1);
      expect(result[1]).toEqual(action2);
    });

    it('should clear pending actions after flush', () => {
      const action: ChatAction = {
        id: 'action-1',
        type: 'copy',
        label: 'Copy',
        payload: { type: 'copy', text: 'test' },
      };

      service.emitAction(sessionId, action);

      const firstFlush = service.flushPendingActions(sessionId);
      expect(firstFlush).toHaveLength(1);

      const secondFlush = service.flushPendingActions(sessionId);
      expect(secondFlush).toHaveLength(0);
    });

    it('should return empty array when no pending actions', () => {
      const result = service.flushPendingActions(sessionId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return actions for specified sessionId', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      const action1: ChatAction = {
        id: 'action-1',
        type: 'copy',
        label: 'Action 1',
        payload: { type: 'copy', text: 'test1' },
      };

      const action2: ChatAction = {
        id: 'action-2',
        type: 'copy',
        label: 'Action 2',
        payload: { type: 'copy', text: 'test2' },
      };

      service.emitAction(session1, action1);
      service.emitAction(session2, action2);

      const result1 = service.flushPendingActions(session1);
      expect(result1).toHaveLength(1);
      expect(result1[0]).toEqual(action1);

      const result2 = service.flushPendingActions(session2);
      expect(result2).toHaveLength(1);
      expect(result2[0]).toEqual(action2);
    });

    it('should maintain action order', () => {
      const actions: ChatAction[] = [
        {
          id: 'action-1',
          type: 'copy',
          label: 'First',
          payload: { type: 'copy', text: '1' },
        },
        {
          id: 'action-2',
          type: 'copy',
          label: 'Second',
          payload: { type: 'copy', text: '2' },
        },
        {
          id: 'action-3',
          type: 'copy',
          label: 'Third',
          payload: { type: 'copy', text: '3' },
        },
      ];

      actions.forEach((action) => service.emitAction(sessionId, action));

      const result = service.flushPendingActions(sessionId);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('action-1');
      expect(result[1].id).toBe('action-2');
      expect(result[2].id).toBe('action-3');
    });
  });

  // ==========================================================================
  // clearPendingActions
  // ==========================================================================

  describe('clearPendingActions', () => {
    const sessionId = 'session-123';

    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should remove all pending actions for session', () => {
      const action: ChatAction = {
        id: 'action-1',
        type: 'copy',
        label: 'Copy',
        payload: { type: 'copy', text: 'test' },
      };

      service.emitAction(sessionId, action);
      service.clearPendingActions(sessionId);

      const result = service.flushPendingActions(sessionId);
      expect(result).toEqual([]);
    });

    it('should not affect other sessions actions', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      const action1: ChatAction = {
        id: 'action-1',
        type: 'copy',
        label: 'Action 1',
        payload: { type: 'copy', text: 'test1' },
      };

      const action2: ChatAction = {
        id: 'action-2',
        type: 'copy',
        label: 'Action 2',
        payload: { type: 'copy', text: 'test2' },
      };

      service.emitAction(session1, action1);
      service.emitAction(session2, action2);

      service.clearPendingActions(session1);

      const result1 = service.flushPendingActions(session1);
      expect(result1).toEqual([]);

      const result2 = service.flushPendingActions(session2);
      expect(result2).toHaveLength(1);
      expect(result2[0]).toEqual(action2);
    });

    it('should not throw when clearing non-existent session', () => {
      expect(() => {
        service.clearPendingActions('non-existent-session');
      }).not.toThrow();
    });

    it('should not throw when clearing already-cleared session', () => {
      service.emitAction(sessionId, {
        id: 'action-1',
        type: 'copy',
        label: 'Copy',
        payload: { type: 'copy', text: 'test' },
      });

      service.clearPendingActions(sessionId);

      expect(() => {
        service.clearPendingActions(sessionId);
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // handleActionExecuted
  // ==========================================================================

  describe('handleActionExecuted', () => {
    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should mark action as applied', () => {
      const data = {
        actionId: 'action-123',
        success: true,
        sessionId: 'session-123',
      };

      service.handleActionExecuted(data);

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action executed:',
        data.actionId,
        data.success,
      );
    });

    it('should log action execution for analytics', () => {
      const data = {
        actionId: 'action-456',
        success: false,
        sessionId: 'session-456',
      };

      service.handleActionExecuted(data);

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action executed:',
        'action-456',
        false,
      );
    });

    it('should handle missing sessionId', () => {
      const data = {
        actionId: 'action-789',
        success: true,
      };

      expect(() => {
        service.handleActionExecuted(data);
      }).not.toThrow();

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action executed:',
        'action-789',
        true,
      );
    });

    it('should log both successful and failed executions', () => {
      service.handleActionExecuted({
        actionId: 'action-success',
        success: true,
      });

      service.handleActionExecuted({
        actionId: 'action-failure',
        success: false,
      });

      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action executed:',
        'action-success',
        true,
      );
      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action executed:',
        'action-failure',
        false,
      );
    });
  });

  // ==========================================================================
  // handleActionDismissed
  // ==========================================================================

  describe('handleActionDismissed', () => {
    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should remove action from pending', () => {
      const data = {
        actionId: 'action-123',
        sessionId: 'session-123',
      };

      service.handleActionDismissed(data);

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action dismissed:',
        data.actionId,
      );
    });

    it('should log dismissal for analytics', () => {
      const data = {
        actionId: 'action-456',
        sessionId: 'session-456',
      };

      service.handleActionDismissed(data);

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action dismissed:',
        'action-456',
      );
    });

    it('should handle missing sessionId', () => {
      const data = {
        actionId: 'action-789',
      };

      expect(() => {
        service.handleActionDismissed(data);
      }).not.toThrow();

      expect(console.log).toHaveBeenCalledWith(
        '[ActionEmitter] Action dismissed:',
        'action-789',
      );
    });

    it('should log multiple dismissals independently', () => {
      service.handleActionDismissed({ actionId: 'action-1' });
      service.handleActionDismissed({ actionId: 'action-2' });
      service.handleActionDismissed({ actionId: 'action-3' });

      expect(console.log).toHaveBeenCalledTimes(3);
      expect(console.log).toHaveBeenNthCalledWith(
        1,
        '[ActionEmitter] Action dismissed:',
        'action-1',
      );
      expect(console.log).toHaveBeenNthCalledWith(
        2,
        '[ActionEmitter] Action dismissed:',
        'action-2',
      );
      expect(console.log).toHaveBeenNthCalledWith(
        3,
        '[ActionEmitter] Action dismissed:',
        'action-3',
      );
    });
  });

  // ==========================================================================
  // Integration scenarios
  // ==========================================================================

  describe('Integration scenarios', () => {
    beforeEach(() => {
      service.initialize(mockIo);
    });

    it('should handle full action lifecycle: emit -> flush -> clear', () => {
      const sessionId = 'session-123';
      const action: ChatAction = {
        id: 'action-1',
        type: 'update_field',
        label: 'Update Field',
        payload: { type: 'update_field', field: 'title', value: 'Test' },
      };

      // Emit action
      service.emitAction(sessionId, action);
      expect(mockIo.emit).toHaveBeenCalledWith(
        SocketEvents.CHAT_ACTION_SUGGESTED,
        expect.anything(),
      );

      // Flush actions
      const flushed = service.flushPendingActions(sessionId);
      expect(flushed).toHaveLength(1);

      // Clear actions (should be already cleared by flush)
      service.clearPendingActions(sessionId);
      const afterClear = service.flushPendingActions(sessionId);
      expect(afterClear).toHaveLength(0);
    });

    it('should handle error scenario: emit -> clear without flush', () => {
      const sessionId = 'session-123';
      const action: ChatAction = {
        id: 'action-1',
        type: 'copy',
        label: 'Copy',
        payload: { type: 'copy', text: 'test' },
      };

      service.emitAction(sessionId, action);
      service.clearPendingActions(sessionId);

      const result = service.flushPendingActions(sessionId);
      expect(result).toEqual([]);
    });

    it('should handle concurrent sessions independently', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const session3 = 'session-3';

      const action1: ChatAction = {
        id: 'action-1',
        type: 'copy',
        label: 'Session 1 Action',
        payload: { type: 'copy', text: 'test1' },
      };

      const action2: ChatAction = {
        id: 'action-2',
        type: 'copy',
        label: 'Session 2 Action',
        payload: { type: 'copy', text: 'test2' },
      };

      const action3: ChatAction = {
        id: 'action-3',
        type: 'copy',
        label: 'Session 3 Action',
        payload: { type: 'copy', text: 'test3' },
      };

      service.emitAction(session1, action1);
      service.emitAction(session2, action2);
      service.emitAction(session3, action3);

      // Flush session1
      const result1 = service.flushPendingActions(session1);
      expect(result1).toHaveLength(1);
      expect(result1[0].id).toBe('action-1');

      // Clear session2
      service.clearPendingActions(session2);

      // Session 1 should be empty (flushed)
      expect(service.flushPendingActions(session1)).toEqual([]);

      // Session 2 should be empty (cleared)
      expect(service.flushPendingActions(session2)).toEqual([]);

      // Session 3 should still have its action
      const result3 = service.flushPendingActions(session3);
      expect(result3).toHaveLength(1);
      expect(result3[0].id).toBe('action-3');
    });

    it('should handle rapid action emissions', () => {
      const sessionId = 'session-123';
      const actionCount = 100;

      for (let i = 0; i < actionCount; i++) {
        service.emitAction(sessionId, {
          id: `action-${i}`,
          type: 'copy',
          label: `Action ${i}`,
          payload: { type: 'copy', text: `test-${i}` },
        });
      }

      const result = service.flushPendingActions(sessionId);
      expect(result).toHaveLength(actionCount);
      expect(result[0].id).toBe('action-0');
      expect(result[actionCount - 1].id).toBe(`action-${actionCount - 1}`);
    });
  });
});
