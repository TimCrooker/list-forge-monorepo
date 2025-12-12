import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import { Item } from '../items/entities/item.entity';
import { ResearchService } from '../research/research.service';
import { ActionEmitterService } from '../ai-workflows/services/action-emitter.service';
import {
  getAllToolSchemas,
  validateToolInputs,
} from '../ai-workflows/tools/tool-schemas';
import { TOOL_REGISTRY } from '../ai-workflows/tools/tool-registry';
import {
  ChatToolDependencies,
  runWithToolContext,
  getToolContext,
} from '../ai-workflows/tools';
import { startResearchJob } from '../ai-workflows/tools/chat.tools';
import { ChatAction } from '../ai-workflows/tools/action.tools';
import { RequestContext } from '../common/interfaces/request-context.interface';
import {
  ToolInfoDto,
  ExecuteToolResponseDto,
  DebuggerItemDto,
} from '@listforge/api-types';
import {
  ToolDebuggerAuditLog,
  ToolDebuggerAuditEventType,
} from './entities/tool-debugger-audit-log.entity';

/**
 * Request metadata for audit logging
 */
interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Configuration constants
 */
const CONFIG = {
  DEFAULT_SEARCH_LIMIT: 20,
  MAX_SEARCH_LIMIT: 100,
  MAX_RESULT_SIZE: 100 * 1024, // 100KB
  MAX_INPUT_SIZE: 10 * 1024, // 10KB
  MAX_SANITIZE_DEPTH: 10,
} as const;

