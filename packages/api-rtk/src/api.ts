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
  CreateItemResponse,
  ListItemsResponse,
  GetItemResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  GetEbayAuthUrlResponse,
  ExchangeEbayCodeRequest,
  ExchangeEbayCodeResponse,
  ListMarketplaceAccountsResponse,
  DeleteMarketplaceAccountResponse,
  PublishMetaListingRequest,
  PublishMetaListingResponse,
  GetMarketplaceListingsResponse,
  SystemMetricsResponse,
} from '@listforge/api-types';
import { baseQueryWithErrorHandling } from './baseQueryWithErrorHandling';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ['User', 'Org', 'OrgMember', 'Item', 'MarketplaceAccount', 'MarketplaceListing'],
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
      providesTags: (result, error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    addOrgMember: builder.mutation<AddOrgMemberResponse, { orgId: string; data: AddOrgMemberRequest }>({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/members`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orgId }) => [
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
      invalidatesTags: (result, error, { orgId }) => [
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
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),
    disableUser: builder.mutation<AdminUpdateUserResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/disable`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),
    enableUser: builder.mutation<AdminUpdateUserResponse, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/enable`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
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
      invalidatesTags: (result, error, { userId }) => [
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
      providesTags: (result, error, orgId) => [{ type: 'Org', id: orgId }],
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
      invalidatesTags: (result, error, { orgId }) => [
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

    // Item endpoints
    createItem: builder.mutation<CreateItemResponse, FormData>({
      query: (formData) => ({
        url: '/items',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Item'],
    }),
    listItems: builder.query<
      ListItemsResponse,
      { page?: number; pageSize?: number }
    >({
      query: ({ page = 1, pageSize = 20 }) => ({
        url: '/items',
        params: { page, pageSize },
      }),
      providesTags: ['Item'],
    }),
    getItem: builder.query<GetItemResponse, string>({
      query: (itemId) => `/items/${itemId}`,
      providesTags: (result, error, itemId) => [{ type: 'Item', id: itemId }],
    }),
    updateItem: builder.mutation<
      UpdateItemResponse,
      { itemId: string; data: UpdateItemRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/items/${itemId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { itemId }) => [
        { type: 'Item', id: itemId },
      ],
    }),
    deleteItem: builder.mutation<void, string>({
      query: (itemId) => ({
        url: `/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item'],
    }),

    // Marketplace endpoints
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
    publishMetaListing: builder.mutation<
      PublishMetaListingResponse,
      { metaListingId: string; data: PublishMetaListingRequest }
    >({
      query: ({ metaListingId, data }) => ({
        url: `/meta-listings/${metaListingId}/publish`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MarketplaceListing', 'Item'],
    }),
    getMarketplaceListings: builder.query<
      GetMarketplaceListingsResponse,
      string
    >({
      query: (metaListingId) => `/meta-listings/${metaListingId}/marketplace-listings`,
      providesTags: ['MarketplaceListing'],
    }),

    // Admin endpoints - metrics
    getSystemMetrics: builder.query<SystemMetricsResponse, void>({
      query: () => '/admin/system/metrics',
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
  useCreateItemMutation,
  useListItemsQuery,
  useGetItemQuery,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useGetEbayAuthUrlQuery,
  useExchangeEbayCodeMutation,
  useListMarketplaceAccountsQuery,
  useDeleteMarketplaceAccountMutation,
  usePublishMetaListingMutation,
  useGetMarketplaceListingsQuery,
  useGetSystemMetricsQuery,
} = api;

