/**
 * Item Types - Phase 6 Unified Item Model
 *
 * Core types for the unified Item entity that replaces the separate
 * "draft" and "inventory" concepts with a single AI-native model.
 */

// ============================================================================
// Status Types (Phase 6 spec Section 2.1.2)
// ============================================================================

/**
 * Lifecycle status - where the item is in its lifecycle
 */
export type LifecycleStatus =
  | 'draft'     // Not yet inventory-ready; needs AI/human work
  | 'ready'     // Considered inventory-ready; can be listed
  | 'listed'    // At least one active marketplace listing (live)
  | 'sold'      // All quantity sold
  | 'archived'; // No longer active (disposed, permanently removed)

/**
 * AI review state - how the AI flow was used and evaluated
 */
export type AiReviewState =
  | 'none'      // No AI review/pipeline involved (e.g., manually created items)
  | 'pending'   // AI processing/review in progress or awaiting human approval
  | 'approved'  // AI-produced details were accepted as "good enough"
  | 'rejected'; // AI output was not sufficient; human intervention required

/**
 * Item source - how the item was created
 */
export type ItemSource =
  | 'ai_capture' // Created via AI capture tool (images + minimal description)
  | 'manual';    // Created via manual form

// ============================================================================
// Media & Attributes
// ============================================================================

/**
 * Media item attached to an Item
 */
export interface ItemMedia {
  id: string;
  url: string;
  storagePath: string;
  sortOrder: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
}

/**
 * Item attribute with source tracking
 */
export interface ItemAttribute {
  key: string;           // e.g., "Brand", "Model", "Size", "Color"
  value: string;
  source: 'ai' | 'user' | 'imported';
  confidence?: number;   // 0-1 for AI-sourced attributes
}

// ============================================================================
// Shipping & Pricing Types
// ============================================================================

/**
 * Shipping type options
 */
export type ShippingType = 'flat' | 'calculated' | 'local_pickup' | 'free';

/**
 * Pricing strategy options
 */
export type PricingStrategy = 'aggressive' | 'balanced' | 'premium';

/**
 * Item condition
 */
export type ItemCondition =
  | 'new'
  | 'used_like_new'
  | 'used_very_good'
  | 'used_good'
  | 'used_acceptable';

