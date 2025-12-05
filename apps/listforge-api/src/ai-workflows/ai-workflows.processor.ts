import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { QUEUE_AI_WORKFLOW, StartWorkflowJob } from '@listforge/queue-types';
import { PhotoIntakeWorkflow } from './workflows/photo-intake.workflow';
import { ListingIntakeWorkflow } from './workflows/listing-intake.workflow';

@Processor(QUEUE_AI_WORKFLOW)
@Injectable()
export class AiWorkflowsProcessor extends WorkerHost {
  private readonly logger = new Logger(AiWorkflowsProcessor.name);

  constructor(
    private photoIntakeWorkflow: PhotoIntakeWorkflow,
    private listingIntakeWorkflow: ListingIntakeWorkflow,
  ) {
    super();
  }

  async process(job: Job<StartWorkflowJob>): Promise<void> {
    const { workflowType, itemId, listingDraftId, orgId, userId } = job.data;
    this.logger.log(
      `Processing workflow: ${workflowType} for ${listingDraftId ? 'draft ' + listingDraftId : 'item ' + itemId}`,
    );

    switch (workflowType) {
      case 'photo-intake-v1':
        if (!itemId) {
          throw new BadRequestException('itemId required for photo-intake-v1 workflow');
        }
        await this.photoIntakeWorkflow.execute(itemId, orgId, userId);
        break;
      case 'listing-intake-v1':
        if (!listingDraftId) {
          throw new BadRequestException('listingDraftId required for listing-intake-v1 workflow');
        }
        await this.listingIntakeWorkflow.execute(listingDraftId, orgId, userId);
        break;
      default:
        this.logger.error(`Unknown workflow type: ${workflowType}`);
        throw new BadRequestException(`Unsupported workflow type: ${workflowType}`);
    }
  }
}

