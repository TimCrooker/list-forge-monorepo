import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublishListingJob, QUEUE_MARKETPLACE_PUBLISH } from '@listforge/queue-types';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';
import { MarketplaceListingStatus } from '@listforge/core-types';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { MetaListing } from '../../meta-listings/entities/meta-listing.entity';
import { MarketplaceAccountService } from '../services/marketplace-account.service';
import { CanonicalListing } from '@listforge/marketplace-adapters';

@Processor(QUEUE_MARKETPLACE_PUBLISH)
@Injectable()
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(
    @InjectRepository(MarketplaceListing)
    private listingRepo: Repository<MarketplaceListing>,
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    @InjectRepository(MetaListing)
    private metaListingRepo: Repository<MetaListing>,
    private accountService: MarketplaceAccountService,
  ) {
    super();
  }

  async process(job: Job<PublishListingJob>): Promise<void> {
    const { metaListingId, marketplaceAccountId, orgId } = job.data;
    this.logger.log(`Processing publish job: ${metaListingId} to account ${marketplaceAccountId}`);

    // Load meta listing with item and photos
    const metaListing = await this.metaListingRepo.findOne({
      where: { id: metaListingId },
      relations: ['item', 'item.photos'],
    });

    if (!metaListing) {
      throw new NotFoundException(`Meta listing not found: ${metaListingId}`);
    }

    // Verify org match
    if (metaListing.item.orgId !== orgId) {
      throw new ForbiddenException('Organization mismatch - cannot publish listing from another organization');
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
        metaListingId,
        marketplaceAccountId,
      },
    });

    if (!listing) {
      listing = this.listingRepo.create({
        metaListingId,
        marketplaceAccountId,
        status: 'pending',
      });
    } else {
      listing.status = 'pending';
      listing.errorMessage = null;
    }

    await this.listingRepo.save(listing);

    try {
      // Get adapter with credentials
      const adapter = await this.accountService.getAdapter(account.id);

      // Extract primitive attributes for the listing (exclude researchSnapshot)
      const listingAttributes: Record<string, string | number | boolean | undefined> = {};
      if (metaListing.attributes) {
        for (const [key, value] of Object.entries(metaListing.attributes)) {
          // Only include primitive values, exclude complex objects like researchSnapshot
          if (key !== 'researchSnapshot' &&
              (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
            listingAttributes[key] = value;
          }
        }
      }

      // Convert meta listing to canonical format
      const canonicalListing: CanonicalListing = {
        title: metaListing.generatedTitle || metaListing.item.title || 'Untitled Item',
        description: metaListing.generatedDescription || '',
        bulletPoints: metaListing.bulletPoints || [],
        categoryId: metaListing.attributes?.categoryId as string | undefined,
        brand: metaListing.brand || undefined,
        model: metaListing.model || undefined,
        condition: metaListing.attributes?.condition as string || 'used',
        price: metaListing.priceSuggested ? Number(metaListing.priceSuggested) : 0,
        currency: 'USD',
        quantity: 1,
        images: metaListing.item.photos?.map((p) => p.storagePath) || [],
        shipping: metaListing.shippingOptions || undefined,
        attributes: Object.keys(listingAttributes).length > 0 ? listingAttributes : undefined,
      };

      // Create listing via adapter
      const result = await adapter.createListing(canonicalListing);

      if (result.success && result.remoteListingId) {
        listing.status = 'live';
        listing.remoteListingId = result.remoteListingId;
        listing.url = result.url || null;
        listing.price = canonicalListing.price;
        listing.lastSyncedAt = new Date();
        listing.errorMessage = null;
      } else {
        listing.status = 'error';
        listing.errorMessage = result.error || 'Unknown error';
      }

      await this.listingRepo.save(listing);
    } catch (error) {
      listing.status = 'error';
      listing.errorMessage = error instanceof Error ? error.message : String(error);
      await this.listingRepo.save(listing);
      throw error;
    }
  }
}

