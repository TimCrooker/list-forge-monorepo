import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AiWorkflowsProcessor } from './ai-workflows.processor';
import { PhotoIntakeWorkflow } from './workflows/photo-intake.workflow';
import { OpenAIService } from './services/openai.service';
import { Item } from '../items/entities/item.entity';
import { ItemPhoto } from '../items/entities/item-photo.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { WorkflowRun } from './entities/workflow-run.entity';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ItemPhoto, MetaListing, WorkflowRun]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    MarketplacesModule,
  ],
  providers: [
    AiWorkflowsProcessor,
    PhotoIntakeWorkflow,
    OpenAIService,
  ],
  exports: [OpenAIService],
})
export class AiWorkflowsModule {}

