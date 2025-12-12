import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AiWorkflowsProcessor } from './ai-workflows.processor';
import { ItemIntakeWorkflow } from './workflows/item-intake.workflow';
import { OpenAIService } from './services/openai.service';
import { WebSearchService } from './services/web-search.service';
import { OCRService } from './services/ocr.service';
import { UPCLookupService } from './services/upc-lookup.service';
import { MarketplaceSchemaService } from './services/marketplace-schema.service';
import { PricingStrategyService } from './services/pricing-strategy.service';
import { ListingAssemblyService } from './services/listing-assembly.service';
import { ResearchGraphService } from './services/research-graph.service';
import { ChatGraphService } from './services/chat-graph.service';
import { ChatContextService } from './services/chat-context.service';
import { ActionEmitterService } from './services/action-emitter.service';
import { KeepaService } from './services/keepa.service';
import { AmazonCatalogService } from './services/amazon-catalog.service';
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
import { ChatModule } from '../chat/chat.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import { PromptTemplateService } from './services/prompt-template.service';
import { GoalOrchestratorService } from './orchestration/goal-orchestrator.service';
import { RecoveryService } from './services/recovery.service';
import { ResearchHealthService } from './services/research-health.service';
// Field-Driven Research services
import { FieldStateManagerService } from './services/field-state-manager.service';
import { ResearchPlannerService } from './services/research-planner.service';
import { FieldResearchService } from './services/field-research.service';
// Slice 4: Image Cross-Validation
import { ImageComparisonService } from './services/image-comparison.service';
// Slice 1: Reverse Image Search (Google Lens style)
import { ReverseImageSearchService } from './services/reverse-image-search.service';
// Slice 2: Category-Specific Visual Inspection
import { CategoryDetectionService } from './services/category-detection.service';
import { GuidedVisionAnalysisService } from './services/guided-vision-analysis.service';
// Slice 3: Iterative Search Refinement
import { IterativeSearchService } from './services/iterative-search.service';
// Slice 5: Structured Comp Attribute Matching
import { CompAttributeService } from './services/comp-attribute.service';
// Slice 6: Identification Validation Checkpoint
import { IdentificationValidatorService } from './services/identification-validator.service';
// Slice 7: Cross-Source Validation
import { CrossValidationService } from './services/cross-validation.service';
// Slice 8: Product Page Extraction
import { ProductPageExtractorService } from './services/product-page-extractor.service';
// Slice 9: Domain Knowledge Database
import { DomainKnowledgeService } from './services/domain-knowledge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowRun, Item, ItemResearchRun, Organization]),
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    }),
    ConfigModule,
    forwardRef(() => MarketplacesModule), // Handle circular dependency chain (MarketplacesModule → LearningModule → MarketplacesModule)
    EvidenceModule,
    EventsModule,
    ResearchModule,
    forwardRef(() => ChatModule), // Handle circular dependency with ChatModule
    forwardRef(() => OrganizationsModule), // Handle circular dependency chain (OrganizationsModule → MarketplacesModule → LearningModule → ItemsModule → AiWorkflowsModule)
  ],
  providers: [
    AiWorkflowsProcessor,
    ItemIntakeWorkflow,
    OpenAIService,
    WebSearchService,
    // Slice 2: Enhanced Product Identification services
    OCRService,
    UPCLookupService,
    // Slice 4: Marketplace Schema Awareness
    MarketplaceSchemaService,
    // Slice 5: Pricing Strategies
    PricingStrategyService,
    // Slice 6: Full Listing Assembly
    ListingAssemblyService,
    PostgresCheckpointerService,
    LLMConfigService,
    ResearchGraphService,
    // General Chatbot services
    ChatGraphService,
    ChatContextService,
    ActionEmitterService,
    // Amazon/Keepa Integration
    KeepaService,
    AmazonCatalogService,
    // Prompt management
    PromptTemplateService,
    // Goal-driven orchestration
    GoalOrchestratorService,
    // Research recovery and health
    RecoveryService,
    ResearchHealthService,
    // Slice 7: Cross-Source Validation (must be before FieldStateManagerService)
    CrossValidationService,
    // Field-Driven Research services
    FieldStateManagerService,
    ResearchPlannerService,
    FieldResearchService,
    // Slice 4: Image Cross-Validation
    ImageComparisonService,
    // Slice 1: Reverse Image Search (Google Lens style)
    ReverseImageSearchService,
    // Slice 2: Category-Specific Visual Inspection
    CategoryDetectionService,
    GuidedVisionAnalysisService,
    // Slice 3: Iterative Search Refinement
    IterativeSearchService,
    // Slice 5: Structured Comp Attribute Matching
    CompAttributeService,
    // Slice 6: Identification Validation Checkpoint
    IdentificationValidatorService,
    // Slice 8: Product Page Extraction
    ProductPageExtractorService,
    // Slice 9: Domain Knowledge Database
    DomainKnowledgeService,
  ],
  exports: [
    OpenAIService,
    WebSearchService,
    OCRService,
    UPCLookupService,
    MarketplaceSchemaService,
    PricingStrategyService,
    ListingAssemblyService,
    ResearchGraphService,
    ChatGraphService,
    ChatContextService,
    ActionEmitterService,
    KeepaService,
    AmazonCatalogService,
    PromptTemplateService,
    GoalOrchestratorService,
    RecoveryService,
    ResearchHealthService,
    // Slice 7: Cross-Source Validation
    CrossValidationService,
    // Field-Driven Research services
    FieldStateManagerService,
    ResearchPlannerService,
    FieldResearchService,
    // Slice 4: Image Cross-Validation
    ImageComparisonService,
    // Slice 1: Reverse Image Search (Google Lens style)
    ReverseImageSearchService,
    // Slice 2: Category-Specific Visual Inspection
    CategoryDetectionService,
    GuidedVisionAnalysisService,
    // Slice 3: Iterative Search Refinement
    IterativeSearchService,
    // Slice 5: Structured Comp Attribute Matching
    CompAttributeService,
    // Slice 6: Identification Validation Checkpoint
    IdentificationValidatorService,
    // Slice 8: Product Page Extraction
    ProductPageExtractorService,
    // Slice 9: Domain Knowledge Database
    DomainKnowledgeService,
  ],
})
export class AiWorkflowsModule {}

