export const QUEUE_AI_WORKFLOW = 'queue-ai-workflows';

export interface StartItemWorkflowJob {
  workflowType: 'item-intake-v1';
  itemId: string;
  orgId: string;
  userId: string;
}

export const QUEUE_MARKETPLACE_PUBLISH = 'queue-marketplace-publish';

export interface PublishItemListingJob {
  itemId: string;
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

/**
 * Job to start a research run for an item
 * Phase 6 Sub-Phase 8
 */
export interface StartResearchRunJob {
  researchRunId: string;
  itemId: string;
  runType: 'initial_intake' | 'pricing_refresh' | 'manual_request';
  orgId: string;
  userId: string;
}

