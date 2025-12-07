import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { StorageModule } from '../storage/storage.module';
import { EventsModule } from '../events/events.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

/**
 * Items Module - Phase 6 Unified Item Model
 *
 * Module for managing the unified Item entity.
 * Includes MarketplacesModule for marketplace listing integration (Sub-Phase 7).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Item]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    StorageModule,
    EventsModule,
    EvidenceModule,
    MarketplacesModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}

