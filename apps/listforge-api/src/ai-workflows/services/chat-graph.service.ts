import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { buildChatGraph } from '../graphs/chat/chat-graph.builder';
import {
  ChatGraphState,
  ItemSnapshot,
  UserContext,
  ChatContext,
  createInitialChatState,
} from '../graphs/chat/chat-graph.state';
import { buildSystemPrompt } from '../graphs/chat/prompts/system-prompt';
import { Item } from '../../items/entities/item.entity';
import { ResearchService } from '../../research/research.service';
import { ChatService } from '../../chat/chat.service';
import { LLMConfigService } from '../config/llm.config';
import { ChatContextService } from './chat-context.service';
import { ActionEmitterService } from './action-emitter.service';
import { ItemResearchData, ChatAction } from '@listforge/core-types';
import { ChatActionDto } from '@listforge/api-types';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import {
  getChatTools,
  getToolsForContext,
  runWithToolContext,
  getToolContext,
  ChatToolDependencies,
  toolDisplayInfo,
  CompSearchParams,
  ResearchJobParams,
  EvidenceSearchQuery,
} from '../tools';
import { startResearchJob } from '../tools/chat.tools';

/**
 * Chat Graph Service - MAX Pattern Implementation
 *
 * Executes the ChatGraph workflow for AI-powered chat Q&A.
 * Implements the agent/tools loop pattern from MAX architecture:
 * - Single agent with tools bound
 * - Tool loop until done
 * - Rich context injection
 * - Streaming responses
 */
