import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MarketplaceListing } from '../entities/marketplace-listing.entity';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { EventsService } from '../../events/events.service';

/**
 * Webhook event payload structure
 */
interface WebhookEvent {
  eventType: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook verification result
 */
interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * MarketplaceWebhookService
 *
 * Handles webhook event processing from marketplace platforms (eBay, Amazon, etc.)
 * with enhanced security features.
 *
 * Security Features:
 * - HMAC signature verification with timing-safe comparison
 * - Timestamp validation (rejects events older than 5 minutes)
 * - Payload size limits (1MB max to prevent DoS)
 * - Duplicate detection (in-memory cache of processed webhook IDs)
 * - Audit logging for all webhook events
 *
 * @see Phase 4.2: Complete Webhook Signature Verification
 */
@Injectable()
export class MarketplaceWebhookService {
  private readonly logger = new Logger(MarketplaceWebhookService.name);

  // Security configuration
  private readonly MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
  private readonly MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000; // 5 minutes
  private readonly WEBHOOK_ID_CACHE_SIZE = 1000; // Max cached webhook IDs
  private readonly WEBHOOK_ID_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  // In-memory cache for duplicate detection
  private processedWebhookIds = new Map<string, number>();

  constructor(
    @InjectRepository(MarketplaceListing)
    private listingRepo: Repository<MarketplaceListing>,
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    private configService: ConfigService,
    private auditService: MarketplaceAuditService,
    private eventsService: EventsService,
  ) {
    // Periodically clean up old webhook IDs from cache
    setInterval(() => this.cleanupWebhookCache(), 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Verify eBay webhook signature
   *
   * @param rawBody - Raw request body as string
   * @param signature - Signature from x-ebay-signature header
   * @param timestamp - Timestamp from webhook payload
   * @param webhookId - Unique webhook ID for duplicate detection
   * @returns Verification result
   */
  verifyEbayWebhook(
    rawBody: string,
    signature: string | undefined,
    timestamp: string | undefined,
    webhookId?: string,
  ): WebhookVerificationResult {
    // Check payload size
    if (Buffer.byteLength(rawBody, 'utf8') > this.MAX_PAYLOAD_SIZE) {
      this.logger.warn('eBay webhook payload exceeds size limit');
      return { valid: false, error: 'Payload too large' };
    }

    // Check signature presence
    if (!signature) {
      this.logger.warn('eBay webhook missing signature');
      return { valid: false, error: 'Missing signature' };
    }

    // Verify HMAC signature
    const webhookSecret = this.configService.get<string>('EBAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.error('EBAY_WEBHOOK_SECRET not configured');
      return { valid: false, error: 'Webhook not configured' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('base64');

    try {
      const signaturesMatch = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );

      if (!signaturesMatch) {
        this.logger.warn('eBay webhook signature mismatch');
        return { valid: false, error: 'Invalid signature' };
      }
    } catch (error) {
      this.logger.error('Error comparing webhook signatures', error);
      return { valid: false, error: 'Signature verification failed' };
    }

    // Verify timestamp (prevent replay attacks)
    if (timestamp) {
      const timestampAge = Date.now() - new Date(timestamp).getTime();
      if (timestampAge > this.MAX_TIMESTAMP_AGE_MS) {
        this.logger.warn(
          `eBay webhook timestamp too old: ${timestampAge}ms (max ${this.MAX_TIMESTAMP_AGE_MS}ms)`
        );
        return { valid: false, error: 'Timestamp too old' };
      }

      if (timestampAge < 0) {
        this.logger.warn('eBay webhook timestamp is in the future');
        return { valid: false, error: 'Invalid timestamp' };
      }
    }

    // Check for duplicate webhooks
    if (webhookId) {
      if (this.isWebhookProcessed(webhookId)) {
        this.logger.warn(`Duplicate eBay webhook detected: ${webhookId}`);
        return { valid: false, error: 'Duplicate webhook' };
      }
      this.markWebhookProcessed(webhookId);
    }

    return { valid: true };
  }

  /**
   * Process eBay webhook event
   *
   * Handles various eBay notification types:
   * - ITEM_SOLD: Update listing status to sold
   * - ITEM_ENDED: Update listing status to ended
   * - ITEM_SUSPENDED: Update listing status to error
   * - ORDER_CREATED: Create order record (future)
   *
   * @param event - Webhook event payload
   * @param ipAddress - Client IP address
   */
  async processEbayWebhook(
    event: WebhookEvent & { notificationId?: string; listingId?: string; sellerId?: string },
    ipAddress?: string,
  ): Promise<void> {
    this.logger.log(`Processing eBay webhook: ${event.eventType}`);

    try {
      // Find associated account
      const account = event.sellerId
        ? await this.accountRepo.findOne({
            where: { marketplace: 'EBAY', remoteAccountId: event.sellerId },
          })
        : null;

      // Audit log: Webhook received
      if (account) {
        await this.auditService.logWebhookReceived({
          orgId: account.orgId,
          accountId: account.id,
          marketplace: 'EBAY',
          webhookType: event.eventType,
          verified: true,
          ipAddress,
        }).catch(err => {
          this.logger.error('Failed to log webhook audit', err);
        });
      }

      // Process event based on type
      switch (event.eventType) {
        case 'ITEM_SOLD':
          await this.handleItemSold(event);
          break;
        case 'ITEM_ENDED':
          await this.handleItemEnded(event);
          break;
        case 'ITEM_SUSPENDED':
          await this.handleItemSuspended(event);
          break;
        default:
          this.logger.log(`Unhandled eBay webhook event type: ${event.eventType}`);
      }

      // TODO: Add marketplace webhook events to socket-types
      // if (account) {
      //   this.eventsService.emit(Rooms.org(account.orgId), 'marketplace:webhook:received', {
      //     marketplace: 'EBAY',
      //     eventType: event.eventType,
      //     timestamp: new Date().toISOString(),
      //   });
      // }
    } catch (error) {
      this.logger.error(
        `Error processing eBay webhook (${event.eventType})`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Handle ITEM_SOLD event
   */
  private async handleItemSold(event: { listingId?: string }): Promise<void> {
    if (!event.listingId) {
      this.logger.warn('ITEM_SOLD event missing listingId');
      return;
    }

    const listing = await this.listingRepo.findOne({
      where: { remoteListingId: event.listingId },
    });

    if (listing) {
      listing.status = 'ended'; // Mark as ended (sold is a type of ended)
      listing.lastSyncedAt = new Date();
      await this.listingRepo.save(listing);
      this.logger.log(`Marked listing ${listing.id} as sold`);
    }
  }

  /**
   * Handle ITEM_ENDED event
   */
  private async handleItemEnded(event: { listingId?: string }): Promise<void> {
    if (!event.listingId) {
      this.logger.warn('ITEM_ENDED event missing listingId');
      return;
    }

    const listing = await this.listingRepo.findOne({
      where: { remoteListingId: event.listingId },
    });

    if (listing) {
      listing.status = 'ended';
      listing.lastSyncedAt = new Date();
      await this.listingRepo.save(listing);
      this.logger.log(`Marked listing ${listing.id} as ended`);
    }
  }

  /**
   * Handle ITEM_SUSPENDED event
   */
  private async handleItemSuspended(event: { listingId?: string }): Promise<void> {
    if (!event.listingId) {
      this.logger.warn('ITEM_SUSPENDED event missing listingId');
      return;
    }

    const listing = await this.listingRepo.findOne({
      where: { remoteListingId: event.listingId },
    });

    if (listing) {
      listing.status = 'error';
      listing.errorMessage = 'Listing suspended by marketplace';
      listing.lastSyncedAt = new Date();
      await this.listingRepo.save(listing);
      this.logger.log(`Marked listing ${listing.id} as suspended`);
    }
  }

  /**
   * Check if webhook has already been processed
   */
  private isWebhookProcessed(webhookId: string): boolean {
    return this.processedWebhookIds.has(webhookId);
  }

  /**
   * Mark webhook as processed
   */
  private markWebhookProcessed(webhookId: string): void {
    // Add to cache with current timestamp
    this.processedWebhookIds.set(webhookId, Date.now());

    // Enforce cache size limit (FIFO eviction)
    if (this.processedWebhookIds.size > this.WEBHOOK_ID_CACHE_SIZE) {
      const firstKey = this.processedWebhookIds.keys().next().value;
      this.processedWebhookIds.delete(firstKey);
    }
  }

  /**
   * Clean up old webhook IDs from cache
   */
  private cleanupWebhookCache(): void {
    const now = Date.now();
    const cutoff = now - this.WEBHOOK_ID_CACHE_TTL_MS;

    let removedCount = 0;
    for (const [webhookId, timestamp] of this.processedWebhookIds.entries()) {
      if (timestamp < cutoff) {
        this.processedWebhookIds.delete(webhookId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} old webhook IDs from cache`);
    }
  }
}
