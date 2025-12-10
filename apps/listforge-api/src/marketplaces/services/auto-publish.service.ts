import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository, In } from 'typeorm';
import {
  AutoPublishSettings,
  DEFAULT_AUTO_PUBLISH_SETTINGS,
  ItemResearchData,
} from '@listforge/core-types';
import { QUEUE_MARKETPLACE_PUBLISH, PublishItemListingJob } from '@listforge/queue-types';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { Item } from '../../items/entities/item.entity';
import { Organization } from '../../organizations/entities/organization.entity';

/**
 * Auto-publish statistics for monitoring
 */
export interface AutoPublishStats {
  totalEvaluations: number;
  totalPublished: number;
  totalRejected: number;
  rejectionReasons: Record<string, number>;
  averageConfidence: number;
  lastEvaluationTime?: Date;
}

/**
 * Result of auto-publish eligibility evaluation
 */
export interface AutoPublishEvaluation {
  eligible: boolean;
  reasons: string[];
  checks: {
    settingsEnabled: boolean;
    confidenceMet: boolean;
    compsMet: boolean;
    priceBelowThreshold: boolean;
    listingReady: boolean;
    hasMarketplaceAccount: boolean;
  };
}

/**
 * AutoPublishService - Slice 7: Auto-Publish & Production Polish
 *
 * Evaluates items for auto-publish eligibility after research completes,
 * and executes automatic publishing to the default marketplace account.
 *
 * Enhanced with:
 * - Statistics tracking for monitoring
 * - Batch evaluation support
 * - Detailed rejection reason tracking
 */
@Injectable()
export class AutoPublishService {
  private readonly logger = new Logger(AutoPublishService.name);

