import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import {
  UpdateUserRequest,
  UpdateUserResponse,
  UserDto,
} from '@listforge/api-types';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, OrgGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

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
}

