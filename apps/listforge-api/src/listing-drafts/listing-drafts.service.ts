import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateListingDraftRequest,
  CreateListingDraftResponse,
  GetListingDraftResponse,
  ListListingDraftsResponse,
  UpdateListingDraftRequest,
  UpdateListingDraftResponse,
  ListingDraftDto,
  ListingDraftSummaryDto,
  DeleteListingDraftResponse,
  RerunAiResponse,
  AssignReviewerRequest,
  AssignReviewerResponse,
} from '@listforge/api-types';
import { ListingDraftMedia } from '@listforge/core-types';
import { QUEUE_AI_WORKFLOW, StartWorkflowJob } from '@listforge/queue-types';
import { ListingDraft } from './entities/listing-draft.entity';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { StorageService } from '../storage/storage.service';
import { MulterFile } from '../common/types/multer-file.type';

@Injectable()
export class ListingDraftsService {
  constructor(
    @InjectRepository(ListingDraft)
    private draftRepo: Repository<ListingDraft>,
    private storageService: StorageService,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private aiWorkflowQueue: Queue,
  ) {}

  /**
   * Create a new listing draft from uploaded photos and optional hints
   */
  async createFromIngestion(
    ctx: RequestContext,
    photos: MulterFile[],
    hints: CreateListingDraftRequest,
  ): Promise<CreateListingDraftResponse> {
    if (!photos || photos.length === 0) {
      throw new BadRequestException('At least one photo is required');
    }

    // Create the draft first to get an ID
    const draft = this.draftRepo.create({
      organizationId: ctx.currentOrgId,
      createdByUserId: ctx.userId,
      ingestionStatus: 'uploaded',
      reviewStatus: 'unreviewed',
      userTitleHint: hints.userTitleHint || null,
      userDescriptionHint: hints.userDescriptionHint || null,
      userNotes: hints.userNotes || null,
      media: [],
      attributes: [],
    });

    const savedDraft = await this.draftRepo.save(draft);

    // Upload photos and build media array
    const mediaPromises = photos.map(async (file, index) => {
      const mediaId = uuidv4();
      const filename = `${ctx.currentOrgId}/${savedDraft.id}/${mediaId}-${file.originalname}`;
      // uploadPhoto returns the public URL directly
      const url = await this.storageService.uploadPhoto(
        file.buffer,
        filename,
      );

      const media: ListingDraftMedia = {
        id: mediaId,
        url,
        storagePath: filename,
        sortOrder: index,
        isPrimary: index === 0,
      };

      return media;
    });

    const mediaItems = await Promise.all(mediaPromises);

    // Update draft with media
    savedDraft.media = mediaItems;
    savedDraft.ingestionStatus = 'ai_queued';
    await this.draftRepo.save(savedDraft);

    // Enqueue AI workflow
    const job: StartWorkflowJob = {
      workflowType: 'listing-intake-v1',
      listingDraftId: savedDraft.id,
      orgId: ctx.currentOrgId,
      userId: ctx.userId,
    };
    await this.aiWorkflowQueue.add('start-workflow', job);

    return {
      draft: this.toSummaryDto(savedDraft),
    };
  }

