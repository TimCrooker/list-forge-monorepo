import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateAiCaptureItemRequest,
  CreateManualItemRequest,
  CreateItemResponse,
  GetItemResponse,
  ListItemsResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  ListItemsQuery,
  CreateMarketplaceListingRequest,
  CreateMarketplaceListingResponse,
  GetItemMarketplaceListingsResponse,
  PublishItemListingRequest,
  PublishItemListingResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from '@listforge/api-types';
import { ItemMedia } from '@listforge/core-types';
import { ItemsService } from './items.service';
import { StorageService } from '../storage/storage.service';
import { EvidenceService } from '../evidence/evidence.service';
import { MarketplaceListingService } from '../marketplaces/services/marketplace-listing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { ReqCtx } from '../common/decorators/req-ctx.decorator';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { MulterFile } from '../common/types/multer-file.type';

/**
 * Items Controller - Phase 6 Unified Item Model
 *
 * Handles all Item operations including AI capture and manual creation.
 */
@Controller('items')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly storageService: StorageService,
    private readonly evidenceService: EvidenceService,
    private readonly marketplaceListingService: MarketplaceListingService,
  ) {}

  /**
   * Create an AI-capture item from photos + optional hints
   *
   * POST /items/ai-capture
   *
   * Uploads photos, creates Item, and queues AI processing.
   * Returns immediately with item summary (doesn't wait for AI).
   */
  @Post('ai-capture')
  @UseInterceptors(FilesInterceptor('photos', 20))
  async createAiCaptureItem(
    @ReqCtx() ctx: RequestContext,
    @UploadedFiles() photos: MulterFile[],
    @Body() body: CreateAiCaptureItemRequest,
  ): Promise<CreateItemResponse> {
    // Create a temporary item ID for storage path
    const tempItemId = uuidv4();

    // Upload photos and build media array
    const mediaPromises = photos.map(async (file, index) => {
      const mediaId = uuidv4();
      const filename = `${ctx.currentOrgId}/${tempItemId}/${mediaId}-${file.originalname}`;
      const url = await this.storageService.uploadPhoto(file.buffer, filename);

      const media: ItemMedia = {
        id: mediaId,
        url,
        storagePath: filename,
        sortOrder: index,
        isPrimary: index === 0,
      };

      return media;
    });

    const mediaItems = await Promise.all(mediaPromises);

    // Create item with media
    const item = await this.itemsService.createAiCaptureItem(
      ctx.currentOrgId,
      ctx.userId,
      body,
      mediaItems,
    );

    return { item };
  }

  /**
   * Create a manual item
   *
   * POST /items/manual
   *
   * Creates an inventory-ready item with user-provided details.
   * No AI processing - item is immediately ready for listing.
   */
  @Post('manual')
  @UseInterceptors(FilesInterceptor('photos', 20))
  async createManualItem(
    @ReqCtx() ctx: RequestContext,
    @UploadedFiles() photos: MulterFile[],
    @Body() body: CreateManualItemRequest,
  ): Promise<CreateItemResponse> {
    // Upload photos if provided and build media array
    let mediaItems: ItemMedia[] = [];

    if (photos && photos.length > 0) {
      const tempItemId = uuidv4();

      const mediaPromises = photos.map(async (file, index) => {
        const mediaId = uuidv4();
        const filename = `${ctx.currentOrgId}/${tempItemId}/${mediaId}-${file.originalname}`;
        const url = await this.storageService.uploadPhoto(file.buffer, filename);

        const media: ItemMedia = {
          id: mediaId,
          url,
          storagePath: filename,
          sortOrder: index,
          isPrimary: index === 0,
        };

        return media;
      });

      mediaItems = await Promise.all(mediaPromises);
    }

    // Create manual item with photos
    const requestWithMedia: CreateManualItemRequest = {
      ...body,
      media: mediaItems,
    };

    const item = await this.itemsService.createManualItem(
      ctx.currentOrgId,
      ctx.userId,
      requestWithMedia,
    );

    return { item };
  }

  // ============================================================================
  // Review Endpoints (Sub-Phase 3)
  // ============================================================================
  // NOTE: These MUST come before the :id routes to avoid route collision

  /**
   * Get AI review queue
   *
   * GET /items/review/ai-queue
   *
   * Returns items with source='ai_capture', lifecycleStatus='draft', aiReviewState='pending'
   */
  @Get('review/ai-queue')
  async getAiReviewQueue(
    @ReqCtx() ctx: RequestContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;

    const { items, total } = await this.itemsService.getAiReviewQueue(
      ctx.currentOrgId,
      pageNum,
      pageSizeNum,
    );

    return {
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };
  }

  /**
   * Get Needs Work queue
   *
   * GET /items/review/needs-work
   *
   * Returns items with lifecycleStatus='draft', aiReviewState='rejected'
   */
  @Get('review/needs-work')
  async getNeedsWorkQueue(
    @ReqCtx() ctx: RequestContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;

    const { items, total } = await this.itemsService.getNeedsWorkQueue(
      ctx.currentOrgId,
      pageNum,
      pageSizeNum,
    );

    return {
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };
  }

  /**
   * List items with optional filters
   *
   * GET /items
   */
  @Get()
  async listItems(
    @ReqCtx() ctx: RequestContext,
    @Query('lifecycleStatus') lifecycleStatus?: string,
    @Query('aiReviewState') aiReviewState?: string,
    @Query('source') source?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<ListItemsResponse> {
    const query: ListItemsQuery = {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    };

    if (lifecycleStatus) {
      query.lifecycleStatus = lifecycleStatus.split(',') as any;
    }
    if (aiReviewState) {
      query.aiReviewState = aiReviewState.split(',') as any;
    }
    if (source) {
      query.source = source.split(',') as any;
    }
    if (search) {
      query.search = search;
    }
    if (sortBy) {
      query.sortBy = sortBy as any;
    }
    if (sortOrder) {
      query.sortOrder = sortOrder as any;
    }

    const { items, total } = await this.itemsService.listItems(
      ctx.currentOrgId,
      query,
    );

    return {
      items,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    };
  }

  /**
   * Approve an item from AI review
   *
   * POST /items/:id/review/ai-approve
   *
   * Sets aiReviewState='approved', lifecycleStatus='ready'
   */
  @Post(':id/review/ai-approve')
  async approveItem(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ) {
    const item = await this.itemsService.approveItem(
      ctx.currentOrgId,
      ctx.userId,
      id,
    );
    return { item };
  }

  /**
   * Reject an item from AI review
   *
   * POST /items/:id/review/ai-reject
   *
   * Sets aiReviewState='rejected', keeps lifecycleStatus='draft'
   */
  @Post(':id/review/ai-reject')
  async rejectItem(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ) {
    const item = await this.itemsService.rejectItem(
      ctx.currentOrgId,
      ctx.userId,
      id,
      body.comment,
    );
    return { item };
  }

  /**
   * Mark an item as ready (from Needs Work queue)
   *
   * POST /items/:id/mark-ready
   *
   * Sets lifecycleStatus='ready', aiReviewState stays 'rejected'
   */
  @Post(':id/mark-ready')
  async markItemReady(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ) {
    const item = await this.itemsService.markItemReady(
      ctx.currentOrgId,
      ctx.userId,
      id,
    );
    return { item };
  }

  /**
   * Get evidence bundle for an item
   *
   * GET /items/:id/evidence
   */
  @Get(':id/evidence')
  async getItemEvidence(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ) {
    // Verify item belongs to org
    await this.itemsService.getItem(ctx.currentOrgId, id);

    // Get evidence from evidence service
    const bundle = await this.evidenceService.getBundleForItem(id);

    if (!bundle) {
      return { bundle: null };
    }

    return {
      bundle: this.evidenceService.toDto(bundle),
    };
  }

  /**
   * Get a single item by ID
   *
   * GET /items/:id
   */
  @Get(':id')
  async getItem(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetItemResponse> {
    const item = await this.itemsService.getItem(ctx.currentOrgId, id);
    return { item };
  }

  /**
   * Update an item
   *
   * PATCH /items/:id
   */
  @Patch(':id')
  async updateItem(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() data: UpdateItemRequest,
  ): Promise<UpdateItemResponse> {
    const item = await this.itemsService.updateItem(ctx.currentOrgId, id, data);
    return { item };
  }

  /**
   * Delete an item
   *
   * DELETE /items/:id
   */
  @Delete(':id')
  async deleteItem(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.itemsService.deleteItem(ctx.currentOrgId, id);
    return { success: true };
  }

  // ============================================================================
  // Marketplace Listing Endpoints (Sub-Phase 7)
  // ============================================================================

  /**
   * Get marketplace listings for an item
   *
   * GET /items/:id/marketplace-listings
   */
  @Get(':id/marketplace-listings')
  async getMarketplaceListings(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<GetItemMarketplaceListingsResponse> {
    // Verify item belongs to org
    await this.itemsService.getItem(ctx.currentOrgId, id);

    // Get listings
    const listings = await this.marketplaceListingService.getListings(id, ctx);

    return {
      listings: listings.map((listing) => ({
        id: listing.id,
        itemId: listing.itemId,
        marketplaceAccountId: listing.marketplaceAccountId,
        marketplace: listing.marketplaceAccount.marketplace,
        remoteListingId: listing.remoteListingId,
        status: listing.status,
        url: listing.url,
        title: listing.title,
        description: listing.description,
        price: listing.price ? Number(listing.price) : null,
        marketplaceCategoryId: listing.marketplaceCategoryId,
        marketplaceAttributes: listing.marketplaceAttributes,
        lastSyncedAt: listing.lastSyncedAt ? listing.lastSyncedAt.toISOString() : null,
        errorMessage: listing.errorMessage,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Publish item to marketplaces
   *
   * POST /items/:id/publish
   */
  @Post(':id/publish')
  async publishItem(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: PublishItemListingRequest,
  ): Promise<PublishItemListingResponse> {
    await this.marketplaceListingService.publish(id, body.accountIds, ctx);
    return { success: true };
  }

  // ============================================================================
  // Chat Agent Endpoints (Sub-Phase 9)
  // ============================================================================

  /**
   * Send a chat message to the item chat agent
   *
   * POST /items/:id/chat
   *
   * Stub implementation - returns a "coming soon" message.
   * Future implementation will integrate with LLM for context-aware responses.
   */
  @Post(':id/chat')
  async sendChatMessage(
    @ReqCtx() ctx: RequestContext,
    @Param('id') id: string,
    @Body() body: SendChatMessageRequest,
  ): Promise<SendChatMessageResponse> {
    // Verify item exists and belongs to org
    await this.itemsService.getItem(ctx.currentOrgId, id);

    // Return stub response
    return {
      message: {
        id: uuidv4(),
        role: 'assistant',
        content: 'Chat functionality coming soon! This will allow you to ask questions about pricing, condition, and get AI-powered suggestions for your listing.',
        timestamp: new Date().toISOString(),
        actions: [],
      },
    };
  }
}

