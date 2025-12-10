import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  TriggerResearchRequest,
  TriggerResearchResponse,
  ListResearchRunsResponse,
  GetResearchRunResponse,
  GetResearchRunEvidenceResponse,
  GetResearchActivityLogResponse,
  GetLatestResearchResponse,
  GetResearchHistoryResponse,
  PauseResearchResponse,
  StopResearchResponse,
} from '@listforge/api-types';
import { QUEUE_AI_WORKFLOW, StartResearchRunJob } from '@listforge/queue-types';
import { ResearchService } from './research.service';
import { EvidenceService } from '../evidence/evidence.service';
import { BadRequestException } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * Research Controller - Phase 6 Sub-Phase 8 + Phase 7 Slice 1 + Slice 4
 *
 * Handles research run operations and structured research data for items.
 */
@Controller()
@UseGuards(JwtAuthGuard, OrgGuard)
export class ResearchController {
  constructor(
    private readonly researchService: ResearchService,
    private readonly evidenceService: EvidenceService,
    private readonly eventsService: EventsService,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private readonly aiWorkflowQueue: Queue,
  ) {}

  /**
   * Trigger a new research run for an item
   *
   * POST /items/:id/research
   */
  @Post('items/:id/research')
  async triggerResearch(
    @ReqCtx() ctx: RequestContext,
    @Param('id') itemId: string,
    @Body() body: TriggerResearchRequest,
  ): Promise<TriggerResearchResponse> {
    const runType = body.runType || 'manual_request';

    // Create research run
    const researchRun = await this.researchService.createResearchRun(
      itemId,
      ctx.currentOrgId,
      runType,
    );

    // Enqueue AI workflow job
    const job: StartResearchRunJob = {
      researchRunId: researchRun.id,
      itemId,
      runType,
      orgId: ctx.currentOrgId,
      userId: ctx.userId,
    };
    await this.aiWorkflowQueue.add('start-research-run', job);

    return {
      researchRun: this.researchService.toDto(researchRun),
    };
  }

  /**
   * List research runs for an item
   *
   * GET /items/:id/research-runs
   */
  @Get('items/:id/research-runs')
  async listResearchRuns(
    @ReqCtx() ctx: RequestContext,
    @Param('id') itemId: string,
  ): Promise<ListResearchRunsResponse> {
    const { researchRuns, total } = await this.researchService.listResearchRuns(
      itemId,
      ctx.currentOrgId,
    );

    return {
      researchRuns: researchRuns.map((run) =>
        this.researchService.toSummaryDto(run),
      ),
      total,
    };
  }

