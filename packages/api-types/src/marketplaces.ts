import { MarketplaceListingStatus } from '@listforge/core-types';

export type MarketplaceType = 'EBAY' | 'AMAZON';

export type MarketplaceAccountStatus = 'active' | 'expired' | 'revoked' | 'error';

export interface MarketplaceAccountDto {
  id: string;
  orgId: string;
  userId: string;
  marketplace: MarketplaceType;
  status: MarketplaceAccountStatus;
  remoteAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListingDto {
  id: string;
  itemId: string;
  marketplaceAccountId: string;
  marketplace: MarketplaceType;
  remoteListingId: string | null;
  status: MarketplaceListingStatus;
  url: string | null;
  // Divergence fields (marketplace-specific overrides)
  title: string | null;
  description: string | null;
  price: number | null;
  marketplaceCategoryId: string | null;
  marketplaceAttributes: Record<string, string | number | boolean> | null;
  // Slice 7: Auto-publish tracking
  autoPublished: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetEbayAuthUrlResponse {
  authUrl: string;
}

export interface ExchangeEbayCodeRequest {
  code: string;
  state: string;
}

export interface ExchangeEbayCodeResponse {
  success: boolean;
  account: {
    id: string;
    marketplace: MarketplaceType;
    status: MarketplaceAccountStatus;
    remoteAccountId: string | null;
  };
}

export interface EbayCallbackResponse {
  success: boolean;
  account: {
    id: string;
    marketplace: MarketplaceType;
    status: MarketplaceAccountStatus;
    remoteAccountId: string | null;
  };
}

// Amazon OAuth types
export interface GetAmazonAuthUrlResponse {
  authUrl: string;
}

export interface ExchangeAmazonCodeRequest {
  spapi_oauth_code: string;
  state: string;
  selling_partner_id: string;
}

export interface ExchangeAmazonCodeResponse {
  success: boolean;
  account: {
    id: string;
    marketplace: MarketplaceType;
    status: MarketplaceAccountStatus;
    remoteAccountId: string | null;
  };
}

export interface ListMarketplaceAccountsResponse {
  accounts: MarketplaceAccountDto[];
}

export interface DeleteMarketplaceAccountResponse {
  success: boolean;
}

export interface RefreshMarketplaceAccountResponse {
  success: boolean;
  message: string;
}

export interface SystemMetricsResponse {
  queues: {
    aiWorkflow: {
      waiting: number;
      active: number;
      failed: number;
    };
    marketplacePublish: {
      waiting: number;
      active: number;
      failed: number;
    };
    marketplaceSync: {
      waiting: number;
      active: number;
      failed: number;
    };
  };
  counts: {
    users: number;
    organizations: number;
    items: number;
    marketplaceAccounts: number;
  };
  recentWorkflowRuns: Array<{
    id: string;
    type: string;
    status: string;
    itemId: string;
    orgId: string;
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
  }>;
}

// Item-based marketplace listing types (Phase 6 Sub-Phase 7)
export interface CreateMarketplaceListingRequest {
  marketplaceAccountId: string;
  title?: string;  // Override Item title
  description?: string;  // Override Item description
  price?: number;  // Override Item price
  marketplaceCategoryId?: string;
  marketplaceAttributes?: Record<string, string | number | boolean>;
}

export interface CreateMarketplaceListingResponse {
  listing: MarketplaceListingDto;
}

export interface GetItemMarketplaceListingsResponse {
  listings: MarketplaceListingDto[];
}

export interface PublishItemListingRequest {
  accountIds: string[];
}

export interface PublishItemListingResponse {
  success: boolean;
}

