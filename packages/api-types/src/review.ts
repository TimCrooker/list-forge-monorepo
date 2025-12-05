import { ComponentStatus } from '@listforge/core-types';
import { ListingDraftSummaryDto, ListingDraftDto } from './listing-drafts';

/**
 * Review action types
 */
export type ReviewAction = 'approve' | 'reject' | 'needs_manual';

/**
 * Filters for the review queue
 */
export interface ReviewQueueFilters {
  /** Filter by category path */
  category?: string;
  /** Filter by assigned reviewer user ID */
  assignedTo?: string;
  /** Filter by date range - start */
  dateFrom?: string;
  /** Filter by date range - end */
  dateTo?: string;
  /** Filter by minimum AI confidence score */
  minConfidence?: number;
  /** Filter by maximum AI confidence score */
  maxConfidence?: number;
}

/**
 * Request for getting review queue
 */
export interface GetReviewQueueRequest {
  page?: number;
  pageSize?: number;
  filters?: ReviewQueueFilters;
}

/**
 * Response for review queue
 */
export interface ReviewQueueResponse {
  items: ListingDraftSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Component status overrides for review decisions
 */
export interface ComponentStatusOverrides {
  titleStatus?: ComponentStatus;
  descriptionStatus?: ComponentStatus;
  categoryStatus?: ComponentStatus;
  pricingStatus?: ComponentStatus;
  attributesStatus?: ComponentStatus;
}

/**
 * Request to apply a review decision
 */
export interface ApplyReviewRequest {
  /** The review action to apply */
  action: ReviewAction;
  /** Optional component status overrides */
  componentStatusOverrides?: ComponentStatusOverrides;
  /** Optional review comment */
  reviewComment?: string;
}

/**
 * Response after applying a review decision
 */
export interface ApplyReviewResponse {
  draft: ListingDraftDto;
}
