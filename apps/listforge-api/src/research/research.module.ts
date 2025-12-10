import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ResearchActivityLoggerService } from './services/research-activity-logger.service';
import { ItemResearchRun } from './entities/item-research-run.entity';
import { ItemResearch } from './entities/item-research.entity';
import { ResearchActivityLog } from './entities/research-activity-log.entity';
import { Item } from '../items/entities/item.entity';
import { EvidenceModule } from '../evidence/evidence.module';
import { EventsModule } from '../events/events.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

/**
 * Research Module - Phase 6 Sub-Phase 8 + Phase 7 Slice 1 + Slice 4
 *
 * Module for managing item research runs and structured research data.
 * Includes activity logging for granular research event tracking.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ItemResearchRun, ItemResearch, ResearchActivityLog, Item]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    EvidenceModule,
    EventsModule,
  ],
  controllers: [ResearchController],
  providers: [ResearchService, ResearchActivityLoggerService],
  exports: [ResearchService, ResearchActivityLoggerService],
})
export class ResearchModule {}
