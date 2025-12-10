import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MarketplaceAccount } from './entities/marketplace-account.entity';
import { MarketplaceListing } from './entities/marketplace-listing.entity';
import { MarketplaceAuditLog } from './entities/marketplace-audit-log.entity';
import { Item } from '../items/entities/item.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { EventsModule } from '../events/events.module';
import { MarketplaceConnectionController } from './marketplace-connection.controller';
import { MarketplaceWebhookController } from './marketplace-webhook.controller';
import { MarketplaceAccountService } from './services/marketplace-account.service';
import { MarketplaceListingService } from './services/marketplace-listing.service';
import { MarketplaceSyncService } from './services/marketplace-sync.service';
import { AutoPublishService } from './services/auto-publish.service';
import { EncryptionService } from './services/encryption.service';
import { EncryptionValidatorService } from './services/encryption-validator.service';
import { RevokeTokenService } from './services/revoke-token.service';
import { TokenExpirationMonitorService } from './services/token-expiration-monitor.service';
import { MarketplaceAuditService } from './services/marketplace-audit.service';
import { MarketplaceWebhookService } from './services/marketplace-webhook.service';
import { EncryptionKeyRotationService } from './services/encryption-key-rotation.service';
import { PublishProcessor } from './processors/publish.processor';
import { SyncProcessor } from './processors/sync.processor';
import { QUEUE_MARKETPLACE_PUBLISH, QUEUE_MARKETPLACE_SYNC } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceAccount,
      MarketplaceListing,
      MarketplaceAuditLog,
      Item,
      Organization,
    ]),
    BullModule.registerQueue({
      name: QUEUE_MARKETPLACE_PUBLISH,
    }),
    BullModule.registerQueue({
      name: QUEUE_MARKETPLACE_SYNC,
    }),
    EventsModule,
  ],
  controllers: [MarketplaceConnectionController, MarketplaceWebhookController],
  providers: [
    MarketplaceAccountService,
    MarketplaceListingService,
    MarketplaceSyncService,
    AutoPublishService,
    EncryptionService,
    EncryptionValidatorService,
    RevokeTokenService,
    TokenExpirationMonitorService,
    MarketplaceAuditService,
    MarketplaceWebhookService,
    EncryptionKeyRotationService,
    PublishProcessor,
    SyncProcessor,
  ],
  exports: [MarketplaceAccountService, MarketplaceListingService, MarketplaceSyncService, AutoPublishService],
})
export class MarketplacesModule implements OnModuleInit {
  private readonly logger = new Logger(MarketplacesModule.name);

  constructor(private encryptionService: EncryptionService) {}

  /**
   * Validate encryption key configuration on module initialization
   *
   * This ensures that the encryption key is valid before the application
   * starts accepting requests. In production, an invalid key will prevent
   * the application from starting.
   */
  onModuleInit() {
    this.logger.log('Validating marketplace encryption configuration...');
    try {
      this.encryptionService.validateKeyConfiguration();
      this.logger.log('Marketplace encryption configuration validated successfully');
    } catch (error) {
      this.logger.error('Failed to validate encryption configuration', error);
      // Error will be thrown from EncryptionService in production
      // In development, we log and continue
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}

