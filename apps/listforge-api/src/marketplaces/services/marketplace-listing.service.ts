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
import { MetaListing } from '../../meta-listings/entities/meta-listing.entity';
import { QUEUE_MARKETPLACE_PUBLISH, PublishListingJob } from '@listforge/queue-types';
import { RequestContext } from '../../common/interfaces/request-context.interface';

@Injectable()
export class MarketplaceListingService {
  constructor(
    @InjectRepository(MarketplaceListing)
    private listingRepo: Repository<MarketplaceListing>,
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    @InjectRepository(MetaListing)
    private metaListingRepo: Repository<MetaListing>,
    @InjectQueue(QUEUE_MARKETPLACE_PUBLISH)
    private publishQueue: Queue<PublishListingJob>,
  ) {}

  /**
   * Publish a meta listing to one or more marketplace accounts
   */
  async publish(
    metaListingId: string,
    accountIds: string[],
    ctx: RequestContext,
  ): Promise<void> {
    // Verify meta listing exists and belongs to org
    const metaListing = await this.metaListingRepo.findOne({
      where: { id: metaListingId },
      relations: ['item'],
    });

    if (!metaListing) {
      throw new NotFoundException('Meta listing not found');
    }

    if (metaListing.item.orgId !== ctx.currentOrgId) {
      throw new NotFoundException('Meta listing not found');
    }

    if (metaListing.aiStatus !== 'complete') {
      throw new UnprocessableEntityException('Listing is not ready for publishing. AI processing must be complete.');
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
      await this.publishQueue.add('publish-listing', {
        metaListingId,
        marketplaceAccountId: account.id,
        orgId: ctx.currentOrgId,
        userId: ctx.userId,
      });
    }
  }

  /**
   * Get all marketplace listings for a meta listing
   */
  async getListings(
    metaListingId: string,
    ctx: RequestContext,
  ): Promise<MarketplaceListing[]> {
    // Verify meta listing belongs to org
    const metaListing = await this.metaListingRepo.findOne({
      where: { id: metaListingId },
      relations: ['item'],
    });

    if (!metaListing) {
      throw new NotFoundException('Meta listing not found');
    }

    if (metaListing.item.orgId !== ctx.currentOrgId) {
      throw new NotFoundException('Meta listing not found');
    }

    return await this.listingRepo.find({
      where: { metaListingId },
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
      relations: ['marketplaceAccount', 'metaListing'],
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

