import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { QUEUE_AI_WORKFLOW, StartWorkflowJob } from '@listforge/queue-types';
import { PhotoIntakeWorkflow } from './workflows/photo-intake.workflow';

@Processor(QUEUE_AI_WORKFLOW)
@Injectable()
export class AiWorkflowsProcessor extends WorkerHost {
  constructor(private photoIntakeWorkflow: PhotoIntakeWorkflow) {
    super();
  }

  async process(job: Job<StartWorkflowJob>): Promise<void> {
    const { workflowType, itemId, orgId, userId } = job.data;

    switch (workflowType) {
      case 'photo-intake-v1':
        await this.photoIntakeWorkflow.execute(itemId, orgId, userId);
        break;
      default:
        throw new Error(`Unknown workflow type: ${workflowType}`);
    }
  }
}

