import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  CreateListingDraftRequest,
  CreateListingDraftResponse,
  ListListingDraftsResponse,
} from '@listforge/api-types';
import { ListingDraftsService } from './listing-drafts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { MulterFile } from '../common/types/multer-file.type';

/**
 * Ingestion Controller
 *
 * Handles mobile-first capture flow for creating listing drafts.
 * Optimized for quick item capture with photos + optional hints.
 */
@Controller('ingestion')
@UseGuards(JwtAuthGuard, OrgGuard)
export class IngestionController {
  constructor(private listingDraftsService: ListingDraftsService) {}

  /**
   * Create a new listing draft from photos + hints
   *
   * POST /ingestion/listings
   *
   * Uploads photos, creates draft, and queues AI processing.
   * Returns immediately with draft summary (doesn't wait for AI).
   */
  @Post('listings')
  @UseInterceptors(FilesInterceptor('photos', 20))
  async create(
    @ReqCtx() ctx: RequestContext,
    @UploadedFiles() photos: MulterFile[],
    @Body() body: CreateListingDraftRequest,
  ): Promise<CreateListingDraftResponse> {
    return this.listingDraftsService.createFromIngestion(ctx, photos, body);
  }

  /**
   * List recent listing drafts
   *
   * GET /ingestion/listings
   *
   * Returns lightweight summaries for mobile capture view.
   * Shows recently captured items with their AI processing status.
   */
  @Get('listings')
  async list(
    @ReqCtx() ctx: RequestContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListListingDraftsResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.listingDraftsService.findAll(ctx, pageNum, pageSizeNum);
  }
}
