import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  GetListingDraftResponse,
  ListListingDraftsResponse,
  UpdateListingDraftRequest,
  UpdateListingDraftResponse,
  DeleteListingDraftResponse,
  GetEvidenceResponse,
  RerunAiResponse,
  AssignReviewerRequest,
  AssignReviewerResponse,
} from '@listforge/api-types';
import { ListingDraftsService } from './listing-drafts.service';
import { EvidenceService } from '../evidence/evidence.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';

/**
 * Listing Drafts Controller
 *
 * Handles CRUD operations for listing drafts.
 * Used by the Review Deck and detail views.
 */
@Controller('listings/drafts')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ListingDraftsController {
  constructor(
    private listingDraftsService: ListingDraftsService,
    private evidenceService: EvidenceService,
  ) {}

  /**
   * List all listing drafts with pagination
   *
   * GET /listings/drafts
   *
   * Supports filtering by status, date range, etc.
   * Used by Review Deck queue and admin views.
   */
  @Get()
  async list(
    @ReqCtx() ctx: RequestContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListListingDraftsResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.listingDraftsService.findAll(ctx, pageNum, pageSizeNum);
  }

  /**
   * Get a single listing draft
   *
   * GET /listings/drafts/:id
   *
   * Returns full draft details including all AI-generated content,
   * component flags, and metadata.
   */
  @Get(':id')
  async getOne(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetListingDraftResponse> {
    return this.listingDraftsService.findOne(id, ctx);
  }

  /**
   * Get evidence for a listing draft
   *
   * GET /listings/drafts/:id/evidence
   *
   * Returns the evidence bundle with all comps, summaries,
   * and AI reasoning for this draft.
   */
  @Get(':id/evidence')
  async getEvidence(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetEvidenceResponse> {
    // First verify the draft exists and belongs to the org
    await this.listingDraftsService.findOne(id, ctx);

    // Get evidence bundle
    const bundle = await this.evidenceService.getBundleForDraft(id);

    return {
      bundle: bundle ? this.evidenceService.toDto(bundle) : null,
    };
  }

  /**
   * Update a listing draft
   *
   * PATCH /listings/drafts/:id
   *
   * Allows manual edits to AI-generated content,
   * user hints, pricing, and component flags.
   */
  @Patch(':id')
  async update(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: UpdateListingDraftRequest,
  ): Promise<UpdateListingDraftResponse> {
    return this.listingDraftsService.update(id, ctx, body);
  }

  /**
   * Delete a listing draft
   *
   * DELETE /listings/drafts/:id
   *
   * Removes the draft and all associated photos from storage.
   */
  @Delete(':id')
  async remove(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<DeleteListingDraftResponse> {
    return this.listingDraftsService.remove(id, ctx);
  }

  /**
   * Re-run AI processing on a listing draft
   *
   * POST /listings/drafts/:id/ai-run
   *
   * Triggers a new AI processing run while preserving
   * user-edited fields.
   */
  @Post(':id/ai-run')
  async rerunAi(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<RerunAiResponse> {
    return this.listingDraftsService.rerunAi(id, ctx);
  }

  /**
   * Assign a reviewer to a listing draft
   *
   * POST /listings/drafts/:id/assign
   *
   * Assigns or unassigns a reviewer from the draft.
   */
  @Post(':id/assign')
  async assignReviewer(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: AssignReviewerRequest,
  ): Promise<AssignReviewerResponse> {
    return this.listingDraftsService.assignReviewer(id, ctx, body);
  }
}
