import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingDraft } from '../../listing-drafts/entities/listing-draft.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { WorkflowRun } from '../entities/workflow-run.entity';
import { OpenAIService } from '../services/openai.service';
import { MarketplaceAccountService } from '../../marketplaces/services/marketplace-account.service';
import { EvidenceService } from '../../evidence/evidence.service';
import {
  VisionExtractResult,
  GeneratedListingContent,
  ResearchSnapshot,
  IngestionStatus,
  ReviewStatus,
  ComponentStatus,
  ListingDraftAttribute,
  MarketplaceSoldEvidence,
  MarketplaceActiveEvidence,
  SummaryEvidence,
  AutoApprovalSettings,
  DEFAULT_AUTO_APPROVAL_SETTINGS,
} from '@listforge/core-types';
import { CompResult } from '@listforge/marketplace-adapters';

@Injectable()
export class ListingIntakeWorkflow {
  private readonly logger = new Logger(ListingIntakeWorkflow.name);
  private readonly PIPELINE_VERSION = 'listing-intake-v1.0';

  constructor(
    @InjectRepository(ListingDraft)
    private draftRepo: Repository<ListingDraft>,
    @InjectRepository(WorkflowRun)
    private workflowRunRepo: Repository<WorkflowRun>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    private openaiService: OpenAIService,
    private marketplaceAccountService: MarketplaceAccountService,
    private evidenceService: EvidenceService,
  ) {}

