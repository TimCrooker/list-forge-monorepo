import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AiWorkflowsProcessor } from './ai-workflows.processor';
import { ItemIntakeWorkflow } from './workflows/item-intake.workflow';
import { OpenAIService } from './services/openai.service';
import { ResearchGraphService } from './services/research-graph.service';
import { ChatGraphService } from './services/chat-graph.service';
import { PostgresCheckpointerService } from './checkpointers/postgres.checkpointer';
import { LLMConfigService } from './config/llm.config';
import { WorkflowRun } from './entities/workflow-run.entity';
import { Item } from '../items/entities/item.entity';
import { ItemResearchRun } from '../research/entities/item-research-run.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { EventsModule } from '../events/events.module';
import { ResearchModule } from '../research/research.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import { ListingAgentService } from './services/listing-agent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowRun, Item, ItemResearchRun, Organization]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
    MarketplacesModule,
    EvidenceModule,
    EventsModule,
    ResearchModule,
  ],
  providers: [
    AiWorkflowsProcessor,
    ItemIntakeWorkflow,
    OpenAIService,
    ListingAgentService,
    PostgresCheckpointerService,
    LLMConfigService,
    ResearchGraphService,
    ChatGraphService,
  ],
  exports: [OpenAIService, ResearchGraphService, ChatGraphService],
})
export class AiWorkflowsModule {}

