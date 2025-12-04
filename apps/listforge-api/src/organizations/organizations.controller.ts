import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  CreateOrgRequest,
  CreateOrgResponse,
  OrgDetailResponse,
  AddOrgMemberRequest,
  AddOrgMemberResponse,
  UpdateOrgMemberRequest,
  UpdateOrgMemberResponse,
} from '@listforge/api-types';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

@Controller('orgs')
@UseGuards(JwtAuthGuard, OrgGuard)
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

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
}

