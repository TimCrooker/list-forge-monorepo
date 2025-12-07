import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateChatSessionRequest,
  CreateChatSessionResponse,
  GetChatMessagesResponse,
} from '@listforge/api-types';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * Chat Controller - Phase 7 Slice 5
 *
 * Handles chat session and message operations for item Q&A.
 */
@Controller('items/:itemId/chat')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Create or get existing chat session for an item
   *
   * POST /items/:itemId/chat/sessions
   */
  @Post('sessions')
  async createSession(
    @ReqCtx() ctx: RequestContext,
    @Param('itemId') itemId: string,
    @Body() body: CreateChatSessionRequest,
  ): Promise<CreateChatSessionResponse> {
    const session = await this.chatService.getOrCreateSession(
      itemId,
      ctx.userId,
      ctx.currentOrgId,
    );

    return {
      session: {
        id: session.id,
        itemId: session.itemId,
        createdAt: session.createdAt.toISOString(),
        lastMessageAt: session.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Get messages for a chat session
   *
   * GET /items/:itemId/chat/sessions/:sessionId/messages
   */
  @Get('sessions/:sessionId/messages')
  async getMessages(
    @ReqCtx() ctx: RequestContext,
    @Param('itemId') itemId: string,
    @Param('sessionId') sessionId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<GetChatMessagesResponse> {
    const pagination = {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };

    const { messages, total } = await this.chatService.getMessages(
      sessionId,
      ctx.userId,
      ctx.currentOrgId,
      pagination,
    );

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        sessionId: msg.sessionId,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
      total,
    };
  }
}
