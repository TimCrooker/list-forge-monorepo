import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_AI_WORKFLOW, StartResearchRunJob } from '@listforge/queue-types';
import { ItemResearchRun } from '../../research/entities/item-research-run.entity';
import { ResearchService } from '../../research/research.service';
import { Item } from '../../items/entities/item.entity';

/**
 * Recovery Service - Research Flow Recovery System
 *
 * Handles automatic recovery of stalled research runs on startup
 * and synchronization between BullMQ queue state and database state.
 */
@Injectable()
export class RecoveryService implements OnModuleInit {
  private readonly logger = new Logger(RecoveryService.name);

  constructor(
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private readonly aiWorkflowQueue: Queue,
    @InjectRepository(ItemResearchRun)
    private readonly researchRunRepo: Repository<ItemResearchRun>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    private readonly researchService: ResearchService,
  ) {}

  /**
   * Run recovery check on module initialization
   */
  async onModuleInit() {
    this.logger.log('RecoveryService initialized, running startup recovery check...');
    // Delay slightly to ensure all modules are initialized
    setTimeout(() => {
      this.recoverStalledRuns().catch((error) => {
        this.logger.error('Startup recovery check failed:', error);
      });
    }, 5000); // 5 second delay
  }

  /**
   * Recover stalled research runs across all organizations
   * Conservative strategy:
   * - Recover runs with status='error' that have checkpoints
   * - Recover runs with status='running' and no activity for >15 minutes
   * - Mark status='pending' jobs >10 minutes with no BullMQ job as error
   */
  async recoverStalledRuns(): Promise<void> {
    this.logger.log('Starting stalled research runs recovery...');

    try {
      // Get all organizations
      const items = await this.itemRepo
        .createQueryBuilder('item')
        .select('DISTINCT item.organizationId', 'orgId')
        .getRawMany();

      const orgIds = items.map((item) => item.orgId);
      this.logger.debug(`Found ${orgIds.length} organizations to check`);

      let totalRecovered = 0;
      let totalMarkedAsError = 0;

      for (const orgId of orgIds) {
        const { recovered, markedAsError } = await this.recoverStalledRunsForOrg(orgId);
        totalRecovered += recovered;
        totalMarkedAsError += markedAsError;
      }

      this.logger.log(
        `Recovery complete: ${totalRecovered} runs recovered, ${totalMarkedAsError} runs marked as error`,
      );
    } catch (error) {
      this.logger.error('Error during recovery:', error);
      throw error;
    }
  }

  /**
   * Recover stalled runs for a specific organization
   */
  private async recoverStalledRunsForOrg(orgId: string): Promise<{
    recovered: number;
    markedAsError: number;
  }> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find stalled runs
    const stalledRuns = await this.researchRunRepo
      .createQueryBuilder('run')
      .leftJoin('run.item', 'item')
      .where('item.organizationId = :orgId', { orgId })
      .andWhere(
        `(
          (run.status = 'running' AND run.startedAt < :fifteenMinutesAgo)
          OR
          (run.status = 'error' AND run.checkpoint IS NOT NULL AND run.completedAt IS NULL)
          OR
          (run.status = 'pending' AND run.startedAt < :tenMinutesAgo)
        )`,
        { fifteenMinutesAgo, tenMinutesAgo },
      )
      .andWhere('run.completedAt IS NULL')
      .andWhere('run.status != :cancelled', { cancelled: 'cancelled' })
      .getMany();

    this.logger.debug(`Found ${stalledRuns.length} stalled runs for org ${orgId}`);

    let recovered = 0;
    let markedAsError = 0;

    // Sync with BullMQ queue
    await this.syncQueueWithDatabase(orgId);

