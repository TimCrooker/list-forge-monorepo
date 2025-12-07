import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { buildResearchGraph } from '../graphs/research/research-graph.builder';
import { ResearchGraphState, ItemSnapshot } from '../graphs/research/research-graph.state';
import { Item } from '../../items/entities/item.entity';
import { ItemResearchRun } from '../../research/entities/item-research-run.entity';
import { ResearchService } from '../../research/research.service';
import { EvidenceService } from '../../evidence/evidence.service';
import { MarketplaceAccountService } from '../../marketplaces/services/marketplace-account.service';
import { EventsService } from '../../events/events.service';
import { PostgresCheckpointerService } from '../checkpointers/postgres.checkpointer';
import { LLMConfigService } from '../config/llm.config';
import { withRetry } from '../utils/error-handling';
import { ItemResearchData, ResearchEvidenceRecord } from '@listforge/core-types';
import { CompResult, MarketplaceAdapter } from '@listforge/marketplace-adapters';
import { StartResearchRunJob } from '@listforge/queue-types';
import { Inject, Optional, forwardRef } from '@nestjs/common';

/**
 * Research Graph Service
 * Phase 7 Slice 2 + Slice 4
 *
 * Executes the ResearchGraph workflow for AI-powered item research.
 * Supports checkpointing and resume functionality.
 */
@Injectable()
export class ResearchGraphService {
  private readonly logger = new Logger(ResearchGraphService.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(ItemResearchRun)
    private readonly researchRunRepo: Repository<ItemResearchRun>,
    private readonly researchService: ResearchService,
    private readonly evidenceService: EvidenceService,
    private readonly marketplaceAccountService: MarketplaceAccountService,
    private readonly eventsService: EventsService,
    private readonly checkpointerService: PostgresCheckpointerService,
    private readonly llmConfigService: LLMConfigService,
    // ChatGateway will be injected via module imports if available
    // Using a simpler approach: check for chatGateway via a getter method
    // This avoids circular dependency issues
    private chatGateway?: any,
  ) {}

