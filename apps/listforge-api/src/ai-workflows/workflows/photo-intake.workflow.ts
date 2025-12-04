import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { ItemPhoto } from '../../items/entities/item-photo.entity';
import { MetaListing } from '../../meta-listings/entities/meta-listing.entity';
import { WorkflowRun } from '../entities/workflow-run.entity';
import { OpenAIService } from '../services/openai.service';
import { MarketplaceAccountService } from '../../marketplaces/services/marketplace-account.service';
import {
  MetaListingAiStatus,
  VisionExtractResult,
  GeneratedListingContent,
  ResearchSnapshot,
} from '@listforge/core-types';
import { CompResult } from '@listforge/marketplace-adapters';

@Injectable()
export class PhotoIntakeWorkflow {
  private readonly logger = new Logger(PhotoIntakeWorkflow.name);

  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ItemPhoto)
    private photoRepo: Repository<ItemPhoto>,
    @InjectRepository(MetaListing)
    private metaListingRepo: Repository<MetaListing>,
    @InjectRepository(WorkflowRun)
    private workflowRunRepo: Repository<WorkflowRun>,
    private openaiService: OpenAIService,
    private marketplaceAccountService: MarketplaceAccountService,
  ) {}

  async execute(
    itemId: string,
    orgId: string,
    userId: string,
  ): Promise<void> {
    // Create workflow run
    const workflowRun = this.workflowRunRepo.create({
      type: 'photo-intake-v1',
      itemId,
      orgId,
      userId,
      status: 'running',
      startedAt: new Date(),
    });
    const savedRun = await this.workflowRunRepo.save(workflowRun);

    try {
      // Update meta listing status to in_progress
      const metaListing = await this.metaListingRepo.findOne({
        where: { itemId },
      });
      if (metaListing) {
        metaListing.aiStatus = 'in_progress';
        await this.metaListingRepo.save(metaListing);
      }

      // Step 1: Load item and photos
      const item = await this.itemRepo.findOne({
        where: { id: itemId },
        relations: ['photos'],
      });

      if (!item) {
        throw new NotFoundException(`Item not found: ${itemId}`);
      }

      const photoUrls = item.photos.map((photo) => photo.storagePath);

      // Step 2: Vision extract
      const extracted = await this.openaiService.analyzePhotos(photoUrls);

      // Step 3: Normalize attributes (simple for now)
      const normalizedAttributes = {
        ...extracted.attributes,
        condition: extracted.condition,
      };

      // Step 3.5: Search comps (if marketplace account available)
      let compsResults: CompResult[] = [];
      let researchSnapshot: ResearchSnapshot | null = null;
      try {
        const accounts = await this.marketplaceAccountService.listAccounts(orgId);
        const ebayAccount = accounts.find((acc) => acc.marketplace === 'EBAY' && acc.status === 'active');

        if (ebayAccount) {
          const adapter = await this.marketplaceAccountService.getAdapter(ebayAccount.id);

          // Search sold listings for pricing data
          const soldComps = await adapter.searchComps({
            keywords: extracted.brand && extracted.model
              ? `${extracted.brand} ${extracted.model}`
              : extracted.category || '',
            brand: extracted.brand,
            model: extracted.model,
            condition: extracted.condition,
            soldOnly: true,
            limit: 20,
          });

          // Search active listings
          const activeComps = await adapter.searchComps({
            keywords: extracted.brand && extracted.model
              ? `${extracted.brand} ${extracted.model}`
              : extracted.category || '',
            brand: extracted.brand,
            model: extracted.model,
            condition: extracted.condition,
            soldOnly: false,
            limit: 20,
          });

          compsResults = [...soldComps, ...activeComps];

          // Calculate pricing statistics
          const soldPrices = soldComps.map((c) => c.price).filter((p) => p > 0);
          const activePrices = activeComps.map((c) => c.price).filter((p) => p > 0);

          researchSnapshot = {
            soldComps: soldComps.length,
            activeComps: activeComps.length,
            soldPrices: soldPrices.length > 0 ? {
              min: Math.min(...soldPrices),
              max: Math.max(...soldPrices),
              avg: soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length,
              median: this.median(soldPrices),
            } : null,
            activePrices: activePrices.length > 0 ? {
              min: Math.min(...activePrices),
              max: Math.max(...activePrices),
              avg: activePrices.reduce((a, b) => a + b, 0) / activePrices.length,
              median: this.median(activePrices),
            } : null,
            searchedAt: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Failed to search comps:', error);
        // Continue without comps data
      }

      // Step 4: Price recommendation (enhanced with comps if available)
      const priceSuggested = this.calculatePrice(extracted, researchSnapshot);
      const priceMin = priceSuggested * 0.8;
      const priceMax = priceSuggested * 1.2;

      // Step 5: Generate meta listing content
      const listingContent = await this.openaiService.generateListingContent(
        extracted,
        priceSuggested,
      );

      // Step 6: Validate and finalize
      const missingFields = this.validateFields(extracted, listingContent);
      const aiStatus: MetaListingAiStatus = missingFields.length > 0
        ? 'needs_review'
        : 'complete';

      // Step 7: Update item title
      item.title = listingContent.title;
      await this.itemRepo.save(item);

      // Step 8: Persist meta listing (metaListing already loaded and set to in_progress above)
      if (metaListing) {
        metaListing.aiStatus = aiStatus;
        metaListing.category = extracted.category;
        metaListing.brand = extracted.brand;
        metaListing.model = extracted.model;
        metaListing.attributes = {
          ...normalizedAttributes,
          researchSnapshot,
        };
        metaListing.generatedTitle = listingContent.title;
        metaListing.generatedDescription = listingContent.description;
        metaListing.bulletPoints = listingContent.bulletPoints;
        metaListing.priceSuggested = priceSuggested;
        metaListing.priceMin = priceMin;
        metaListing.priceMax = priceMax;
        metaListing.missingFields = missingFields.length > 0 ? missingFields : null;
        await this.metaListingRepo.save(metaListing);
      }

      // Update workflow run
      workflowRun.status = 'completed';
      workflowRun.completedAt = new Date();
      await this.workflowRunRepo.save(workflowRun);
    } catch (error) {
      // Update workflow run with error
      workflowRun.status = 'failed';
      workflowRun.error = error instanceof Error ? error.message : String(error);
      workflowRun.completedAt = new Date();
      await this.workflowRunRepo.save(workflowRun);

      // Update meta listing status
      const metaListing = await this.metaListingRepo.findOne({
        where: { itemId },
      });
      if (metaListing) {
        metaListing.aiStatus = 'failed';
        await this.metaListingRepo.save(metaListing);
      }

      throw error;
    }
  }

  private calculatePrice(
    extracted: VisionExtractResult,
    researchSnapshot: ResearchSnapshot | null,
  ): number {
    // Use comps data if available
    if (researchSnapshot?.soldPrices) {
      // Use median sold price as base, with slight discount for faster sale
      const basePrice = researchSnapshot.soldPrices.median;
      return Math.max(basePrice * 0.95, researchSnapshot.soldPrices.min * 0.9);
    }

    if (researchSnapshot?.activePrices) {
      // Use median active price, slightly below to be competitive
      const basePrice = researchSnapshot.activePrices.median;
      return Math.max(basePrice * 0.9, researchSnapshot.activePrices.min * 0.85);
    }

    // Fallback to category defaults
    const categoryDefaults: Record<string, number> = {
      Electronics: 50,
      Clothing: 20,
      'Home & Garden': 30,
      Books: 10,
      Other: 25,
    };

    return categoryDefaults[extracted.category] || 25;
  }

  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private validateFields(
    extracted: VisionExtractResult,
    listingContent: GeneratedListingContent,
  ): string[] {
    const missing: string[] = [];

    if (!extracted.category) {
      missing.push('category');
    }
    if (!listingContent.title) {
      missing.push('title');
    }
    if (!listingContent.description) {
      missing.push('description');
    }

    return missing;
  }
}