    for (const run of stalledRuns) {
      try {
        // Check if there's a corresponding BullMQ job
        const jobs = await this.aiWorkflowQueue.getJobs(['active', 'waiting', 'delayed']);
        const hasJob = jobs.some(
          (job) =>
            job.data &&
            'researchRunId' in job.data &&
            job.data.researchRunId === run.id,
        );

        if (run.status === 'pending' && !hasJob) {
          // Pending run with no job - mark as error
          run.status = 'error';
          run.errorMessage = 'Research run was pending but no queue job found. Likely lost during restart.';
          run.completedAt = new Date();
          await this.researchRunRepo.save(run);
          markedAsError++;
          this.logger.warn(`Marked pending run ${run.id} as error (no queue job)`);
          continue;
        }

        if (run.status === 'error' && run.checkpoint) {
          // Error run with checkpoint - can be resumed
          const canResume = await this.researchService.canResume(run.id, orgId);
          if (canResume) {
            await this.requeueResearchRun(run, orgId);
            recovered++;
            this.logger.log(`Recovered error run ${run.id} with checkpoint`);
          }
        } else if (run.status === 'running' && run.startedAt < fifteenMinutesAgo) {
          // Running for >15 minutes - check if can resume
          const canResume = await this.researchService.canResume(run.id, orgId);
          if (canResume && (run.checkpoint || run.stepCount > 0)) {
            // Mark as error first, then requeue
            run.status = 'error';
            run.errorMessage = 'Research run stalled (no activity for >15 minutes). Auto-recovered.';
            await this.researchRunRepo.save(run);
            await this.requeueResearchRun(run, orgId);
            recovered++;
            this.logger.log(`Recovered stalled running run ${run.id}`);
          } else {
            // Can't resume - mark as error
            run.status = 'error';
            run.errorMessage = 'Research run stalled (no activity for >15 minutes) and cannot be recovered.';
            run.completedAt = new Date();
            await this.researchRunRepo.save(run);
            markedAsError++;
            this.logger.warn(`Marked stalled run ${run.id} as error (cannot recover)`);
          }
        }
      } catch (error) {
        this.logger.error(`Error recovering run ${run.id}:`, error);
      }
    }

    return { recovered, markedAsError };
  }

  /**
   * Synchronize BullMQ queue state with database state
   * Removes orphaned jobs and ensures database records match queue state
   */
  async syncQueueWithDatabase(orgId: string): Promise<void> {
    try {
      // Get all active/waiting jobs from queue
      const jobs = await this.aiWorkflowQueue.getJobs(['active', 'waiting', 'delayed']);
      const researchJobs = jobs.filter(
        (job) => job.data && 'researchRunId' in job.data,
      ) as Job<StartResearchRunJob>[];

      // Get all running/pending research runs from database
      const dbRuns = await this.researchRunRepo
        .createQueryBuilder('run')
        .leftJoin('run.item', 'item')
        .where('item.organizationId = :orgId', { orgId })
        .andWhere("run.status IN ('pending', 'running')")
        .andWhere('run.completedAt IS NULL')
        .getMany();

      const dbRunIds = new Set(dbRuns.map((run) => run.id));
      const queueRunIds = new Set(
        researchJobs.map((job) => job.data.researchRunId),
      );

      // Find runs in DB but not in queue (orphaned)
      const orphanedRuns = dbRuns.filter((run) => !queueRunIds.has(run.id));
      for (const run of orphanedRuns) {
        this.logger.warn(
          `Found orphaned research run ${run.id} (in DB but not in queue). Marking as error.`,
        );
        run.status = 'error';
        run.errorMessage = 'Research run was lost from queue during restart.';
        run.completedAt = new Date();
        await this.researchRunRepo.save(run);
      }

      // Find jobs in queue but not in DB (shouldn't happen, but handle gracefully)
      const orphanedJobs = researchJobs.filter(
        (job) => !dbRunIds.has(job.data.researchRunId),
      );
      for (const job of orphanedJobs) {
        this.logger.warn(
          `Found orphaned queue job ${job.id} (in queue but not in DB). Removing from queue.`,
        );
        await job.remove();
      }
    } catch (error) {
      this.logger.error('Error syncing queue with database:', error);
    }
  }

  /**
   * Requeue a research run for execution
   */
  private async requeueResearchRun(
    run: ItemResearchRun,
    orgId: string,
  ): Promise<void> {
    const job: StartResearchRunJob = {
      researchRunId: run.id,
      itemId: run.itemId,
      runType: run.runType,
      orgId,
      userId: null, // We don't have userId in recovery context
    };

    await this.aiWorkflowQueue.add('start-research-run', job, {
      jobId: `resume-${run.id}`, // Unique job ID for resume
    });

    this.logger.log(`Requeued research run ${run.id} for recovery`);
  }
}
