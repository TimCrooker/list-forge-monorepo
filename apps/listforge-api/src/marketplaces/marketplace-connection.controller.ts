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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { MarketplaceAccountService } from './services/marketplace-account.service';
import { MarketplaceListingService } from './services/marketplace-listing.service';

@Controller('marketplaces')
@UseGuards(JwtAuthGuard, OrgGuard)
export class MarketplaceConnectionController {
  constructor(
    private accountService: MarketplaceAccountService,
    private listingService: MarketplaceListingService,
  ) {}

  @Get('ebay/auth-url')
  getEbayAuthUrl(@ReqCtx() ctx: RequestContext) {
    const url = this.accountService.getEbayAuthUrl(ctx.currentOrgId, ctx.userId);
    return { authUrl: url };
  }

  /**
   * Exchange OAuth authorization code for tokens
   * Called by frontend after eBay redirects back with code
   */
  @Post('ebay/exchange-code')
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

  @Get('accounts')
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

  @Delete('accounts/:id')
  async revokeAccount(
    @Param('id') id: string,
    @ReqCtx() ctx: RequestContext,
  ) {
    await this.accountService.revokeAccount(id, ctx.currentOrgId);
    return { success: true };
  }
}