  /**
   * Execute research graph for a research run
   * Phase 7 Slice 4: Now supports checkpointing and resume
   */
  async execute(job: StartResearchRunJob, isResume = false): Promise<void> {
    const { researchRunId, itemId, orgId } = job;

    // Get research run
    const researchRun = await this.researchRunRepo.findOne({
      where: { id: researchRunId },
    });

    if (!researchRun) {
      throw new NotFoundException(`Research run ${researchRunId} not found`);
    }

    // Check retry limit
    if (isResume && researchRun.stepCount >= this.MAX_RETRIES * 10) {
      throw new BadRequestException(
        `Research run ${researchRunId} has exceeded maximum retry attempts`,
      );
    }

    // Update status to running
    researchRun.status = 'running';
    if (!isResume) {
      researchRun.stepCount = 0;
      researchRun.stepHistory = [];
    }
    await this.researchRunRepo.save(researchRun);

    try {
      // Initialize LLM with fallback support
      const llm = this.llmConfigService.getLLM('research');

      // Create tools
      const tools = this.createTools(orgId, llm);

      // Get checkpointer
      const checkpointer = this.checkpointerService.getCheckpointer();

      // Build graph with checkpointer
      const graph = buildResearchGraph(checkpointer);

      // Initial state (or resume from checkpoint)
      const initialState: Partial<ResearchGraphState> = isResume
        ? {} // Will be loaded from checkpoint
        : {
            itemId,
            researchRunId,
            organizationId: orgId,
            iteration: 0,
            maxIterations: 3,
            confidenceThreshold: 0.7,
            done: false,
            error: null,
          };

      // Track node execution for event emission and step history
      let finalResult: ResearchGraphState | null = null;
      let previousNode: string | null = null;
      const nodeOrder = [
        'load_context',
        'analyze_media',
        'identify_product',
        'search_comps',
        'analyze_comps',
        'calculate_price',
        'assess_missing',
        'refine_search',
        'persist_results',
      ];

      // Execute graph with streaming and checkpointing
      // Use researchRunId as thread_id for checkpointing
      const stream = await graph.stream(initialState, {
        configurable: {
          thread_id: researchRunId,
          tools,
          llm,
        },
      });

      // Process streaming events
      for await (const event of stream) {
        // Each event is an object with node names as keys
        for (const [nodeName, nodeState] of Object.entries(event)) {
          // Skip special keys like '__end__' or '__start__'
          if (!nodeOrder.includes(nodeName)) {
            continue;
          }

          // When we see a new node in the stream, it means:
          // 1. The previous node (if any) has completed
          // 2. This node has started AND completed

          // Emit completion for previous node and update step history
          if (previousNode) {
            this.eventsService.emitResearchNodeCompleted(
              researchRunId,
              itemId,
              orgId,
              previousNode,
              'success',
            );
            this.logger.debug(`Research node completed: ${previousNode} for run ${researchRunId}`);

            // Update step history
            await this.updateStepHistory(researchRun, previousNode, 'success');
          }

          // Emit started event for current node
          this.eventsService.emitResearchNodeStarted(
            researchRunId,
            itemId,
            orgId,
            nodeName,
          );

          // Update database with current node and increment step count
          researchRun.currentNode = nodeName;
          researchRun.stepCount += 1;
          await this.updateStepHistory(researchRun, nodeName, 'running');
          await this.researchRunRepo.save(researchRun);

          this.logger.debug(`Research node started: ${nodeName} for run ${researchRunId}`);

          // Store state update
          finalResult = nodeState as unknown as ResearchGraphState;
          previousNode = nodeName;
        }
      }

      // Mark final node as completed
      if (previousNode) {
        this.eventsService.emitResearchNodeCompleted(
          researchRunId,
          itemId,
          orgId,
          previousNode,
          'success',
        );
        await this.updateStepHistory(researchRun, previousNode, 'success');
        this.logger.debug(`Research node completed: ${previousNode} for run ${researchRunId}`);
      }

      // Check for errors
      if (!finalResult) {
        throw new Error('Research graph did not produce a result');
      }

      if (finalResult.error) {
        throw new Error(finalResult.error);
      }

      if (!finalResult.done) {
        throw new Error('Research graph did not complete');
      }

      // Update research run status
      researchRun.status = 'success';
      researchRun.completedAt = new Date();
      researchRun.currentNode = null; // Clear current node on completion
      researchRun.checkpoint = null; // Clear checkpoint on completion

      // Generate summary with safe defaults
      const compsCount = finalResult.comps?.length ?? 0;
      const confidence = finalResult.overallConfidence ?? 0;
      researchRun.summary = `Research completed. Found ${compsCount} comps. Confidence: ${(confidence * 100).toFixed(0)}%`;
      await this.researchRunRepo.save(researchRun);

      // Emit job completed event
      this.eventsService.emitResearchJobCompleted(
        researchRunId,
        itemId,
        orgId,
        'success',
        researchRun.summary,
      );

      // Notify chat sessions via EventsService (Phase 7 Slice 7)
      // ChatGateway will listen for RESEARCH_JOB_COMPLETED events and notify sessions
      // This avoids circular dependency while still providing the functionality

      this.logger.log(`Research completed for item ${itemId}, run ${researchRunId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Research failed for item ${itemId}: ${errorMessage}`, error);

      // Emit node error if we were in the middle of a node
      if (researchRun.currentNode) {
        this.eventsService.emitResearchNodeCompleted(
          researchRunId,
          itemId,
          orgId,
          researchRun.currentNode,
          'error',
          errorMessage,
        );
        await this.updateStepHistory(researchRun, researchRun.currentNode, 'error', errorMessage);
      }

      // Update research run with error (but keep checkpoint for resume)
      researchRun.status = 'error';
      researchRun.errorMessage = errorMessage;
      researchRun.completedAt = null; // Don't set completedAt on error (allows resume)
      await this.researchRunRepo.save(researchRun);

      // Emit job completed event with error
      this.eventsService.emitResearchJobCompleted(
        researchRunId,
        itemId,
        orgId,
        'error',
        undefined,
        errorMessage,
      );

      // Notify chat sessions via EventsService (Phase 7 Slice 7)
      // ChatGateway will listen for RESEARCH_JOB_COMPLETED events and notify sessions
      // This avoids circular dependency while still providing the functionality

      throw error;
    }
  }

  /**
   * Resume a failed research run from the last checkpoint
   * Phase 7 Slice 4
   */
  async resume(job: StartResearchRunJob): Promise<void> {
    return this.execute(job, true);
  }

