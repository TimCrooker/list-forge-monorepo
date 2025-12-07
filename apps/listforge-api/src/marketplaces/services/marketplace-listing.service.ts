import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { Item } from '../../items/entities/item.entity';
import { QUEUE_MARKETPLACE_PUBLISH, PublishItemListingJob } from '@listforge/queue-types';
import { RequestContext } from '../../common/interfaces/request-context.interface';

/**
 * MarketplaceListingService - Phase 6 Sub-Phase 7
 *
 * Updated to work with unified Item model instead of ListingDraft.
 */
@Injectable()
export class MarketplaceListingService {
  constructor(
    @InjectRepository(MarketplaceListing)
    private listingRepo: Repository<MarketplaceListing>,
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectQueue(QUEUE_MARKETPLACE_PUBLISH)
    private publishQueue: Queue<PublishItemListingJob>,
  ) {}

  /**
   * Publish an item to one or more marketplace accounts
   */
  async publish(
    itemId: string,
    accountIds: string[],
    ctx: RequestContext,
  ): Promise<void> {
    // Verify item exists and belongs to org
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: ctx.currentOrgId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Validate item lifecycle status (must be 'ready' or 'listed')
    if (item.lifecycleStatus !== 'ready' && item.lifecycleStatus !== 'listed') {
      throw new UnprocessableEntityException(
        `Item must be in 'ready' or 'listed' status to publish. Current status: ${item.lifecycleStatus}`,
      );
    }

    // Verify all accounts belong to org and are active
    const accounts = await this.accountRepo
      .createQueryBuilder('account')
      .where('account.id IN (:...accountIds)', { accountIds })
      .andWhere('account.orgId = :orgId', { orgId: ctx.currentOrgId })
      .andWhere('account.status = :status', { status: 'active' })
      .getMany();

    if (accounts.length !== accountIds.length) {
      throw new NotFoundException('One or more marketplace accounts not found');
    }

    // Enqueue publish jobs
    for (const account of accounts) {
      await this.publishQueue.add('publish-item-listing', {
        itemId,
        marketplaceAccountId: account.id,
        orgId: ctx.currentOrgId,
        userId: ctx.userId,
      });
    }
  }

  /**
   * Get all marketplace listings for an item
   */
  async getListings(
    itemId: string,
    ctx: RequestContext,
  ): Promise<MarketplaceListing[]> {
    return await this.listingRepo.find({
      where: { itemId },
      relations: ['marketplaceAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Sync listing status from marketplace
   */
  async syncStatus(listingId: string, ctx: RequestContext): Promise<MarketplaceListing> {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
      relations: ['marketplaceAccount', 'item'],
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found');
    }

    if (listing.marketplaceAccount.orgId !== ctx.currentOrgId) {
      throw new NotFoundException('Marketplace listing not found');
    }

    // This would call the adapter to get current status
    // For now, we'll just return the listing as-is
    // The actual sync will be implemented in the processor

    return listing;
  }
}

