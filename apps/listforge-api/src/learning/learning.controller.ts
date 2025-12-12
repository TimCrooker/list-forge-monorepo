import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ListResearchOutcomesQuery,
  ListResearchOutcomesResponse,
  GetResearchOutcomeResponse,
  CorrectOutcomeDto,
  ToolEffectivenessQuery,
  GetToolEffectivenessResponse,
  GetToolEffectivenessTrendResponse,
  ListAnomaliesQuery,
  ListAnomaliesResponse,
  ResolveAnomalyDto,
  TriggerCalibrationResponse,
  GetCalibrationHistoryQuery,
  GetCalibrationHistoryResponse,
  LearningDashboardQuery,
  GetLearningDashboardResponse,
} from '@listforge/api-types';
import type { ResearchAnomaly } from '@listforge/core-types';
import { ResearchLearningService } from './services/research-learning.service';
import { ToolCalibrationService } from './services/tool-calibration.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * LearningController - Slice 10 (Learning Loop)
 *
 * REST endpoints for the learning module:
 * - Research outcomes management
 * - Tool effectiveness metrics
 * - Anomaly detection and resolution
 * - Calibration management
 * - Dashboard summary
 */
@Controller('learning')
@UseGuards(JwtAuthGuard, OrgGuard)
export class LearningController {
  constructor(
    private readonly learningService: ResearchLearningService,
    private readonly calibrationService: ToolCalibrationService,
    private readonly anomalyService: AnomalyDetectionService,
  ) {}

  // ==========================================================================
  // Research Outcomes
  // ==========================================================================

  /**
   * List research outcomes for the organization
   * GET /learning/outcomes
   */
  @Get('outcomes')
  async listOutcomes(
    @ReqCtx() ctx: RequestContext,
    @Query() query: ListResearchOutcomesQuery,
  ): Promise<ListResearchOutcomesResponse> {
    return this.learningService.listOutcomes(ctx.currentOrgId, query);
  }

  /**
   * Get a single research outcome
   * GET /learning/outcomes/:id
   */
  @Get('outcomes/:id')
  async getOutcome(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetResearchOutcomeResponse> {
    const outcome = await this.learningService.getOutcome(ctx.currentOrgId, id);
    return { outcome };
  }

  /**
   * Manually correct an outcome
   * PATCH /learning/outcomes/:id/correct
   */
  @Patch('outcomes/:id/correct')
  async correctOutcome(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: CorrectOutcomeDto,
  ): Promise<GetResearchOutcomeResponse> {
    const outcome = await this.learningService.correctOutcome(
      ctx.currentOrgId,
      id,
      dto,
      ctx.userId,
    );
    return { outcome };
  }

  // ==========================================================================
  // Tool Effectiveness
  // ==========================================================================

  /**
   * Get tool effectiveness metrics
   * GET /learning/tool-effectiveness
   */
  @Get('tool-effectiveness')
  async getToolEffectiveness(
    @ReqCtx() ctx: RequestContext,
    @Query() query: ToolEffectivenessQuery,
  ): Promise<GetToolEffectivenessResponse> {
    return this.learningService.getToolEffectiveness(ctx.currentOrgId, query);
  }

  /**
   * Get tool effectiveness trends
   * GET /learning/tool-effectiveness/trends
   */
  @Get('tool-effectiveness/trends')
  async getToolEffectivenessTrends(
    @ReqCtx() ctx: RequestContext,
    @Query('periodDays') periodDays?: number,
  ): Promise<GetToolEffectivenessTrendResponse> {
    return this.learningService.getToolEffectivenessTrends(
      ctx.currentOrgId,
      periodDays ?? 90,
    );
  }

  // ==========================================================================
  // Anomalies
  // ==========================================================================

  /**
   * List anomalies for the organization
   * GET /learning/anomalies
   */
  @Get('anomalies')
  async listAnomalies(
    @ReqCtx() ctx: RequestContext,
    @Query() query: ListAnomaliesQuery,
  ): Promise<ListAnomaliesResponse> {
    return this.anomalyService.listAnomalies(ctx.currentOrgId, query);
  }

  /**
   * Resolve an anomaly
   * POST /learning/anomalies/:id/resolve
   */
  @Post('anomalies/:id/resolve')
  async resolveAnomaly(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() dto: ResolveAnomalyDto,
  ): Promise<{ anomaly: ResearchAnomaly }> {
    const anomaly = await this.anomalyService.resolveAnomaly(
      ctx.currentOrgId,
      id,
      dto,
      ctx.userId,
    );
    return { anomaly };
  }

  // ==========================================================================
  // Calibration
  // ==========================================================================

  /**
   * Trigger manual calibration (admin only)
   * POST /learning/calibrate
   */
  @Post('calibrate')
  @UseGuards(AdminGuard)
  async triggerCalibration(
    @ReqCtx() ctx: RequestContext,
  ): Promise<TriggerCalibrationResponse> {
    const results = await this.calibrationService.recalibrateAllTools(
      90,
      'manual',
      ctx.userId,
    );
    return {
      success: true,
      results,
      calibratedAt: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  /**
   * Get learning dashboard summary
   * GET /learning/dashboard
   */
  @Get('dashboard')
  async getDashboard(
    @ReqCtx() ctx: RequestContext,
    @Query() query: LearningDashboardQuery,
  ): Promise<GetLearningDashboardResponse> {
    const summary = await this.learningService.getDashboardSummary(
      ctx.currentOrgId,
      query,
    );
    return { summary };
  }
}

/**
 * AdminLearningController - Slice 10 (Learning Loop)
 *
 * Admin-only endpoints for global learning data and calibration management
 */
@Controller('admin/learning')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminLearningController {
  constructor(
    private readonly learningService: ResearchLearningService,
    private readonly calibrationService: ToolCalibrationService,
    private readonly anomalyService: AnomalyDetectionService,
  ) {}

  /**
   * Get global tool effectiveness (across all orgs)
   * GET /admin/learning/global-effectiveness
   */
  @Get('global-effectiveness')
  async getGlobalEffectiveness(
    @Query() query: ToolEffectivenessQuery,
  ): Promise<GetToolEffectivenessResponse> {
    return this.learningService.getToolEffectiveness(null, query);
  }

  /**
   * Get all anomalies across all organizations
   * GET /admin/learning/all-anomalies
   */
  @Get('all-anomalies')
  async getAllAnomalies(
    @Query() query: ListAnomaliesQuery,
  ): Promise<ListAnomaliesResponse> {
    return this.anomalyService.listAnomalies(null, query);
  }

  /**
   * Get calibration history (admin only - global data)
   * GET /admin/learning/calibration/history
   */
  @Get('calibration/history')
  async getCalibrationHistory(
    @Query() query: GetCalibrationHistoryQuery,
  ): Promise<GetCalibrationHistoryResponse> {
    return this.calibrationService.getHistory(query.limit ?? 10);
  }
}
