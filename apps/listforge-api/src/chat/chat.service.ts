import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Item } from '../items/entities/item.entity';
import { ItemsService } from '../items/items.service';
import { ChatActionDto } from '@listforge/api-types';
import { updateItemField } from '../ai-workflows/tools/chat.tools';

/**
 * Chat Service - Phase 7 Slice 5
 *
 * Service for managing chat sessions and messages.
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    private readonly itemsService: ItemsService,
  ) {}

  /**
   * Create a new chat session for an item
   * @deprecated Use createGeneralSession for new code (supports all session types)
   */
  async createSession(
    itemId: string,
    userId: string,
    organizationId: string,
  ): Promise<ChatSession> {
    // Verify item exists and belongs to org
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const session = this.chatSessionRepo.create({
      itemId,
      userId,
      organizationId,
      conversationType: 'item_scoped',
      title: `Item: ${item.title}`,
      lastActivityAt: new Date(),
    });

    return this.chatSessionRepo.save(session);
  }

  /**
   * Get or create a chat session for an item (idempotent)
   * Returns existing session if one exists for this user/item, otherwise creates new
   */
  async getOrCreateSession(
    itemId: string,
    userId: string,
    organizationId: string,
  ): Promise<ChatSession> {
    // Try to find existing session
    const existing = await this.chatSessionRepo.findOne({
      where: { itemId, userId, organizationId },
      order: { updatedAt: 'DESC' },
    });

    if (existing) {
      return existing;
    }

    // Create new session
    return this.createSession(itemId, userId, organizationId);
  }

  /**
   * Find a chat session by ID with authorization check
   */
  async findSession(
    sessionId: string,
    userId: string,
    organizationId: string,
  ): Promise<ChatSession> {
    const session = await this.chatSessionRepo.findOne({
      where: { id: sessionId, userId, organizationId },
      relations: ['item'],
    });

    if (!session) {
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Save a message to a chat session
   * Phase 7 Slice 6: Added support for actions
   */
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    options?: {
      toolCalls?: Array<{
        tool: string;
        args: Record<string, unknown>;
        result?: unknown;
      }>;
      actions?: ChatActionDto[];
    },
  ): Promise<ChatMessage> {
    // Verify session exists
    const session = await this.chatSessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    }

    const message = this.chatMessageRepo.create({
      sessionId,
      role,
      content,
      toolCalls: options?.toolCalls,
      actions: options?.actions?.map((action) => ({
        type: action.type,
        field: action.field,
        value: action.value,
        label: action.label,
        applied: action.applied,
      })),
    });

    const savedMessage = await this.chatMessageRepo.save(message);

    // Update session updatedAt timestamp
    session.updatedAt = new Date();
    await this.chatSessionRepo.save(session);

    return savedMessage;
  }

  /**
   * Get messages for a chat session with pagination
   */
  async getMessages(
    sessionId: string,
    userId: string,
    organizationId: string,
    pagination: { page?: number; pageSize?: number } = {},
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    // Verify session belongs to user
    await this.findSession(sessionId, userId, organizationId);

    const { page = 1, pageSize = 50 } = pagination;

    const [messages, total] = await this.chatMessageRepo.findAndCount({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { messages, total };
  }

  /**
   * Get recent messages for a session (last N messages)
   * Used for loading conversation history into graph context
   */
  async getRecentMessages(
    sessionId: string,
    limit: number = 20,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepo.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find a message by ID
   * Phase 7 Slice 6
   */
  async findMessage(messageId: string): Promise<ChatMessage> {
    const message = await this.chatMessageRepo.findOne({
      where: { id: messageId },
      relations: ['session'],
    });

    if (!message) {
      throw new NotFoundException(`Chat message ${messageId} not found`);
    }

    return message;
  }

  /**
   * Apply an action from a chat message
   * Phase 7 Slice 6
   */
  async applyAction(
    messageId: string,
    actionIndex: number,
    userId: string,
  ): Promise<{
    success: boolean;
    field?: string;
    newValue?: unknown;
    error?: string;
  }> {
    // Find message and verify it belongs to user
    const message = await this.findMessage(messageId);
    const session = await this.findSession(message.sessionId, userId, message.session.organizationId);

    // Verify action exists
    if (!message.actions || actionIndex >= message.actions.length) {
      throw new BadRequestException(`Action at index ${actionIndex} not found`);
    }

    const action = message.actions[actionIndex];

    // Verify action hasn't been applied
    if (action.applied) {
      throw new BadRequestException('Action has already been applied');
    }

    // Verify action type
    if (action.type !== 'update_field') {
      throw new BadRequestException(`Action type ${action.type} is not supported`);
    }

    if (!action.field || action.value === undefined) {
      throw new BadRequestException('Action missing required field or value');
    }

    // Verify session is item-scoped before applying field updates
    if (!session.itemId) {
      throw new BadRequestException('Cannot update item field: session is not item-scoped');
    }

    try {
      // Apply the action using updateItemField tool
      const result = await updateItemField(
        {
          itemId: session.itemId,
          orgId: session.organizationId,
          field: action.field,
          value: action.value,
          userId,
        },
        this.itemsService,
      );

      // Mark action as applied
      action.applied = true;
      await this.chatMessageRepo.save(message);

      return {
        success: true,
        field: result.field,
        newValue: result.newValue,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create a general-purpose chat session
   * Supports item-scoped, general, dashboard, review_queue, and custom conversations
   */
  async createGeneralSession(params: {
    userId: string;
    organizationId: string;
    conversationType: 'item_scoped' | 'general' | 'dashboard' | 'review_queue' | 'custom';
    itemId?: string;
    title?: string;
    contextSnapshot?: Record<string, unknown>;
  }): Promise<ChatSession> {
    // Validate: item_scoped requires itemId
    if (params.conversationType === 'item_scoped' && !params.itemId) {
      throw new BadRequestException('item_scoped conversation requires itemId');
    }

    // Validate item exists if provided
    let item: Item | null = null;
    if (params.itemId) {
      item = await this.itemRepo.findOne({
        where: { id: params.itemId, organizationId: params.organizationId },
      });
      if (!item) {
        throw new NotFoundException(`Item ${params.itemId} not found`);
      }
    }

    // Generate title if not provided
    const title = params.title || this.generateSessionTitle(params.conversationType, item);

    const session = this.chatSessionRepo.create({
      userId: params.userId,
      organizationId: params.organizationId,
      conversationType: params.conversationType,
      itemId: params.itemId || null,
      title,
      contextSnapshot: params.contextSnapshot || null,
      lastActivityAt: new Date(),
    });

    return this.chatSessionRepo.save(session);
  }

  /**
   * Get user's chat sessions with optional filtering
   */
  async getUserSessions(
    userId: string,
    organizationId: string,
    options?: {
      conversationType?: string;
      limit?: number;
      includeArchived?: boolean;
    },
  ): Promise<ChatSession[]> {
    const qb = this.chatSessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.item', 'item')
      .where('session.userId = :userId', { userId })
      .andWhere('session.organizationId = :organizationId', { organizationId });

    if (options?.conversationType) {
      qb.andWhere('session.conversationType = :type', {
        type: options.conversationType,
      });
    }

    qb.orderBy('session.lastActivityAt', 'DESC');
    qb.limit(options?.limit || 50);

    return qb.getMany();
  }

  /**
   * Get a session by ID with authorization check
   * Supports sessions with or without itemId (general conversations)
   */
  async getSession(
    sessionId: string,
    userId: string,
    organizationId: string,
  ): Promise<ChatSession> {
    const session = await this.chatSessionRepo.findOne({
      where: { id: sessionId, userId, organizationId },
      relations: ['item'],
    });

    if (!session) {
      throw new NotFoundException(`Chat session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Update session's last activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.chatSessionRepo.update(
      { id: sessionId },
      { lastActivityAt: new Date() },
    );
  }

  /**
   * Update session metadata (title, context, etc.)
   */
  async updateSession(
    sessionId: string,
    userId: string,
    organizationId: string,
    updates: {
      title?: string;
      contextSnapshot?: Record<string, unknown>;
    },
  ): Promise<ChatSession> {
    // Verify session belongs to user
    const session = await this.getSession(sessionId, userId, organizationId);

    // Apply updates
    if (updates.title !== undefined) {
      session.title = updates.title;
    }
    if (updates.contextSnapshot !== undefined) {
      session.contextSnapshot = updates.contextSnapshot;
    }

    return this.chatSessionRepo.save(session);
  }

  /**
   * Delete a chat session (soft delete by marking inactive)
   */
  async deleteSession(
    sessionId: string,
    userId: string,
    organizationId: string,
  ): Promise<void> {
    // Verify session belongs to user
    await this.getSession(sessionId, userId, organizationId);

    // Hard delete (cascade will delete messages)
    await this.chatSessionRepo.delete({ id: sessionId });
  }

  /**
   * Generate a session title based on conversation type
   */
  private generateSessionTitle(
    conversationType: string,
    item?: Item | null,
  ): string {
    switch (conversationType) {
      case 'item_scoped':
        return item ? `Item: ${item.title}` : 'Item Conversation';
      case 'dashboard':
        return 'Dashboard Questions';
      case 'review_queue':
        return 'Review Queue';
      case 'general':
      default:
        return 'General Conversation';
    }
  }
}
