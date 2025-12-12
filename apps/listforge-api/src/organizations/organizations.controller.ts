import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CreateOrgRequest,
  CreateOrgResponse,
  OrgDetailResponse,
  AddOrgMemberRequest,
  AddOrgMemberResponse,
  UpdateOrgMemberRequest,
  UpdateOrgMemberResponse,
  EnableTeamRequest,
  EnableTeamResponse,
  DisableTeamResponse,
  GetAutoPublishSettingsResponse,
  UpdateAutoPublishSettingsRequest,
  UpdateAutoPublishSettingsResponse,
  GetWorkflowSettingsResponse,
  UpdateWorkflowSettingsRequest,
  UpdateWorkflowSettingsResponse,
  GetNotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
  UpdateNotificationSettingsResponse,
  GetTeamSettingsResponse,
  UpdateTeamSettingsRequest,
  UpdateTeamSettingsResponse,
  GetInventorySettingsResponse,
  UpdateInventorySettingsRequest,
  UpdateInventorySettingsResponse,
  GetMarketplaceDefaultSettingsResponse,
  UpdateMarketplaceDefaultSettingsRequest,
  UpdateMarketplaceDefaultSettingsResponse,
  GetBillingSettingsResponse,
  UpdateBillingSettingsRequest,
  UpdateBillingSettingsResponse,
  GetSecuritySettingsResponse,
  UpdateSecuritySettingsRequest,
  UpdateSecuritySettingsResponse,
  GetResearchSettingsResponse,
  UpdateResearchSettingsRequest,
  UpdateResearchSettingsResponse,
  SettingsType,
  GetSettingsVersionsResponse,
  GetSettingsAuditLogsRequest,
  GetSettingsAuditLogsResponse,
  PreviewSettingsRevertResponse,
  RevertSettingsRequest,
  RevertSettingsResponse,
} from '@listforge/api-types';
import { OrganizationsService } from './organizations.service';
import { AutoPublishService } from '../marketplaces/services/auto-publish.service';
import { OrganizationSettingsService } from './services/organization-settings.service';
import { SettingsAuditService, AuditContext } from './services/settings-audit.service';
import { SettingsVersionService } from './services/settings-version.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { TeamOrgGuard } from '../common/guards/team-org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

@Controller('orgs')
@UseGuards(JwtAuthGuard, OrgGuard)
export class OrganizationsController {
  constructor(
    private orgsService: OrganizationsService,
    private autoPublishService: AutoPublishService,
    private settingsService: OrganizationSettingsService,
    private auditService: SettingsAuditService,
    private versionService: SettingsVersionService,
  ) {}

  /**
   * Extract audit context from request
   */
  private getAuditContext(req: Request, ctx: RequestContext): AuditContext {
    return {
      userId: ctx.userId,
      ipAddress: req.ip || req.socket?.remoteAddress || null,
      userAgent: req.get('user-agent') || null,
    };
  }

  @Get()
  async list(@ReqCtx() ctx: RequestContext) {
    const orgs = await this.orgsService.findUserOrgs(ctx.userId);
    return {
      orgs: orgs.map((org) => ({
        id: org.id,
        name: org.name,
        status: org.status,
        createdAt: org.createdAt.toISOString(),
      })),
    };
  }

  @Post()
  async create(
    @ReqCtx() ctx: RequestContext,
    @Body() body: CreateOrgRequest,
  ): Promise<CreateOrgResponse> {
    return this.orgsService.create(ctx, body);
  }

