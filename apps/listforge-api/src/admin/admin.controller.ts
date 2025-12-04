import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import {
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  AdminGetUserDetailResponse,
  AdminGetOrgDetailResponse,
  AdminUpdateOrgStatusRequest,
  AdminUpdateOrgStatusResponse,
  AdminListMarketplaceAccountsQuery,
  AdminListMarketplaceAccountsResponse,
} from '@listforge/api-types';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, OrgGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string): Promise<AdminGetUserDetailResponse> {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/disable')
  async disableUser(@Param('id') id: string): Promise<AdminUpdateUserResponse> {
    return this.adminService.disableUser(id);
  }

  @Post('users/:id/enable')
  async enableUser(@Param('id') id: string): Promise<AdminUpdateUserResponse> {
    return this.adminService.enableUser(id);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserRequest,
  ): Promise<AdminUpdateUserResponse> {
    return this.adminService.updateUser(id, body);
  }

  @Get('orgs')
  async listOrgs() {
    return this.adminService.listOrgs();
  }

  @Get('orgs/:id')
  async getOrgDetail(@Param('id') id: string): Promise<AdminGetOrgDetailResponse> {
    return this.adminService.getOrgDetail(id);
  }

  @Patch('orgs/:id/status')
  async updateOrgStatus(
    @Param('id') id: string,
    @Body() body: AdminUpdateOrgStatusRequest,
  ): Promise<AdminUpdateOrgStatusResponse> {
    return this.adminService.updateOrgStatus(id, body);
  }

  @Get('marketplace-accounts')
  async listMarketplaceAccounts(
    @Query() query: AdminListMarketplaceAccountsQuery,
  ): Promise<AdminListMarketplaceAccountsResponse> {
    return this.adminService.listMarketplaceAccounts(query);
  }

  @Post('marketplace-accounts/:id/disable')
  async disableMarketplaceAccount(@Param('id') id: string) {
    return this.adminService.disableMarketplaceAccount(id);
  }

  @Get('system/metrics')
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }
}

