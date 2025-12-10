import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { MarketplaceAccountService } from './services/marketplace-account.service';
import { MarketplaceListingService } from './services/marketplace-listing.service';
import { MARKETPLACE_THROTTLER_OPTIONS, createThrottleOptions } from './config/throttler.config';

@Controller('marketplaces')
@UseGuards(JwtAuthGuard, OrgGuard)
export class MarketplaceConnectionController {
  constructor(
    private accountService: MarketplaceAccountService,
    private listingService: MarketplaceListingService,
  ) {}

  // ============ eBay OAuth Endpoints ============

  /**
   * Generate eBay OAuth authorization URL
   * Rate limit: 5 requests per minute (prevent state enumeration)
   */
  @Get('ebay/auth-url')
  @Throttle(createThrottleOptions(MARKETPLACE_THROTTLER_OPTIONS.getAuthUrl))
  getEbayAuthUrl(@ReqCtx() ctx: RequestContext) {
    const url = this.accountService.getEbayAuthUrl(ctx.currentOrgId, ctx.userId);
    return { authUrl: url };
  }

  /**
   * Exchange OAuth authorization code for tokens
   * Called by frontend after eBay redirects back with code
   * Rate limit: 10 requests per 5 minutes (prevent brute force)
   */
  @Post('ebay/exchange-code')
  @Throttle(createThrottleOptions(MARKETPLACE_THROTTLER_OPTIONS.exchangeCode))
  async exchangeEbayCode(
    @Body() body: { code: string; state: string },
    @ReqCtx() ctx: RequestContext,
  ) {
    if (!body.code) {
      throw new BadRequestException('Authorization code is required');
    }

    if (!body.state) {
      throw new BadRequestException('State parameter is required');
    }

    const account = await this.accountService.exchangeEbayCode(
      body.code,
      body.state,
      ctx.currentOrgId,
      ctx.userId,
    );

    return {
      success: true,
      account: {
        id: account.id,
        marketplace: account.marketplace,
        status: account.status,
        remoteAccountId: account.remoteAccountId,
      },
    };
  }

  // ============ Amazon OAuth Endpoints ============

  /**
   * Generate Amazon OAuth authorization URL
   * Rate limit: 5 requests per minute (prevent state enumeration)
   */
  @Get('amazon/auth-url')
  @Throttle(createThrottleOptions(MARKETPLACE_THROTTLER_OPTIONS.getAuthUrl))
  getAmazonAuthUrl(@ReqCtx() ctx: RequestContext) {
    const url = this.accountService.getAmazonAuthUrl(ctx.currentOrgId, ctx.userId);
    return { authUrl: url };
  }

  /**
   * Exchange Amazon OAuth authorization code for tokens
   * Called by frontend after Amazon redirects back with code
   * Rate limit: 10 requests per 5 minutes (prevent brute force)
   */
  @Post('amazon/exchange-code')
  @Throttle(createThrottleOptions(MARKETPLACE_THROTTLER_OPTIONS.exchangeCode))
  async exchangeAmazonCode(
    @Body() body: { spapi_oauth_code: string; state: string; selling_partner_id: string },
    @ReqCtx() ctx: RequestContext,
  ) {
    if (!body.spapi_oauth_code) {
      throw new BadRequestException('Authorization code is required');
    }

    if (!body.state) {
      throw new BadRequestException('State parameter is required');
    }

    if (!body.selling_partner_id) {
      throw new BadRequestException('Selling partner ID is required');
    }

    const account = await this.accountService.exchangeAmazonCode(
      body.spapi_oauth_code,
      body.state,
      body.selling_partner_id,
      ctx.currentOrgId,
      ctx.userId,
    );

    return {
      success: true,
      account: {
        id: account.id,
        marketplace: account.marketplace,
        status: account.status,
        remoteAccountId: account.remoteAccountId,
      },
    };
  }

  /**
   * List all marketplace accounts for organization
   * Rate limit: 20 requests per minute (normal API usage)
   */
  @Get('accounts')
  @Throttle(createThrottleOptions(MARKETPLACE_THROTTLER_OPTIONS.listAccounts))
  async listAccounts(@ReqCtx() ctx: RequestContext) {
    const accounts = await this.accountService.listAccounts(ctx.currentOrgId);
    return {
      accounts: accounts.map((acc) => ({
        id: acc.id,
        marketplace: acc.marketplace,
        status: acc.status,
        remoteAccountId: acc.remoteAccountId,
        createdAt: acc.createdAt.toISOString(),
        updatedAt: acc.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Manually refresh marketplace account tokens
   * Supports both eBay and Amazon marketplaces
   * Rate limit: 3 requests per minute (prevent abuse)
   */
  @Post('accounts/:id/refresh')
  @Throttle(createThrottleOptions(MARKETPLACE_THROTTLER_OPTIONS.refreshTokens))
  async refreshAccountTokens(
    @Param('id') id: string,
    @ReqCtx() ctx: RequestContext,
  ) {
    await this.accountService.refreshTokens(id, ctx.currentOrgId);
    return {
      success: true,
      message: 'Tokens refreshed successfully',
    };
  }

  /**
   * Disconnect/revoke marketplace account
   * Rate limit: 5 requests per minute (prevent abuse)
   */
  @Delete('accounts/:id')
  @Throttle(createThrottleOptions(MARKETPLACE_THROTTLER_OPTIONS.deleteAccount))
  async revokeAccount(
    @Param('id') id: string,
    @ReqCtx() ctx: RequestContext,
  ) {
    await this.accountService.revokeAccount(id, ctx.currentOrgId);
    return { success: true };
  }
}

