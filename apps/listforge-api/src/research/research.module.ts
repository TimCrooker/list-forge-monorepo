import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ItemResearchRun } from './entities/item-research-run.entity';
import { ItemResearch } from './entities/item-research.entity';
import { Item } from '../items/entities/item.entity';
import { EvidenceModule } from '../evidence/evidence.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

/**
 * Research Module - Phase 6 Sub-Phase 8 + Phase 7 Slice 1 + Slice 4
 *
 * Module for managing item research runs and structured research data.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ItemResearchRun, ItemResearch, Item]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    EvidenceModule,
  ],
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
