import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  ReviewQueueResponse,
  ApplyReviewRequest,
  ApplyReviewResponse,
  ReviewQueueFilters,
  ListingDraftDto,
  ListingDraftSummaryDto,
} from '@listforge/api-types';
import { ReviewStatus } from '@listforge/core-types';
import { ListingDraft } from '../listing-drafts/entities/listing-draft.entity';
import { RequestContext } from '../common/interfaces/request-context.interface';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ListingDraft)
    private draftRepo: Repository<ListingDraft>,
  ) {}

  /**
   * Get the review queue with optional filters
   */
  async getQueue(
    ctx: RequestContext,
    page: number = 1,
    pageSize: number = 20,
    filters?: ReviewQueueFilters,
  ): Promise<ReviewQueueResponse> {
    const queryBuilder = this.draftRepo
      .createQueryBuilder('draft')
      .where('draft.organizationId = :orgId', { orgId: ctx.currentOrgId })
      .andWhere('draft.ingestionStatus = :ingestionStatus', {
        ingestionStatus: 'ai_complete',
      })
      .andWhere('draft.reviewStatus IN (:...reviewStatuses)', {
        reviewStatuses: ['needs_review', 'unreviewed'],
      });

    // Apply filters
    if (filters?.category) {
      queryBuilder.andWhere('draft.primaryCategoryId = :category', {
        category: filters.category,
      });
    }

    if (filters?.assignedTo) {
      queryBuilder.andWhere('draft.assignedReviewerUserId = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('draft.createdAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('draft.createdAt <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }

    if (filters?.minConfidence !== undefined) {
      queryBuilder.andWhere('draft.aiConfidenceScore >= :minConfidence', {
        minConfidence: filters.minConfidence,
      });
    }

    if (filters?.maxConfidence !== undefined) {
      queryBuilder.andWhere('draft.aiConfidenceScore <= :maxConfidence', {
        maxConfidence: filters.maxConfidence,
      });
    }

    // Order by createdAt descending (newest first)
    queryBuilder.orderBy('draft.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    const drafts = await queryBuilder.getMany();

    return {
      items: drafts.map((d) => this.toSummaryDto(d)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Apply a review decision to a listing draft
   */
  async applyDecision(
    draftId: string,
    ctx: RequestContext,
    request: ApplyReviewRequest,
  ): Promise<ApplyReviewResponse> {
    const draft = await this.draftRepo.findOne({
      where: { id: draftId, organizationId: ctx.currentOrgId },
    });

    if (!draft) {
      throw new NotFoundException('Listing draft not found');
    }

    // Map action to review status
    let newReviewStatus: ReviewStatus;
    switch (request.action) {
      case 'approve':
        newReviewStatus = 'approved';
        break;
      case 'reject':
        newReviewStatus = 'rejected';
        break;
      case 'needs_manual':
        newReviewStatus = 'needs_review';
        break;
      default:
        newReviewStatus = 'needs_review';
    }

    // Update review status
    draft.reviewStatus = newReviewStatus;
    draft.reviewedByUserId = ctx.userId;
    draft.reviewedAt = new Date();

    // Update review comment if provided
    if (request.reviewComment !== undefined) {
      draft.reviewComment = request.reviewComment;
    }

    // Apply component status overrides if provided
    if (request.componentStatusOverrides) {
      const overrides = request.componentStatusOverrides;
      if (overrides.titleStatus !== undefined) {
        draft.titleStatus = overrides.titleStatus;
      }
      if (overrides.descriptionStatus !== undefined) {
        draft.descriptionStatus = overrides.descriptionStatus;
      }
      if (overrides.categoryStatus !== undefined) {
        draft.categoryStatus = overrides.categoryStatus;
      }
      if (overrides.pricingStatus !== undefined) {
        draft.pricingStatus = overrides.pricingStatus;
      }
      if (overrides.attributesStatus !== undefined) {
        draft.attributesStatus = overrides.attributesStatus;
      }
    }

    const savedDraft = await this.draftRepo.save(draft);

    return {
      draft: this.toDto(savedDraft),
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
