import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SyncListingStatusJob,
  SyncAllListingsJob,
  QUEUE_MARKETPLACE_SYNC,
} from '@listforge/queue-types';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { Item } from '../../items/entities/item.entity';
import { MarketplaceAccountService } from '../services/marketplace-account.service';

/**
 * SyncProcessor - Phase 6 Sub-Phase 7
 *
 * Updated to work with unified Item model.
 * Syncs Item.lifecycleStatus when listing is sold and quantity hits 0.
 */
@Processor(QUEUE_MARKETPLACE_SYNC)
@Injectable()
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    @InjectRepository(MarketplaceListing)
    private listingRepo: Repository<MarketplaceListing>,
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    private accountService: MarketplaceAccountService,
  ) {
    super();
  }

  async process(job: Job<SyncListingStatusJob | SyncAllListingsJob>): Promise<void> {
    if (job.name === 'sync-listing') {
      await this.syncSingleListing(job.data as SyncListingStatusJob);
    } else if (job.name === 'sync-all') {
      await this.syncAllListings(job.data as SyncAllListingsJob);
    }
  }

  /**
   * Sync status for a single listing
   */
  private async syncSingleListing(data: SyncListingStatusJob): Promise<void> {
    const { marketplaceListingId, marketplaceAccountId } = data;
    this.logger.log(`Syncing listing status: ${marketplaceListingId}`);

    const listing = await this.listingRepo.findOne({
      where: { id: marketplaceListingId },
      relations: ['item'],
    });

    if (!listing) {
      this.logger.warn(`Listing not found: ${marketplaceListingId}`);
      return;
    }

    if (!listing.remoteListingId) {
      this.logger.warn(`Listing has no remote ID: ${marketplaceListingId}`);
      return;
    }

    const account = await this.accountRepo.findOne({
      where: { id: marketplaceAccountId },
    });

    if (!account || account.status !== 'active') {
      this.logger.warn(`Account not active: ${marketplaceAccountId}`);
      return;
    }

    try {
      const adapter = await this.accountService.getAdapter(account.id);

      if (!adapter.getListingStatus) {
        this.logger.warn(`Adapter does not support getListingStatus: ${account.marketplace}`);
        return;
      }

      const status = await adapter.getListingStatus(listing.remoteListingId);

      // Update listing status
      const previousStatus = listing.status;
      listing.status = status;
      listing.lastSyncedAt = new Date();
      await this.listingRepo.save(listing);

      this.logger.log(
        `Synced listing ${marketplaceListingId}: ${previousStatus} -> ${status}`
      );

      // If listing is sold, update Item lifecycle status
      if (status === 'sold' && listing.item) {
        const item = await this.itemRepo.findOne({
          where: { id: listing.item.id },
        });

        if (item && item.quantity === 0 && item.lifecycleStatus !== 'sold') {
          item.lifecycleStatus = 'sold';
          await this.itemRepo.save(item);
          this.logger.log(`Updated Item ${item.id} lifecycle status to 'sold' (quantity = 0)`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync listing ${marketplaceListingId}: ${error instanceof Error ? error.message : String(error)}`
      );
      // Don't throw - we don't want to retry failed syncs aggressively
    }
  }

  /**
   * Sync status for all stale listings
   */
  private async syncAllListings(data: SyncAllListingsJob): Promise<void> {
    const { orgId, staleAfterMinutes = 60 } = data;
    this.logger.log(`Syncing all stale listings (stale after ${staleAfterMinutes} minutes)`);

    const staleThreshold = new Date(Date.now() - staleAfterMinutes * 60 * 1000);

    // Build query for listings that need sync
    const queryBuilder = this.listingRepo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.marketplaceAccount', 'account')
      .where('listing.status IN (:...statuses)', {
        statuses: ['listed', 'listing_pending'],
      })
      .andWhere('listing.remoteListingId IS NOT NULL')
      .andWhere('account.status = :accountStatus', { accountStatus: 'active' })
      .andWhere(
        '(listing.lastSyncedAt IS NULL OR listing.lastSyncedAt < :threshold)',
        { threshold: staleThreshold }
      );

    if (orgId) {
      queryBuilder.andWhere('account.orgId = :orgId', { orgId });
    }

    const listings = await queryBuilder.getMany();

    this.logger.log(`Found ${listings.length} listings to sync`);

    // Sync each listing
    for (const listing of listings) {
      try {
        await this.syncSingleListing({
          marketplaceListingId: listing.id,
          marketplaceAccountId: listing.marketplaceAccountId,
        });
      } catch (error) {
        this.logger.error(
          `Failed to sync listing ${listing.id}: ${error instanceof Error ? error.message : String(error)}`
        );
        // Continue with other listings
      }
    }

    this.logger.log(`Completed syncing ${listings.length} listings`);
  }
}
