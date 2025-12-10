import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublishItemListingJob, QUEUE_MARKETPLACE_PUBLISH } from '@listforge/queue-types';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { Item } from '../../items/entities/item.entity';
import { MarketplaceAccountService } from '../services/marketplace-account.service';
import { CanonicalListing } from '@listforge/marketplace-adapters';

/**
 * PublishProcessor - Phase 6 Sub-Phase 7 + Slice 7
 *
 * Updated to work with unified Item model instead of ListingDraft.
 * Syncs Item.lifecycleStatus when listing goes live.
 * Slice 7: Persists autoPublished flag from job data.
 */
@Processor(QUEUE_MARKETPLACE_PUBLISH)
@Injectable()
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

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

  async process(job: Job<PublishItemListingJob>): Promise<void> {
    const { itemId, marketplaceAccountId, orgId, autoPublished } = job.data;
    this.logger.log(`Processing publish job: Item ${itemId} to account ${marketplaceAccountId}${autoPublished ? ' (auto-publish)' : ''}`);

    // Load item
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item not found: ${itemId}`);
    }

    // Load marketplace account
    const account = await this.accountRepo.findOne({
      where: { id: marketplaceAccountId, orgId },
    });

    if (!account) {
      throw new NotFoundException(`Marketplace account not found: ${marketplaceAccountId}`);
    }

    if (account.status !== 'active') {
      throw new UnprocessableEntityException(`Marketplace account is not active: ${marketplaceAccountId}`);
    }

    // Create or get existing listing record
    let listing = await this.listingRepo.findOne({
      where: {
        itemId,
        marketplaceAccountId,
      },
    });

    if (!listing) {
      listing = this.listingRepo.create({
        itemId,
        marketplaceAccountId,
        status: 'listing_pending',
        autoPublished: autoPublished ?? false,
      });
    } else {
      listing.status = 'listing_pending';
      listing.errorMessage = null;
      // Preserve autoPublished if already set, or set from job data
      if (autoPublished !== undefined) {
        listing.autoPublished = autoPublished;
      }
    }

    await this.listingRepo.save(listing);

    try {
      // Get adapter with credentials
      const adapter = await this.accountService.getAdapter(account.id);

      // Extract primitive attributes
      const listingAttributes: Record<string, string | number | boolean | undefined> = {};
      for (const attr of item.attributes || []) {
        if (attr.key && attr.value !== undefined && attr.value !== null) {
          listingAttributes[attr.key] = attr.value as string | number | boolean;
        }
      }

      // Use marketplace-specific overrides if present, otherwise fall back to Item fields
      const finalTitle = listing.title || item.title || item.userTitleHint || 'Untitled Item';
      const finalDescription = listing.description || item.description || '';
      const finalPrice = listing.price || item.defaultPrice || 0;
      const finalCategoryId = listing.marketplaceCategoryId || item.categoryId || undefined;

      // Convert item to canonical format
      const canonicalListing: CanonicalListing = {
        title: finalTitle,
        description: finalDescription,
        bulletPoints: [],
        categoryId: finalCategoryId,
        brand: item.attributes.find(a => a.key === 'Brand')?.value,
        model: item.attributes.find(a => a.key === 'Model')?.value,
        condition: item.condition || 'used',
        price: Number(finalPrice),
        currency: item.currency || 'USD',
        quantity: item.quantity || 1,
        images: item.media?.map((m) => m.url) || [],
        shipping: undefined,
        attributes: Object.keys(listingAttributes).length > 0 ? listingAttributes : undefined,
      };

      // Create listing via adapter
      const result = await adapter.createListing(canonicalListing);

      if (result.success && result.remoteListingId) {
        listing.status = 'listed';
        listing.remoteListingId = result.remoteListingId;
        listing.url = result.url || null;
        listing.price = canonicalListing.price;
        listing.lastSyncedAt = new Date();
        listing.errorMessage = null;

        await this.listingRepo.save(listing);

        // Sync Item lifecycle status: set to 'listed' when any marketplace listing goes live
        if (item.lifecycleStatus === 'ready') {
          item.lifecycleStatus = 'listed';
          await this.itemRepo.save(item);
          this.logger.log(`Updated Item ${itemId} lifecycle status to 'listed'`);
        }
      } else {
        listing.status = 'error';
        listing.errorMessage = result.error || 'Unknown error';
        await this.listingRepo.save(listing);
      }
    } catch (error) {
      listing.status = 'error';
      listing.errorMessage = error instanceof Error ? error.message : String(error);
      await this.listingRepo.save(listing);
      throw error;
    }
  }
}

