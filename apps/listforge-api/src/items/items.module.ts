import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { QuickEvalService } from './services/quick-eval.service';
import { Item } from './entities/item.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { StorageModule } from '../storage/storage.module';
import { EventsModule } from '../events/events.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';
import { ChatModule } from '../chat/chat.module';
import { AiWorkflowsModule } from '../ai-workflows/ai-workflows.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

/**
 * Items Module - Phase 6 Unified Item Model
 *
 * Module for managing the unified Item entity.
 * Includes MarketplacesModule for marketplace listing integration (Sub-Phase 7).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Item, Organization]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    StorageModule,
    EventsModule,
    EvidenceModule,
    MarketplacesModule,
    OrganizationsModule, // For TeamOrgGuard
    forwardRef(() => ChatModule), // Handle circular dependency with ChatModule
    forwardRef(() => AiWorkflowsModule), // Handle circular dependency with AiWorkflowsModule
  ],
  controllers: [ItemsController],
  providers: [ItemsService, QuickEvalService],
  exports: [ItemsService],
})
export class ItemsModule {}

