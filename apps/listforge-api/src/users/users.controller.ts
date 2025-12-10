import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  UpdateUserRequest,
  UpdateUserResponse,
  UserDto,
} from '@listforge/api-types';
import { UsersService } from './users.service';
import { PushNotificationService } from './services/push-notification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { RegisterDeviceTokenDto, RegisterDeviceTokenResult } from './dto/device-token.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, OrgGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private pushNotificationService: PushNotificationService,
  ) {}

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<{ user: UserDto }> {
    const user = await this.usersService.findOne(id);
    return { user: this.usersService.toDto(user) };
  }

  @Patch(':id')
  async update(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: UpdateUserRequest,
  ): Promise<UpdateUserResponse> {
    return this.usersService.update(ctx, id, body);
  }

  @Post('device-token')
  async registerDeviceToken(
    @ReqCtx() ctx: RequestContext,
    @Body() body: RegisterDeviceTokenDto,
  ): Promise<RegisterDeviceTokenResult> {
    try {
      await this.pushNotificationService.registerDeviceToken(
        ctx.userId,
        body.token,
        body.platform,
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to register device token',
      };
    }
  }
}

