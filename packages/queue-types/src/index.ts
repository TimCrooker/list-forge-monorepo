export const QUEUE_AI_WORKFLOW = 'queue-ai-workflows';

export interface StartWorkflowJob {
  workflowType: 'photo-intake-v1' | 'price-refresh-v1' | 'listing-intake-v1';
  /** For legacy photo-intake workflow */
  itemId?: string;
  /** For new listing-intake workflow */
  listingDraftId?: string;
  orgId: string;
  userId: string;
}

export const QUEUE_MARKETPLACE_PUBLISH = 'queue-marketplace-publish';

export interface PublishListingJob {
  metaListingId: string;
  marketplaceAccountId: string;
  orgId: string;
  userId: string;
}

export const QUEUE_MARKETPLACE_SYNC = 'queue-marketplace-sync';

export interface SyncListingStatusJob {
  marketplaceListingId: string;
  marketplaceAccountId: string;
}

export interface SyncAllListingsJob {
  /** Optional: only sync listings for a specific org */
  orgId?: string;
  /** Only sync listings that haven't been synced in this many minutes */
  staleAfterMinutes?: number;
}

