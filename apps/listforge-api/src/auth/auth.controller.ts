import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
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
import {
  AuthenticatedRequest,
  LocalAuthenticatedRequest,
} from '../common/interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterRequest): Promise<RegisterResponse> {
    return this.authService.register(body);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req: LocalAuthenticatedRequest): Promise<LoginResponse> {
    // req.user is already validated by LocalStrategy
    return this.authService.loginWithUser(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthenticatedRequest): Promise<MeResponse> {
    return this.authService.me(req.user.userId, req.user.currentOrgId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-org')
  async switchOrg(
    @Req() req: AuthenticatedRequest,
    @Body() body: SwitchOrgRequest,
  ): Promise<SwitchOrgResponse> {
    return this.authService.switchOrg(req.user.userId, body);
  }
}

