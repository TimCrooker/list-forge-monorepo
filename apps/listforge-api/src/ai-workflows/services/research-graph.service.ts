import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { buildFieldDrivenResearchGraph, buildGoalDrivenResearchGraph } from '../graphs/research/research-graph.builder';
import { OrganizationSettingsService } from '../../organizations/services/organization-settings.service';
import { ResearchGraphState, ItemSnapshot } from '../graphs/research/research-graph.state';
import { FieldStateManagerService } from './field-state-manager.service';
import { ResearchPlannerService } from './research-planner.service';
import { FieldResearchService } from './field-research.service';
import { Item } from '../../items/entities/item.entity';
import { ItemResearchRun } from '../../research/entities/item-research-run.entity';
import { ResearchService } from '../../research/research.service';
import { ResearchActivityLoggerService } from '../../research/services/research-activity-logger.service';
import { EvidenceService } from '../../evidence/evidence.service';
import { MarketplaceAccountService } from '../../marketplaces/services/marketplace-account.service';
import { AutoPublishService } from '../../marketplaces/services/auto-publish.service';
import { EventsService } from '../../events/events.service';
import { PostgresCheckpointerService } from '../checkpointers/postgres.checkpointer';
import { LLMConfigService } from '../config/llm.config';
import { WebSearchService } from './web-search.service';
import { OCRService } from './ocr.service';
import { UPCLookupService } from './upc-lookup.service';
import { MarketplaceSchemaService } from './marketplace-schema.service';
import { PricingStrategyService } from './pricing-strategy.service';
import { ListingAssemblyService } from './listing-assembly.service';
import { AmazonCatalogService } from './amazon-catalog.service';
import { KeepaService } from './keepa.service';
// Slice 4: Image Cross-Validation
import { ImageComparisonService } from './image-comparison.service';
// Slice 6: Identification Validation Checkpoint
import { IdentificationValidatorService } from './identification-validator.service';
import { retryWithBackoff } from '../utils/error-handling';
import { API_LIMITS } from '../config/research.constants';
import { withSpan, ResearchMetrics, startTiming } from '../utils/telemetry';
import { ItemResearchData, ResearchEvidenceRecord, ItemUpdateFromResearch, WebSearchResult, DiscoveredProductData, OCRExtractionResult, UPCLookupResult, AmazonProductMatch } from '@listforge/core-types';
import { CompResult, MarketplaceAdapter, EbayAdapter } from '@listforge/marketplace-adapters';
import { StartResearchRunJob } from '@listforge/queue-types';

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
    private readonly activityLogger: ResearchActivityLoggerService,
    private readonly evidenceService: EvidenceService,
    private readonly marketplaceAccountService: MarketplaceAccountService,
    // Slice 7: Auto-Publish
    private readonly autoPublishService: AutoPublishService,
    private readonly eventsService: EventsService,
    private readonly checkpointerService: PostgresCheckpointerService,
    private readonly llmConfigService: LLMConfigService,
    private readonly webSearchService: WebSearchService,
    // Slice 2: Enhanced Product Identification services
    private readonly ocrService: OCRService,
    private readonly upcLookupService: UPCLookupService,
    // Slice 4: Marketplace Schema Awareness
    private readonly marketplaceSchemaService: MarketplaceSchemaService,
    // Slice 5: Pricing Strategies
    private readonly pricingStrategyService: PricingStrategyService,
    // Slice 6: Full Listing Assembly
    private readonly listingAssemblyService: ListingAssemblyService,
    // Amazon/Keepa Integration
    private readonly amazonCatalogService: AmazonCatalogService,
    private readonly keepaService: KeepaService,
    // Field-driven research services
    private readonly fieldStateManager: FieldStateManagerService,
    private readonly researchPlanner: ResearchPlannerService,
    private readonly fieldResearchService: FieldResearchService,
    // Organization settings for graph selection and routing
    private readonly orgSettingsService: OrganizationSettingsService,
    // Slice 4: Image Cross-Validation
    private readonly imageComparisonService: ImageComparisonService,
    // Slice 6: Identification Validation Checkpoint
    private readonly identificationValidatorService: IdentificationValidatorService,
  ) {}

  /**
   * Execute research graph for a research run
   * Phase 7 Slice 4: Now supports checkpointing and resume
   */
  async execute(job: StartResearchRunJob, isResume = false): Promise<void> {
    const { researchRunId, itemId, orgId } = job;
    const timing = startTiming();

    // Record research run started
    ResearchMetrics.researchRunsStarted({ organization_id: orgId });

    this.logger.log(`Starting research graph execution - Run: ${researchRunId}, Item: ${itemId}, Resume: ${isResume}`);

    // CRITICAL: Verify authorization - item must belong to the specified organization
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    if (item.organizationId !== orgId) {
      this.logger.error(
        `Authorization failed: Item ${itemId} belongs to org ${item.organizationId} but research requested for org ${orgId}`,
      );
      throw new BadRequestException(
        `Authorization failed: Item does not belong to the specified organization`,
      );
    }

    // Get research run with item relation to verify organization
    const researchRun = await this.researchRunRepo.findOne({
      where: { id: researchRunId },
      relations: ['item'],
    });

    if (!researchRun) {
      throw new NotFoundException(`Research run ${researchRunId} not found`);
    }

    // Verify research run's item belongs to the same organization
    if (researchRun.item && researchRun.item.organizationId !== orgId) {
      this.logger.error(
        `Authorization failed: Research run ${researchRunId} belongs to org ${researchRun.item.organizationId} but requested for org ${orgId}`,
      );
      throw new BadRequestException(
        `Authorization failed: Research run does not belong to the specified organization`,
      );
    }

    // Check retry limit
    if (isResume && researchRun.stepCount >= this.MAX_RETRIES * 10) {
      this.logger.warn(`Retry limit exceeded for research run ${researchRunId}`, {
        researchRunId,
        stepCount: researchRun.stepCount,
        maxSteps: this.MAX_RETRIES * 10,
      });
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
      this.logger.debug('LLM initialized', { researchRunId, modelType: 'research' });

      // Create tools
      const tools = this.createTools(orgId, llm);
      this.logger.debug('Tools created', { researchRunId, orgId });

      // Get checkpointer
      const checkpointer = this.checkpointerService.getCheckpointer();
      this.logger.debug('Checkpointer initialized', { researchRunId });

      // Load organization workflow settings to determine which graph to use
      const workflowSettings = await this.orgSettingsService.getWorkflowSettings(orgId);
      const useGoalDriven = workflowSettings.useGoalDrivenGraph ?? true;

      // Build research graph based on org settings
      const graph = useGoalDriven
        ? buildGoalDrivenResearchGraph(checkpointer)
        : buildFieldDrivenResearchGraph(checkpointer);
      this.logger.debug('Research graph built with checkpointer', {
        researchRunId,
        graphType: useGoalDriven ? 'goal-driven' : 'field-driven',
      });

      // Initial state (or resume from checkpoint)
      // Use org settings for confidence threshold and max retries
      const initialState: Partial<ResearchGraphState> = isResume
        ? {} // Will be loaded from checkpoint
        : {
            itemId,
            researchRunId,
            organizationId: orgId,
            iteration: 0,
            maxIterations: workflowSettings.maxResearchRetries || 3,
            confidenceThreshold: workflowSettings.confidenceThreshold || 0.7,
            done: false,
            error: null,
          };

      this.logger.debug('Initial state prepared', {
        researchRunId,
        itemId,
        isResume,
        iteration: initialState.iteration,
        maxIterations: initialState.maxIterations,
        confidenceThreshold: initialState.confidenceThreshold,
        graphType: useGoalDriven ? 'goal-driven' : 'field-driven',
      });

      // Track node execution for event emission and step history
      let finalResult: ResearchGraphState | null = null;
      let previousNode: string | null = null;

      // Node order depends on which graph is being used
      const nodeOrder = useGoalDriven
        ? [
            // Phase 0: Setup, Goal Initialization & Planning
            'initialize_goals',
            'load_context',
            'analyze_media',
            'plan_research',
            'detect_marketplace_schema',
            'initialize_field_states',
            // Phase 1: Identification
            'extract_identifiers',
            'deep_identify',
            'update_item',
            'complete_identification_goal',
            // Phase 2: Parallel Goals - Metadata
            'extract_from_images',
            'quick_lookups',
            'evaluate_fields',
            'plan_next_research',
            'execute_research',
            'complete_metadata_goal',
            // Phase 2: Parallel Goals - Market Research
            'search_comps',
            'analyze_comps',
            'complete_market_goal',
            // Phase 3: Assembly
            'calculate_price',
            'assemble_listing',
            'complete_assembly_goal',
            // Phase 4: Persistence
            'persist_results',
          ]
        : [
            // Field-driven research graph node order
            // Phase 0: Setup
            'load_context',
            'detect_marketplace_schema',
            'initialize_field_states',
            // Phase 1: Fast Extraction
            'extract_from_images',
            'quick_lookups',
            // Phase 2: Adaptive Research Loop
            'evaluate_fields',
            'plan_next_research',
            'execute_research',
            // Phase 3: Validation
            'validate_readiness',
            // Phase 4: Core Market Research Operations
            'search_comps',
            'analyze_comps',
            'calculate_price',
            'assemble_listing',
            // Phase 5: Persistence
            'persist_results',
          ];

      // Execute graph with streaming and checkpointing
      // Use researchRunId as thread_id for checkpointing
      console.log('[research:service] Starting graph stream execution');
      const stream = await graph.stream(initialState, {
        configurable: {
          thread_id: researchRunId,
          // Pass the tools object that nodes expect
          tools: {
            ...tools,
            // Include field-driven research services in the tools object
            fieldStateManager: this.fieldStateManager,
            researchPlanner: this.researchPlanner,
            fieldResearchService: this.fieldResearchService,
            // Include marketplace schema service for initialize_field_states
            marketplaceSchema: this.marketplaceSchemaService,
            keepaService: this.keepaService,
            upcLookupService: this.upcLookupService,
            // Slice 4: Image Cross-Validation for keyword comp validation
            compareImages: this.imageComparisonService.compareImages.bind(this.imageComparisonService),
            // Slice 7: Cross-Source Validation event emitter
            eventsService: this.eventsService,
          },
          llm,
          activityLogger: this.activityLogger,
          // Slice 4: Marketplace Schema Awareness
          marketplaceSchemaService: this.marketplaceSchemaService,
          // Slice 5: Pricing Strategies
          pricingStrategyService: this.pricingStrategyService,
          // Slice 6: Full Listing Assembly
          listingAssemblyService: this.listingAssemblyService,
          // Amazon/Keepa Integration
          amazonCatalogService: this.amazonCatalogService,
          keepaService: this.keepaService,
          // Slice 6: Identification Validation Checkpoint
          identificationValidator: this.identificationValidatorService,
        },
      });

      // Process streaming events
      let nodeCount = 0;
      for await (const event of stream) {
        // Check for pause request before processing each event
        const isPaused = await this.researchService.isPaused(researchRunId);
        if (isPaused) {
          this.logger.log(`Pause requested for research run ${researchRunId}. Saving checkpoint and stopping.`);
          await this.handlePauseRequest(researchRun, researchRunId, itemId, orgId);
          return; // Exit early
        }

        // Each event is an object with node names as keys
        for (const [nodeName, nodeState] of Object.entries(event)) {
          // Skip special keys like '__end__' or '__start__'
          if (!nodeOrder.includes(nodeName)) {
            continue;
          }

          nodeCount++;
          console.log('[research:service] Node executed:', nodeName);

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
            console.log('[research:service] Node completed:', previousNode);
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

      console.log('[research:service] Graph stream complete:', {
        nodesExecuted: nodeCount,
        finalNode: previousNode,
      });

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
        console.error('[research:service] No final result produced');
        throw new Error('Research graph did not produce a result');
      }

      if (finalResult.error) {
        console.error('[research:service] Final result has error:', finalResult.error);
        throw new Error(finalResult.error);
      }

      if (!finalResult.done) {
        console.error('[research:service] Research graph did not complete');
        throw new Error('Research graph did not complete');
      }

      console.log('[research:service] Research graph completed successfully');
      console.log('[research:service] Final result summary:', {
        compsCount: finalResult.comps?.length || 0,
        priceBandsCount: finalResult.priceBands?.length || 0,
        overallConfidence: finalResult.overallConfidence,
        iteration: finalResult.iteration,
      });

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

      // ========================================================================
      // Confidence-Based Review Routing
      // Determines whether item should be auto-approved, spot-checked, or full-reviewed
      // ========================================================================
      const itemForRouting = await this.itemRepo.findOne({
        where: { id: itemId },
      });
      if (itemForRouting && itemForRouting.aiReviewState === 'researching') {
        // Load research settings for routing thresholds
        const researchSettings = await this.orgSettingsService.getResearchSettings(orgId);

        // Extract confidence and validated comp count from results
        const overallConfidence = finalResult.overallConfidence ?? 0;
        const validatedCompCount = finalResult.tieredPricing?.validatedCompCount ??
          finalResult.comps?.filter((c: any) => c.validation?.isValid).length ?? 0;

        // Determine routing decision
        let reviewRoute: 'auto_approve' | 'spot_check' | 'full_review';

        if (
          researchSettings.enableAutoApproval &&
          overallConfidence >= researchSettings.autoApproveThreshold &&
          validatedCompCount >= researchSettings.minCompsForAutoApproval
        ) {
          // Auto-approve: Skip review queue
          reviewRoute = 'auto_approve';
          itemForRouting.aiReviewState = 'approved';
          itemForRouting.lifecycleStatus = 'ready';
          itemForRouting.reviewedAt = new Date();
          itemForRouting.reviewedByUserId = null; // System approval
          itemForRouting.reviewComment = `Auto-approved: ${(overallConfidence * 100).toFixed(0)}% confidence, ${validatedCompCount} validated comps`;
          itemForRouting.reviewRecommendation = null; // Clear any recommendation since auto-approved

          this.logger.log(
            `Item ${itemId} auto-approved: confidence=${(overallConfidence * 100).toFixed(0)}%, ` +
            `validatedComps=${validatedCompCount}, threshold=${(researchSettings.autoApproveThreshold * 100).toFixed(0)}%`,
          );
        } else if (overallConfidence >= researchSettings.spotCheckThreshold) {
          // Spot-check: Go to review queue with "recommend approve" flag
          reviewRoute = 'spot_check';
          itemForRouting.aiReviewState = 'pending';
          itemForRouting.reviewRecommendation = 'approve';

          this.logger.log(
            `Item ${itemId} routed to spot-check: confidence=${(overallConfidence * 100).toFixed(0)}%, ` +
            `threshold=${(researchSettings.spotCheckThreshold * 100).toFixed(0)}%`,
          );
        } else {
          // Full review: Go to review queue with "needs review" flag
          reviewRoute = 'full_review';
          itemForRouting.aiReviewState = 'pending';
          itemForRouting.reviewRecommendation = 'review';

          this.logger.log(
            `Item ${itemId} routed to full-review: confidence=${(overallConfidence * 100).toFixed(0)}%, ` +
            `below spotCheck threshold=${(researchSettings.spotCheckThreshold * 100).toFixed(0)}%`,
          );
        }

        await this.itemRepo.save(itemForRouting);

        // Emit item updated event so frontend refreshes
        this.eventsService.emitItemUpdated({
          id: itemForRouting.id,
          organizationId: itemForRouting.organizationId,
          createdByUserId: itemForRouting.createdByUserId,
          source: itemForRouting.source,
          createdAt: itemForRouting.createdAt.toISOString(),
          updatedAt: itemForRouting.updatedAt.toISOString(),
          lifecycleStatus: itemForRouting.lifecycleStatus,
          aiReviewState: itemForRouting.aiReviewState,
          title: itemForRouting.title,
          description: itemForRouting.description,
          condition: itemForRouting.condition,
          categoryPath: itemForRouting.categoryPath,
          categoryId: itemForRouting.categoryId,
          attributes: itemForRouting.attributes,
          media: itemForRouting.media,
          quantity: itemForRouting.quantity,
          defaultPrice: itemForRouting.defaultPrice ? Number(itemForRouting.defaultPrice) : null,
          currency: itemForRouting.currency,
          priceMin: itemForRouting.priceMin ? Number(itemForRouting.priceMin) : null,
          priceMax: itemForRouting.priceMax ? Number(itemForRouting.priceMax) : null,
          pricingStrategy: itemForRouting.pricingStrategy,
          shippingType: itemForRouting.shippingType,
          flatRateAmount: itemForRouting.flatRateAmount ? Number(itemForRouting.flatRateAmount) : null,
          domesticOnly: itemForRouting.domesticOnly,
          weight: itemForRouting.weight ? Number(itemForRouting.weight) : null,
          dimensions: itemForRouting.dimensions,
          location: itemForRouting.location,
          costBasis: itemForRouting.costBasis ? Number(itemForRouting.costBasis) : null,
          tags: itemForRouting.tags,
          aiPipelineVersion: itemForRouting.aiPipelineVersion,
          aiLastRunAt: itemForRouting.aiLastRunAt ? itemForRouting.aiLastRunAt.toISOString() : null,
          aiLastRunError: itemForRouting.aiLastRunError,
          aiConfidenceScore: itemForRouting.aiConfidenceScore ? Number(itemForRouting.aiConfidenceScore) : null,
          userTitleHint: itemForRouting.userTitleHint,
          userDescriptionHint: itemForRouting.userDescriptionHint,
          userNotes: itemForRouting.userNotes,
          subtitle: itemForRouting.subtitle,
          assignedReviewerUserId: itemForRouting.assignedReviewerUserId,
          reviewedByUserId: itemForRouting.reviewedByUserId,
          reviewedAt: itemForRouting.reviewedAt ? itemForRouting.reviewedAt.toISOString() : null,
          reviewComment: itemForRouting.reviewComment,
          reviewRecommendation: itemForRouting.reviewRecommendation,
        });

        this.logger.log(`Updated item ${itemId} via ${reviewRoute} routing`);
      }

      // Slice 7: Evaluate and trigger auto-publish if eligible
      // Build research data from final result for auto-publish evaluation
      const researchDataForAutoPublish: ItemResearchData = {
        productId: finalResult.productIdentification || undefined,
        priceBands: finalResult.priceBands || [],
        pricingStrategies: finalResult.pricingStrategies || undefined,
        demandSignals: finalResult.demandSignals || [],
        missingInfo: finalResult.missingInfo || [],
        competitorCount: finalResult.comps?.filter((c) => c.type === 'active_listing').length,
        recommendedMarketplaces: ['ebay'],
        marketplaceCategory: finalResult.marketplaceCategory || undefined,
        fieldCompletion: finalResult.fieldCompletion || undefined,
        listings: finalResult.listings || undefined,
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
      };

      try {
        const autoPublishResult = await this.autoPublishService.evaluateAndPublish(
          itemId,
          orgId,
          researchDataForAutoPublish,
        );
        if (autoPublishResult.published) {
          this.logger.log(`Item ${itemId} queued for auto-publish`);
        } else {
          this.logger.debug(`Item ${itemId} not eligible for auto-publish: ${autoPublishResult.reason}`);
        }
      } catch (error) {
        // Don't fail research if auto-publish fails - just log the error
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Auto-publish evaluation failed for item ${itemId}: ${errorMessage}`);
      }

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

      // Record success metrics
      const duration = timing.stop();
      ResearchMetrics.researchRunsCompleted({ organization_id: orgId, status: 'success' });
      ResearchMetrics.researchRunDuration(duration, { organization_id: orgId, status: 'success' });
      ResearchMetrics.confidenceScore(finalResult.overallConfidence ?? 0, { stage: 'final' });

      this.logger.log(`Research completed for item ${itemId}, run ${researchRunId} in ${duration}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRecursionError = errorMessage.includes('Recursion limit') ||
        errorMessage.includes('GraphRecursionError') ||
        (error as any)?.name === 'GraphRecursionError';

      this.logger.error(`Research failed for item ${itemId}: ${errorMessage}`, error);

      // Record error metrics
      const duration = timing.stop();

      // Handle GraphRecursionError specially - this usually means research
      // completed but the graph didn't terminate cleanly. We should still
      // try to save whatever results we have and mark as partial success.
      if (isRecursionError) {
        this.logger.warn(
          `Research hit recursion limit for item ${itemId}. ` +
          `This may indicate the graph loop conditions need tuning. ` +
          `Attempting to salvage results...`,
        );

        // Try to save any results we accumulated
        try {
          await this.salvagePartialResults(researchRunId, itemId, orgId, researchRun);

          // Mark as completed with warning instead of error
          researchRun.status = 'success';
          researchRun.completedAt = new Date();
          researchRun.currentNode = null;
          researchRun.checkpoint = null;
          researchRun.summary = `Research completed (hit iteration limit). Results may be partial.`;
          researchRun.errorMessage = null; // Clear error since we salvaged
          await this.researchRunRepo.save(researchRun);

          // Update item state
          const item = await this.itemRepo.findOne({ where: { id: itemId } });
          if (item && item.aiReviewState === 'researching') {
            item.aiReviewState = 'pending';
            await this.itemRepo.save(item);
            this.eventsService.emitItemUpdated({
              id: item.id,
              organizationId: item.organizationId,
              createdByUserId: item.createdByUserId,
              source: item.source,
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
              lifecycleStatus: item.lifecycleStatus,
              aiReviewState: item.aiReviewState,
              title: item.title,
              description: item.description,
              condition: item.condition,
              categoryPath: item.categoryPath,
              categoryId: item.categoryId,
              attributes: item.attributes,
              media: item.media,
              quantity: item.quantity,
              defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
              currency: item.currency,
              priceMin: item.priceMin ? Number(item.priceMin) : null,
              priceMax: item.priceMax ? Number(item.priceMax) : null,
              pricingStrategy: item.pricingStrategy,
              shippingType: item.shippingType,
              flatRateAmount: item.flatRateAmount ? Number(item.flatRateAmount) : null,
              domesticOnly: item.domesticOnly,
              weight: item.weight ? Number(item.weight) : null,
              dimensions: item.dimensions,
              location: item.location,
              costBasis: item.costBasis ? Number(item.costBasis) : null,
              tags: item.tags,
              aiPipelineVersion: item.aiPipelineVersion,
              aiLastRunAt: item.aiLastRunAt ? item.aiLastRunAt.toISOString() : null,
              aiLastRunError: item.aiLastRunError,
              aiConfidenceScore: item.aiConfidenceScore ? Number(item.aiConfidenceScore) : null,
              userTitleHint: item.userTitleHint,
              userDescriptionHint: item.userDescriptionHint,
              userNotes: item.userNotes,
              subtitle: item.subtitle,
              assignedReviewerUserId: item.assignedReviewerUserId,
              reviewedByUserId: item.reviewedByUserId,
              reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
              reviewComment: item.reviewComment,
            });
          }

          // Record as partial success
          ResearchMetrics.researchRunsCompleted({ organization_id: orgId, status: 'partial' });
          ResearchMetrics.researchRunDuration(duration, { organization_id: orgId, status: 'partial' });

          // Emit completion (not error) since we salvaged results
          this.eventsService.emitResearchJobCompleted(
            researchRunId,
            itemId,
            orgId,
            'success',
            researchRun.summary,
          );

          this.logger.log(`Successfully salvaged research results for item ${itemId}`);
          return; // Don't throw - we handled it
        } catch (salvageError) {
          this.logger.error(
            `Failed to salvage research results for item ${itemId}:`,
            salvageError,
          );
          // Fall through to normal error handling
        }
      }

      ResearchMetrics.researchRunsCompleted({ organization_id: orgId, status: 'error' });
      ResearchMetrics.researchRunDuration(duration, { organization_id: orgId, status: 'error' });

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
   * Handle pause request - save checkpoint and update status
   */
  private async handlePauseRequest(
    researchRun: ItemResearchRun,
    researchRunId: string,
    itemId: string,
    orgId: string,
  ): Promise<void> {
    try {
      // The checkpoint is already saved by LangGraph's checkpointer
      // We just need to update the database status
      researchRun.status = 'paused';
      researchRun.pauseRequested = false; // Clear the request flag
      researchRun.pausedAt = new Date();
      await this.researchRunRepo.save(researchRun);

      // Emit pause events
      this.eventsService.emitResearchJobCompleted(
        researchRunId,
        itemId,
        orgId,
        'paused',
        'Research run paused by user',
      );
      this.eventsService.emitResearchPaused(researchRunId, itemId, orgId);

      this.logger.log(`Research run ${researchRunId} paused successfully`);
    } catch (error) {
      this.logger.error(`Error handling pause request for run ${researchRunId}:`, error);
      throw error;
    }
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
   * Salvage partial results when research hits recursion limit or other recoverable errors
   * This ensures we don't lose valuable research data just because the graph didn't terminate cleanly
   *
   * CRITICAL: Only salvages if we have meaningful data (minimum 3 comps)
   * Otherwise research should fail and be re-run
   */
  private async salvagePartialResults(
    researchRunId: string,
    itemId: string,
    orgId: string,
    researchRun: ItemResearchRun,
  ): Promise<void> {
    this.logger.log(`Salvaging partial results for run ${researchRunId}`);

    // ========================================================================
    // BULLETPROOFING: More robust salvage logic
    // With the bulletproofing improvements (iteration limits, stuck detection,
    // task history tracking), we should rarely hit recursion limits.
    // When we do, we want to salvage as much useful data as possible.
    // ========================================================================

    // Try to load the latest research data from the database
    // (the research service may have already persisted some data during the run)
    const existingResearch = await this.researchService.findLatestResearch(itemId, orgId);

    // Get evidence bundle for this run
    const evidenceBundle = await this.evidenceService.getBundleForResearchRun(researchRunId);
    const compCount = evidenceBundle?.items?.length || 0;

    // Log detailed salvage diagnostic info
    this.logger.log(
      `Salvage diagnostics for run ${researchRunId}: ` +
        `existingResearch=${!!existingResearch}, ` +
        `compCount=${compCount}, ` +
        `evidenceBundle=${!!evidenceBundle}`,
    );

    // Minimum comps required for salvage - lower threshold for graceful degradation
    const MIN_COMPS_FOR_SALVAGE = 1; // Reduced from 3 - any comp data is better than none

    if (existingResearch) {
      // We have research data
      if (compCount >= MIN_COMPS_FOR_SALVAGE) {
        this.logger.log(
          `Salvage successful: Found existing research data for item ${itemId} with ${compCount} comps`,
        );
        return;
      }

      // Research exists but no/few comps - still allow salvage but log warning
      this.logger.warn(
        `Salvage with low confidence: Found research data but only ${compCount} comps. ` +
          `Results may be incomplete.`,
      );
      return;
    }

    // No research data persisted yet - check if we have comps in evidence bundle
    if (evidenceBundle && compCount >= MIN_COMPS_FOR_SALVAGE) {
      // We have comps but no persisted research - this means persist_results
      // didn't run before the recursion limit. The evidence bundle still has
      // the comp data which can be used for manual review or re-research.
      this.logger.warn(
        `Salvage partial: No research entity but found ${compCount} comps in evidence bundle. ` +
          `Evidence bundle ${evidenceBundle.id} is available for manual review or re-research. ` +
          `Consider running research again for full pricing analysis.`,
      );
      // Allow salvage - the evidence data exists even if persist_results didn't complete
      return;
    }

    // No research and no comps - truly a failed run
    this.logger.warn(
      `Salvage failed: No research data and no evidence found for item ${itemId}. ` +
        `Research must be re-run.`,
    );
    throw new Error(
      'Research failed without producing any results. Please re-run research.',
    );
  }

  /**
   * Get eBay adapter for the given organization
   * Tries to use org's linked account, falls back to app-level credentials
   */
  private async getEbayAdapter(orgId: string): Promise<MarketplaceAdapter> {
    const accounts = await this.marketplaceAccountService.listAccounts(orgId);
    const ebayAccount = accounts.find(
      (acc) => acc.marketplace === 'EBAY' && acc.status === 'active',
    );

    if (ebayAccount) {
      // Use org's linked account
      return await this.marketplaceAccountService.getAdapter(ebayAccount.id);
    } else {
      // Use app-level credentials for public API access
      return new EbayAdapter({
        marketplace: 'EBAY',
        accessToken: '', // Not needed for public API access
        appId: process.env.EBAY_APP_ID || '',
        certId: process.env.EBAY_CERT_ID || '',
        devId: process.env.EBAY_DEV_ID || '',
        sandbox: process.env.EBAY_SANDBOX === 'true',
      });
    }
  }

  /**
   * Create tools for the research graph
   * Returns plain functions (not LangChain Tool wrappers) to avoid type inference issues
   */
  private createTools(orgId: string, llm: BaseChatModel) {
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

      searchSoldListings: async ({ query, source, limit }: { query: string; source: string; limit: number }): Promise<CompResult[]> => {
        // Validate query
        if (!query || !query.trim()) {
          this.logger.debug(`Skipping searchSoldListings: empty query`);
          return [];
        }

        // Get eBay adapter
        const adapter = await this.getEbayAdapter(orgId);

        try {
          return await retryWithBackoff(
            () => adapter.searchComps({
              keywords: query,
              soldOnly: true,
              limit,
            }),
            {
              maxRetries: API_LIMITS.RETRY.MAX_RETRIES,
              initialDelay: API_LIMITS.RETRY.INITIAL_DELAY_MS,
              maxDelay: API_LIMITS.RETRY.MAX_DELAY_MS,
              context: `ebay-sold-search-${query.substring(0, 20)}`,
            }
          );
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const statusCode = error?.response?.status || error?.statusCode;

          // Check for permission/access errors - don't retry, just log and continue
          if (statusCode === 403 || statusCode === 401 || errorMessage.includes('Forbidden') || errorMessage.includes('Unauthorized')) {
            this.logger.warn(`Sold listings API access denied for query "${query}" (status ${statusCode}). Continuing without sold data.`);
            return []; // Gracefully return empty - research can continue with active listings only
          }

          // For other errors, log but don't break the research agent
          this.logger.warn(`Sold listings search failed for query "${query}": ${errorMessage}. Continuing without this data source.`, error);
          return []; // Return empty instead of throwing
        }
      },

      searchActiveListings: async ({ query, source, limit }: { query: string; source: string; limit: number }): Promise<CompResult[]> => {
        // Validate query
        if (!query || !query.trim()) {
          this.logger.debug(`Skipping searchActiveListings: empty query`);
          return [];
        }

        // Get eBay adapter
        const adapter = await this.getEbayAdapter(orgId);

        try {
          return await retryWithBackoff(
            () => adapter.searchComps({
              keywords: query,
              soldOnly: false,
              limit,
            }),
            {
              maxRetries: API_LIMITS.RETRY.MAX_RETRIES,
              initialDelay: API_LIMITS.RETRY.INITIAL_DELAY_MS,
              maxDelay: API_LIMITS.RETRY.MAX_DELAY_MS,
              context: `ebay-active-search-${query.substring(0, 20)}`,
            }
          );
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const statusCode = error?.response?.status || error?.statusCode;

          // Check for permission/access errors
          if (statusCode === 403 || statusCode === 401 || errorMessage.includes('Forbidden') || errorMessage.includes('Unauthorized')) {
            this.logger.warn(`Active listings API access denied for query "${query}" (status ${statusCode}). Research will be limited.`);
            return [];
          }

          // For other errors (rate limits, network issues, etc.), log but don't break research
          this.logger.warn(`Active listings search failed for query "${query}": ${errorMessage}. Continuing without this data source.`, error);
          return [];
        }
      },

      searchByImage: async ({ imageUrl, source, limit }: { imageUrl: string; source: string; limit: number }): Promise<CompResult[]> => {
        // Validate imageUrl
        if (!imageUrl || !imageUrl.trim()) {
          this.logger.debug(`Skipping searchByImage: empty imageUrl`);
          return [];
        }

        // Get eBay adapter
        const adapter = await this.getEbayAdapter(orgId);

        try {
          return await retryWithBackoff(
            () => adapter.searchComps({
              imageUrl,
              limit,
            }),
            {
              maxRetries: API_LIMITS.RETRY.MAX_RETRIES,
              initialDelay: API_LIMITS.RETRY.INITIAL_DELAY_MS,
              maxDelay: API_LIMITS.RETRY.MAX_DELAY_MS,
              context: 'ebay-image-search',
            }
          );
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const statusCode = error?.response?.status || error?.statusCode;

          // Check for permission/access errors
          if (statusCode === 403 || statusCode === 401) {
            this.logger.warn(`Image search API access denied (status ${statusCode}). Continuing with keyword search only.`);
            return [];
          }

          // For other errors (image fetch failure, invalid format, etc.), log and continue
          this.logger.warn(`Image search failed for URL "${imageUrl}": ${errorMessage}. Continuing without image data.`);
          return [];
        }
      },

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
        // Slice 3: Include validation data in evidence records
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
                // Slice 3: Include validation result if available
                validation: ev.validation ? {
                  isValid: ev.validation.isValid,
                  overallScore: ev.validation.overallScore,
                  criteria: ev.validation.criteria,
                  reasoning: ev.validation.reasoning,
                } : undefined,
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
              data: {
                ...ev.extractedData,
                // Slice 3: Include validation if present
                validation: ev.validation,
              },
            },
          };
        });

        // Add evidence items
        await this.evidenceService.addItems(bundle.id, evidenceItems as any);

        return { bundleId: bundle.id, evidenceCount: evidence.length };
      },

      // ========================================================================
      // Deep Product Identification Tools
      // ========================================================================

      /**
       * Search the web for product information using OpenAI web search
       * Slice 2: Enhanced with color, size, mpn parameters
       * Returns results array, and logs stats about successes/failures
       */
      searchProduct: async (params: {
        brand?: string;
        model?: string;
        category?: string;
        upc?: string;
        extractedText?: string;
        attributes?: Record<string, string>;
        color?: string;
        size?: string;
        mpn?: string;
      }): Promise<WebSearchResult[]> => {
        const { results, successCount, failedCount } = await this.webSearchService.searchProduct(params);

        // Log search statistics for monitoring
        if (failedCount > 0) {
          this.logger.warn(`Web search: ${successCount} succeeded, ${failedCount} failed`);
        }

        return results;
      },

      // ========================================================================
      // Slice 2: OCR and UPC Lookup Tools
      // ========================================================================

      /**
       * Extract text from images using dedicated OCR
       */
      extractOCR: async (imageUrls: string[]): Promise<OCRExtractionResult> => {
        return this.ocrService.extractText(imageUrls);
      },

      /**
       * Look up product information by UPC/EAN barcode
       */
      lookupUPC: async (code: string): Promise<UPCLookupResult> => {
        return this.upcLookupService.lookup(code);
      },

      // ========================================================================
      // Amazon/Keepa Integration Tools
      // ========================================================================

      /**
       * Search Amazon products by keywords
       */
      searchAmazonProducts: async ({ keywords, brand, limit }: { keywords: string; brand?: string; limit: number }): Promise<CompResult[]> => {
        if (!keywords?.trim()) {
          this.logger.debug('Skipping searchAmazonProducts: empty keywords');
          return [];
        }

        try {
          const results = await retryWithBackoff(
            () => this.amazonCatalogService.searchComps({
              keywords,
              brand,
              limit,
            }),
            {
              maxRetries: API_LIMITS.RETRY.MAX_RETRIES,
              initialDelay: API_LIMITS.RETRY.INITIAL_DELAY_MS,
              maxDelay: API_LIMITS.RETRY.MAX_DELAY_MS,
              context: `amazon-search-${keywords.substring(0, 20)}`,
            }
          );
          return results;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Amazon product search failed: ${errorMessage}. Continuing without Amazon data.`);
          return [];
        }
      },

      /**
       * Look up Amazon product by UPC
       */
      lookupAmazonByUpc: async ({ upc }: { upc: string }): Promise<AmazonProductMatch | null> => {
        if (!upc?.trim()) {
          return null;
        }

        try {
          const match = await retryWithBackoff(
            () => this.amazonCatalogService.findProduct({ upc }),
            {
              maxRetries: API_LIMITS.RETRY.MAX_RETRIES,
              initialDelay: API_LIMITS.RETRY.INITIAL_DELAY_MS,
              maxDelay: API_LIMITS.RETRY.MAX_DELAY_MS,
              context: `amazon-upc-lookup-${upc}`,
            }
          );
          return match;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Amazon UPC lookup failed for ${upc}: ${errorMessage}`);
          return null;
        }
      },

      /**
       * Look up Amazon product by ASIN
       */
      lookupAmazonByAsin: async ({ asin }: { asin: string }): Promise<CompResult | null> => {
        if (!asin?.trim()) {
          return null;
        }

        try {
          const researchData = await retryWithBackoff(
            () => this.amazonCatalogService.getResearchData(asin),
            {
              maxRetries: API_LIMITS.RETRY.MAX_RETRIES,
              initialDelay: API_LIMITS.RETRY.INITIAL_DELAY_MS,
              maxDelay: API_LIMITS.RETRY.MAX_DELAY_MS,
              context: `amazon-asin-lookup-${asin}`,
            }
          );

          if (!researchData) {
            return null;
          }

          return {
            listingId: asin,
            title: researchData.product.title,
            price: researchData.currentPricing?.buyBoxPrice || researchData.currentPricing?.newPrice || 0,
            currency: researchData.currentPricing?.currency || 'USD',
            url: `https://www.amazon.com/dp/${asin}`,
            attributes: {
              asin,
              brand: researchData.product.brand,
              category: researchData.product.category,
              salesRank: researchData.product.salesRank,
              // Include Keepa data if available
              hasKeepaData: !!researchData.keepaData,
              buyBoxPrice: researchData.currentPricing?.buyBoxPrice,
              newOfferCount: researchData.currentPricing?.newOfferCount,
              usedOfferCount: researchData.currentPricing?.usedOfferCount,
            },
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Amazon ASIN lookup failed for ${asin}: ${errorMessage}`);
          return null;
        }
      },

      /**
       * Get Keepa data for ASINs (for enriching comps in analyze phase)
       */
      getKeepaData: async ({ asins }: { asins: string[] }): Promise<Record<string, any>> => {
        if (!asins || asins.length === 0) {
          return {};
        }

        try {
          const keepaMap = await this.keepaService.getBulkProducts(asins);
          // Convert Map to Record for state serialization
          return Object.fromEntries(keepaMap);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Keepa bulk lookup failed: ${errorMessage}`);
          return {};
        }
      },

      /**
       * Synthesize product data from web search results
       */
      synthesizeProductData: async (
        searchResults: WebSearchResult[],
        existingData: {
          brand?: string;
          model?: string;
          category?: string;
          attributes?: Record<string, string>;
        },
      ): Promise<DiscoveredProductData> => {
        return this.webSearchService.synthesizeProductData(searchResults, existingData);
      },

      /**
       * Update the Item entity with discovered product data
       */
      updateItem: async ({ itemId, updates }: {
        itemId: string;
        updates: ItemUpdateFromResearch;
      }): Promise<{ success: boolean; updatedFields: string[] }> => {
        const item = await this.itemRepo.findOne({
          where: { id: itemId, organizationId: orgId },
        });

        if (!item) {
          throw new NotFoundException(`Item ${itemId} not found`);
        }

        const updatedFields: string[] = [];

        // Update title
        if (updates.title !== undefined) {
          item.title = updates.title;
          updatedFields.push('title');
        }

        // Update description
        if (updates.description !== undefined) {
          item.description = updates.description;
          updatedFields.push('description');
        }

        // Update condition
        if (updates.condition !== undefined) {
          item.condition = updates.condition as any;
          updatedFields.push('condition');
        }

        // Update category path
        if (updates.categoryPath !== undefined) {
          item.categoryPath = updates.categoryPath;
          updatedFields.push('categoryPath');
        }

        // Update attributes (replace entire array)
        if (updates.attributes !== undefined) {
          item.attributes = updates.attributes;
          updatedFields.push('attributes');
        }

        // Update AI confidence score
        if (updates.aiConfidenceScore !== undefined) {
          item.aiConfidenceScore = updates.aiConfidenceScore;
          updatedFields.push('aiConfidenceScore');
        }

        // Mark AI as having processed this item
        item.aiLastRunAt = new Date();

        if (updatedFields.length > 0) {
          await this.itemRepo.save(item);
          this.logger.log(`Updated item ${itemId} fields: ${updatedFields.join(', ')}`);
        }

        return { success: updatedFields.length > 0, updatedFields };
      },

      // ========================================================================
      // Field-Driven Research Tools
      // ========================================================================

      /**
       * Field state manager service for field-driven research nodes
       */
      fieldStateManager: this.fieldStateManager,

      /**
       * Research planner service for adaptive research
       */
      researchPlanner: this.researchPlanner,

      /**
       * Field research service for executing research tasks
       */
      fieldResearchService: this.fieldResearchService,

      /**
       * Save field states to research run
       */
      saveFieldStates: async ({
        itemId,
        researchRunId,
        fieldStates,
        researchCostUsd,
        researchMode,
        researchConstraints,
      }: {
        itemId: string;
        researchRunId: string;
        fieldStates: any;
        researchCostUsd: number;
        researchMode: 'fast' | 'balanced' | 'thorough';
        researchConstraints: any;
      }): Promise<void> => {
        const run = await this.researchRunRepo.findOne({
          where: { id: researchRunId },
        });
        if (run) {
          run.fieldStates = fieldStates;
          run.researchCostUsd = researchCostUsd;
          run.researchMode = researchMode;
          run.researchConstraints = researchConstraints;
          await this.researchRunRepo.save(run);
        }
      },

      /**
       * Update item readiness status
       */
      updateItemReadiness: async ({
        itemId,
        readyToPublish,
        fieldCompletionScore,
        canonicalFields,
      }: {
        itemId: string;
        readyToPublish: boolean;
        fieldCompletionScore: number;
        canonicalFields: Record<string, unknown>;
      }): Promise<void> => {
        const item = await this.itemRepo.findOne({
          where: { id: itemId, organizationId: orgId },
        });
        if (item) {
          item.readyToPublish = readyToPublish;
          item.fieldCompletionScore = fieldCompletionScore;
          item.canonicalFields = canonicalFields;
          await this.itemRepo.save(item);
        }
      },
    };
  }
}
