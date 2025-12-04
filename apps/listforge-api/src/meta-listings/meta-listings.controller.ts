import { Controller, Get, Post, Param, UseGuards, Query, Body } from '@nestjs/common';
import { MetaListingsService } from './meta-listings.service';
import { MarketplaceListingService } from '../marketplaces/services/marketplace-listing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { MetaListingDto } from '@listforge/api-types';

@Controller('meta-listings')
@UseGuards(JwtAuthGuard, OrgGuard)
export class MetaListingsController {
  constructor(
    private metaListingsService: MetaListingsService,
    private marketplaceListingService: MarketplaceListingService,
  ) {}

  @Get(':id')
  async getOne(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<{ metaListing: MetaListingDto }> {
    const metaListing = await this.metaListingsService.findOne(id, ctx);
    return { metaListing };
  }

  @Get('by-item/:itemId')
  async getByItem(
    @ReqCtx() ctx: RequestContext,
    @Param('itemId') itemId: string,
  ): Promise<{ metaListing: MetaListingDto | null }> {
    const metaListing = await this.metaListingsService.findByItemId(
      itemId,
      ctx,
    );
    return { metaListing };
  }

  @Post(':id/publish')
  async publish(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: { accountIds: string[] },
  ): Promise<{ success: boolean }> {
    await this.marketplaceListingService.publish(id, body.accountIds, ctx);
    return { success: true };
  }

  @Get(':id/marketplace-listings')
  async getMarketplaceListings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ) {
    const listings = await this.marketplaceListingService.getListings(id, ctx);
    return {
      listings: listings.map((listing) => ({
        id: listing.id,
        metaListingId: listing.metaListingId,
        marketplaceAccountId: listing.marketplaceAccountId,
        remoteListingId: listing.remoteListingId,
        status: listing.status,
        url: listing.url,
        price: listing.price ? Number(listing.price) : null,
        lastSyncedAt: listing.lastSyncedAt?.toISOString() || null,
        errorMessage: listing.errorMessage,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
      })),
    };
  }
}

