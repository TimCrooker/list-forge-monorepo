import {
  IngestionStatus,
  ReviewStatus,
  ComponentStatus,
  ListingDraftMedia,
  ListingDraftAttribute,
  ShippingType,
  PricingStrategy,
  ResearchSnapshot,
} from '@listforge/core-types';

/**
 * Full ListingDraft DTO returned from API
 */
export interface ListingDraftDto {
  id: string;
  organizationId: string;
  createdByUserId: string;

  // Statuses
  ingestionStatus: IngestionStatus;
  reviewStatus: ReviewStatus;

  // User hints
  userTitleHint: string | null;
  userDescriptionHint: string | null;
  userNotes: string | null;

  // Media
  media: ListingDraftMedia[];

  // AI-generated content
  title: string | null;
  subtitle: string | null;
  description: string | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  categoryPath: string[] | null;
  primaryCategoryId: string | null;
  ebayCategoryId: string | null;
  attributes: ListingDraftAttribute[];

  // Research data
  researchSnapshot: ResearchSnapshot | null;

  // Pricing
  suggestedPrice: number | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  pricingStrategy: PricingStrategy | null;

  // Shipping
  shippingType: ShippingType | null;
  flatRateAmount: number | null;
  domesticOnly: boolean;
  shippingNotes: string | null;

  // Component flags
  titleStatus: ComponentStatus;
  descriptionStatus: ComponentStatus;
  categoryStatus: ComponentStatus;
  pricingStatus: ComponentStatus;
  attributesStatus: ComponentStatus;

  // AI metadata
  aiPipelineVersion: string | null;
  aiLastRunAt: string | null;
  aiErrorMessage: string | null;
  aiConfidenceScore: number | null;

  // Assignment
  assignedReviewerUserId: string | null;

  // Review metadata
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Lightweight summary DTO for lists
 */
export interface ListingDraftSummaryDto {
  id: string;
  ingestionStatus: IngestionStatus;
  reviewStatus: ReviewStatus;
  userTitleHint: string | null;
  title: string | null;
  suggestedPrice: number | null;
  currency: string;
  primaryImageUrl: string | null;
  createdAt: string;
}

/**
 * Request to create a new listing draft (ingestion)
 */
export interface CreateListingDraftRequest {
  userTitleHint?: string;
  userDescriptionHint?: string;
  userNotes?: string;
}

/**
 * Response after creating a listing draft
 */
export interface CreateListingDraftResponse {
  draft: ListingDraftSummaryDto;
}

/**
 * Response for listing recent drafts
 */
export interface ListListingDraftsResponse {
  drafts: ListingDraftSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response for getting a single draft
 */
export interface GetListingDraftResponse {
  draft: ListingDraftDto;
}

/**
 * Request to update a listing draft
 */
export interface UpdateListingDraftRequest {
  // User hints
  userTitleHint?: string;
  userDescriptionHint?: string;
  userNotes?: string;

  // AI-generated content (can be manually edited)
  title?: string;
  subtitle?: string;
  description?: string;
  condition?: string;
  categoryPath?: string[];
  primaryCategoryId?: string;
  ebayCategoryId?: string;

  // Pricing
  suggestedPrice?: number;
  priceMin?: number;
  priceMax?: number;
  pricingStrategy?: PricingStrategy;

  // Shipping
  shippingType?: ShippingType;
  flatRateAmount?: number;
  domesticOnly?: boolean;
  shippingNotes?: string;

  // Component flags (for manual review)
  titleStatus?: ComponentStatus;
  descriptionStatus?: ComponentStatus;
  categoryStatus?: ComponentStatus;
  pricingStatus?: ComponentStatus;
  attributesStatus?: ComponentStatus;
}

/**
 * Response after updating a listing draft
 */
export interface UpdateListingDraftResponse {
  draft: ListingDraftDto;
}

/**
 * Request to delete a listing draft
 */
export interface DeleteListingDraftResponse {
  success: boolean;
}

/**
 * Response after re-running AI on a listing draft
 */
export interface RerunAiResponse {
  draft: ListingDraftDto;
}

/**
 * Request to assign a reviewer to a listing draft
 */
export interface AssignReviewerRequest {
  /** User ID to assign, or null to unassign */
  assignedReviewerUserId: string | null;
}

/**
 * Response after assigning a reviewer
 */
export interface AssignReviewerResponse {
  draft: ListingDraftDto;
}