  async execute(
    listingDraftId: string,
    orgId: string,
    userId: string,
  ): Promise<void> {
    // Create workflow run
    const workflowRun = this.workflowRunRepo.create({
      type: 'listing-intake-v1',
      itemId: listingDraftId, // Reuse itemId field for listingDraftId
      orgId,
      userId,
      status: 'running',
      startedAt: new Date(),
    });
    const savedRun = await this.workflowRunRepo.save(workflowRun);

    try {
      // Step 1: Load draft and update status
      const draft = await this.draftRepo.findOne({
        where: { id: listingDraftId, organizationId: orgId },
      });

      if (!draft) {
        throw new NotFoundException(`ListingDraft not found: ${listingDraftId}`);
      }

      // Load organization to get auto-approval settings
      const org = await this.orgRepo.findOne({ where: { id: orgId } });
      const autoApprovalSettings = org?.autoApprovalSettings || DEFAULT_AUTO_APPROVAL_SETTINGS;

      draft.ingestionStatus = 'ai_running';
      draft.aiPipelineVersion = this.PIPELINE_VERSION;
      draft.aiLastRunAt = new Date();
      await this.draftRepo.save(draft);

      // Create evidence bundle
      const evidenceBundle = await this.evidenceService.createBundle(listingDraftId);

      // Get photo URLs from media
      const photoUrls = draft.media.map((m) => m.url);

      if (photoUrls.length === 0) {
        throw new Error('No photos available for analysis');
      }

      // Step 2: Vision Extract
      this.logger.log(`Running vision extract for draft ${listingDraftId}`);
      const extracted = await this.openaiService.analyzePhotos(photoUrls);

      // Store brand and model
      draft.brand = extracted.brand;
      draft.model = extracted.model;
      draft.condition = extracted.condition;

      // Step 3: Category & Attribute Inference
      const attributes = this.buildAttributes(extracted);
      draft.attributes = attributes;

      // Infer category path
      if (extracted.category) {
        draft.categoryPath = [extracted.category];
        draft.primaryCategoryId = extracted.category;
      }

      // Step 4: eBay Comps Research
      let soldComps: CompResult[] = [];
      let activeComps: CompResult[] = [];
      let researchSnapshot: ResearchSnapshot | null = null;

      try {
        const accounts = await this.marketplaceAccountService.listAccounts(orgId);
        const ebayAccount = accounts.find(
          (acc) => acc.marketplace === 'EBAY' && acc.status === 'active',
        );

        if (ebayAccount) {
          const adapter = await this.marketplaceAccountService.getAdapter(ebayAccount.id);

          // Build search keywords
          const keywords = this.buildSearchKeywords(extracted, draft.userTitleHint);

          // Search sold listings
          soldComps = await adapter.searchComps({
            keywords,
            brand: extracted.brand,
            model: extracted.model,
            condition: extracted.condition,
            soldOnly: true,
            limit: 20,
          });

          // Search active listings
          activeComps = await adapter.searchComps({
            keywords,
            brand: extracted.brand,
            model: extracted.model,
            condition: extracted.condition,
            soldOnly: false,
            limit: 20,
          });

          // Persist comps as evidence
          await this.persistCompsAsEvidence(evidenceBundle.id, soldComps, activeComps);

          // Step 5: Calculate ResearchSnapshot
          researchSnapshot = this.calculateResearchSnapshot(soldComps, activeComps);
          draft.researchSnapshot = researchSnapshot;
        }
      } catch (error) {
        this.logger.warn(`Failed to search comps: ${error}`);
        // Continue without comps data
      }

      // Step 6: Pricing Recommendation
      const { suggested, min, max, strategy } = this.calculatePricing(
        extracted,
        researchSnapshot,
      );
      draft.suggestedPrice = suggested;
      draft.priceMin = min;
      draft.priceMax = max;
      draft.pricingStrategy = strategy;

      // Add pricing summary evidence
      await this.addPricingSummaryEvidence(evidenceBundle.id, suggested, min, max, researchSnapshot);

      // Step 7: Title & Description Generation
      this.logger.log(`Generating listing content for draft ${listingDraftId}`);
      const listingContent = await this.openaiService.generateListingContent(
        extracted,
        suggested,
      );

      draft.title = listingContent.title;
      draft.description = listingContent.description;

      // Add title/description rationale evidence
      await this.addContentRationaleEvidence(evidenceBundle.id, extracted, listingContent);

      // Step 8: Shipping Suggestion
      const shippingType = this.suggestShippingType(extracted, suggested);
      draft.shippingType = shippingType;
      if (shippingType === 'flat') {
        draft.flatRateAmount = this.estimateFlatRate(extracted);
      }

      // Step 9: Validation & Status Assignment
      const { componentFlags, confidenceScore, reviewStatus } = this.validateAndAssignStatus(
        draft,
        extracted,
        listingContent,
        researchSnapshot,
        autoApprovalSettings,
        draft.suggestedPrice,
      );

      draft.titleStatus = componentFlags.title;
      draft.descriptionStatus = componentFlags.description;
      draft.categoryStatus = componentFlags.category;
      draft.pricingStatus = componentFlags.pricing;
      draft.attributesStatus = componentFlags.attributes;
      draft.aiConfidenceScore = confidenceScore;
      draft.reviewStatus = reviewStatus;
      draft.ingestionStatus = 'ai_complete';

      // Step 10: Save final draft
      await this.draftRepo.save(draft);

      // Update workflow run
      workflowRun.status = 'completed';
      workflowRun.completedAt = new Date();
      await this.workflowRunRepo.save(workflowRun);

      this.logger.log(`Successfully completed listing intake for draft ${listingDraftId}`);
    } catch (error) {
      this.logger.error(`Workflow failed for draft ${listingDraftId}:`, error);

      // Update workflow run with error
      workflowRun.status = 'failed';
      workflowRun.error = error instanceof Error ? error.message : String(error);
      workflowRun.completedAt = new Date();
      await this.workflowRunRepo.save(workflowRun);

      // Update draft status
      const draft = await this.draftRepo.findOne({
        where: { id: listingDraftId },
      });
      if (draft) {
        draft.ingestionStatus = 'ai_error';
        draft.aiErrorMessage = error instanceof Error ? error.message : String(error);
        await this.draftRepo.save(draft);
      }

      throw error;
    }
  }