  @Get(':id')
  async getDetail(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<OrgDetailResponse> {
    return this.orgsService.getDetail(id, ctx);
  }

  @Post(':id/members')
  @UseGuards(TeamOrgGuard)
  async addMember(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: AddOrgMemberRequest,
  ): Promise<AddOrgMemberResponse> {
    return this.orgsService.addMember(orgId, ctx, body);
  }

  @Patch(':id/members/:userId')
  @UseGuards(TeamOrgGuard)
  async updateMember(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateOrgMemberRequest,
  ): Promise<UpdateOrgMemberResponse> {
    return this.orgsService.updateMember(orgId, userId, ctx, body);
  }

  // ============================================================================
  // Organization Type Management (Personal vs Team)
  // ============================================================================

  @Patch(':id/enable-team')
  async enableTeam(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: EnableTeamRequest,
  ): Promise<EnableTeamResponse> {
    return this.orgsService.enableTeam(orgId, ctx, body);
  }

  @Patch(':id/disable-team')
  async disableTeam(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<DisableTeamResponse> {
    return this.orgsService.disableTeam(orgId, ctx);
  }

  // ============================================================================
  // Settings Version History & Audit Logs
  // ============================================================================

  @Get(':id/settings/:type/versions')
  async getSettingsVersions(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Param('type') settingsType: SettingsType,
  ): Promise<GetSettingsVersionsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const versions = await this.auditService.getVersionHistory(orgId, settingsType);
    return {
      versions: versions.map((v) => ({
        id: v.id,
        orgId: v.orgId,
        settingsType: v.settingsType,
        versionNumber: v.versionNumber,
        settingsSnapshot: v.settingsSnapshot,
        user: v.user
          ? { id: v.user.id, email: v.user.email, name: v.user.name }
          : null,
        isRevert: v.isRevert,
        revertedFromVersionId: v.revertedFromVersionId,
        revertReason: v.revertReason,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  }

  @Get(':id/settings/audit-logs')
  async getSettingsAuditLogs(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Query() query: GetSettingsAuditLogsRequest,
  ): Promise<GetSettingsAuditLogsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const { logs, total } = await this.auditService.queryAuditLogs({
      orgId,
      settingsType: query.settingsType,
      eventType: query.eventType,
      userId: query.userId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit || 50,
      offset: query.offset || 0,
    });

    return {
      logs: logs.map((log) => ({
        id: log.id,
        orgId: log.orgId,
        user: log.user
          ? { id: log.user.id, email: log.user.email, name: log.user.name }
          : null,
        settingsType: log.settingsType,
        eventType: log.eventType,
        message: log.message,
        fieldDiffs: log.fieldDiffs,
        versionId: log.versionId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata,
        timestamp: log.timestamp.toISOString(),
      })),
      total,
    };
  }

  @Get(':id/settings/versions/:versionId/preview')
  async previewSettingsRevert(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Param('versionId') versionId: string,
  ): Promise<PreviewSettingsRevertResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const preview = await this.versionService.previewRevert(orgId, versionId);

    return {
      version: {
        id: preview.version.id,
        orgId: preview.version.orgId,
        settingsType: preview.version.settingsType,
        versionNumber: preview.version.versionNumber,
        settingsSnapshot: preview.version.settingsSnapshot,
        user: preview.version.user
          ? {
              id: preview.version.user.id,
              email: preview.version.user.email,
              name: preview.version.user.name,
            }
          : null,
        isRevert: preview.version.isRevert,
        revertedFromVersionId: preview.version.revertedFromVersionId,
        revertReason: preview.version.revertReason,
        createdAt: preview.version.createdAt.toISOString(),
      },
      currentSettings: preview.currentSettings,
      targetSettings: preview.targetSettings,
      fieldDiffs: preview.fieldDiffs,
    };
  }

  @Post(':id/settings/versions/:versionId/revert')
  async revertSettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Param('versionId') versionId: string,
    @Body() body: RevertSettingsRequest,
  ): Promise<RevertSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);

    const result = await this.versionService.revertToVersion({
      orgId,
      versionId,
      reason: body.reason,
      context: auditContext,
    });

    return {
      newVersion: {
        id: result.newVersion.id,
        orgId: result.newVersion.orgId,
        settingsType: result.newVersion.settingsType,
        versionNumber: result.newVersion.versionNumber,
        settingsSnapshot: result.newVersion.settingsSnapshot,
        user: null, // We don't load relation here
        isRevert: result.newVersion.isRevert,
        revertedFromVersionId: result.newVersion.revertedFromVersionId,
        revertReason: result.newVersion.revertReason,
        createdAt: result.newVersion.createdAt.toISOString(),
      },
      appliedSettings: result.appliedSettings,
    };
  }

