import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MarketplaceAccount } from './entities/marketplace-account.entity';
import { MarketplaceListing } from './entities/marketplace-listing.entity';
import { Item } from '../items/entities/item.entity';
import { MarketplaceConnectionController } from './marketplace-connection.controller';
import { MarketplaceWebhookController } from './marketplace-webhook.controller';
import { MarketplaceAccountService } from './services/marketplace-account.service';
import { MarketplaceListingService } from './services/marketplace-listing.service';
import { MarketplaceSyncService } from './services/marketplace-sync.service';
import { EncryptionService } from './services/encryption.service';
import { PublishProcessor } from './processors/publish.processor';
import { SyncProcessor } from './processors/sync.processor';
import { QUEUE_MARKETPLACE_PUBLISH, QUEUE_MARKETPLACE_SYNC } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceAccount,
      MarketplaceListing,
      Item,
    ]),
    BullModule.registerQueue({
      name: QUEUE_MARKETPLACE_PUBLISH,
    }),
    BullModule.registerQueue({
      name: QUEUE_MARKETPLACE_SYNC,
    }),
  ],
  controllers: [MarketplaceConnectionController, MarketplaceWebhookController],
  providers: [
    MarketplaceAccountService,
    MarketplaceListingService,
    MarketplaceSyncService,
    EncryptionService,
    PublishProcessor,
    SyncProcessor,
  ],
  exports: [MarketplaceAccountService, MarketplaceListingService, MarketplaceSyncService],
})
export class MarketplacesModule {}