  /**
   * Get a single research run
   *
   * GET /research-runs/:id
   */
  @Get('research-runs/:id')
  async getResearchRun(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetResearchRunResponse> {
    const researchRun = await this.researchService.getResearchRun(
      id,
      ctx.currentOrgId,
    );

    return {
      researchRun: this.researchService.toDto(researchRun),
    };
  }

  /**
   * Get evidence for a research run
   *
   * GET /research-runs/:id/evidence
   */
  @Get('research-runs/:id/evidence')
  async getResearchRunEvidence(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetResearchRunEvidenceResponse> {
    // Verify research run exists and belongs to org
    await this.researchService.getResearchRun(id, ctx.currentOrgId);

    // Get evidence bundle for this research run
    const bundle = await this.evidenceService.getBundleForResearchRun(id);

    return {
      evidence: bundle ? this.evidenceService.toDto(bundle) : null,
    };
  }

  /**
   * Get activity log for a research run (legacy format)
   *
   * GET /research-runs/:id/activity
   */
  @Get('research-runs/:id/activity')
  async getResearchActivityLog(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetResearchActivityLogResponse> {
    // Verify research run exists and belongs to org
    await this.researchService.getResearchRun(id, ctx.currentOrgId);

    // Get activity log entries
    const entries = await this.researchService.getActivityLog(id);

    return {
      entries: entries.map((entry) => ({
        id: entry.id,
        researchRunId: entry.researchRunId,
        itemId: entry.itemId,
        type: entry.type,
        message: entry.message,
        metadata: entry.metadata || undefined,
        status: entry.status,
        stepId: entry.stepId || undefined,
        timestamp: entry.timestamp.toISOString(),
        // Include new fields if present (for forward compatibility)
        ...(entry.operationId && { operationId: entry.operationId }),
        ...(entry.operationType && { operationType: entry.operationType }),
        ...(entry.eventType && { eventType: entry.eventType }),
        ...(entry.title && { title: entry.title }),
      })),
    };
  }

  /**
   * Get operation events for a research run (new format for AgentActivityFeed)
   *
   * GET /research-runs/:id/events
   */
  @Get('research-runs/:id/events')
  async getResearchOperationEvents(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ) {
    // Verify research run exists and belongs to org
    await this.researchService.getResearchRun(id, ctx.currentOrgId);

    // Get operation events
    const events = await this.researchService.getOperationEvents(id);

    return {
      events,
    };
  }

  // ============================================================================
  // Phase 7 Slice 1: ItemResearch Endpoints
  // ============================================================================

  /**
   * Get latest (current) research for an item
   *
   * GET /items/:id/research/latest
   */
  @Get('items/:id/research/latest')
  async getLatestResearch(
    @ReqCtx() ctx: RequestContext,
    @Param('id') itemId: string,
  ): Promise<GetLatestResearchResponse> {
    const research = await this.researchService.findLatestResearch(
      itemId,
      ctx.currentOrgId,
    );

    return {
      research: research ? this.researchService.toResearchDto(research) : null,
    };
  }

  /**
   * Get research history for an item with pagination
   *
   * GET /items/:id/research/history
   */
  @Get('items/:id/research/history')
  async getResearchHistory(
    @ReqCtx() ctx: RequestContext,
    @Param('id') itemId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<GetResearchHistoryResponse> {
    const { researches, total } = await this.researchService.findResearchHistory(
      itemId,
      ctx.currentOrgId,
      {
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      },
    );

    return {
      researches: researches.map((r) => this.researchService.toResearchDto(r)),
      total,
    };
  }

  // ============================================================================
  // Phase 7 Slice 4: Resume Endpoint
  // ============================================================================

  /**
   * Resume a failed, stalled, or paused research run
   *
   * POST /research-runs/:id/resume
   */
  @Post('research-runs/:id/resume')
  async resumeResearch(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<TriggerResearchResponse> {
    // Verify research run exists and belongs to org
    const researchRun = await this.researchService.getResearchRun(id, ctx.currentOrgId);

    // Check if can be resumed
    const canResume = await this.researchService.canResume(id, ctx.currentOrgId);
    if (!canResume) {
      throw new BadRequestException(
        `Research run ${id} cannot be resumed. It may have completed, exceeded retry limits, or have no checkpoint.`,
      );
    }

    // Clear pause flags if paused - update status back to running
    if (researchRun.status === 'paused') {
      await this.researchService.updateResearchRunStatus(
        researchRun.id,
        'running',
        undefined,
        undefined,
      );
      await this.researchService.clearPauseFlags(researchRun.id);
    }

    // Enqueue resume job
    const job: StartResearchRunJob = {
      researchRunId: researchRun.id,
      itemId: researchRun.itemId,
      runType: researchRun.runType,
      orgId: ctx.currentOrgId,
      userId: ctx.userId,
    };
    await this.aiWorkflowQueue.add('start-research-run', job, {
      jobId: `resume-${researchRun.id}`, // Unique job ID for resume
    });

    // Emit resume event
    this.eventsService.emitResearchResumed(researchRun.id, researchRun.itemId, ctx.currentOrgId);

    return {
      researchRun: this.researchService.toDto(researchRun),
    };
  }

  /**
   * Pause a running research run
   *
   * POST /research-runs/:id/pause
   */
  @Post('research-runs/:id/pause')
  async pauseResearch(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<PauseResearchResponse> {
    // Verify research run exists and belongs to org
    const researchRun = await this.researchService.pauseResearchRun(id, ctx.currentOrgId);

    // Emit pause event
    this.eventsService.emitResearchPaused(researchRun.id, researchRun.itemId, ctx.currentOrgId);

    return {
      success: true,
      researchRun: this.researchService.toDto(researchRun),
    };
  }

  /**
   * Stop/cancel a research run
   *
   * POST /research-runs/:id/stop
   */
  @Post('research-runs/:id/stop')
  async stopResearch(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<StopResearchResponse> {
    // Verify research run exists and belongs to org
    const researchRun = await this.researchService.stopResearchRun(id, ctx.currentOrgId);

    // Try to remove from queue if it exists
    try {
      const jobs = await this.aiWorkflowQueue.getJobs(['active', 'waiting', 'delayed']);
      const job = jobs.find(
        (j) => j.data && 'researchRunId' in j.data && j.data.researchRunId === id,
      );
      if (job) {
        await job.remove();
      }
    } catch (error) {
      // Log but don't fail if queue removal fails
      console.error(`Failed to remove job from queue for run ${id}:`, error);
    }

    // Emit cancel event
    this.eventsService.emitResearchCancelled(researchRun.id, researchRun.itemId, ctx.currentOrgId);

    return {
      success: true,
      researchRun: this.researchService.toDto(researchRun),
    };
  }
}
