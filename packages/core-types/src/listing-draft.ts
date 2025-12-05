/**
 * Listing Draft Types
 *
 * Types for the Phase 5 Listing Engine - unified model replacing Item + MetaListing
 */

// Ingestion lifecycle status (AI processing)
export type IngestionStatus =
  | 'uploaded' // Photos uploaded, not yet queued
  | 'ai_queued' // Waiting for AI processing
  | 'ai_running' // AI pipeline in progress
  | 'ai_complete' // AI finished successfully
  | 'ai_error'; // AI pipeline failed

// Human review status
export type ReviewStatus =
  | 'unreviewed' // Created, awaiting review
  | 'auto_approved' // AI deemed ready, no human touch
  | 'needs_review' // AI flagged for human review
  | 'approved' // Human explicitly approved
  | 'rejected'; // Human explicitly rejected

// Component-level QA flags
export type ComponentStatus = 'ok' | 'needs_review' | 'flagged';

// Media item in the draft
export interface ListingDraftMedia {
  id: string;
  url: string;
  storagePath: string;
  sortOrder: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
}

// Attribute with source tracking
export interface ListingDraftAttribute {
  key: string;
  value: string;
  source: 'ai' | 'user' | 'imported';
  confidence?: number; // 0-1 for AI-derived
}

// Shipping type options
export type ShippingType = 'flat' | 'calculated' | 'local_pickup' | 'free';

// Pricing strategy options
export type PricingStrategy = 'aggressive' | 'balanced' | 'premium';