  /**
   * Update step history for a research run
   * Phase 7 Slice 4
   */
  private async updateStepHistory(
    researchRun: ItemResearchRun,
    node: string,
    status: 'running' | 'success' | 'error',
    error?: string,
  ): Promise<void> {
    const history = researchRun.stepHistory || [];
    const now = new Date().toISOString();

    // Find existing entry for this node
    const existingIndex = history.findIndex((entry) => entry.node === node && !entry.completedAt);

    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex].status = status;
      if (status === 'success' || status === 'error') {
        history[existingIndex].completedAt = now;
      }
      if (error) {
        history[existingIndex].error = error;
      }
    } else {
      // Create new entry
      history.push({
        node,
        startedAt: now,
        status,
        ...(status === 'success' || status === 'error' ? { completedAt: now } : {}),
        ...(error ? { error } : {}),
      });
    }

    researchRun.stepHistory = history;
  }

  /**
   * Create tools for the research graph
   * Returns plain functions (not LangChain Tool wrappers) to avoid type inference issues
   */
  private createTools(orgId: string, llm: any) {
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

      searchSoldListings: withRetry(
        async ({ query, source, limit }: { query: string; source: string; limit: number }): Promise<CompResult[]> => {
          const accounts = await this.marketplaceAccountService.listAccounts(orgId);
          const ebayAccount = accounts.find(
            (acc) => acc.marketplace === 'EBAY' && acc.status === 'active',
          );

          if (!ebayAccount) {
            this.logger.warn(`No active eBay account found for org ${orgId}`);
            return [];
          }

          const adapter: MarketplaceAdapter = await this.marketplaceAccountService.getAdapter(ebayAccount.id);
          return adapter.searchComps({
            keywords: query,
            soldOnly: true,
            limit,
          });
        },
        'searchSoldListings',
        { maxRetries: 3, useCircuitBreaker: true },
      ),

      searchActiveListings: withRetry(
        async ({ query, source, limit }: { query: string; source: string; limit: number }): Promise<CompResult[]> => {
          const accounts = await this.marketplaceAccountService.listAccounts(orgId);
          const ebayAccount = accounts.find(
            (acc) => acc.marketplace === 'EBAY' && acc.status === 'active',
          );

          if (!ebayAccount) {
            this.logger.warn(`No active eBay account found for org ${orgId}`);
            return [];
          }

          const adapter: MarketplaceAdapter = await this.marketplaceAccountService.getAdapter(ebayAccount.id);
          return adapter.searchComps({
            keywords: query,
            soldOnly: false,
            limit,
          });
        },
        'searchActiveListings',
        { maxRetries: 3, useCircuitBreaker: true },
      ),

      saveItemResearch: async ({ itemId, researchRunId, data }: { itemId: string; researchRunId: string; data: ItemResearchData }): Promise<{ researchId: string }> => {
        const research = await this.researchService.createResearch({
          itemId,
          researchRunId,
          data,
        });
        return { researchId: research.id };
      },

      saveEvidenceBundle: async ({ itemId, researchRunId, evidence }: { itemId: string; researchRunId: string; evidence: ResearchEvidenceRecord[] }): Promise<{ bundleId: string; evidenceCount: number }> => {
        // Create evidence bundle
        const bundle = await this.evidenceService.createBundleForResearchRun(itemId, researchRunId);

        // Convert ResearchEvidenceRecord to EvidenceItem format
        const evidenceItems = evidence.map((ev) => {
          if (ev.type === 'sold_listing' || ev.type === 'active_listing') {
            const evidenceType = ev.type === 'sold_listing' ? 'marketplace_sold' : 'marketplace_active';
            return {
              type: evidenceType,
              data: {
                type: evidenceType,
                marketplace: ev.source,
                url: ev.url || '',
                title: ev.title,
                price: ev.price || 0,
                shippingCost: null,
                soldDate: ev.soldDate,
                condition: ev.condition || null,
                thumbUrl: ev.imageUrl || null,
                relevanceScore: ev.relevanceScore,
              },
            };
          }
          // For other types, create a summary evidence item
          return {
            type: 'summary',
            data: {
              type: 'summary',
              kind: 'ai_analysis',
              text: ev.title,
              data: ev.extractedData,
            },
          };
        });

        // Add evidence items
        await this.evidenceService.addItems(bundle.id, evidenceItems as any);

        return { bundleId: bundle.id, evidenceCount: evidence.length };
      },
    };
  }
}
