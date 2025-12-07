export type MetaListingAiStatus =
  | 'pending'
  | 'in_progress'
  | 'complete'
  | 'failed'
  | 'needs_review';

export type MarketplaceListingStatus =
  | 'not_listed'      // Configuration exists but not published
  | 'listing_pending' // In process of being created
  | 'listed'          // Live on marketplace
  | 'sold'            // Sold on this marketplace
  | 'ended'           // Ended/cancelled
  | 'error';          // Error in publish/update

export type WorkflowRunStatus = 'pending' | 'running' | 'completed' | 'failed';