  private buildSearchKeywords(
    extracted: VisionExtractResult,
    userHint: string | null,
  ): string {
    const parts: string[] = [];

    if (extracted.brand) parts.push(extracted.brand);
    if (extracted.model) parts.push(extracted.model);

    if (parts.length === 0 && userHint) {
      return userHint;
    }

    if (parts.length === 0 && extracted.category) {
      return extracted.category;
    }

    return parts.join(' ');
  }

  private buildAttributes(extracted: VisionExtractResult): ListingDraftAttribute[] {
    const attrs: ListingDraftAttribute[] = [];

    if (extracted.attributes.color) {
      attrs.push({
        key: 'Color',
        value: String(extracted.attributes.color),
        source: 'ai',
        confidence: 0.8,
      });
    }

    if (extracted.attributes.size) {
      attrs.push({
        key: 'Size',
        value: String(extracted.attributes.size),
        source: 'ai',
        confidence: 0.8,
      });
    }

    if (extracted.attributes.material) {
      attrs.push({
        key: 'Material',
        value: String(extracted.attributes.material),
        source: 'ai',
        confidence: 0.7,
      });
    }

    if (extracted.condition) {
      attrs.push({
        key: 'Condition',
        value: extracted.condition,
        source: 'ai',
        confidence: 0.85,
      });
    }

    if (extracted.brand) {
      attrs.push({
        key: 'Brand',
        value: extracted.brand,
        source: 'ai',
        confidence: 0.9,
      });
    }

    if (extracted.model) {
      attrs.push({
        key: 'Model',
        value: extracted.model,
        source: 'ai',
        confidence: 0.85,
      });
    }

    return attrs;
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

  private calculateResearchSnapshot(
    soldComps: CompResult[],
    activeComps: CompResult[],
  ): ResearchSnapshot {
    const soldPrices = soldComps.map((c) => c.price).filter((p) => p > 0);
    const activePrices = activeComps.map((c) => c.price).filter((p) => p > 0);

    return {
      soldComps: soldComps.length,
      activeComps: activeComps.length,
      soldPrices:
        soldPrices.length > 0
          ? {
              min: Math.min(...soldPrices),
              max: Math.max(...soldPrices),
              avg: soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length,
              median: this.median(soldPrices),
            }
          : null,
      activePrices:
        activePrices.length > 0
          ? {
              min: Math.min(...activePrices),
              max: Math.max(...activePrices),
              avg: activePrices.reduce((a, b) => a + b, 0) / activePrices.length,
              median: this.median(activePrices),
            }
          : null,
      searchedAt: new Date().toISOString(),
    };
  }

  private calculatePricing(
    extracted: VisionExtractResult,
    researchSnapshot: ResearchSnapshot | null,
  ): { suggested: number; min: number; max: number; strategy: 'balanced' } {
    let basePrice = 25; // Default

    // Use comps data if available
    if (researchSnapshot?.soldPrices) {
      // Use median sold price as base, with slight discount for faster sale
      basePrice = researchSnapshot.soldPrices.median * 0.95;
      basePrice = Math.max(basePrice, researchSnapshot.soldPrices.min * 0.9);
    } else if (researchSnapshot?.activePrices) {
      // Use median active price, slightly below to be competitive
      basePrice = researchSnapshot.activePrices.median * 0.9;
      basePrice = Math.max(basePrice, researchSnapshot.activePrices.min * 0.85);
    } else {
      // Fallback to category defaults
      const categoryDefaults: Record<string, number> = {
        Electronics: 50,
        Clothing: 20,
        'Home & Garden': 30,
        Books: 10,
        Collectibles: 40,
        'Sports & Outdoors': 35,
        Other: 25,
      };
      basePrice = categoryDefaults[extracted.category] || 25;
    }

    // Round to sensible prices
    const suggested = Math.round(basePrice * 100) / 100;
    const min = Math.round(suggested * 0.8 * 100) / 100;
    const max = Math.round(suggested * 1.2 * 100) / 100;

    return { suggested, min, max, strategy: 'balanced' };
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
    extracted: VisionExtractResult,
    listingContent: GeneratedListingContent,
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

  private suggestShippingType(
    extracted: VisionExtractResult,
    price: number,
  ): 'flat' | 'calculated' | 'free' {
    // Free shipping for items over $75
    if (price >= 75) {
      return 'free';
    }

    // For smaller, lighter items use flat rate
    const lightCategories = ['Clothing', 'Books', 'Collectibles', 'Jewelry'];
    if (lightCategories.includes(extracted.category)) {
      return 'flat';
    }

    // For electronics and larger items, use calculated
    return 'calculated';
  }

  private estimateFlatRate(extracted: VisionExtractResult): number {
    const categoryRates: Record<string, number> = {
      Books: 4.99,
      Clothing: 6.99,
      Collectibles: 5.99,
      Jewelry: 4.99,
      Electronics: 9.99,
      'Home & Garden': 12.99,
    };

    return categoryRates[extracted.category] || 8.99;
  }

  private validateAndAssignStatus(
    draft: ListingDraft,
    extracted: VisionExtractResult,
    listingContent: GeneratedListingContent,
    researchSnapshot: ResearchSnapshot | null,
    autoApprovalSettings: AutoApprovalSettings,
    suggestedPrice: number | null,
  ): {
    componentFlags: {
      title: ComponentStatus;
      description: ComponentStatus;
      category: ComponentStatus;
      pricing: ComponentStatus;
      attributes: ComponentStatus;
    };
    confidenceScore: number;
    reviewStatus: ReviewStatus;
  } {
    const flags = {
      title: 'ok' as ComponentStatus,
      description: 'ok' as ComponentStatus,
      category: 'ok' as ComponentStatus,
      pricing: 'ok' as ComponentStatus,
      attributes: 'ok' as ComponentStatus,
    };

    let confidence = 1.0;

    // Validate title
    if (!listingContent.title || listingContent.title.length < 10) {
      flags.title = 'needs_review';
      confidence -= 0.1;
    }

    // Validate description
    if (!listingContent.description || listingContent.description.length < 50) {
      flags.description = 'needs_review';
      confidence -= 0.1;
    }

    // Validate category
    if (!extracted.category) {
      flags.category = 'flagged';
      confidence -= 0.15;
    }

    // Validate pricing (flag if no comps available)
    if (!researchSnapshot?.soldPrices && !researchSnapshot?.activePrices) {
      flags.pricing = 'needs_review';
      confidence -= 0.1;
    }

    // Validate attributes
    if (draft.attributes.length < 2) {
      flags.attributes = 'needs_review';
      confidence -= 0.05;
    }

    // Ensure confidence is between 0 and 1
    confidence = Math.max(0, Math.min(1, confidence));

    // Determine review status based on confidence and auto-approval settings
    let reviewStatus: ReviewStatus = 'needs_review';

    // If any component is flagged, force needs_review
    const hasFlags = Object.values(flags).some((f) => f !== 'ok');

    // Check if auto-approval is enabled and criteria are met
    if (autoApprovalSettings.enabled && !hasFlags) {
      const meetsConfidenceThreshold = confidence >= autoApprovalSettings.minConfidenceScore;
      const meetsPriceThreshold =
        autoApprovalSettings.maxPriceThreshold === null ||
        (suggestedPrice !== null && suggestedPrice <= autoApprovalSettings.maxPriceThreshold);

      if (meetsConfidenceThreshold && meetsPriceThreshold) {
        reviewStatus = 'auto_approved';
        this.logger.log(
          `Auto-approved draft with confidence ${confidence}, price $${suggestedPrice}`,
        );
      }
    }

    return {
      componentFlags: flags,
      confidenceScore: confidence,
      reviewStatus,
    };
  }

  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
