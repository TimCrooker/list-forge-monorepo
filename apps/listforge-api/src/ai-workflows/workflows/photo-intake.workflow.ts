import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { ItemPhoto } from '../../items/entities/item-photo.entity';
import { MetaListing } from '../../meta-listings/entities/meta-listing.entity';
import { WorkflowRun } from '../entities/workflow-run.entity';
import { OpenAIService } from '../services/openai.service';
import { MetaListingAiStatus } from '@listforge/core-types';

@Injectable()
export class PhotoIntakeWorkflow {
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
        throw new Error('Item not found');
      }

      const photoUrls = item.photos.map((photo) => photo.storagePath);

      // Step 2: Vision extract
      const extracted = await this.openaiService.analyzePhotos(photoUrls);

      // Step 3: Normalize attributes (simple for now)
      const normalizedAttributes = {
        ...extracted.attributes,
        condition: extracted.condition,
      };

      // Step 4: Price recommendation (placeholder - will be enhanced later)
      const priceSuggested = this.calculatePrice(extracted);
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
        metaListing.attributes = normalizedAttributes;
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

  private calculatePrice(extracted: any): number {
    // Placeholder pricing logic - will be enhanced with comps research later
    // For now, return a default based on category
    const categoryDefaults: Record<string, number> = {
      Electronics: 50,
      Clothing: 20,
      'Home & Garden': 30,
      Books: 10,
      Other: 25,
    };

    return categoryDefaults[extracted.category] || 25;
  }

  private validateFields(
    extracted: any,
    listingContent: any,
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

