import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { ItemResearchRun } from '../../research/entities/item-research-run.entity';
import { EvidenceService } from '../../evidence/evidence.service';
import { EventsService } from '../../events/events.service';
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
import { ListingAgentService } from '../services/listing-agent.service';

/**
 * Item Intake Workflow - Phase 6
 *
 * AI workflow for processing AI-captured Items.
 * Phase 6 Sub-Phase 8: Updated to use ItemResearchRun instead of WorkflowRun.
 */
@Injectable()
export class ItemIntakeWorkflow {
  private readonly logger = new Logger(ItemIntakeWorkflow.name);
  private readonly PIPELINE_VERSION = 'item-intake-v1.0';

  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ItemResearchRun)
    private researchRunRepo: Repository<ItemResearchRun>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    private evidenceService: EvidenceService,
    private eventsService: EventsService,
    private listingAgentService: ListingAgentService,
  ) {}

  async execute(
    itemId: string,
    orgId: string,
    userId: string,
    researchRunId?: string,
  ): Promise<void> {
    // Get or create research run
    let researchRun: ItemResearchRun;
    if (researchRunId) {
      researchRun = await this.researchRunRepo.findOne({
        where: { id: researchRunId },
      });
      if (!researchRun) {
        throw new NotFoundException(`Research run ${researchRunId} not found`);
      }
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
    }

    // Update status to running
    researchRun.status = 'running';
    researchRun.pipelineVersion = this.PIPELINE_VERSION;
    await this.researchRunRepo.save(researchRun);

    try {
      // Step 1: Load item
      const item = await this.itemRepo.findOne({
        where: { id: itemId, organizationId: orgId },
      });

      if (!item) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }

      // Load organization to get auto-approval settings
      const org = await this.orgRepo.findOne({ where: { id: orgId } });
      const autoApprovalSettings = org?.autoApprovalSettings || DEFAULT_AUTO_APPROVAL_SETTINGS;

      // Update AI metadata
      item.aiPipelineVersion = this.PIPELINE_VERSION;
      item.aiLastRunAt = new Date();
      await this.itemRepo.save(item);

      // Emit item update (AI processing started)
      this.eventsService.emitItemUpdated(this.mapToDto(item));

      // Validate media exists
      if (!item.media || item.media.length === 0) {
        throw new Error('No photos available for analysis');
      }

      // Get photo URLs from media
      const photoUrls = item.media.map((m) => m.url);

      // Run AI agent
      const agentResult = await this.listingAgentService.run({
        itemId,
        orgId,
        userId,
        photoUrls,
        userHint: item.userTitleHint,
        autoApprovalSettings,
      });

      // Create evidence bundle linked to this research run
      const evidenceBundle = await this.evidenceService.createBundleForResearchRun(
        itemId,
        researchRun.id,
      );

      // Map AI results to Item fields
      item.title = agentResult.listingContent.title;
      item.description = agentResult.listingContent.description;
      item.condition = agentResult.extracted.condition as any;

      // Map category
      item.categoryPath = agentResult.extracted.category ? [agentResult.extracted.category] : null;
      item.categoryId = agentResult.extracted.category || null;

      // Map attributes from agent result
      item.attributes = agentResult.attributes.map(attr => ({
        key: attr.key,
        value: attr.value,
        source: attr.source as 'ai' | 'user' | 'imported',
        confidence: attr.confidence,
      }));

      // Map pricing
      item.defaultPrice = agentResult.pricing.suggested;
      item.priceMin = agentResult.pricing.min;
      item.priceMax = agentResult.pricing.max;
      item.pricingStrategy = agentResult.pricing.strategy;

      // Map shipping
      item.shippingType = agentResult.shipping.type;
      item.flatRateAmount = agentResult.shipping.flatRateAmount;

      // Set AI confidence
      item.aiConfidenceScore = agentResult.confidence;

      // Keep status as draft/pending (review happens in Sub-Phase 3)
      item.lifecycleStatus = 'draft';
      item.aiReviewState = 'pending';

      // Persist evidence from agent outputs
      await this.persistCompsAsEvidence(
        evidenceBundle.id,
        agentResult.soldComps,
        agentResult.activeComps,
      );
      await this.addPricingSummaryEvidence(
        evidenceBundle.id,
        agentResult.pricing.suggested,
        agentResult.pricing.min,
        agentResult.pricing.max,
        agentResult.researchSnapshot,
      );
      await this.addContentRationaleEvidence(
        evidenceBundle.id,
        agentResult.extracted,
        agentResult.listingContent,
      );

      // Save final item
      await this.itemRepo.save(item);

      // Emit item updated event (AI processing complete)
      this.eventsService.emitItemUpdated(this.mapToDto(item));

      // Emit item review queue changed (item added to review queue)
      const summaryDto = this.mapToSummaryDto(item);
      this.eventsService.emitItemReviewQueueChanged(
        orgId,
        'added',
        item.id,
        summaryDto,
      );

      // Update research run with summary and mark as success
      const summary = `AI intake completed. Title: ${item.title}. Price: $${item.defaultPrice}. Category: ${item.categoryId}. Confidence: ${item.aiConfidenceScore || 0}`;
      researchRun.status = 'success';
      researchRun.completedAt = new Date();
      researchRun.summary = summary;
      await this.researchRunRepo.save(researchRun);

      this.logger.log(`Successfully completed item intake for item ${itemId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

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