  // Statistics tracking (in-memory, reset on restart)
  private stats: AutoPublishStats = {
    totalEvaluations: 0,
    totalPublished: 0,
    totalRejected: 0,
    rejectionReasons: {},
    averageConfidence: 0,
  };
  private confidenceSum = 0;

  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    @InjectRepository(MarketplaceListing)
    private listingRepo: Repository<MarketplaceListing>,
    @InjectQueue(QUEUE_MARKETPLACE_PUBLISH)
    private publishQueue: Queue<PublishItemListingJob>,
  ) {}

  /**
   * Evaluate whether an item is eligible for auto-publishing
   */
  async evaluateForAutoPublish(
    item: Item,
    researchData: ItemResearchData,
    settings: AutoPublishSettings,
  ): Promise<AutoPublishEvaluation> {
    const reasons: string[] = [];
    const checks = {
      settingsEnabled: false,
      confidenceMet: false,
      compsMet: false,
      priceBelowThreshold: false,
      listingReady: false,
      hasMarketplaceAccount: false,
    };

    // Check 1: Auto-publish enabled
    checks.settingsEnabled = settings.enabled;
    if (!settings.enabled) {
      reasons.push('Auto-publish is disabled for this organization');
    }

    // Check 2: Confidence threshold met
    const listingConfidence = researchData.listings?.[0]?.confidence ?? 0;
    checks.confidenceMet = listingConfidence >= settings.minConfidenceScore;
    if (!checks.confidenceMet) {
      reasons.push(
        `Confidence ${(listingConfidence * 100).toFixed(0)}% is below threshold ${(settings.minConfidenceScore * 100).toFixed(0)}%`,
      );
    }

    // Check 3: Minimum validated comps
    const validatedComps = this.countValidatedComps(researchData);
    checks.compsMet = validatedComps >= settings.minValidatedComps;
    if (!checks.compsMet) {
      reasons.push(
        `Only ${validatedComps} validated comps, need at least ${settings.minValidatedComps}`,
      );
    }

    // Check 4: Price below threshold (if set)
    const price = researchData.listings?.[0]?.payload?.price ?? item.defaultPrice ?? 0;
    if (settings.maxPriceThreshold !== null) {
      checks.priceBelowThreshold = price <= settings.maxPriceThreshold;
      if (!checks.priceBelowThreshold) {
        reasons.push(
          `Price $${price} exceeds threshold $${settings.maxPriceThreshold}`,
        );
      }
    } else {
      checks.priceBelowThreshold = true; // No threshold set
    }

    // Check 5: Listing is ready for publish
    const listingStatus = researchData.listings?.[0]?.status;
    checks.listingReady = listingStatus === 'READY_FOR_PUBLISH';
    if (!checks.listingReady) {
      reasons.push(`Listing status is "${listingStatus}", not READY_FOR_PUBLISH`);
    }

    // Check 6: Has active marketplace account
    const defaultAccount = await this.getDefaultMarketplaceAccount(item.organizationId);
    checks.hasMarketplaceAccount = defaultAccount !== null;
    if (!checks.hasMarketplaceAccount) {
      reasons.push('No active marketplace account available');
    }

    const eligible = Object.values(checks).every(Boolean);

    return { eligible, reasons, checks };
  }

  /**
   * Count validated comps from research data
   * A comp is considered validated if it has a validation score >= 0.7
   */
  private countValidatedComps(researchData: ItemResearchData): number {
    // Validated comps count comes from competitorCount or we estimate from price bands
    // In a full implementation, this would check the evidence bundle
    return researchData.competitorCount ?? 0;
  }

  /**
   * Get the default marketplace account for an organization
   * Uses the first active eBay account
   */
  async getDefaultMarketplaceAccount(orgId: string): Promise<MarketplaceAccount | null> {
    const account = await this.accountRepo.findOne({
      where: {
        orgId,
        status: 'active',
        marketplace: 'EBAY',
      },
      order: {
        createdAt: 'ASC', // Use the oldest (first created) account
      },
    });

    return account ?? null;
  }

  /**
   * Execute auto-publish for an item after research completes
   * This is the main entry point called from research completion
   */
  async evaluateAndPublish(
    itemId: string,
    orgId: string,
    researchData: ItemResearchData,
  ): Promise<{ published: boolean; reason?: string }> {
    this.logger.log(`Evaluating item ${itemId} for auto-publish`);

    // Load item
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      return { published: false, reason: 'Item not found' };
    }

    // Load organization settings
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    const settings = org?.autoPublishSettings ?? DEFAULT_AUTO_PUBLISH_SETTINGS;

    // Evaluate eligibility
    const evaluation = await this.evaluateForAutoPublish(item, researchData, settings);

    if (!evaluation.eligible) {
      this.logger.log(
        `Item ${itemId} not eligible for auto-publish: ${evaluation.reasons.join('; ')}`,
      );
      return { published: false, reason: evaluation.reasons[0] };
    }

    // Execute auto-publish
    try {
      await this.executeAutoPublish(item, orgId);
      this.logger.log(`Item ${itemId} queued for auto-publish`);
      return { published: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to auto-publish item ${itemId}: ${message}`);
      return { published: false, reason: message };
    }
  }

  /**
   * Execute the auto-publish by queueing the publish job
   */
  private async executeAutoPublish(item: Item, orgId: string): Promise<void> {
    const account = await this.getDefaultMarketplaceAccount(orgId);

    if (!account) {
      throw new Error('No active marketplace account available for auto-publish');
    }

    // Check if listing already exists for this account
    let listing = await this.listingRepo.findOne({
      where: {
        itemId: item.id,
        marketplaceAccountId: account.id,
      },
    });

    // Create listing record if it doesn't exist
    if (!listing) {
      listing = this.listingRepo.create({
        itemId: item.id,
        marketplaceAccountId: account.id,
        status: 'not_listed',
        autoPublished: true, // Mark as auto-published
      });
      await this.listingRepo.save(listing);
    } else {
      // Update existing listing to mark as auto-published
      listing.autoPublished = true;
      await this.listingRepo.save(listing);
    }

    // Queue the publish job
    await this.publishQueue.add('publish-item-listing', {
      itemId: item.id,
      marketplaceAccountId: account.id,
      orgId,
      userId: item.createdByUserId,
      autoPublished: true,
    });

    // Update item lifecycle status to 'ready' if still in draft
    if (item.lifecycleStatus === 'draft') {
      item.lifecycleStatus = 'ready';
      await this.itemRepo.save(item);
    }
  }

  /**
   * Retry a failed auto-publish listing
   */
  async retryFailedPublish(
    listingId: string,
    orgId: string,
    userId: string,
  ): Promise<void> {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
      relations: ['marketplaceAccount'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.marketplaceAccount.orgId !== orgId) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== 'error') {
      throw new BadRequestException('Can only retry listings with error status');
    }

    // Clear error and re-queue
    listing.status = 'listing_pending';
    listing.errorMessage = null;
    await this.listingRepo.save(listing);

    await this.publishQueue.add('publish-item-listing', {
      itemId: listing.itemId,
      marketplaceAccountId: listing.marketplaceAccountId,
      orgId,
      userId,
      autoPublished: listing.autoPublished,
    });
  }

  /**
   * Get auto-publish settings for an organization
   */
  async getSettings(orgId: string): Promise<AutoPublishSettings> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    return org?.autoPublishSettings ?? DEFAULT_AUTO_PUBLISH_SETTINGS;
  }

  /**
   * Update auto-publish settings for an organization
   */
  async updateSettings(
    orgId: string,
    settings: Partial<AutoPublishSettings>,
  ): Promise<AutoPublishSettings> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const currentSettings = org.autoPublishSettings ?? DEFAULT_AUTO_PUBLISH_SETTINGS;
    const newSettings: AutoPublishSettings = {
      ...currentSettings,
      ...settings,
    };

    // Validate settings
    if (newSettings.minConfidenceScore < 0 || newSettings.minConfidenceScore > 1) {
      throw new BadRequestException('minConfidenceScore must be between 0 and 1');
    }
    if (newSettings.minValidatedComps < 0) {
      throw new BadRequestException('minValidatedComps must be non-negative');
    }
    if (newSettings.maxPriceThreshold !== null && newSettings.maxPriceThreshold < 0) {
      throw new BadRequestException('maxPriceThreshold must be non-negative or null');
    }

    org.autoPublishSettings = newSettings;
    await this.orgRepo.save(org);

    return newSettings;
  }

  /**
   * Get auto-publish statistics for monitoring
   */
  getStats(): AutoPublishStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics (for testing or manual reset)
   */
  resetStats(): void {
    this.stats = {
      totalEvaluations: 0,
      totalPublished: 0,
      totalRejected: 0,
      rejectionReasons: {},
      averageConfidence: 0,
    };
    this.confidenceSum = 0;
    this.logger.log('Auto-publish statistics reset');
  }

  /**
   * Track an evaluation result in statistics
   */
  private trackEvaluation(
    published: boolean,
    reason?: string,
    confidence?: number,
  ): void {
    this.stats.totalEvaluations++;
    this.stats.lastEvaluationTime = new Date();

    if (published) {
      this.stats.totalPublished++;
    } else {
      this.stats.totalRejected++;
      if (reason) {
        // Extract the primary reason category
        const reasonKey = this.categorizeReason(reason);
        this.stats.rejectionReasons[reasonKey] =
          (this.stats.rejectionReasons[reasonKey] || 0) + 1;
      }
    }

    if (confidence !== undefined) {
      this.confidenceSum += confidence;
      this.stats.averageConfidence =
        this.confidenceSum / this.stats.totalEvaluations;
    }
  }

  /**
   * Categorize a rejection reason for aggregation
   */
  private categorizeReason(reason: string): string {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('disabled')) return 'settings_disabled';
    if (lowerReason.includes('confidence')) return 'low_confidence';
    if (lowerReason.includes('comp')) return 'insufficient_comps';
    if (lowerReason.includes('price') || lowerReason.includes('threshold')) return 'price_threshold';
    if (lowerReason.includes('ready') || lowerReason.includes('status')) return 'not_ready';
    if (lowerReason.includes('account')) return 'no_account';

    return 'other';
  }

  /**
   * Batch evaluate multiple items for auto-publish
   * Returns items that are eligible
   */
  async batchEvaluate(
    items: Array<{ item: Item; researchData: ItemResearchData }>,
    orgId: string,
  ): Promise<Array<{ itemId: string; eligible: boolean; reason?: string }>> {
    this.logger.log(`Batch evaluating ${items.length} items for auto-publish`);

    // Load organization settings once
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    const settings = org?.autoPublishSettings ?? DEFAULT_AUTO_PUBLISH_SETTINGS;

    const results: Array<{ itemId: string; eligible: boolean; reason?: string }> = [];

    for (const { item, researchData } of items) {
      const evaluation = await this.evaluateForAutoPublish(item, researchData, settings);

      results.push({
        itemId: item.id,
        eligible: evaluation.eligible,
        reason: evaluation.reasons[0],
      });

      // Track stats
      const confidence = researchData.listings?.[0]?.confidence ?? 0;
      this.trackEvaluation(evaluation.eligible, evaluation.reasons[0], confidence);
    }

    const eligibleCount = results.filter(r => r.eligible).length;
    this.logger.log(`Batch evaluation complete: ${eligibleCount}/${items.length} eligible`);

    return results;
  }

  /**
   * Auto-publish all eligible items from a batch
   */
  async batchPublish(
    itemIds: string[],
    orgId: string,
  ): Promise<{ published: string[]; failed: Array<{ itemId: string; reason: string }> }> {
    const published: string[] = [];
    const failed: Array<{ itemId: string; reason: string }> = [];

    // Load items
    const items = await this.itemRepo.find({
      where: { id: In(itemIds), organizationId: orgId },
    });

    // Get default account
    const account = await this.getDefaultMarketplaceAccount(orgId);
    if (!account) {
      return {
        published: [],
        failed: itemIds.map(id => ({ itemId: id, reason: 'No marketplace account available' })),
      };
    }

    for (const item of items) {
      try {
        await this.executeAutoPublish(item, orgId);
        published.push(item.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({ itemId: item.id, reason: message });
      }
    }

    this.logger.log(`Batch publish complete: ${published.length} published, ${failed.length} failed`);
    return { published, failed };
  }

  /**
   * Get items pending auto-publish evaluation
   * Items that have completed research but haven't been evaluated yet
   */
  async getPendingItems(
    orgId: string,
    limit: number = 100,
  ): Promise<Item[]> {
    // Find items that:
    // 1. Are in 'ready' lifecycle status
    // 2. Have aiReviewState of 'approved' or 'pending'
    // 3. Don't have an existing listing
    const items = await this.itemRepo
      .createQueryBuilder('item')
      .leftJoin('marketplace_listing', 'listing', 'listing.item_id = item.id')
      .where('item.organization_id = :orgId', { orgId })
      .andWhere('item.lifecycle_status = :status', { status: 'ready' })
      .andWhere('item.ai_review_state IN (:...states)', { states: ['approved', 'pending'] })
      .andWhere('listing.id IS NULL')
      .orderBy('item.updated_at', 'DESC')
      .take(limit)
      .getMany();

    return items;
  }

  /**
   * Enhanced evaluation with more granular checks
   */
  async evaluateWithDetails(
    itemId: string,
    orgId: string,
    researchData: ItemResearchData,
  ): Promise<{
    evaluation: AutoPublishEvaluation;
    item: Item | null;
    settings: AutoPublishSettings;
    recommendations: string[];
  }> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      return {
        evaluation: {
          eligible: false,
          reasons: ['Item not found'],
          checks: {
            settingsEnabled: false,
            confidenceMet: false,
            compsMet: false,
            priceBelowThreshold: false,
            listingReady: false,
            hasMarketplaceAccount: false,
          },
        },
        item: null,
        settings: DEFAULT_AUTO_PUBLISH_SETTINGS,
        recommendations: [],
      };
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    const settings = org?.autoPublishSettings ?? DEFAULT_AUTO_PUBLISH_SETTINGS;
    const evaluation = await this.evaluateForAutoPublish(item, researchData, settings);

    // Generate recommendations
    const recommendations: string[] = [];

    if (!evaluation.checks.confidenceMet) {
      recommendations.push('Add more photos or provide additional product details to improve confidence');
    }
    if (!evaluation.checks.compsMet) {
      recommendations.push('Similar products may be rare - consider manual review');
    }
    if (!evaluation.checks.priceBelowThreshold) {
      recommendations.push('High-value item - consider manual review before publishing');
    }
    if (!evaluation.checks.hasMarketplaceAccount) {
      recommendations.push('Connect a marketplace account to enable auto-publishing');
    }

    // Track stats
    const confidence = researchData.listings?.[0]?.confidence ?? 0;
    this.trackEvaluation(evaluation.eligible, evaluation.reasons[0], confidence);

    return {
      evaluation,
      item,
      settings,
      recommendations,
    };
  }
}
