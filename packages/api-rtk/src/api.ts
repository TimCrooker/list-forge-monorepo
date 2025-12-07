import { createApi } from '@reduxjs/toolkit/query/react';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MeResponse,
  SwitchOrgRequest,
  SwitchOrgResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  CreateOrgRequest,
  CreateOrgResponse,
  OrgDetailResponse,
  AddOrgMemberRequest,
  AddOrgMemberResponse,
  UpdateOrgMemberRequest,
  UpdateOrgMemberResponse,
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  AdminListUsersResponse,
  AdminListOrgsResponse,
  AdminGetUserDetailResponse,
  AdminGetOrgDetailResponse,
  AdminUpdateOrgStatusRequest,
  AdminUpdateOrgStatusResponse,
  AdminListMarketplaceAccountsQuery,
  AdminListMarketplaceAccountsResponse,
  GetEbayAuthUrlResponse,
  ExchangeEbayCodeRequest,
  ExchangeEbayCodeResponse,
  GetAmazonAuthUrlResponse,
  ExchangeAmazonCodeRequest,
  ExchangeAmazonCodeResponse,
  ListMarketplaceAccountsResponse,
  DeleteMarketplaceAccountResponse,
  SystemMetricsResponse,
  GetEvidenceResponse,
  // Item types
  CreateItemResponse,
  GetItemResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  ListItemsResponse,
  ItemReviewQueueResponse,
  ApproveItemResponse,
  RejectItemResponse,
  NeedsWorkQueueResponse,
  MarkItemReadyResponse,
  // Item marketplace types
  GetItemMarketplaceListingsResponse,
  PublishItemListingRequest,
  PublishItemListingResponse,
  // Research types
  TriggerResearchRequest,
  TriggerResearchResponse,
  ListResearchRunsResponse,
  GetResearchRunResponse,
  GetResearchRunEvidenceResponse,
  // Chat types
  SendChatMessageRequest,
  SendChatMessageResponse,
} from '@listforge/api-types';
import { baseQueryWithErrorHandling } from './baseQueryWithErrorHandling';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ['User', 'Org', 'OrgMember', 'MarketplaceAccount', 'MarketplaceListing', 'Item', 'ResearchRun'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    me: builder.query<MeResponse, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    switchOrg: builder.mutation<SwitchOrgResponse, SwitchOrgRequest>({
      query: (body) => ({
        url: '/auth/switch-org',
        method: 'POST',
        body,
      }),
    }),

    // User endpoints
    updateUser: builder.mutation<UpdateUserResponse, { userId: string; data: UpdateUserRequest }>({
      query: ({ userId, data }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Organization endpoints
    listOrgs: builder.query<{ orgs: CreateOrgResponse['org'][] }, void>({
      query: () => '/orgs',
      providesTags: ['Org'],
    }),
    createOrg: builder.mutation<CreateOrgResponse, CreateOrgRequest>({
      query: (body) => ({
        url: '/orgs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Org'],
    }),
    getOrg: builder.query<OrgDetailResponse, string>({
      query: (orgId) => `/orgs/${orgId}`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    addOrgMember: builder.mutation<AddOrgMemberResponse, { orgId: string; data: AddOrgMemberRequest }>({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/members`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        'OrgMember',
      ],
    }),
    updateOrgMember: builder.mutation<
      UpdateOrgMemberResponse,
      { orgId: string; userId: string; data: UpdateOrgMemberRequest }
    >({
      query: ({ orgId, userId, data }) => ({
        url: `/orgs/${orgId}/members/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        'OrgMember',
      ],
    }),

    // Admin endpoints
    listUsers: builder.query<AdminListUsersResponse, void>({
      query: () => '/admin/users',
      providesTags: ['User'],
    }),
    getUserAdmin: builder.query<AdminGetUserDetailResponse, string>({
      query: (userId) => `/admin/users/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
    disableUser: builder.mutation<AdminUpdateUserResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/disable`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, userId) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),
    enableUser: builder.mutation<AdminUpdateUserResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/enable`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, userId) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),
    updateUserAdmin: builder.mutation<
      AdminUpdateUserResponse,
      { userId: string; data: AdminUpdateUserRequest }
    >({
      query: ({ userId, data }) => ({
        url: `/admin/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),
    listOrgsAdmin: builder.query<AdminListOrgsResponse, void>({
      query: () => '/admin/orgs',
      providesTags: ['Org'],
    }),
    getOrgAdmin: builder.query<AdminGetOrgDetailResponse, string>({
      query: (orgId) => `/admin/orgs/${orgId}`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateOrgStatus: builder.mutation<
      AdminUpdateOrgStatusResponse,
      { orgId: string; data: AdminUpdateOrgStatusRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/admin/orgs/${orgId}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        'Org',
      ],
    }),
    listMarketplaceAccountsAdmin: builder.query<
      AdminListMarketplaceAccountsResponse,
      AdminListMarketplaceAccountsQuery | void
    >({
      query: (params = {}) => ({
        url: '/admin/marketplace-accounts',
        params: params as Record<string, string>,
      }),
      providesTags: ['MarketplaceAccount'],
    }),
    disableMarketplaceAccount: builder.mutation<{ success: boolean }, string>({
      query: (accountId) => ({
        url: `/admin/marketplace-accounts/${accountId}/disable`,
        method: 'POST',
      }),
      invalidatesTags: ['MarketplaceAccount'],
    }),

    // Marketplace endpoints - eBay
    getEbayAuthUrl: builder.query<GetEbayAuthUrlResponse, void>({
      query: () => '/marketplaces/ebay/auth-url',
    }),
    exchangeEbayCode: builder.mutation<ExchangeEbayCodeResponse, ExchangeEbayCodeRequest>({
      query: (body) => ({
        url: '/marketplaces/ebay/exchange-code',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MarketplaceAccount'],
    }),

    // Marketplace endpoints - Amazon
    getAmazonAuthUrl: builder.query<GetAmazonAuthUrlResponse, void>({
      query: () => '/marketplaces/amazon/auth-url',
    }),
    exchangeAmazonCode: builder.mutation<ExchangeAmazonCodeResponse, ExchangeAmazonCodeRequest>({
      query: (body) => ({
        url: '/marketplaces/amazon/exchange-code',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MarketplaceAccount'],
    }),

    listMarketplaceAccounts: builder.query<ListMarketplaceAccountsResponse, void>({
      query: () => '/marketplaces/accounts',
      providesTags: ['MarketplaceAccount'],
    }),
    deleteMarketplaceAccount: builder.mutation<DeleteMarketplaceAccountResponse, string>({
      query: (accountId) => ({
        url: `/marketplaces/accounts/${accountId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MarketplaceAccount'],
    }),

    // Admin endpoints - metrics
    getSystemMetrics: builder.query<SystemMetricsResponse, void>({
      query: () => '/admin/system/metrics',
    }),

    // Item endpoints - Phase 6
    createAiCaptureItem: builder.mutation<CreateItemResponse, FormData>({
      query: (formData) => ({
        url: '/items/ai-capture',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Item'],
    }),
    createManualItem: builder.mutation<CreateItemResponse, FormData>({
      query: (formData) => ({
        url: '/items/manual',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Item'],
    }),
    listItems: builder.query<
      ListItemsResponse,
      {
        lifecycleStatus?: string[];
        aiReviewState?: string[];
        source?: string[];
        search?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
      }
    >({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params.lifecycleStatus?.length) queryParams.lifecycleStatus = params.lifecycleStatus.join(',');
        if (params.aiReviewState?.length) queryParams.aiReviewState = params.aiReviewState.join(',');
        if (params.source?.length) queryParams.source = params.source.join(',');
        if (params.search) queryParams.search = params.search;
        if (params.page) queryParams.page = String(params.page);
        if (params.pageSize) queryParams.pageSize = String(params.pageSize);
        if (params.sortBy) queryParams.sortBy = params.sortBy;
        if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

        return {
          url: '/items',
          params: queryParams,
        };
      },
      providesTags: ['Item'],
    }),
    getItem: builder.query<GetItemResponse, string>({
      query: (id) => `/items/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Item', id }],
    }),
    updateItem: builder.mutation<
      UpdateItemResponse,
      { id: string; data: UpdateItemRequest }
    >({
      query: ({ id, data }) => ({
        url: `/items/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Item', id },
        'Item',
      ],
    }),
    deleteItem: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item'],
    }),

    // Item Review endpoints - Phase 6 Sub-Phase 3
    getItemAiReviewQueue: builder.query<
      ItemReviewQueueResponse,
      { page?: number; pageSize?: number }
    >({
      query: ({ page = 1, pageSize = 20 }) => ({
        url: '/items/review/ai-queue',
        params: { page, pageSize },
      }),
      providesTags: ['Item'],
    }),
    approveItem: builder.mutation<ApproveItemResponse, string>({
      query: (id) => ({
        url: `/items/${id}/review/ai-approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Item', id },
        'Item',
      ],
    }),
    rejectItem: builder.mutation<RejectItemResponse, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({
        url: `/items/${id}/review/ai-reject`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Item', id },
        'Item',
      ],
    }),
    getItemEvidence: builder.query<GetEvidenceResponse, string>({
      query: (id) => `/items/${id}/evidence`,
      providesTags: (_result, _error, id) => [{ type: 'Item', id }],
    }),

    // Needs Work Queue endpoints - Phase 6 Sub-Phase 4
    getNeedsWorkQueue: builder.query<
      NeedsWorkQueueResponse,
      { page?: number; pageSize?: number }
    >({
      query: ({ page = 1, pageSize = 20 }) => ({
        url: '/items/review/needs-work',
        params: { page, pageSize },
      }),
      providesTags: ['Item'],
    }),
    markItemReady: builder.mutation<MarkItemReadyResponse, string>({
      query: (id) => ({
        url: `/items/${id}/mark-ready`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Item', id },
        'Item',
      ],
    }),

    // Item Marketplace endpoints - Phase 6 Sub-Phase 7
    getItemMarketplaceListings: builder.query<
      GetItemMarketplaceListingsResponse,
      string
    >({
      query: (itemId) => `/items/${itemId}/marketplace-listings`,
      providesTags: (_result, _error, itemId) => [
        { type: 'Item', id: itemId },
        'MarketplaceListing',
      ],
    }),
    publishItemToMarketplaces: builder.mutation<
      PublishItemListingResponse,
      { itemId: string; data: PublishItemListingRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/items/${itemId}/publish`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: 'Item', id: itemId },
        'Item',
        'MarketplaceListing',
      ],
    }),

    // Research endpoints - Phase 6 Sub-Phase 8
    triggerItemResearch: builder.mutation<
      TriggerResearchResponse,
      { itemId: string; data?: TriggerResearchRequest }
    >({
      query: ({ itemId, data = {} }) => ({
        url: `/items/${itemId}/research`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: 'Item', id: itemId },
        'ResearchRun',
      ],
    }),
    getItemResearchRuns: builder.query<ListResearchRunsResponse, string>({
      query: (itemId) => `/items/${itemId}/research-runs`,
      providesTags: (_result, _error, itemId) => [
        { type: 'Item', id: itemId },
        'ResearchRun',
      ],
    }),
    getResearchRun: builder.query<GetResearchRunResponse, string>({
      query: (id) => `/research-runs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ResearchRun', id }],
    }),
    getResearchRunEvidence: builder.query<GetResearchRunEvidenceResponse, string>({
      query: (id) => `/research-runs/${id}/evidence`,
      providesTags: (_result, _error, id) => [{ type: 'ResearchRun', id }],
    }),

    // Chat endpoints - Phase 6 Sub-Phase 9
    sendItemChatMessage: builder.mutation<
      SendChatMessageResponse,
      { itemId: string; data: SendChatMessageRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/items/${itemId}/chat`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
  useSwitchOrgMutation,
  useUpdateUserMutation,
  useListOrgsQuery,
  useCreateOrgMutation,
  useGetOrgQuery,
  useAddOrgMemberMutation,
  useUpdateOrgMemberMutation,
  useListUsersQuery,
  useGetUserAdminQuery,
  useDisableUserMutation,
  useEnableUserMutation,
  useUpdateUserAdminMutation,
  useListOrgsAdminQuery,
  useGetOrgAdminQuery,
  useUpdateOrgStatusMutation,
  useListMarketplaceAccountsAdminQuery,
  useDisableMarketplaceAccountMutation,
  useGetEbayAuthUrlQuery,
  useExchangeEbayCodeMutation,
  useGetAmazonAuthUrlQuery,
  useExchangeAmazonCodeMutation,
  useListMarketplaceAccountsQuery,
  useDeleteMarketplaceAccountMutation,
  useGetSystemMetricsQuery,
  // Item hooks
  useCreateAiCaptureItemMutation,
  useCreateManualItemMutation,
  useListItemsQuery,
  useGetItemQuery,
  useUpdateItemMutation,
  useDeleteItemMutation,
  // Item review hooks
  useGetItemAiReviewQueueQuery,
  useApproveItemMutation,
  useRejectItemMutation,
  useGetItemEvidenceQuery,
  // Needs Work hooks
  useGetNeedsWorkQueueQuery,
  useMarkItemReadyMutation,
  // Item marketplace hooks
  useGetItemMarketplaceListingsQuery,
  usePublishItemToMarketplacesMutation,
  // Research hooks
  useTriggerItemResearchMutation,
  useGetItemResearchRunsQuery,
  useGetResearchRunQuery,
  useGetResearchRunEvidenceQuery,
  // Chat hooks
  useSendItemChatMessageMutation,
} = api;

