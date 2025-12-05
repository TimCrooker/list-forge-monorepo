import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  QUEUE_MARKETPLACE_SYNC,
  SyncListingStatusJob,
  SyncAllListingsJob,
} from '@listforge/queue-types';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';

@Injectable()
export class MarketplaceSyncService implements OnModuleInit {
  private readonly logger = new Logger(MarketplaceSyncService.name);

  constructor(
    @InjectQueue(QUEUE_MARKETPLACE_SYNC)
    private syncQueue: Queue<SyncListingStatusJob | SyncAllListingsJob>,
    @InjectRepository(MarketplaceListing)
    private listingRepo: Repository<MarketplaceListing>,
  ) {}

  async onModuleInit() {
    // Set up a repeatable job to sync all stale listings every hour
    await this.setupScheduledSync();
  }

  /**
   * Set up scheduled sync job that runs every hour
   */
  private async setupScheduledSync(): Promise<void> {
    const jobName = 'sync-all';

    // Remove any existing repeatable jobs with the same name
    const existingJobs = await this.syncQueue.getRepeatableJobs();
    for (const job of existingJobs) {
      if (job.name === jobName) {
        await this.syncQueue.removeRepeatableByKey(job.key);
      }
    }

    // Add a new repeatable job that runs every hour
    await this.syncQueue.add(
      jobName,
      { staleAfterMinutes: 60 } as SyncAllListingsJob,
      {
        repeat: {
          pattern: '0 * * * *', // Every hour at minute 0
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    this.logger.log('Scheduled hourly marketplace listing sync');
  }

  /**
   * Manually trigger sync for a single listing
   */
  async syncListing(listingId: string): Promise<void> {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    await this.syncQueue.add('sync-listing', {
      marketplaceListingId: listing.id,
      marketplaceAccountId: listing.marketplaceAccountId,
    } as SyncListingStatusJob);

    this.logger.log(`Queued sync for listing ${listingId}`);
  }

  /**
   * Manually trigger sync for all stale listings
   */
  async syncAllListings(orgId?: string, staleAfterMinutes = 60): Promise<void> {
    await this.syncQueue.add('sync-all', {
      orgId,
      staleAfterMinutes,
    } as SyncAllListingsJob);

    this.logger.log(
      `Queued sync-all job${orgId ? ` for org ${orgId}` : ''}`
    );
  }

  /**
   * Get sync queue status
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    return {
      waiting: await this.syncQueue.getWaitingCount(),
      active: await this.syncQueue.getActiveCount(),
      completed: await this.syncQueue.getCompletedCount(),
      failed: await this.syncQueue.getFailedCount(),
    };
  }
}
