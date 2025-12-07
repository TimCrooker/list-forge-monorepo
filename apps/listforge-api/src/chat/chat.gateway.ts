import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { ChatGraphService } from '../ai-workflows/services/chat-graph.service';
import { Rooms, SocketEvents } from '@listforge/socket-types';
import { ChatActionDto } from '@listforge/api-types';
import { EventsService } from '../events/events.service';
import { OnModuleInit } from '@nestjs/common';

interface SocketAuthPayload {
  userId: string;
  globalRole: string;
  currentOrgId: string | null;
}

/**
 * Chat Gateway - Phase 7 Slice 5 + Slice 7
 *
 * WebSocket gateway for real-time chat functionality.
 * Handles session joining and message sending with streaming responses.
 * Phase 7 Slice 7: Added research integration.
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // Track active research jobs per session (sessionId -> researchRunId)
  private readonly sessionResearchJobs = new Map<string, string>();
  // Track sessions per item (itemId -> Set<sessionId>)
  private readonly itemSessions = new Map<string, Set<string>>();
  // Rate limiting: track message timestamps per user (userId -> timestamp[])
  private readonly messageRateLimit = new Map<string, number[]>();
  // Rate limit: 10 messages per 10 seconds
  private readonly RATE_LIMIT_COUNT = 10;
  private readonly RATE_LIMIT_WINDOW = 10000; // 10 seconds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private chatService: ChatService,
    private chatGraphService: ChatGraphService,
    private eventsService: EventsService,
  ) {}

  /**
   * Handle client connection
   * Validates JWT token and stores user info on socket
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Chat socket connection rejected: no token provided');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const secret = this.configService.get<string>('JWT_SECRET') || 'dev-secret';
      const payload = this.jwtService.verify<SocketAuthPayload>(token, { secret });

      // Load user to verify they exist and aren't disabled
      const user = await this.userRepo.findOne({
        where: { id: payload.userId },
      });

      if (!user || user.disabled) {
        this.logger.warn(`Chat socket connection rejected: invalid user ${payload.userId}`);
        client.disconnect();
        return;
      }

      // Store user info on socket
      client.data.userId = payload.userId;
      client.data.currentOrgId = payload.currentOrgId;
      client.data.globalRole = payload.globalRole;

      this.logger.log(`Chat client connected: ${payload.userId}`);
    } catch (error) {
      this.logger.error('Chat socket connection error:', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.data.userId || 'unknown'}`);
  }

  /**
   * Handle join_session - client joins a chat session room
   */
  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    const userId = client.data.userId;
    const orgId = client.data.currentOrgId;

    if (!userId || !orgId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Verify session belongs to user
      const session = await this.chatService.findSession(sessionId, userId, orgId);

      // Join session room
      const room = Rooms.chatSession(sessionId);
      await client.join(room);

      // Track session for item (Phase 7 Slice 7)
      if (!this.itemSessions.has(session.itemId)) {
        this.itemSessions.set(session.itemId, new Set());
      }
      this.itemSessions.get(session.itemId)!.add(sessionId);

      this.logger.debug(`User ${userId} joined chat session ${sessionId}`);

      return { success: true, sessionId };
    } catch (error) {
      this.logger.error(`Failed to join session ${sessionId}:`, error);
      return { error: 'Session not found' };
    }
  }

  /**
   * Check rate limit for a user
   * Returns true if within limit, false if exceeded
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const timestamps = this.messageRateLimit.get(userId) || [];

    // Remove timestamps outside the window
    const recentTimestamps = timestamps.filter(
      (ts) => now - ts < this.RATE_LIMIT_WINDOW,
    );

    // Check if limit exceeded
    if (recentTimestamps.length >= this.RATE_LIMIT_COUNT) {
      return false;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.messageRateLimit.set(userId, recentTimestamps);

    return true;
  }

  /**
   * Handle send_message - send a message and stream response
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; content: string },
  ) {
    const { sessionId, content } = data;
    const userId = client.data.userId;
    const orgId = client.data.currentOrgId;

    if (!userId || !orgId) {
      return { error: 'Unauthorized' };
    }

    if (!content || !content.trim()) {
      return { error: 'Message content is required' };
    }

    // Check rate limit
    if (!this.checkRateLimit(userId)) {
      const errorMsg = 'Rate limit exceeded. Please wait a moment before sending another message.';
      client.emit('chat:error', {
        sessionId,
        error: errorMsg,
      });
      return { error: errorMsg };
    }

    try {
      // Verify session belongs to user
      const session = await this.chatService.findSession(sessionId, userId, orgId);

      // Save user message
      const userMessage = await this.chatService.saveMessage(sessionId, 'user', content);

      // Broadcast user message to session room
      this.server.to(Rooms.chatSession(sessionId)).emit(SocketEvents.CHAT_MESSAGE, {
        sessionId,
        message: {
          id: userMessage.id,
          sessionId: userMessage.sessionId,
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
      });

      // Stream assistant response
      let fullResponse = '';
      await this.chatGraphService.streamResponse({
        sessionId,
        itemId: session.itemId,
        userId,
        organizationId: orgId,
        userMessage: content,
        onToken: (token: string) => {
          fullResponse += token;
          // Emit token to session room
          this.server.to(Rooms.chatSession(sessionId)).emit('chat:token', {
            sessionId,
            token,
          });
        },
        onComplete: async (response: string, actions?: ChatActionDto[]) => {
          // Save assistant message with actions
          const assistantMessage = await this.chatService.saveMessage(
            sessionId,
            'assistant',
            response,
            { actions },
          );

          // Check if research was started (Phase 7 Slice 7)
          const researchAction = actions?.find((a) => a.type === 'start_research');
          if (researchAction && researchAction.value) {
            const researchRunId = String(researchAction.value);
            this.sessionResearchJobs.set(sessionId, researchRunId);

            // Emit research started event
            this.server.to(Rooms.chatSession(sessionId)).emit(SocketEvents.CHAT_RESEARCH_STARTED, {
              sessionId,
              itemId: session.itemId,
              researchRunId,
              timestamp: new Date().toISOString(),
            });
          }

          // Emit final message
          this.server.to(Rooms.chatSession(sessionId)).emit(SocketEvents.CHAT_MESSAGE, {
            sessionId,
            message: {
              id: assistantMessage.id,
              sessionId: assistantMessage.sessionId,
              role: assistantMessage.role,
              content: assistantMessage.content,
              actions: assistantMessage.actions?.map((a) => ({
                type: a.type,
                field: a.field,
                value: a.value,
                label: a.label,
                applied: a.applied,
              })),
              createdAt: assistantMessage.createdAt.toISOString(),
            },
          });
        },
        onError: async (error: string) => {
          // Emit error event
          this.server.to(Rooms.chatSession(sessionId)).emit('chat:error', {
            sessionId,
            error,
          });
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send message to session ${sessionId}:`, error);

      // Emit error to client
      client.emit('chat:error', {
        sessionId,
        error: errorMessage,
      });

      return { error: errorMessage };
    }
  }

  /**
   * Handle apply_action - apply an action from a chat message
   * Phase 7 Slice 6
   */
  @SubscribeMessage('apply_action')
  async handleApplyAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; actionIndex: number },
  ) {
    const { messageId, actionIndex } = data;
    const userId = client.data.userId;
    const orgId = client.data.currentOrgId;

    if (!userId || !orgId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Apply the action
      const result = await this.chatService.applyAction(messageId, actionIndex, userId);

      // Get the updated message
      const message = await this.chatService.findMessage(messageId);

      // Emit action applied event to session room
      this.server.to(Rooms.chatSession(message.sessionId)).emit(SocketEvents.CHAT_ACTION_APPLIED, {
        sessionId: message.sessionId,
        messageId,
        actionIndex,
        success: result.success,
        field: result.field,
        newValue: result.newValue,
        error: result.error,
      });

      // Also emit updated message with applied action
      this.server.to(Rooms.chatSession(message.sessionId)).emit(SocketEvents.CHAT_MESSAGE, {
        sessionId: message.sessionId,
        message: {
          id: message.id,
          sessionId: message.sessionId,
          role: message.role,
          content: message.content,
          actions: message.actions?.map((a) => ({
            type: a.type,
            field: a.field,
            value: a.value,
            label: a.label,
            applied: a.applied,
          })),
          createdAt: message.createdAt.toISOString(),
        },
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to apply action for message ${messageId}:`, error);

      // Emit error to client
      client.emit(SocketEvents.CHAT_ACTION_APPLIED, {
        sessionId: '',
        messageId,
        actionIndex,
        success: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Initialize module - subscribe to research completion events
   * Phase 7 Slice 7
   */
  onModuleInit() {
    // Research completion is handled via EventsService emitting RESEARCH_JOB_COMPLETED
    // to item rooms. ChatGateway tracks item sessions and will be notified via
    // the notifyResearchCompleted method when research completes.
    // The actual connection happens when ResearchGraphService emits the event.
    this.logger.log('ChatGateway initialized with research integration');
  }

  /**
   * Notify chat sessions when research completes
   * Called by research processor or via event listener
   * Phase 7 Slice 7
   */
  notifyResearchCompleted(itemId: string, researchRunId: string, status: 'success' | 'error', error?: string) {
    const sessions = this.itemSessions.get(itemId);
    if (!sessions) {
      return;
    }

    sessions.forEach((sessionId) => {
      // Only notify if this session started this research
      if (this.sessionResearchJobs.get(sessionId) === researchRunId) {
        this.server.to(Rooms.chatSession(sessionId)).emit(SocketEvents.CHAT_RESEARCH_COMPLETED, {
          sessionId,
          itemId,
          researchRunId,
          status,
          timestamp: new Date().toISOString(),
          error,
        });

        // Clear tracking
        this.sessionResearchJobs.delete(sessionId);
      }
    });
  }
}