  /**
   * List listing drafts with pagination
   */
  async findAll(
    ctx: RequestContext,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ListListingDraftsResponse> {
    const [drafts, total] = await this.draftRepo.findAndCount({
      where: { organizationId: ctx.currentOrgId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      drafts: drafts.map((d) => this.toSummaryDto(d)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get a single listing draft by ID
   */
  async findOne(id: string, ctx: RequestContext): Promise<GetListingDraftResponse> {
    const draft = await this.draftRepo.findOne({
      where: { id, organizationId: ctx.currentOrgId },
    });

    if (!draft) {
      throw new NotFoundException('Listing draft not found');
    }

    return {
      draft: this.toDto(draft),
    };
  }

  /**
   * Update a listing draft
   */
  async update(
    id: string,
    ctx: RequestContext,
    data: UpdateListingDraftRequest,
  ): Promise<UpdateListingDraftResponse> {
    const draft = await this.draftRepo.findOne({
      where: { id, organizationId: ctx.currentOrgId },
    });

    if (!draft) {
      throw new NotFoundException('Listing draft not found');
    }

    // Update user hints
    if (data.userTitleHint !== undefined) {
      draft.userTitleHint = data.userTitleHint;
    }
    if (data.userDescriptionHint !== undefined) {
      draft.userDescriptionHint = data.userDescriptionHint;
    }
    if (data.userNotes !== undefined) {
      draft.userNotes = data.userNotes;
    }

    // Update AI-generated content (manual edits)
    if (data.title !== undefined) {
      draft.title = data.title;
    }
    if (data.subtitle !== undefined) {
      draft.subtitle = data.subtitle;
    }
    if (data.description !== undefined) {
      draft.description = data.description;
    }
    if (data.condition !== undefined) {
      draft.condition = data.condition;
    }
    if (data.categoryPath !== undefined) {
      draft.categoryPath = data.categoryPath;
    }
    if (data.primaryCategoryId !== undefined) {
      draft.primaryCategoryId = data.primaryCategoryId;
    }
    if (data.ebayCategoryId !== undefined) {
      draft.ebayCategoryId = data.ebayCategoryId;
    }

    // Update pricing
    if (data.suggestedPrice !== undefined) {
      draft.suggestedPrice = data.suggestedPrice;
    }
    if (data.priceMin !== undefined) {
      draft.priceMin = data.priceMin;
    }
    if (data.priceMax !== undefined) {
      draft.priceMax = data.priceMax;
    }
    if (data.pricingStrategy !== undefined) {
      draft.pricingStrategy = data.pricingStrategy;
    }

    // Update shipping
    if (data.shippingType !== undefined) {
      draft.shippingType = data.shippingType;
    }
    if (data.flatRateAmount !== undefined) {
      draft.flatRateAmount = data.flatRateAmount;
    }
    if (data.domesticOnly !== undefined) {
      draft.domesticOnly = data.domesticOnly;
    }
    if (data.shippingNotes !== undefined) {
      draft.shippingNotes = data.shippingNotes;
    }

    // Update component flags
    if (data.titleStatus !== undefined) {
      draft.titleStatus = data.titleStatus;
    }
    if (data.descriptionStatus !== undefined) {
      draft.descriptionStatus = data.descriptionStatus;
    }
    if (data.categoryStatus !== undefined) {
      draft.categoryStatus = data.categoryStatus;
    }
    if (data.pricingStatus !== undefined) {
      draft.pricingStatus = data.pricingStatus;
    }
    if (data.attributesStatus !== undefined) {
      draft.attributesStatus = data.attributesStatus;
    }

    const savedDraft = await this.draftRepo.save(draft);

    return {
      draft: this.toDto(savedDraft),
    };
  }

  /**
   * Delete a listing draft
   */
  async remove(id: string, ctx: RequestContext): Promise<DeleteListingDraftResponse> {
    const draft = await this.draftRepo.findOne({
      where: { id, organizationId: ctx.currentOrgId },
    });

    if (!draft) {
      throw new NotFoundException('Listing draft not found');
    }

    // Delete photos from storage
    const deletePromises = draft.media.map((media) =>
      this.storageService.deletePhoto(media.storagePath),
    );
    await Promise.all(deletePromises);

    // Delete draft
    await this.draftRepo.remove(draft);

    return { success: true };
  }

  /**
   * Re-run AI processing on a listing draft
   *
   * Preserves user-edited fields while re-running AI analysis.
   * Resets status to ai_queued and enqueues new workflow job.
   */
  async rerunAi(id: string, ctx: RequestContext): Promise<RerunAiResponse> {
    const draft = await this.draftRepo.findOne({
      where: { id, organizationId: ctx.currentOrgId },
    });

    if (!draft) {
      throw new NotFoundException('Listing draft not found');
    }

    // Cannot re-run AI on draft that is already processing
    if (draft.ingestionStatus === 'ai_queued' || draft.ingestionStatus === 'ai_running') {
      throw new BadRequestException('AI processing is already in progress');
    }

    // Reset AI status
    draft.ingestionStatus = 'ai_queued';
    draft.aiErrorMessage = null;

    await this.draftRepo.save(draft);

    // Enqueue AI workflow
    const job: StartWorkflowJob = {
      workflowType: 'listing-intake-v1',
      listingDraftId: draft.id,
      orgId: ctx.currentOrgId,
      userId: ctx.userId,
    };
    await this.aiWorkflowQueue.add('start-workflow', job);

    return {
      draft: this.toDto(draft),
    };
  }

  /**
   * Assign a reviewer to a listing draft
   */
  async assignReviewer(
    id: string,
    ctx: RequestContext,
    data: AssignReviewerRequest,
  ): Promise<AssignReviewerResponse> {
    const draft = await this.draftRepo.findOne({
      where: { id, organizationId: ctx.currentOrgId },
    });

    if (!draft) {
      throw new NotFoundException('Listing draft not found');
    }

    draft.assignedReviewerUserId = data.assignedReviewerUserId;
    await this.draftRepo.save(draft);

    return {
      draft: this.toDto(draft),
    };
  }

  /**
   * Convert entity to full DTO
   */
  private toDto(draft: ListingDraft): ListingDraftDto {
    return {
      id: draft.id,
      organizationId: draft.organizationId,
      createdByUserId: draft.createdByUserId,
      ingestionStatus: draft.ingestionStatus,
      reviewStatus: draft.reviewStatus,
      userTitleHint: draft.userTitleHint,
      userDescriptionHint: draft.userDescriptionHint,
      userNotes: draft.userNotes,
      media: draft.media,
      title: draft.title,
      subtitle: draft.subtitle,
      description: draft.description,
      condition: draft.condition,
      brand: draft.brand,
      model: draft.model,
      categoryPath: draft.categoryPath,
      primaryCategoryId: draft.primaryCategoryId,
      ebayCategoryId: draft.ebayCategoryId,
      attributes: draft.attributes,
      researchSnapshot: draft.researchSnapshot,
      suggestedPrice: draft.suggestedPrice ? Number(draft.suggestedPrice) : null,
      priceMin: draft.priceMin ? Number(draft.priceMin) : null,
      priceMax: draft.priceMax ? Number(draft.priceMax) : null,
      currency: draft.currency,
      pricingStrategy: draft.pricingStrategy,
      shippingType: draft.shippingType,
      flatRateAmount: draft.flatRateAmount ? Number(draft.flatRateAmount) : null,
      domesticOnly: draft.domesticOnly,
      shippingNotes: draft.shippingNotes,
      titleStatus: draft.titleStatus,
      descriptionStatus: draft.descriptionStatus,
      categoryStatus: draft.categoryStatus,
      pricingStatus: draft.pricingStatus,
      attributesStatus: draft.attributesStatus,
      aiPipelineVersion: draft.aiPipelineVersion,
      aiLastRunAt: draft.aiLastRunAt ? draft.aiLastRunAt.toISOString() : null,
      aiErrorMessage: draft.aiErrorMessage,
      aiConfidenceScore: draft.aiConfidenceScore
        ? Number(draft.aiConfidenceScore)
        : null,
      assignedReviewerUserId: draft.assignedReviewerUserId,
      reviewedByUserId: draft.reviewedByUserId,
      reviewedAt: draft.reviewedAt ? draft.reviewedAt.toISOString() : null,
      reviewComment: draft.reviewComment,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  /**
   * Convert entity to summary DTO
   */
  private toSummaryDto(draft: ListingDraft): ListingDraftSummaryDto {
    const primaryMedia = draft.media.find((m) => m.isPrimary) || draft.media[0];

    return {
      id: draft.id,
      ingestionStatus: draft.ingestionStatus,
      reviewStatus: draft.reviewStatus,
      userTitleHint: draft.userTitleHint,
      title: draft.title,
      suggestedPrice: draft.suggestedPrice ? Number(draft.suggestedPrice) : null,
      currency: draft.currency,
      primaryImageUrl: primaryMedia?.url || null,
      createdAt: draft.createdAt.toISOString(),
    };
  }
}
