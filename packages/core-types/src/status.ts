export type ItemStatus = 'draft' | 'ready' | 'listed' | 'sold' | 'archived';

export type MetaListingAiStatus =
  | 'pending'
  | 'in_progress'
  | 'complete'
  | 'failed'
  | 'needs_review';

export type MarketplaceListingStatus =
  | 'draft'
  | 'pending'
  | 'live'
  | 'ended'
  | 'sold'
  | 'error';

export type WorkflowRunStatus = 'pending' | 'running' | 'completed' | 'failed';

