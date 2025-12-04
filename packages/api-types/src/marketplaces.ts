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
  metaListingId: string;
  marketplaceAccountId: string;
  remoteListingId: string | null;
  status: MarketplaceListingStatus;
  url: string | null;
  price: number | null;
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

export interface ListMarketplaceAccountsResponse {
  accounts: MarketplaceAccountDto[];
}

export interface DeleteMarketplaceAccountResponse {
  success: boolean;
}

export interface PublishMetaListingRequest {
  accountIds: string[];
}

export interface PublishMetaListingResponse {
  success: boolean;
}

export interface GetMarketplaceListingsResponse {
  listings: MarketplaceListingDto[];
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
  };
  counts: {
    users: number;
    organizations: number;
    items: number;
    metaListings: number;
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

