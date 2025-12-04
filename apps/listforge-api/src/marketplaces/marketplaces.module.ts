import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MarketplaceAccount } from './entities/marketplace-account.entity';
import { MarketplaceListing } from './entities/marketplace-listing.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { Item } from '../items/entities/item.entity';
import { MarketplaceConnectionController } from './marketplace-connection.controller';
import { MarketplaceWebhookController } from './marketplace-webhook.controller';
import { MarketplaceAccountService } from './services/marketplace-account.service';
import { MarketplaceListingService } from './services/marketplace-listing.service';
import { EncryptionService } from './services/encryption.service';
import { PublishProcessor } from './processors/publish.processor';
import { QUEUE_MARKETPLACE_PUBLISH } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceAccount,
      MarketplaceListing,
      MetaListing,
      Item,
    ]),
    BullModule.registerQueue({
      name: QUEUE_MARKETPLACE_PUBLISH,
    }),
  ],
  controllers: [MarketplaceConnectionController, MarketplaceWebhookController],
  providers: [
    MarketplaceAccountService,
    MarketplaceListingService,
    EncryptionService,
    PublishProcessor,
  ],
  exports: [MarketplaceAccountService, MarketplaceListingService],
})
export class MarketplacesModule {}

