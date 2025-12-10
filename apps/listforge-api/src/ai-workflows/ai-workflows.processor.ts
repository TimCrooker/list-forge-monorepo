import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_AI_WORKFLOW, StartItemWorkflowJob, StartResearchRunJob } from '@listforge/queue-types';
import { ItemIntakeWorkflow } from './workflows/item-intake.workflow';
import { ResearchGraphService } from './services/research-graph.service';
import { Item } from '../items/entities/item.entity';
import { ItemResearchRun } from '../research/entities/item-research-run.entity';

/**
 * AI Workflows Processor
 *
 * Phase 6: Handles Item intake workflows and research runs.
 * Phase 7 Slice 2: Updated to use ResearchGraph for manual/refresh research runs.
 * Slice 1: Routes queued research (from fast intake) to ResearchGraphService.
 */
@Processor(QUEUE_AI_WORKFLOW)
@Injectable()
export class AiWorkflowsProcessor extends WorkerHost {
  private readonly logger = new Logger(AiWorkflowsProcessor.name);

  constructor(
    private itemIntakeWorkflow: ItemIntakeWorkflow,
    private researchGraphService: ResearchGraphService,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ItemResearchRun)
    private researchRunRepo: Repository<ItemResearchRun>,
  ) {
    super();
  }

  async process(job: Job<StartItemWorkflowJob | StartResearchRunJob>): Promise<void> {
    // Handle StartResearchRunJob
    if ('researchRunId' in job.data) {
      const { researchRunId, itemId, runType, orgId, userId } = job.data;

      // Phase 7 Slice 4: Check if this is a resume job
      const isResume = job.name?.startsWith('resume-') || false;

      if (isResume) {
        this.logger.log(`Resuming research run ${researchRunId} for item ${itemId}`);
        await this.researchGraphService.resume(job.data);
        return;
      }

      this.logger.log(`Processing research run ${researchRunId} for item ${itemId}, type: ${runType}`);

      // Slice 1: Check if this is a queued research job from fast intake
      // If the research run exists and item is in 'researching' state, route to ResearchGraphService
      const researchRun = await this.researchRunRepo.findOne({
        where: { id: researchRunId },
      });

      const item = await this.itemRepo.findOne({
        where: { id: itemId },
      });

      const isQueuedFromFastIntake =
        researchRun &&
        item &&
        item.aiReviewState === 'researching' &&
        runType === 'initial_intake';

      if (isQueuedFromFastIntake) {
        // This is a queued deep research job from fast intake - use ResearchGraphService
        this.logger.log(
          `Routing queued research from fast intake to ResearchGraphService for item ${itemId}`,
        );
        await this.researchGraphService.execute(job.data);
        return;
      }

      // Phase 7 Slice 2: Use ResearchGraph for manual/refresh runs, ItemIntakeWorkflow for initial intake
      if (runType === 'initial_intake') {
        // Execute item intake workflow with research run ID (fast intake)
        await this.itemIntakeWorkflow.execute(itemId, orgId, userId, researchRunId);
      } else {
        // Use new ResearchGraph for manual_request and pricing_refresh
        await this.researchGraphService.execute(job.data);
      }
      return;
    }

    // Handle StartItemWorkflowJob
    const { workflowType, itemId, orgId, userId } = job.data;
      this.logger.log(`Processing workflow: ${workflowType} for item ${itemId}`);

      switch (workflowType) {
        case 'item-intake-v1':
          if (!itemId) {
            throw new BadRequestException('itemId required for item-intake-v1 workflow');
          }
          await this.itemIntakeWorkflow.execute(itemId, orgId, userId);
          break;
        default:
          this.logger.error(`Unknown workflow type: ${workflowType}`);
          throw new BadRequestException(`Unsupported workflow type: ${workflowType}`);
      }
  }
}

