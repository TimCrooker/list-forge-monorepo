import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
} from '@listforge/api-types';
import { QUEUE_AI_WORKFLOW, StartResearchRunJob } from '@listforge/queue-types';
import { ResearchService } from './research.service';
import { EvidenceService } from '../evidence/evidence.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * Research Controller - Phase 6 Sub-Phase 8
 *
 * Handles research run operations for items.
 */
@Controller()
@UseGuards(JwtAuthGuard, OrgGuard)
export class ResearchController {
  constructor(
    private readonly researchService: ResearchService,
    private readonly evidenceService: EvidenceService,
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
}
