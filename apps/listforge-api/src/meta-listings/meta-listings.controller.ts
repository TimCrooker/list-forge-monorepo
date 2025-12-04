import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { MetaListingsService } from './meta-listings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { MetaListingDto } from '@listforge/api-types';

@Controller('meta-listings')
@UseGuards(JwtAuthGuard, OrgGuard)
export class MetaListingsController {
  constructor(private metaListingsService: MetaListingsService) {}

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
}

