import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ChatOpenAI } from '@langchain/openai';
import { buildChatGraph } from '../graphs/chat/chat-graph.builder';
import { ChatGraphState, ItemSnapshot } from '../graphs/chat/chat-graph.state';
import { Item } from '../../items/entities/item.entity';
import { ResearchService } from '../../research/research.service';
import { LLMConfigService } from '../config/llm.config';
import { ItemResearchData } from '@listforge/core-types';
import { ChatActionDto } from '@listforge/api-types';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import { startResearchJob, isResearchStale } from '../tools/chat.tools';

/**
 * Chat Graph Service
 * Phase 7 Slice 5 + Slice 7
 *
 * Executes the ChatGraph workflow for AI-powered chat Q&A.
 * Supports streaming responses for real-time user experience.
 * Phase 7 Slice 7: Added research integration.
 */
@Injectable()
export class ChatGraphService {
  private readonly logger = new Logger(ChatGraphService.name);

  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    private readonly researchService: ResearchService,
    private readonly llmConfigService: LLMConfigService,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private readonly aiWorkflowQueue: Queue,
  ) {}

  /**
   * Stream a chat response for a user message
   * Phase 7 Slice 6: Added support for actions
   */
  async streamResponse(params: {
    sessionId: string;
    itemId: string;
    userId: string;
    organizationId: string;
    userMessage: string;
    onToken: (token: string) => void;
    onComplete: (response: string, actions?: ChatActionDto[]) => void;
    onError: (error: string) => void;
  }): Promise<void> {
    const { sessionId, itemId, userId, organizationId, userMessage, onToken, onComplete, onError } = params;

    try {
      // Initialize LLM (no need for special streaming wrapper)
      const llm = this.llmConfigService.getLLM('chat');

      // Create tools with streaming callback
      const tools = {
        ...this.createTools(organizationId, userId, llm),
        onToken,
      };

      // Build graph (no checkpointer for speed)
      const graph = buildChatGraph();

      // Check if research is stale
      const stale = await isResearchStale(
        { itemId, orgId: organizationId },
        this.researchService,
      );

      // Initial state
      const initialState: Partial<ChatGraphState> = {
        sessionId,
        itemId,
        userId,
        organizationId,
        userMessage,
        response: '',
        researchStale: stale,
      };

      // Execute graph with streaming
      // Tokens will be emitted via onToken callback during graph execution
      const stream = await graph.stream(initialState, {
        configurable: {
          tools,
          llm,
        },
      });

      // Process streaming events and collect final response and actions
      let finalResponse = '';
      let finalActions: ChatActionDto[] | undefined;
      for await (const event of stream) {
        // Each event contains state updates
        for (const [nodeName, nodeState] of Object.entries(event)) {
          if (nodeName === '__end__' || nodeName === '__start__') {
            continue;
          }

          const state = nodeState as unknown as ChatGraphState;
          if (state.response) {
            // Update final response (this will be the complete response after streaming)
            finalResponse = state.response;
          }
          if (state.proposedActions && state.proposedActions.length > 0) {
            // Capture proposed actions
            finalActions = state.proposedActions;
          }
        }
      }

      // Call onComplete with final response and actions
      // Note: onToken has already been called for each token during streaming
      onComplete(finalResponse, finalActions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chat graph failed for session ${sessionId}: ${errorMessage}`, error);
      onError(errorMessage);
    }
  }

  /**
   * Create tools for the chat graph
   * Phase 7 Slice 7: Added research tools
   */
  private createTools(orgId: string, userId: string, llm: any) {
    return {
      getItemSnapshot: async ({ itemId }: { itemId: string }): Promise<ItemSnapshot> => {
        const item = await this.itemRepo.findOne({
          where: { id: itemId, organizationId: orgId },
        });

        if (!item) {
          throw new NotFoundException(`Item ${itemId} not found`);
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          condition: item.condition,
          attributes: item.attributes.map((attr) => ({
            key: attr.key,
            value: attr.value,
          })),
          media: item.media.map((m) => ({
            id: m.id,
            url: m.url,
            type: 'image',
          })),
          defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
          lifecycleStatus: item.lifecycleStatus,
          aiReviewState: item.aiReviewState,
        };
      },

      getLatestResearch: async ({ itemId }: { itemId: string }): Promise<ItemResearchData | null> => {
        const research = await this.researchService.findLatestResearch(itemId, orgId);
        return research?.data || null;
      },

      startResearchJob: async ({ itemId }: { itemId: string }): Promise<{ jobId: string; status: string }> => {
        return startResearchJob(
          { itemId, orgId, userId },
          this.researchService,
          this.aiWorkflowQueue,
        );
      },

      isResearchStale: async ({ itemId }: { itemId: string }): Promise<boolean> => {
        return isResearchStale({ itemId, orgId }, this.researchService);
      },
    };
  }
}
