import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ReviewQueueResponse,
  ApplyReviewRequest,
  ApplyReviewResponse,
  ReviewQueueFilters,
} from '@listforge/api-types';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * Review Controller
 *
 * Handles review queue retrieval and review decisions.
 */
@Controller('review')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  /**
   * Get the review queue
   *
   * GET /review/queue
   *
   * Returns a paginated list of listing drafts awaiting review.
   * Supports filtering by category, date range, assignee, and confidence score.
   */
  @Get('queue')
  async getQueue(
    @ReqCtx() ctx: RequestContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('maxConfidence') maxConfidence?: string,
  ): Promise<ReviewQueueResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;

    const filters: ReviewQueueFilters = {};
    if (category) filters.category = category;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (minConfidence) filters.minConfidence = parseFloat(minConfidence);
    if (maxConfidence) filters.maxConfidence = parseFloat(maxConfidence);

    return this.reviewService.getQueue(ctx, pageNum, pageSizeNum, filters);
  }

  /**
   * Apply a review decision to a listing draft
   *
   * POST /review/drafts/:id/decision
   *
   * Applies an approve, reject, or needs_manual decision.
   * Optionally includes component status overrides and a review comment.
   */
  @Post('drafts/:id/decision')
  async applyDecision(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: ApplyReviewRequest,
  ): Promise<ApplyReviewResponse> {
    return this.reviewService.applyDecision(id, ctx, body);
  }
}