@Injectable()
export class ChatGraphService {
  private readonly logger = new Logger(ChatGraphService.name);

  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    private readonly researchService: ResearchService,
    private readonly chatService: ChatService,
    private readonly llmConfigService: LLMConfigService,
    private readonly chatContextService: ChatContextService,
    private readonly actionEmitterService: ActionEmitterService,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private readonly aiWorkflowQueue: Queue,
  ) {}

  /**
   * Stream a chat response for a user message
   * Uses the MAX-style agent/tools loop pattern
   */
  async streamResponse(params: {
    sessionId: string;
    itemId?: string;
    userId: string;
    organizationId: string;
    userMessage: string;
    userContext?: UserContext;
    chatContext?: ChatContext;
    onToken: (token: string) => void;
    onToolStart?: (toolName: string) => void;
    onToolEnd?: (toolName: string) => void;
    onComplete: (response: string, actions?: ChatActionDto[]) => void;
    onError: (error: string) => void;
  }): Promise<void> {
    const {
      sessionId,
      itemId,
      userId,
      organizationId,
      userMessage,
      userContext,
      chatContext,
      onToken,
      onToolStart,
      onToolEnd,
      onComplete,
      onError,
    } = params;

    this.logger.log(`[chat:service] Starting chat graph execution for session ${sessionId}`);

    // Execute within AsyncLocalStorage context for request isolation
    return runWithToolContext(
      {
        userId,
        organizationId,
        sessionId,
        itemId,
      },
      async () => {
        try {
          // Initialize LLM
          const llm = this.llmConfigService.getLLM('chat');

      // Load item and research if itemId provided
      let item: ItemSnapshot | null = null;
      let research: ItemResearchData | null = null;
      let researchStale = false;

      if (itemId) {
        const itemEntity = await this.itemRepo.findOne({
          where: { id: itemId, organizationId },
        });

        if (itemEntity) {
          item = this.chatContextService.buildItemSnapshot(itemEntity);
          const researchRun = await this.researchService.findLatestResearch(itemId, organizationId);
          research = researchRun?.data || null;
          researchStale = this.chatContextService.isResearchStale(research);
        }
      }

      // Build user context if not provided
      const resolvedUserContext = userContext || {
        userId,
        name: 'User',
        email: '',
        role: 'member',
        userType: 'member' as const,
        organizationId,
        organizationName: 'Organization',
      };

      // Build chat context if not provided
      const resolvedChatContext = chatContext || (itemId ? {
        pageType: 'item_detail' as const,
        currentRoute: `/items/${itemId}`,
        currentItemId: itemId,
        researchStatus: this.chatContextService.determineResearchStatus(research, false),
      } : {
        pageType: 'other' as const,
        currentRoute: '/',
      });

      // Build tool dependencies
      const toolDeps = this.buildToolDependencies(organizationId, userId);

      // Select tools based on page context (context-aware tool selection)
      const tools = getToolsForContext(toolDeps, {
        pageType: resolvedChatContext.pageType,
        hasItemId: !!itemId,
        organizationId,
      });

      this.logger.log(
        `[chat:service] Selected ${tools.length} tools for ` +
        `page=${resolvedChatContext.pageType} itemId=${itemId ? 'present' : 'none'}`
      );

      // Load conversation history for context retention
      const conversationHistory = await this.loadConversationHistory(sessionId);

      // Build initial state with conversation history + current message
      const initialState: Partial<ChatGraphState> = {
        ...createInitialChatState({
          sessionId,
          userContext: resolvedUserContext,
          chatContext: resolvedChatContext,
          itemId,
        }),
        item,
        research,
        researchStale,
        messages: [...conversationHistory, new HumanMessage(userMessage)],
      };

      // Build graph
      const graph = buildChatGraph();

      // Configure tools for agent node
      const agentTools = {
        llm,
        tools,
        buildSystemPrompt: (state: ChatGraphState) => buildSystemPrompt(state),
        onToken,
      };

      // Configure tools for tools node
      const toolsNodeConfig = {
        tools,
        onToolStart: (toolName: string) => {
          const info = toolDisplayInfo[toolName];
          this.actionEmitterService.emitToolProgress(
            sessionId,
            toolName,
            'starting',
            { displayName: info?.displayName, message: info?.progressMessages?.starting },
          );
          onToolStart?.(toolName);
        },
        onToolEnd: (toolName: string) => {
          const info = toolDisplayInfo[toolName];
          this.actionEmitterService.emitToolProgress(
            sessionId,
            toolName,
            'completed',
            { displayName: info?.displayName, message: info?.progressMessages?.completed },
          );
          onToolEnd?.(toolName);
        },
        onToolError: (toolName: string, error: Error) => {
          this.actionEmitterService.emitToolProgress(
            sessionId,
            toolName,
            'error',
            { message: error.message },
          );
        },
      };

      // Execute graph with streaming
      const stream = await graph.stream(initialState, {
        configurable: {
          tools: agentTools,      // For agent node
          toolsNode: toolsNodeConfig,  // For tools node
        },
      });

      // Process streaming events
      let finalResponse = '';
      let finalActions: ChatActionDto[] | undefined;
      let iterationCount = 0;
      let maxIterationsReached = false;

      for await (const event of stream) {
        for (const [nodeName, nodeState] of Object.entries(event)) {
          if (nodeName === '__end__' || nodeName === '__start__') continue;

          iterationCount++;
          this.logger.debug(`[chat:service] Node executed: ${nodeName}, iteration: ${iterationCount}`);

          const state = nodeState as unknown as Partial<ChatGraphState>;

          if (state.response) {
            finalResponse = state.response;
          }
          if (state.proposedActions && state.proposedActions.length > 0) {
            finalActions = state.proposedActions;
          }

          // Check if max iterations reached
          if (state.iterationCount && state.iterationCount >= 10) {
            maxIterationsReached = true;
          }
        }
      }

      // If max iterations reached and no response, provide fallback
      if (maxIterationsReached && !finalResponse) {
        finalResponse = "I apologize, but I'm having trouble completing this request. The system reached its iteration limit while trying to process your request. Please try rephrasing your question or contact support if this persists.";
        this.logger.warn(`[chat:service] Max iterations reached with no response, using fallback`);
      }

      // Flush any pending actions
      const pendingActions = this.actionEmitterService.flushPendingActions(sessionId);
      if (pendingActions.length > 0 && !finalActions) {
        finalActions = pendingActions.map(a => {
          const action: ChatActionDto = {
            type: a.type as ChatActionDto['type'],
            label: a.label,
            applied: false,
            description: a.description,
            priority: a.priority,
            autoExecute: a.autoExecute,
          };

          // Extract field/value for update_field actions
          if (a.type === 'update_field') {
            const updatePayload = a.payload as { field?: string; value?: unknown };
            action.field = updatePayload.field;
            action.value = updatePayload.value;
          }

          // Pass through payload for complex actions
          action.payload = a.payload as Record<string, unknown>;

          return action;
        });
      }

          this.logger.log(`[chat:service] Graph execution complete: ${iterationCount} iterations, ${finalResponse.length} chars`);

          onComplete(finalResponse, finalActions);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Chat graph failed for session ${sessionId}: ${errorMessage}`, error);
          this.actionEmitterService.clearPendingActions(sessionId);
          onError(errorMessage);
        }
      },
    );
  }

  /**
   * Verify user has access to the organization
   * Basic authorization check - production should use full RBAC
   */
  private async verifyOrganizationAccess(userId: string, organizationId: string): Promise<void> {
    // TODO: Replace with full RBAC check via OrganizationsService
    // For now, this is a placeholder that ensures we're thinking about authorization
    // In production, this should:
    // 1. Query organization membership
    // 2. Verify user's role has required permissions
    // 3. Check resource-level permissions (e.g., item access)

    if (!userId || !organizationId) {
      throw new Error('Authorization failed: userId and organizationId required');
    }

    // Basic existence check - verify item belongs to the org
    // This prevents cross-org data leakage at the tool level
  }

  /**
   * Load conversation history from database and convert to LangChain messages
   * Limits to last 20 messages to prevent context overflow
   */
  private async loadConversationHistory(sessionId: string): Promise<BaseMessage[]> {
    try {
      // Get recent messages (last 20, excluding the current one we're about to add)
      const recentMessages = await this.chatService.getRecentMessages(sessionId, 20);

      // Convert to LangChain messages (reverse to get chronological order)
      const messages: BaseMessage[] = [];
      for (const msg of recentMessages.reverse()) {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
          messages.push(new AIMessage(msg.content));
        }
        // Skip system messages - system prompt is injected by agent node
      }

      this.logger.debug(`[chat:service] Loaded ${messages.length} messages from conversation history`);
      return messages;
    } catch (error) {
      // If history loading fails, log error but continue with empty history
      // This prevents the entire chat from failing due to history issues
      this.logger.warn(`[chat:service] Failed to load conversation history: ${error}`);
      return [];
    }
  }

  /**
   * Build tool dependencies for chat tools
   */
  private buildToolDependencies(orgId: string, userId: string): ChatToolDependencies {
    return {
      // Item operations
      getItem: async (organizationId: string, itemId: string) => {
        await this.verifyOrganizationAccess(userId, organizationId);
        const item = await this.itemRepo.findOne({
          where: { id: itemId, organizationId },
        });
        // Verify item belongs to org (prevent cross-org access)
        if (item && item.organizationId !== organizationId) {
          throw new Error('Authorization failed: item does not belong to organization');
        }
        return item;
      },

      updateItem: async (organizationId: string, itemId: string, updates: Record<string, unknown>) => {
        await this.verifyOrganizationAccess(userId, organizationId);
        // Verify item exists and belongs to org before updating
        const item = await this.itemRepo.findOne({
          where: { id: itemId, organizationId },
        });
        if (!item) {
          throw new NotFoundException(`Item ${itemId} not found`);
        }
        if (item.organizationId !== organizationId) {
          throw new Error('Authorization failed: item does not belong to organization');
        }
        await this.itemRepo.update(
          { id: itemId, organizationId },
          updates,
        );
        return this.itemRepo.findOne({
          where: { id: itemId, organizationId },
        });
      },

      searchItems: async (organizationId: string, query: {
        query?: string;
        lifecycleStatus?: string;
        aiReviewState?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        limit?: number;
      }) => {
        await this.verifyOrganizationAccess(userId, organizationId);
        // Basic search implementation
        const qb = this.itemRepo.createQueryBuilder('item')
          .where('item.organizationId = :orgId', { orgId: organizationId });

        if (query.query) {
          qb.andWhere('(item.title ILIKE :q OR item.description ILIKE :q)', {
            q: `%${query.query}%`
          });
        }
        if (query.lifecycleStatus) {
          qb.andWhere('item.lifecycleStatus = :status', { status: query.lifecycleStatus });
        }
        if (query.aiReviewState) {
          qb.andWhere('item.aiReviewState = :state', { state: query.aiReviewState });
        }

        qb.orderBy(`item.${query.sortBy || 'updatedAt'}`, query.sortOrder === 'asc' ? 'ASC' : 'DESC');
        qb.take(query.limit || 10);

        const [items] = await qb.getManyAndCount();
        return items;
      },

      // Research operations
      getLatestResearch: async (itemId: string, organizationId: string) => {
        await this.verifyOrganizationAccess(userId, organizationId);
        // Verify item belongs to org before fetching research
        const item = await this.itemRepo.findOne({
          where: { id: itemId, organizationId },
        });
        if (!item) {
          throw new NotFoundException(`Item ${itemId} not found`);
        }
        if (item.organizationId !== organizationId) {
          throw new Error('Authorization failed: item does not belong to organization');
        }
        return this.researchService.findLatestResearch(itemId, organizationId);
      },

      searchComps: async (params: CompSearchParams) => {
        // Placeholder - would integrate with marketplace adapters
        return [];
      },

      startResearchJob: async (params: ResearchJobParams) => {
        // ResearchJobParams only has itemId, but startResearchJob needs orgId and userId
        // Use getToolContext to get these
        const ctx = getToolContext();
        return startResearchJob(
          { itemId: params.itemId, orgId: ctx.organizationId, userId: ctx.userId },
          this.researchService,
          this.aiWorkflowQueue,
        );
      },

      // Evidence operations
      searchEvidence: async (organizationId: string, query: EvidenceSearchQuery) => {
        // Placeholder - would integrate with evidence service
        return [];
      },

      // Aggregate operations
      getDashboardStats: async (organizationId: string) => {
        await this.verifyOrganizationAccess(userId, organizationId);
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
          byAIReview: {}, // Would need separate query
          pendingReview: byStatus['pending'] || 0,
          readyToList: byStatus['ready'] || 0,
          listed: byStatus['listed'] || 0,
        };
      },

      getReviewQueueStats: async (organizationId: string) => {
        await this.verifyOrganizationAccess(userId, organizationId);
        const pending = await this.itemRepo.count({
          where: {
            organizationId,
            aiReviewState: 'pending',
          },
        });

        return {
          totalPending: pending,
          needsWork: 0, // Would need separate query
          byStatus: {
            pending,
          },
        };
      },

      // Action emission
      emitAction: (sessionId: string, action: unknown) => {
        this.actionEmitterService.emitAction(sessionId, action as ChatAction);
      },
    };
  }
}
