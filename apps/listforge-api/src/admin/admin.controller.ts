import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import {
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
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

  @Get('orgs')
  async listOrgs() {
    return this.adminService.listOrgs();
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserRequest,
  ): Promise<AdminUpdateUserResponse> {
    return this.adminService.updateUser(id, body);
  }
}

