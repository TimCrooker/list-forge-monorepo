import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * DTOs for general chat operations
 */
interface CreateChatSessionDto {
  conversationType?: 'item_scoped' | 'general' | 'dashboard' | 'review_queue' | 'custom';
  itemId?: string;
  title?: string;
  contextSnapshot?: Record<string, unknown>;
}

interface UpdateChatSessionDto {
  title?: string;
  contextSnapshot?: Record<string, unknown>;
}

interface ChatSessionDto {
  id: string;
  conversationType: string;
  title: string | null;
  itemId: string | null;
  item?: {
    id: string;
    title: string;
  };
  userId: string;
  organizationId: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationQueryDto {
  page?: string;
  pageSize?: string;
}

/**
 * General Chat Controller
 *
 * Handles general-purpose chat sessions that aren't tied to specific items.
 * Supports:
 * - General conversations
 * - Dashboard-focused queries
 * - Review queue discussions
 * - Item-scoped conversations (alternative endpoint)
 */
@Controller('chat')
@UseGuards(JwtAuthGuard, OrgGuard)
export class GeneralChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Create a new chat session
   *
   * POST /chat/sessions
   */
  @Post('sessions')
  async createSession(
    @ReqCtx() ctx: RequestContext,
    @Body() body: CreateChatSessionDto,
  ): Promise<{ session: ChatSessionDto }> {
    const session = await this.chatService.createGeneralSession({
      userId: ctx.userId,
      organizationId: ctx.currentOrgId,
      conversationType: body.conversationType || 'general',
      itemId: body.itemId,
      title: body.title,
      contextSnapshot: body.contextSnapshot,
    });

    return { session: this.mapToDto(session) };
  }

  /**
   * List user's chat sessions
   *
   * GET /chat/sessions
   */
  @Get('sessions')
  async listSessions(
    @ReqCtx() ctx: RequestContext,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ): Promise<{ sessions: ChatSessionDto[] }> {
    const sessions = await this.chatService.getUserSessions(
      ctx.userId,
      ctx.currentOrgId,
      {
        conversationType: type,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
    );

    return { sessions: sessions.map(s => this.mapToDto(s)) };
  }

  /**
   * Get a specific chat session
   *
   * GET /chat/sessions/:sessionId
   */
  @Get('sessions/:sessionId')
  async getSession(
    @ReqCtx() ctx: RequestContext,
    @Param('sessionId') sessionId: string,
  ): Promise<ChatSessionDto> {
    const session = await this.chatService.getSession(
      sessionId,
      ctx.userId,
      ctx.currentOrgId,
    );

    return this.mapToDto(session);
  }

  /**
   * Get messages for a chat session
   *
   * GET /chat/sessions/:sessionId/messages
   */
  @Get('sessions/:sessionId/messages')
  async getMessages(
    @ReqCtx() ctx: RequestContext,
    @Param('sessionId') sessionId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<{
    messages: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: string;
      actions?: Array<{
        type: string;
        field?: string;
        value?: unknown;
        label?: string;
        applied: boolean;
      }>;
    }>;
    total: number;
  }> {
    const { messages, total } = await this.chatService.getMessages(
      sessionId,
      ctx.userId,
      ctx.currentOrgId,
      {
        page: pagination.page ? parseInt(pagination.page, 10) : undefined,
        pageSize: pagination.pageSize ? parseInt(pagination.pageSize, 10) : undefined,
      },
    );

    return {
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        actions: m.actions?.map(a => ({
          type: a.type,
          field: a.field,
          value: a.value,
          label: a.label,
          applied: a.applied,
        })),
      })),
      total,
    };
  }

  /**
   * Update a chat session
   *
   * PATCH /chat/sessions/:sessionId
   */
  @Patch('sessions/:sessionId')
  async updateSession(
    @ReqCtx() ctx: RequestContext,
    @Param('sessionId') sessionId: string,
    @Body() body: UpdateChatSessionDto,
  ): Promise<ChatSessionDto> {
    const session = await this.chatService.updateSession(
      sessionId,
      ctx.userId,
      ctx.currentOrgId,
      body,
    );

    return this.mapToDto(session);
  }

  /**
   * Delete a chat session
   *
   * DELETE /chat/sessions/:sessionId
   */
  @Delete('sessions/:sessionId')
  async deleteSession(
    @ReqCtx() ctx: RequestContext,
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    await this.chatService.deleteSession(
      sessionId,
      ctx.userId,
      ctx.currentOrgId,
    );

    return { success: true };
  }

  /**
   * Map ChatSession entity to DTO
   */
  private mapToDto(session: any): ChatSessionDto {
    return {
      id: session.id,
      conversationType: session.conversationType,
      title: session.title,
      itemId: session.itemId,
      item: session.item ? {
        id: session.item.id,
        title: session.item.title,
      } : undefined,
      userId: session.userId,
      organizationId: session.organizationId,
      lastActivityAt: session.lastActivityAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }
}
