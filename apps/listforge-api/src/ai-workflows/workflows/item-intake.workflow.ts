import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Item } from '../../items/entities/item.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { ItemResearchRun } from '../../research/entities/item-research-run.entity';
import { EvidenceService } from '../../evidence/evidence.service';
import { EventsService } from '../../events/events.service';
import { ResearchService } from '../../research/research.service';
import {
  MarketplaceSoldEvidence,
  MarketplaceActiveEvidence,
  SummaryEvidence,
  DEFAULT_AUTO_APPROVAL_SETTINGS,
  VisionExtractResult,
  ResearchSnapshot,
  ItemAttribute,
} from '@listforge/core-types';
import { ItemSummaryDto } from '@listforge/api-types';
import { CompResult } from '@listforge/marketplace-adapters';
import { OpenAIService } from '../services/openai.service';
import { QUEUE_AI_WORKFLOW, StartResearchRunJob } from '@listforge/queue-types';

/**
 * Item Intake Workflow - Phase 6 + Slice 1
 *
 * AI workflow for processing AI-captured Items.
 * Phase 6 Sub-Phase 8: Updated to use ItemResearchRun instead of WorkflowRun.
 * Slice 1: Fast intake with async deep research.
 */
@Injectable()
export class ItemIntakeWorkflow {
  private readonly logger = new Logger(ItemIntakeWorkflow.name);
  private readonly PIPELINE_VERSION = 'item-intake-v2.0-fast';

  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ItemResearchRun)
    private researchRunRepo: Repository<ItemResearchRun>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    private evidenceService: EvidenceService,
    private eventsService: EventsService,
    private openaiService: OpenAIService,
    private researchService: ResearchService,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private aiWorkflowQueue: Queue,
  ) {}

  async execute(
    itemId: string,
    orgId: string,
    userId: string,
    researchRunId?: string,
  ): Promise<void> {
    console.log('[intake] Starting intake workflow');
    console.log('[intake] Item ID:', itemId);
    console.log('[intake] Organization ID:', orgId);
    console.log('[intake] User ID:', userId);
    console.log('[intake] Research Run ID:', researchRunId || 'new');

    // Get or create research run
    let researchRun: ItemResearchRun;
    if (researchRunId) {
      researchRun = await this.researchRunRepo.findOne({
        where: { id: researchRunId },
      });
      if (!researchRun) {
        throw new NotFoundException(`Research run ${researchRunId} not found`);
      }
      console.log('[intake] Using existing research run:', researchRunId);
    } else {
      // Create new research run if not provided
      researchRun = this.researchRunRepo.create({
        itemId,
        runType: 'initial_intake',
        status: 'running',
        pipelineVersion: this.PIPELINE_VERSION,
        startedAt: new Date(),
      });
      researchRun = await this.researchRunRepo.save(researchRun);
      console.log('[intake] Created new research run:', researchRun.id);
    }

    // Update status to running
    researchRun.status = 'running';
    researchRun.pipelineVersion = this.PIPELINE_VERSION;
    await this.researchRunRepo.save(researchRun);

    try {
      // Step 1: Load item
      console.log('[intake] Loading item');
      const item = await this.itemRepo.findOne({
        where: { id: itemId, organizationId: orgId },
      });

      if (!item) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }

      console.log('[intake] Item loaded:', {
        title: item.title,
        hasDescription: !!item.description,
        mediaCount: item.media?.length || 0,
        hasTitleHint: !!item.userTitleHint,
      });

      // Load organization to get auto-approval settings
      const org = await this.orgRepo.findOne({ where: { id: orgId } });
      const autoApprovalSettings = org?.autoApprovalSettings || DEFAULT_AUTO_APPROVAL_SETTINGS;
      console.log('[intake] Auto-approval settings:', autoApprovalSettings);

      // Update AI metadata
      item.aiPipelineVersion = this.PIPELINE_VERSION;
      item.aiLastRunAt = new Date();
      await this.itemRepo.save(item);

      // Emit item update (AI processing started)
      this.eventsService.emitItemUpdated(this.mapToDto(item));

      // Validate media exists
      if (!item.media || item.media.length === 0) {
        console.error('[intake] No media found for item');
        throw new Error('No photos available for analysis');
      }

      // Get photo URLs from media
      const photoUrls = item.media.map((m) => m.url);
      console.log('[intake] Photo URLs prepared:', photoUrls.length);

      // SLICE 1: Fast Intake - Use gpt-4o-mini for quick placeholder data
      console.log('[intake] Starting fast intake analysis');
      const fastIntakeStart = Date.now();
      const fastResult = await this.openaiService.fastIntakeAnalysis(
        photoUrls,
        item.userTitleHint || undefined,
      );
      const fastIntakeDuration = Date.now() - fastIntakeStart;
      console.log('[intake] Fast intake completed in', fastIntakeDuration, 'ms');

      // Map fast intake results to Item fields (placeholder data)
      console.log('[intake] Mapping fast intake results to item fields');
      // fastResult.description contains the provisional title from fast intake
      const provisionalTitle =
        fastResult.description ||
        (fastResult.brand && fastResult.model
          ? `${fastResult.brand} ${fastResult.model}`
          : fastResult.brand || fastResult.model || fastResult.category || 'Product Item');
      item.title = provisionalTitle;
      item.condition = fastResult.condition as any;
      item.categoryPath = fastResult.category ? [fastResult.category] : null;
      item.categoryId = fastResult.category || null;

      // Map basic attributes from fast intake
      if (fastResult.brand) {
        item.attributes.push({
          key: 'Brand',
          value: fastResult.brand,
          source: 'ai',
          confidence: 0.7,
        });
      }
      if (fastResult.model) {
        item.attributes.push({
          key: 'Model',
          value: fastResult.model,
          source: 'ai',
          confidence: 0.7,
        });
      }

      // Set AI metadata
      item.aiConfidenceScore = 0.5; // Low confidence for placeholder
      item.lifecycleStatus = 'draft';
      item.aiReviewState = 'researching'; // New state: fast intake done, deep research queued

      // Save item with placeholder data
      console.log('[intake] Saving item with placeholder data');
      await this.itemRepo.save(item);

      // Emit item updated event (fast intake complete)
      this.eventsService.emitItemUpdated(this.mapToDto(item));

      // Update research run status
      researchRun.status = 'success';
      researchRun.completedAt = new Date();
      researchRun.summary = `Fast intake completed. Placeholder title: ${item.title}. Deep research queued.`;
      await this.researchRunRepo.save(researchRun);

      // SLICE 1: Queue deep research job
      console.log('[intake] Queueing deep research job');
      const deepResearchRun = await this.researchService.createResearchRun(
        itemId,
        orgId,
        'initial_intake', // Keep same runType for tracking
      );

      const researchJob: StartResearchRunJob = {
        researchRunId: deepResearchRun.id,
        itemId,
        runType: 'initial_intake',
        orgId,
        userId,
      };

      await this.aiWorkflowQueue.add('start-research-run', researchJob);
      console.log('[intake] Deep research job queued:', deepResearchRun.id);

      console.log('[intake] Fast intake workflow completed successfully');
      this.logger.log(`Successfully completed fast intake for item ${itemId}, deep research queued`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('[intake] Workflow failed:', errorMessage);
      if (errorStack) {
        console.error('[intake] Stack trace:', errorStack);
      }

      this.logger.error(
        `Workflow failed for item ${itemId}: ${errorMessage}`,
      );
      if (errorStack) {
        this.logger.error(`Stack trace:\n${errorStack}`);
      }

      // Update research run with error
      researchRun.status = 'error';
      researchRun.errorMessage = errorMessage;
      researchRun.completedAt = new Date();
      await this.researchRunRepo.save(researchRun);

      // Update item with error
      const item = await this.itemRepo.findOne({
        where: { id: itemId },
      });
      if (item) {
        item.aiLastRunError = errorMessage;
        await this.itemRepo.save(item);

        // Emit item updated event with error
        this.eventsService.emitItemUpdated(this.mapToDto(item));
      }

      throw error;
    }
  }

  private async persistCompsAsEvidence(
    bundleId: string,
    soldComps: CompResult[],
    activeComps: CompResult[],
  ): Promise<void> {
    const evidenceItems: Array<{
      type: 'marketplace_sold' | 'marketplace_active';
      data: MarketplaceSoldEvidence | MarketplaceActiveEvidence;
    }> = [];

    // Add sold comps
    for (const comp of soldComps.slice(0, 15)) {
      evidenceItems.push({
        type: 'marketplace_sold',
        data: {
          type: 'marketplace_sold',
          marketplace: 'ebay',
          url: comp.url || '',
          title: comp.title,
          price: comp.price,
          shippingCost: null,
          soldDate: comp.soldDate ? comp.soldDate.toISOString() : new Date().toISOString(),
          condition: comp.condition || null,
          thumbUrl: null,
          relevanceScore: null,
        },
      });
    }

    // Add active comps
    for (const comp of activeComps.slice(0, 10)) {
      evidenceItems.push({
        type: 'marketplace_active',
        data: {
          type: 'marketplace_active',
          marketplace: 'ebay',
          url: comp.url || '',
          title: comp.title,
          price: comp.price,
          shippingCost: null,
          timeLeft: comp.endDate ? comp.endDate.toISOString() : null,
          sellerRating: null,
          thumbUrl: null,
          watchCount: null,
        },
      });
    }

    if (evidenceItems.length > 0) {
      await this.evidenceService.addItems(bundleId, evidenceItems);
    }
  }

  private async addPricingSummaryEvidence(
    bundleId: string,
    suggested: number,
    min: number,
    max: number,
    researchSnapshot: ResearchSnapshot | null,
  ): Promise<void> {
    const compCount = researchSnapshot
      ? researchSnapshot.soldComps + researchSnapshot.activeComps
      : 0;

    let text = `Suggested price: $${suggested.toFixed(2)} (range: $${min.toFixed(2)} - $${max.toFixed(2)}).`;

    if (researchSnapshot?.soldPrices) {
      text += ` Based on ${researchSnapshot.soldComps} sold comps with median price $${researchSnapshot.soldPrices.median.toFixed(2)}.`;
    } else if (researchSnapshot?.activePrices) {
      text += ` Based on ${researchSnapshot.activeComps} active listings with median price $${researchSnapshot.activePrices.median.toFixed(2)}.`;
    } else {
      text += ' Based on category defaults (no comparable sales found).';
    }

    const summaryData: SummaryEvidence = {
      type: 'summary',
      kind: 'pricing_overview',
      text,
      data: {
        suggested,
        min,
        max,
        compCount,
        soldMedian: researchSnapshot?.soldPrices?.median || null,
        activeMedian: researchSnapshot?.activePrices?.median || null,
      },
    };

    await this.evidenceService.addItem(bundleId, 'summary', summaryData);
  }

  private async addContentRationaleEvidence(
    bundleId: string,
    extracted: any,
    listingContent: any,
  ): Promise<void> {
    // Title rationale
    const titleRationale: SummaryEvidence = {
      type: 'summary',
      kind: 'title_rationale',
      text: `Title generated from ${extracted.brand ? 'brand: ' + extracted.brand + ', ' : ''}${extracted.model ? 'model: ' + extracted.model + ', ' : ''}category: ${extracted.category}, condition: ${extracted.condition}.`,
      data: {
        brand: extracted.brand,
        model: extracted.model,
        category: extracted.category,
        condition: extracted.condition,
      },
    };

    await this.evidenceService.addItem(bundleId, 'summary', titleRationale);

    // Category justification
    const categoryRationale: SummaryEvidence = {
      type: 'summary',
      kind: 'category_justification',
      text: `Item categorized as "${extracted.category}" based on visual analysis of product images.`,
      data: {
        category: extracted.category,
      },
    };

    await this.evidenceService.addItem(bundleId, 'summary', categoryRationale);
  }

  private mapToDto(item: Item): any {
    return {
      id: item.id,
      organizationId: item.organizationId,
      createdByUserId: item.createdByUserId,
      source: item.source,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),

      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,

      userTitleHint: item.userTitleHint,
      userDescriptionHint: item.userDescriptionHint,
      userNotes: item.userNotes,

      title: item.title,
      subtitle: item.subtitle,
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

      assignedReviewerUserId: item.assignedReviewerUserId,
      reviewedByUserId: item.reviewedByUserId,
      reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
      reviewComment: item.reviewComment,
    };
  }

  private mapToSummaryDto(item: Item): ItemSummaryDto {
    const primaryImage = item.media.find(m => m.isPrimary) || item.media[0];

    return {
      id: item.id,
      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,
      source: item.source,
      title: item.title,
      defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
      currency: item.currency,
      quantity: item.quantity,
      primaryImageUrl: primaryImage?.url || null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

