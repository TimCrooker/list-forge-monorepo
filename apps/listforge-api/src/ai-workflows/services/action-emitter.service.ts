import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { SocketEvents, Rooms } from '@listforge/socket-types';
import { ChatAction } from '@listforge/core-types';

/**
 * Action Emitter Service
 *
 * Streams action suggestions to the frontend via WebSocket.
 * Actions can be emitted:
 * - During agent tool execution (immediate suggestions)
 * - After message completion (batched with message)
 * - Proactively based on context (without user message)
 */
@Injectable()
export class ActionEmitterService {
  private io: Server | null = null;
  private pendingActions = new Map<string, ChatAction[]>();

  /**
   * Initialize with Socket.IO server
   * Called during module initialization
   */
  initialize(io: Server): void {
    this.io = io;
  }

  /**
   * Emit an action suggestion immediately
   * Used during agent execution to stream actions in real-time
   */
  emitAction(sessionId: string, action: ChatAction): void {
    if (!this.io) {
      console.warn('[ActionEmitter] Socket.IO not initialized');
      return;
    }

    // Emit to session room
    this.io.to(Rooms.chatSession(sessionId)).emit(SocketEvents.CHAT_ACTION_SUGGESTED, {
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
      timestamp: new Date().toISOString(),
    });

    // Also accumulate for message persistence
    this.addPendingAction(sessionId, action);

    console.log('[ActionEmitter] Emitted action:', action.type, action.label);
  }

  /**
   * Emit a proactive suggestion (not tied to a conversation)
   * Used for context-aware suggestions based on user activity
   */
  emitProactiveSuggestion(
    userId: string,
    suggestion: ChatAction,
    context?: { routeName?: string; itemId?: string; ruleId?: string },
    expiresInSeconds?: number,
  ): void {
    if (!this.io) {
      console.warn('[ActionEmitter] Socket.IO not initialized');
      return;
    }

    // Emit to user room
    this.io.to(`user:${userId}`).emit(SocketEvents.CHAT_PROACTIVE_SUGGESTION, {
      userId,
      suggestion: {
        id: suggestion.id,
        type: suggestion.type,
        label: suggestion.label,
        description: suggestion.description,
        payload: suggestion.payload,
      },
      context,
      expiresInSeconds: expiresInSeconds || 30,
      timestamp: new Date().toISOString(),
    });

    console.log('[ActionEmitter] Emitted proactive suggestion:', suggestion.label);
  }

  /**
   * Emit tool progress update
   * Used to show users what the agent is doing
   */
  emitToolProgress(
    sessionId: string,
    toolName: string,
    status: 'starting' | 'completed' | 'error',
    options?: { displayName?: string; message?: string },
  ): void {
    if (!this.io) {
      return;
    }

    this.io.to(Rooms.chatSession(sessionId)).emit(SocketEvents.CHAT_TOOL_PROGRESS, {
      sessionId,
      toolName,
      status,
      displayName: options?.displayName,
      message: options?.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add action to pending list for a session
   * These are persisted with the message when it completes
   */
  private addPendingAction(sessionId: string, action: ChatAction): void {
    if (!this.pendingActions.has(sessionId)) {
      this.pendingActions.set(sessionId, []);
    }
    this.pendingActions.get(sessionId)!.push(action);
  }

  /**
   * Get and clear pending actions for a session
   * Called when message is being saved
   */
  flushPendingActions(sessionId: string): ChatAction[] {
    const actions = this.pendingActions.get(sessionId) || [];
    this.pendingActions.delete(sessionId);
    return actions;
  }

  /**
   * Clear pending actions without returning them
   * Called on error or timeout
   */
  clearPendingActions(sessionId: string): void {
    this.pendingActions.delete(sessionId);
  }

  /**
   * Handle action execution feedback
   */
  handleActionExecuted(data: {
    actionId: string;
    success: boolean;
    sessionId?: string;
  }): void {
    console.log('[ActionEmitter] Action executed:', data.actionId, data.success);
    // Could track action analytics here
  }

  /**
   * Handle action dismissal
   */
  handleActionDismissed(data: {
    actionId: string;
    sessionId?: string;
  }): void {
    console.log('[ActionEmitter] Action dismissed:', data.actionId);
    // Could track dismissal analytics here
  }
}
