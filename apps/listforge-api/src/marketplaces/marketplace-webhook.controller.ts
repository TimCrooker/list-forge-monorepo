import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Webhook controller for marketplace callbacks
 * This controller is intentionally NOT guarded by JWT or Org guards
 * as webhooks come from external services like eBay
 */
@Controller('marketplaces/webhooks')
export class MarketplaceWebhookController {
  private readonly logger = new Logger(MarketplaceWebhookController.name);

  constructor(private configService: ConfigService) {}

  /**
   * Handle eBay notification webhooks
   * eBay sends notifications for order updates, inventory changes, etc.
   *
   * Webhook signature verification:
   * https://developer.ebay.com/develop/guides/features/marketplace-notifications
   */
  @Post('ebay')
  async handleEbayWebhook(
    @Body() payload: unknown,
    @Headers('x-ebay-signature') signature: string | undefined,
  ) {
    // Verify webhook signature if configured
    const webhookSecret = this.configService.get<string>('EBAY_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      const isValid = this.verifyEbaySignature(payload, signature, webhookSecret);
      if (!isValid) {
        this.logger.warn('Invalid eBay webhook signature received');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    this.logger.log('Received eBay webhook', {
      hasSignature: !!signature,
      payloadType: typeof payload,
    });

    // Process webhook payload
    // TODO: Implement actual webhook handling based on event type
    // - Inventory updates
    // - Order notifications
    // - Listing status changes

    return { received: true };
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

  private verifyEbaySignature(
    payload: unknown,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const payloadString = typeof payload === 'string'
        ? payload
        : JSON.stringify(payload);

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }
}

