import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  CreateOrgRequest,
  CreateOrgResponse,
  OrgDetailResponse,
  AddOrgMemberRequest,
  AddOrgMemberResponse,
  UpdateOrgMemberRequest,
  UpdateOrgMemberResponse,
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
} from '@listforge/api-types';
import { OrganizationsService } from './organizations.service';
import { AutoPublishService } from '../marketplaces/services/auto-publish.service';
import { OrganizationSettingsService } from './services/organization-settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

@Controller('orgs')
@UseGuards(JwtAuthGuard, OrgGuard)
export class OrganizationsController {
  constructor(
    private orgsService: OrganizationsService,
    private autoPublishService: AutoPublishService,
    private settingsService: OrganizationSettingsService,
  ) {}

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
  async addMember(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: AddOrgMemberRequest,
  ): Promise<AddOrgMemberResponse> {
    return this.orgsService.addMember(orgId, ctx, body);
  }

  @Patch(':id/members/:userId')
  async updateMember(
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateOrgMemberRequest,
  ): Promise<UpdateOrgMemberResponse> {
    return this.orgsService.updateMember(orgId, userId, ctx, body);
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
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateWorkflowSettingsRequest,
  ): Promise<UpdateWorkflowSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.updateWorkflowSettings(orgId, body);
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
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateNotificationSettingsRequest,
  ): Promise<UpdateNotificationSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.updateNotificationSettings(orgId, body);
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
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateTeamSettingsRequest,
  ): Promise<UpdateTeamSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.updateTeamSettings(orgId, body);
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
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateInventorySettingsRequest,
  ): Promise<UpdateInventorySettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.updateInventorySettings(orgId, body);
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
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateMarketplaceDefaultSettingsRequest,
  ): Promise<UpdateMarketplaceDefaultSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.updateMarketplaceDefaultSettings(orgId, body);
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
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateBillingSettingsRequest,
  ): Promise<UpdateBillingSettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    const settings = await this.settingsService.updateBillingSettings(orgId, body);
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
    @ReqCtx() ctx: RequestContext,
    @Param('id') orgId: string,
    @Body() body: UpdateSecuritySettingsRequest,
  ): Promise<UpdateSecuritySettingsResponse> {
    await this.orgsService.getDetail(orgId, ctx);
    // Only admin or owner can update security settings
    if (ctx.orgRole !== 'owner' && ctx.orgRole !== 'admin') {
      throw new ForbiddenException('Only admins can update security settings');
    }
    const settings = await this.settingsService.updateSecuritySettings(orgId, body);
    return { settings };
  }
}

