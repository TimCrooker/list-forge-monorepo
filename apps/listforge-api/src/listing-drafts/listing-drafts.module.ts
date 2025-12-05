import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ListingDraftsController } from './listing-drafts.controller';
import { IngestionController } from './ingestion.controller';
import { ListingDraftsService } from './listing-drafts.service';
import { ListingDraft } from './entities/listing-draft.entity';
import { StorageModule } from '../storage/storage.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([ListingDraft]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    StorageModule,
    EvidenceModule,
  ],
  controllers: [ListingDraftsController, IngestionController],
  providers: [ListingDraftsService],
  exports: [ListingDraftsService],
})
export class ListingDraftsModule {}
