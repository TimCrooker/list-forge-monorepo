import {
  LifecycleStatus,
  AiReviewState,
  ItemSource,
  ItemMedia,
  ItemAttribute,
  ShippingType,
  PricingStrategy,
  ItemCondition,
} from '@listforge/core-types';

/**
 * Item DTOs - Phase 6 Unified Item Model API Types
 *
 * Request and response types for the unified Item API endpoints.
 */

// ============================================================================
// Full Item DTO (for single item responses)
// ============================================================================

export interface ItemDto {
  // Identity & Provenance
  id: string;
  organizationId: string;
  createdByUserId: string;
  source: ItemSource;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // Status Fields
  lifecycleStatus: LifecycleStatus;
  aiReviewState: AiReviewState;

  // User Hints
  userTitleHint: string | null;
  userDescriptionHint: string | null;
  userNotes: string | null;

  // Core Listing Fields
  title: string | null;
  subtitle: string | null;
  description: string | null;
  condition: ItemCondition | null;

  // Category
  categoryPath: string[] | null;
  categoryId: string | null;

  // Attributes
  attributes: ItemAttribute[];

  // Media
  media: ItemMedia[];
  photos: ItemMedia[]; // Alias for media for backwards compatibility
  primaryImageUrl: string | null; // URL of primary image

  // Quantity & Pricing
  quantity: number;
  defaultPrice: number | null;
  currency: string;
  priceMin: number | null;
  priceMax: number | null;
  pricingStrategy: PricingStrategy | null;

  // Shipping
  shippingType: ShippingType | null;
  flatRateAmount: number | null;
  domesticOnly: boolean;
  weight: number | null;
  dimensions: string | null;

  // Operational/Inventory Fields
  location: string | null;
  costBasis: number | null;
  tags: string[];

  // AI Metadata
  aiPipelineVersion: string | null;
  aiLastRunAt: string | null; // ISO date string
  aiLastRunError: string | null;
  aiConfidenceScore: number | null;

  // Review Tracking & Confidence-Based Routing
  assignedReviewerUserId: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null; // ISO date string
  reviewComment: string | null;
  /** Review recommendation from confidence-based routing: 'approve' (spot-check) or 'review' (full review) */
  reviewRecommendation: 'approve' | 'review' | null;
}

// ============================================================================
// Lightweight Summary DTO (for list views)
// ============================================================================

export interface ItemSummaryDto {
  id: string;
  lifecycleStatus: LifecycleStatus;
  aiReviewState: AiReviewState;
  source: ItemSource;
  title: string | null;
  defaultPrice: number | null;
  currency: string;
  quantity: number;
  primaryImageUrl: string | null; // Computed from media array
  createdAt: string; // ISO date string
  /** Review recommendation from confidence-based routing: 'approve' (spot-check) or 'review' (full review) */
  reviewRecommendation?: 'approve' | 'review' | null;
}

// ============================================================================
// Create AI Capture Item Request
// ============================================================================

export interface CreateAiCaptureItemRequest {
  userTitleHint?: string;
  userDescriptionHint?: string;
  userNotes?: string;
  // Media references are handled separately via upload endpoints
}

// ============================================================================
// Create Manual Item Request
// ============================================================================

export interface CreateManualItemRequest {
  // Core listing fields (required)
  title: string;
  subtitle?: string;
  description: string;
  condition: ItemCondition;

  // Category
  categoryPath?: string[];
  categoryId?: string;

  // Attributes
  attributes?: ItemAttribute[];

  // Media (references to already-uploaded media)
  media?: ItemMedia[];

  // Pricing (at least defaultPrice is typically required)
  quantity?: number; // Default: 1
  defaultPrice?: number;
  currency?: string; // Default: USD
  priceMin?: number;
  priceMax?: number;
  pricingStrategy?: PricingStrategy;

  // Shipping
  shippingType?: ShippingType;
  flatRateAmount?: number;
  domesticOnly?: boolean;
  weight?: number;
  dimensions?: string;

  // Inventory fields
  location?: string;
  costBasis?: number;
  tags?: string[];

  // Optional hints/notes
  userNotes?: string;
}

// ============================================================================
// Update Item Request
// ============================================================================

export interface UpdateItemRequest {
  // User hints
  userTitleHint?: string;
  userDescriptionHint?: string;
  userNotes?: string;

  // Core listing fields
  title?: string;
  subtitle?: string;
  description?: string;
  condition?: ItemCondition;

  // Category
  categoryPath?: string[];
  categoryId?: string;

  // Attributes
  attributes?: ItemAttribute[];

  // Media
  media?: ItemMedia[];

  // Pricing
  quantity?: number;
  defaultPrice?: number;
  currency?: string;
  priceMin?: number;
  priceMax?: number;
  pricingStrategy?: PricingStrategy;

  // Shipping
  shippingType?: ShippingType;
  flatRateAmount?: number;
  domesticOnly?: boolean;
  weight?: number;
  dimensions?: string;

  // Inventory fields
  location?: string;
  costBasis?: number;
  tags?: string[];

  // Note: source, lifecycleStatus, and aiReviewState are NOT editable via this endpoint
  // Those are controlled by specific review/workflow actions
}

// ============================================================================
// Response Types
// ============================================================================

export interface CreateItemResponse {
  item: ItemSummaryDto;
}

export interface GetItemResponse {
  item: ItemDto;
}

export interface UpdateItemResponse {
  item: ItemDto;
}

export interface ListItemsResponse {
  items: ItemSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Filter/Query Types (for list endpoint)
// ============================================================================

export interface ListItemsQuery {
  lifecycleStatus?: LifecycleStatus[];
  aiReviewState?: AiReviewState[];
  source?: ItemSource[];
  search?: string; // Search in title/description
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'defaultPrice';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Review-specific Types (Sub-Phase 3)
// ============================================================================

/**
 * Response for AI review queue
 */
export interface ItemReviewQueueResponse {
  items: ItemSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response for Needs Work queue (Sub-Phase 4)
 */
export interface NeedsWorkQueueResponse {
  items: ItemSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Response after approving an item
 */
export interface ApproveItemResponse {
  item: ItemDto;
}

/**
 * Response after rejecting an item
 */
export interface RejectItemResponse {
  item: ItemDto;
}

/**
 * Request for rejecting an item with optional comment
 */
export interface RejectItemRequest {
  comment?: string;
}

/**
 * Response after marking an item as ready (from Needs Work queue)
 */
export interface MarkItemReadyResponse {
  item: ItemDto;
}

