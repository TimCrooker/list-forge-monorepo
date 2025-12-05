import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AiWorkflowsProcessor } from './ai-workflows.processor';
import { PhotoIntakeWorkflow } from './workflows/photo-intake.workflow';
import { ListingIntakeWorkflow } from './workflows/listing-intake.workflow';
import { OpenAIService } from './services/openai.service';
import { Item } from '../items/entities/item.entity';
import { ItemPhoto } from '../items/entities/item-photo.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { WorkflowRun } from './entities/workflow-run.entity';
import { ListingDraft } from '../listing-drafts/entities/listing-draft.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemPhoto, MetaListing, WorkflowRun, ListingDraft, Organization]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    MarketplacesModule,
    EvidenceModule,
  ],
  providers: [
    AiWorkflowsProcessor,
    PhotoIntakeWorkflow,
    ListingIntakeWorkflow,
    OpenAIService,
  ],
  exports: [OpenAIService],
})
export class AiWorkflowsModule {}