  // ============================================================================
  // Auto-Publish Settings (Slice 7)
  // ============================================================================

  @Get(':id/settings/auto-publish')
  async getAutoPublishSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetAutoPublishSettingsResponse> {
    // Verify user has access to this org
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.autoPublishService.getSettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/auto-publish')
  async updateAutoPublishSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateAutoPublishSettingsRequest,
  ): Promise<UpdateAutoPublishSettingsResponse> {
    // Verify user has access to this org
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.autoPublishService.updateSettings(orgId, body);
    return { settings };
  }

  // ============================================================================
  // Workflow Settings
  // ============================================================================

  @Get(':id/settings/workflow')
  async getWorkflowSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetWorkflowSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.getWorkflowSettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/workflow')
  async updateWorkflowSettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateWorkflowSettingsRequest,
  ): Promise<UpdateWorkflowSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateWorkflowSettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }

  // ============================================================================
  // Notification Settings
  // ============================================================================

  @Get(':id/settings/notifications')
  async getNotificationSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetNotificationSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.getNotificationSettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/notifications')
  async updateNotificationSettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateNotificationSettingsRequest,
  ): Promise<UpdateNotificationSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateNotificationSettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }

  // ============================================================================
  // Team Settings
  // ============================================================================

  @Get(':id/settings/team')
  async getTeamSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetTeamSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.getTeamSettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/team')
  async updateTeamSettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateTeamSettingsRequest,
  ): Promise<UpdateTeamSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateTeamSettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }

  // ============================================================================
  // Inventory Settings
  // ============================================================================

  @Get(':id/settings/inventory')
  async getInventorySettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetInventorySettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.getInventorySettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/inventory')
  async updateInventorySettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateInventorySettingsRequest,
  ): Promise<UpdateInventorySettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateInventorySettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }

  // ============================================================================
  // Marketplace Default Settings
  // ============================================================================

  @Get(':id/settings/marketplace-defaults')
  async getMarketplaceDefaultSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetMarketplaceDefaultSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.getMarketplaceDefaultSettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/marketplace-defaults')
  async updateMarketplaceDefaultSettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateMarketplaceDefaultSettingsRequest,
  ): Promise<UpdateMarketplaceDefaultSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateMarketplaceDefaultSettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }

  // ============================================================================
  // Billing Settings
  // ============================================================================

  @Get(':id/settings/billing')
  async getBillingSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetBillingSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.getBillingSettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/billing')
  async updateBillingSettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateBillingSettingsRequest,
  ): Promise<UpdateBillingSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateBillingSettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }

  // ============================================================================
  // Security Settings (Admin/Owner Only)
  // ============================================================================

  @Get(':id/settings/security')
  async getSecuritySettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetSecuritySettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    // Security settings are read-only for members
    const settings = await this.settingsService.getSecuritySettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/security')
  async updateSecuritySettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateSecuritySettingsRequest,
  ): Promise<UpdateSecuritySettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    // Only admin or owner can update security settings
    if (ctx.orgRole !== 'owner' && ctx.orgRole !== 'admin') {
      throw new ForbiddenException('Only admins can update security settings');
    }
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateSecuritySettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }

  // ============================================================================
  // Research Settings (Confidence-Based Review Routing)
  // ============================================================================

  @Get(':id/settings/research')
  async getResearchSettings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
  ): Promise<GetResearchSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.getResearchSettings(orgId);
    return { settings };
  }

  @Patch(':id/settings/research')
  async updateResearchSettings(
    @Req() req: Request,
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateResearchSettingsRequest,
  ): Promise<UpdateResearchSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const auditContext = this.getAuditContext(req, ctx);
    const settings = await this.settingsService.updateResearchSettings(
      orgId,
      body,
      auditContext,
    );
    return { settings };
  }
}
