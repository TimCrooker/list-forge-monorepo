import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
  RawBodyRequest,
  Req,
  Ip,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { MarketplaceWebhookService } from './services/marketplace-webhook.service';
import { MarketplaceAuditService } from './services/marketplace-audit.service';

/**
 * Webhook controller for marketplace callbacks
 * This controller is intentionally NOT guarded by JWT or Org guards
 * as webhooks come from external services like eBay
 *
 * Enhanced Security (Phase 4.2):
 * - HMAC signature verification
 * - Timestamp validation
 * - Payload size limits
 * - Duplicate detection
 * - Audit logging
 */
@Controller('marketplaces/webhooks')
export class MarketplaceWebhookController {
  private readonly logger = new Logger(MarketplaceWebhookController.name);

  constructor(
    private configService: ConfigService,
    private webhookService: MarketplaceWebhookService,
    private auditService: MarketplaceAuditService,
  ) {}

  /**
   * Handle eBay notification webhooks
   * eBay sends notifications for order updates, inventory changes, etc.
   *
   * Enhanced with full signature verification, timestamp validation,
   * and duplicate detection.
   *
   * Webhook signature verification:
   * https://developer.ebay.com/develop/guides/features/marketplace-notifications
   */
  @Post('ebay')
  async handleEbayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
    @Headers('x-ebay-signature') signature: string | undefined,
    @Ip() ipAddress: string,
  ) {
    // Get raw body for signature verification
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(payload);

    // Extract webhook metadata
    const timestamp = payload?.timestamp;
    const webhookId = payload?.notificationId || payload?.notification_id;

    // Verify webhook (signature, timestamp, duplicate check)
    const verification = this.webhookService.verifyEbayWebhook(
      rawBody,
      signature,
      timestamp,
      webhookId,
    );

    if (!verification.valid) {
      this.logger.warn(`eBay webhook verification failed: ${verification.error}`);

      // Audit log: Webhook rejected
      await this.auditService.logWebhookReceived({
        orgId: 'unknown', // We don't know the org at this point
        marketplace: 'EBAY',
        webhookType: payload?.eventType || 'unknown',
        verified: false,
        ipAddress,
      }).catch(err => {
        this.logger.error('Failed to log rejected webhook audit', err);
      });

      throw new BadRequestException(verification.error || 'Webhook verification failed');
    }

    this.logger.log(`Received valid eBay webhook: ${payload?.eventType || 'unknown'}`);

    // Process webhook event
    try {
      await this.webhookService.processEbayWebhook(payload, ipAddress);
      return { received: true, processed: true };
    } catch (error) {
      this.logger.error('Error processing eBay webhook', error);
      return { received: true, processed: false };
    }
  }

  /**
   * eBay webhook verification endpoint
   * eBay sends a challenge token that must be echoed back
   */
  @Post('ebay/verify')
  verifyEbayEndpoint(@Body() body: { challengeCode: string }) {
    if (!body.challengeCode) {
      throw new BadRequestException('Challenge code required');
    }

    const verificationToken = this.configService.get<string>('EBAY_VERIFICATION_TOKEN');
    const endpoint = this.configService.get<string>('EBAY_WEBHOOK_ENDPOINT');

    if (!verificationToken || !endpoint) {
      this.logger.error('eBay webhook verification tokens not configured');
      throw new BadRequestException('Webhook not configured');
    }

    // Create challenge response per eBay docs
    const hash = crypto
      .createHash('sha256')
      .update(body.challengeCode + verificationToken + endpoint)
      .digest('hex');

    return { challengeResponse: hash };
  }
}

