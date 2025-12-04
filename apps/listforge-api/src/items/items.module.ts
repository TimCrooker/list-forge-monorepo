import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { ItemPhoto } from './entities/item-photo.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { StorageModule } from '../storage/storage.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemPhoto, MetaListing]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    StorageModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}

