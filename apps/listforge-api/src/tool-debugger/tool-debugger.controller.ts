import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { ToolDebuggerService } from './tool-debugger.service';
import {
  SearchDebuggerItemsQueryDto,
  ExecuteToolBodyDto,
} from './dto/tool-debugger.dto';
import {
  ListToolsResponseDto,
  ExecuteToolResponseDto,
  SearchDebuggerItemsResponseDto,
} from '@listforge/api-types';

@Controller('admin/tool-debugger')
@UseGuards(JwtAuthGuard, OrgGuard, AdminGuard)
export class ToolDebuggerController {
  private readonly logger = new Logger(ToolDebuggerController.name);

  constructor(private readonly toolDebuggerService: ToolDebuggerService) {}

  /**
   * List all available tools with their JSON schemas
   */
  @Get('tools')
  listTools(): ListToolsResponseDto {
    return {
      tools: this.toolDebuggerService.listTools(),
    };
  }

  /**
   * Search items for the item selector
   * Rate limited to 30 requests per minute per user
   */
  @Get('items')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async searchItems(
    @ReqCtx() ctx: RequestContext,
    @Query() query: SearchDebuggerItemsQueryDto,
  ): Promise<SearchDebuggerItemsResponseDto> {
    const items = await this.toolDebuggerService.searchItems(
      ctx,
      query.query,
      query.limit ?? 20,
    );
    return {
      items,
      total: items.length,
    };
  }

  /**
   * Execute a tool with the given inputs
   * Rate limited to 10 requests per minute per user
   */
  @Post('execute')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async executeTool(
    @ReqCtx() ctx: RequestContext,
    @Body() body: ExecuteToolBodyDto,
    @Req() req: Request,
  ): Promise<ExecuteToolResponseDto> {
    this.logger.log(`Executing tool: ${body.toolName} by user ${ctx.userId}`);

    // Extract request metadata for audit logging
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;

    return this.toolDebuggerService.executeTool(
      ctx,
      body.toolName,
      body.itemId,
      body.inputs,
      { ipAddress, userAgent },
    );
  }
}