/**
 * Patterns for sensitive data detection
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /bearer/i,
  /credential/i,
  /private/i,
  /ssn/i,
  /credit[_-]?card/i,
  /cvv/i,
];

@Injectable()
export class ToolDebuggerService {
  private readonly logger = new Logger(ToolDebuggerService.name);

  constructor(
    @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
    @InjectRepository(ToolDebuggerAuditLog)
    private readonly auditLogRepo: Repository<ToolDebuggerAuditLog>,
    private readonly researchService: ResearchService,
    private readonly actionEmitterService: ActionEmitterService,
    @InjectQueue(QUEUE_AI_WORKFLOW) private readonly aiWorkflowQueue: Queue,
  ) {}

  /**
   * List all available tools with their JSON schemas
   */
  listTools(): ToolInfoDto[] {
    return getAllToolSchemas().map((schema) => ({
      name: schema.name,
      category: schema.category,
      description: schema.description,
      requiredContext: schema.requiredContext,
      jsonSchema: schema.jsonSchema as Record<string, unknown>,
    }));
  }

  /**
   * Search items for the debugger item selector
   */
  async searchItems(
    ctx: RequestContext,
    query?: string,
    limit: number = CONFIG.DEFAULT_SEARCH_LIMIT,
  ): Promise<DebuggerItemDto[]> {
    const safeLimit = Math.min(limit, CONFIG.MAX_SEARCH_LIMIT);

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .where('item.organizationId = :orgId', { orgId: ctx.currentOrgId })
      .orderBy('item.updatedAt', 'DESC')
      .take(safeLimit);

    if (query) {
      // Escape LIKE pattern special characters to prevent SQL injection
      const escapedQuery = this.escapeLikePattern(query);
      qb.andWhere('(item.title ILIKE :q OR item.id ILIKE :q)', {
        q: `%${escapedQuery}%`,
      });
    }

    const items = await qb.getMany();

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,
      defaultPrice: item.defaultPrice,
      primaryImageUrl: item.media?.[0]?.url || null,
      createdAt: item.createdAt,
    }));
  }

  /**
   * Execute a tool with the given inputs
   */
  async executeTool(
    ctx: RequestContext,
    toolName: string,
    itemId: string | undefined,
    inputs: Record<string, unknown>,
    metadata: RequestMetadata,
  ): Promise<ExecuteToolResponseDto> {
    const startTime = Date.now();

    // Validate input payload size
    const inputSize = JSON.stringify(inputs).length;
    if (inputSize > CONFIG.MAX_INPUT_SIZE) {
      return this.createErrorResponse(
        toolName,
        startTime,
        `Input payload too large (${inputSize} bytes, max ${CONFIG.MAX_INPUT_SIZE})`,
        metadata,
        ctx,
        itemId,
        inputs,
      );
    }

    // Find the tool in registry
    const toolMeta = TOOL_REGISTRY.find((t) => t.name === toolName);
    if (!toolMeta) {
      return this.createErrorResponse(
        toolName,
        startTime,
        `Tool not found: ${toolName}`,
        metadata,
        ctx,
        itemId,
        inputs,
        'unknown',
      );
    }

    // CRITICAL: Validate itemId belongs to organization BEFORE setting context
    if (itemId) {
      const item = await this.itemRepo.findOne({
        where: { id: itemId, organizationId: ctx.currentOrgId },
      });
      if (!item) {
        return this.createErrorResponse(
          toolName,
          startTime,
          'Item not found or access denied',
          metadata,
          ctx,
          itemId,
          inputs,
          toolMeta.category,
        );
      }
    }

    // Validate inputs against schema
    const validation = validateToolInputs(toolName, inputs);
    if (!validation.valid && validation.errors) {
      const response: ExecuteToolResponseDto = {
        success: false,
        toolName,
        executionTimeMs: Date.now() - startTime,
        result: '',
        error: 'Validation failed',
        validationErrors: validation.errors.issues.map((issue) => ({
          path: issue.path.map(String),
          message: issue.message,
        })),
      };
      await this.logExecution(ctx, toolName, toolMeta.category, itemId, inputs, response, metadata);
      return response;
    }

    // Build tool dependencies
    const deps = this.buildToolDependencies(ctx);

    // Create the tool instance
    const tool = toolMeta.factory(deps);

    // Set up tool context (itemId already validated above)
    const toolContext = {
      userId: ctx.userId,
      organizationId: ctx.currentOrgId,
      sessionId: undefined,
      itemId,
    };

    try {
      // Execute the tool within context
      const result = await runWithToolContext(toolContext, async () => {
        return await tool.invoke(inputs);
      });

      const executionTimeMs = Date.now() - startTime;

      // Truncate large results to prevent memory/DB issues
      let resultStr = typeof result === 'string' ? result : JSON.stringify(result);
      let truncated = false;
      if (resultStr.length > CONFIG.MAX_RESULT_SIZE) {
        resultStr = resultStr.substring(0, CONFIG.MAX_RESULT_SIZE);
        truncated = true;
      }

      // Try to parse the result as JSON
      let parsedResult: unknown;
      try {
        parsedResult = JSON.parse(resultStr);
        if (truncated) {
          parsedResult = { ...parsedResult as object, _truncated: true };
        }
      } catch {
        parsedResult = truncated ? { raw: resultStr, _truncated: true } : resultStr;
      }

      // Check if the result indicates an error
      const isError =
        typeof parsedResult === 'object' &&
        parsedResult !== null &&
        'error' in parsedResult &&
        (parsedResult as { error: boolean }).error === true;

      const response: ExecuteToolResponseDto = {
        success: !isError,
        toolName,
        executionTimeMs,
        result: resultStr,
        parsedResult,
        error: isError
          ? (parsedResult as { message?: string }).message
          : undefined,
      };

      await this.logExecution(ctx, toolName, toolMeta.category, itemId, inputs, response, metadata);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Tool execution failed', {
        toolName,
        itemId,
        error: error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : String(error),
      });

      const response: ExecuteToolResponseDto = {
        success: false,
        toolName,
        executionTimeMs: Date.now() - startTime,
        result: '',
        error: message,
      };

      await this.logExecution(ctx, toolName, toolMeta.category, itemId, inputs, response, metadata);
      return response;
    }
  }

  /**
   * Create error response and log it
   */
  private async createErrorResponse(
    toolName: string,
    startTime: number,
    error: string,
    metadata: RequestMetadata,
    ctx: RequestContext,
    itemId: string | undefined,
    inputs: Record<string, unknown>,
    category = 'unknown',
  ): Promise<ExecuteToolResponseDto> {
    const response: ExecuteToolResponseDto = {
      success: false,
      toolName,
      executionTimeMs: Date.now() - startTime,
      result: '',
      error,
    };
    await this.logExecution(ctx, toolName, category, itemId, inputs, response, metadata);
    return response;
  }

  /**
   * Escape LIKE pattern special characters to prevent SQL wildcard injection
   */
  private escapeLikePattern(input: string): string {
    return input.replace(/[%_\\]/g, '\\$&');
  }

  /**
   * Log tool execution to audit log
   */
  private async logExecution(
    ctx: RequestContext,
    toolName: string,
    toolCategory: string,
    itemId: string | undefined,
    inputs: Record<string, unknown>,
    response: ExecuteToolResponseDto,
    metadata: RequestMetadata,
  ): Promise<void> {
    try {
      let eventType: ToolDebuggerAuditEventType;
      if (response.validationErrors && response.validationErrors.length > 0) {
        eventType = 'tool:validation_error';
      } else if (response.success) {
        eventType = 'tool:executed';
      } else {
        eventType = 'tool:failed';
      }

      const auditLog = this.auditLogRepo.create({
        orgId: ctx.currentOrgId,
        userId: ctx.userId,
        toolName,
        toolCategory,
        eventType,
        itemId: itemId || null,
        inputs: this.sanitizeInputs(inputs) as Record<string, unknown>,
        success: response.success,
        executionTimeMs: response.executionTimeMs,
        errorMessage: response.error || null,
        validationErrors: response.validationErrors || null,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });

      await this.auditLogRepo.save(auditLog);
    } catch (error) {
      // Don't fail the execution if audit logging fails
      this.logger.error('Failed to write audit log', {
        error: error instanceof Error ? error.message : String(error),
        toolName,
        userId: ctx.userId,
      });
    }
  }

  /**
   * Deep sanitize inputs to prevent storing sensitive data
   * Recursively processes nested objects and arrays
   */
  private sanitizeInputs(inputs: unknown, depth = 0): unknown {
    // Prevent infinite recursion
    if (depth > CONFIG.MAX_SANITIZE_DEPTH) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    // Handle null/undefined
    if (inputs === null || inputs === undefined) {
      return inputs;
    }

    // Handle primitive types
    if (typeof inputs !== 'object') {
      // Redact long strings that might be secrets
      if (typeof inputs === 'string' && inputs.length > 50) {
        // Check if it looks like a secret (base64, hex, JWT-like)
        if (this.looksLikeSecret(inputs)) {
          return '[REDACTED_SECRET]';
        }
      }
      return inputs;
    }

    // Handle arrays
    if (Array.isArray(inputs)) {
      return inputs.map((item) => this.sanitizeInputs(item, depth + 1));
    }

    // Handle objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(inputs)) {
      // Check if key matches sensitive patterns
      const isSensitiveKey = SENSITIVE_PATTERNS.some((p) => p.test(key));
      if (isSensitiveKey) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeInputs(value, depth + 1);
      }
    }
    return sanitized;
  }

  /**
   * Check if a string looks like a secret (JWT, API key, etc.)
   */
  private looksLikeSecret(value: string): boolean {
    // JWT pattern
    if (/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(value)) {
      return true;
    }
    // API key patterns (sk-, pk-, etc.)
    if (/^(sk|pk|api|key|secret|token)[_-][a-zA-Z0-9]{20,}$/i.test(value)) {
      return true;
    }
    // Long hex strings (might be hashes or keys)
    if (/^[a-f0-9]{32,}$/i.test(value)) {
      return true;
    }
    // Long base64 strings
    if (/^[A-Za-z0-9+/]{40,}={0,2}$/.test(value)) {
      return true;
    }
    return false;
  }

  /**
   * Build tool dependencies - mirrors ChatGraphService pattern
   * Broken into smaller helper methods for maintainability
   */
  private buildToolDependencies(ctx: RequestContext): ChatToolDependencies {
    return {
      // Item operations
      getItem: this.createGetItemFn(),
      updateItem: this.createUpdateItemFn(),
      searchItems: this.createSearchItemsFn(),

      // Research operations
      getLatestResearch: this.createGetLatestResearchFn(),
      searchComps: this.createSearchCompsFn(),
      startResearchJob: this.createStartResearchJobFn(),

      // Evidence operations
      searchEvidence: this.createSearchEvidenceFn(),

      // Aggregate operations
      getDashboardStats: this.createGetDashboardStatsFn(),
      getReviewQueueStats: this.createGetReviewQueueStatsFn(),

      // Action emission
      emitAction: this.createEmitActionFn(),
    };
  }

  // ==========================================
  // Helper: Verify item ownership
  // ==========================================

  private async verifyItemOwnership(
    itemId: string,
    organizationId: string,
  ): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId },
    });
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }
    if (item.organizationId !== organizationId) {
      throw new ForbiddenException('Item does not belong to organization');
    }
    return item;
  }

  // ==========================================
  // Item Operations
  // ==========================================

  private createGetItemFn() {
    return async (organizationId: string, itemId: string) => {
      return this.verifyItemOwnership(itemId, organizationId);
    };
  }

  private createUpdateItemFn() {
    return async (
      organizationId: string,
      itemId: string,
      updates: Record<string, unknown>,
    ) => {
      await this.verifyItemOwnership(itemId, organizationId);
      await this.itemRepo.update({ id: itemId, organizationId }, updates);
      return this.itemRepo.findOne({
        where: { id: itemId, organizationId },
      });
    };
  }

  private createSearchItemsFn() {
    return async (
      organizationId: string,
      query: {
        query?: string;
        lifecycleStatus?: string;
        aiReviewState?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        limit?: number;
      },
    ) => {
      const qb = this.itemRepo
        .createQueryBuilder('item')
        .where('item.organizationId = :orgId', { orgId: organizationId });

      if (query.query) {
        // Escape LIKE pattern special characters
        const escapedQuery = this.escapeLikePattern(query.query);
        qb.andWhere('(item.title ILIKE :q OR item.description ILIKE :q)', {
          q: `%${escapedQuery}%`,
        });
      }
      if (query.lifecycleStatus) {
        qb.andWhere('item.lifecycleStatus = :status', {
          status: query.lifecycleStatus,
        });
      }
      if (query.aiReviewState) {
        qb.andWhere('item.aiReviewState = :state', {
          state: query.aiReviewState,
        });
      }

      // Validate sortBy to prevent SQL injection
      const allowedSortFields = ['updatedAt', 'createdAt', 'title', 'defaultPrice'];
      const sortField = allowedSortFields.includes(query.sortBy || '')
        ? query.sortBy
        : 'updatedAt';

      qb.orderBy(
        `item.${sortField}`,
        query.sortOrder === 'asc' ? 'ASC' : 'DESC',
      );
      qb.take(Math.min(query.limit || CONFIG.DEFAULT_SEARCH_LIMIT, CONFIG.MAX_SEARCH_LIMIT));

      const [items] = await qb.getManyAndCount();
      return items;
    };
  }

  // ==========================================
  // Research Operations
  // ==========================================

  private createGetLatestResearchFn() {
    return async (itemId: string, organizationId: string) => {
      await this.verifyItemOwnership(itemId, organizationId);
      return this.researchService.findLatestResearch(itemId, organizationId);
    };
  }

  private createSearchCompsFn() {
    return async (_params: unknown) => {
      // Placeholder - would integrate with marketplace adapters
      this.logger.warn('searchComps not implemented in tool debugger context');
      return [];
    };
  }

  private createStartResearchJobFn() {
    return async (params: { itemId: string }) => {
      const toolCtx = getToolContext();
      return startResearchJob(
        {
          itemId: params.itemId,
          orgId: toolCtx.organizationId,
          userId: toolCtx.userId,
        },
        this.researchService,
        this.aiWorkflowQueue,
      );
    };
  }

  // ==========================================
  // Evidence Operations
  // ==========================================

  private createSearchEvidenceFn() {
    return async (_organizationId: string, _query: unknown) => {
      // Placeholder - would integrate with evidence service
      this.logger.warn('searchEvidence not implemented in tool debugger context');
      return [];
    };
  }

  // ==========================================
  // Aggregate Operations
  // ==========================================

  private createGetDashboardStatsFn() {
    return async (organizationId: string) => {
      const stats = await this.itemRepo
        .createQueryBuilder('item')
        .select('COUNT(*)', 'total')
        .addSelect('SUM(item.defaultPrice)', 'totalValue')
        .addSelect('item.lifecycleStatus', 'status')
        .where('item.organizationId = :orgId', { orgId: organizationId })
        .groupBy('item.lifecycleStatus')
        .getRawMany();

      const byStatus: Record<string, number> = {};
      let totalItems = 0;
      let totalValue = 0;

      for (const row of stats) {
        byStatus[row.status] = parseInt(row.total, 10);
        totalItems += parseInt(row.total, 10);
        totalValue += parseFloat(row.totalValue) || 0;
      }

      return {
        totalItems,
        totalValue,
        currency: 'USD',
        byStatus,
        byAIReview: {},
        pendingReview: byStatus['pending'] || 0,
        readyToList: byStatus['ready'] || 0,
        listed: byStatus['listed'] || 0,
      };
    };
  }

  private createGetReviewQueueStatsFn() {
    return async (organizationId: string) => {
      const pending = await this.itemRepo.count({
        where: {
          organizationId,
          aiReviewState: 'pending' as const,
        },
      });

      return {
        totalPending: pending,
        needsWork: 0,
        byStatus: {
          pending,
        },
      };
    };
  }

  // ==========================================
  // Action Operations
  // ==========================================

  private createEmitActionFn() {
    return (sessionId: string, action: unknown) => {
      // Cast to ChatAction - the action is validated upstream by the tool
      this.actionEmitterService.emitAction(sessionId, action as ChatAction);
    };
  }
}
