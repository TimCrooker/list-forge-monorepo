import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MeResponse,
  SwitchOrgRequest,
  SwitchOrgResponse,
} from '@listforge/api-types';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterRequest): Promise<RegisterResponse> {
    return this.authService.register(body);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req): Promise<LoginResponse> {
    // req.user is already validated by LocalStrategy
    const user = req.user;
    return this.authService.loginWithUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req): Promise<MeResponse> {
    return this.authService.me(req.user.userId, req.user.currentOrgId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-org')
  async switchOrg(
    @Request() req,
    @Body() body: SwitchOrgRequest,
  ): Promise<SwitchOrgResponse> {
    return this.authService.switchOrg(req.user.userId, body);
  }
}

