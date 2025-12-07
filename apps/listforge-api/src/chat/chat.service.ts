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
}
