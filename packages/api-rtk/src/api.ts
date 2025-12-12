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
  EnableTeamRequest,
  EnableTeamResponse,
  DisableTeamResponse,
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
  GetFacebookAuthUrlResponse,
  ExchangeFacebookCodeRequest,
  ExchangeFacebookCodeResponse,
  ListMarketplaceAccountsResponse,
  DeleteMarketplaceAccountResponse,
  RefreshMarketplaceAccountResponse,
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
  GetResearchActivityLogResponse,
  GetLatestResearchResponse,
  GetResearchHistoryResponse,
  PauseResearchResponse,
  StopResearchResponse,
  // Chat types
  SendChatMessageRequest,
  SendChatMessageResponse,
  CreateChatSessionRequest,
  CreateChatSessionResponse,
  GetChatMessagesResponse,
  ChatSessionDto,
  CreateGeneralChatSessionRequest,
  UpdateChatSessionRequest,
  ListChatSessionsResponse,
  // Auto-publish settings types (Slice 7)
  GetAutoPublishSettingsResponse,
  UpdateAutoPublishSettingsRequest,
  UpdateAutoPublishSettingsResponse,
  // Organization Settings types
  GetWorkflowSettingsResponse,
  UpdateWorkflowSettingsRequest,
  UpdateWorkflowSettingsResponse,
  GetNotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
  UpdateNotificationSettingsResponse,
  GetTeamSettingsResponse,
  UpdateTeamSettingsRequest,
  UpdateTeamSettingsResponse,
  GetInventorySettingsResponse,
  UpdateInventorySettingsRequest,
  UpdateInventorySettingsResponse,
  GetMarketplaceDefaultSettingsResponse,
  UpdateMarketplaceDefaultSettingsRequest,
  UpdateMarketplaceDefaultSettingsResponse,
  GetBillingSettingsResponse,
  UpdateBillingSettingsRequest,
  UpdateBillingSettingsResponse,
  GetSecuritySettingsResponse,
  UpdateSecuritySettingsRequest,
  UpdateSecuritySettingsResponse,
  // Research Settings types
  GetResearchSettingsResponse,
  UpdateResearchSettingsRequest,
  UpdateResearchSettingsResponse,
  // Settings Audit types
  SettingsType,
  GetSettingsVersionsResponse,
  GetSettingsAuditLogsRequest,
  GetSettingsAuditLogsResponse,
  GetAdminSettingsAuditLogsRequest,
  PreviewSettingsRevertResponse,
  RevertSettingsRequest,
  RevertSettingsResponse,
  // Domain Expertise types (Slice 9.1)
  ListDomainExpertiseModulesResponse,
  DomainExpertiseModuleDto,
  DomainExpertiseModuleWithRelationsDto,
  CreateDomainExpertiseModuleDto,
  UpdateDomainExpertiseModuleDto,
  PublishModuleDto,
  RollbackModuleDto,
  ListModulesQuery,
  ListLookupTablesResponse,
  LookupTableDto,
  CreateLookupTableDto,
  UpdateLookupTableDto,
  ListLookupEntriesResponse,
  LookupEntryDto,
  CreateLookupEntryDto,
  UpdateLookupEntryDto,
  BulkLookupEntriesDto,
  BulkOperationResponse,
  ImportLookupEntriesDto,
  ListLookupEntriesQuery,
  ValueDriverDefinitionDto,
  CreateValueDriverDefinitionDto,
  UpdateValueDriverDefinitionDto,
  ReorderValueDriversDto,
  TestValueDriversDto,
  TestValueDriversResponse,
  DecoderDefinitionDto,
  CreateDecoderDefinitionDto,
  UpdateDecoderDefinitionDto,
  TestDecoderDto,
  TestDecoderResponse,
  ValidatePatternDto,
  ValidatePatternResponse,
  AuthenticityMarkerDefinitionDto,
  CreateAuthenticityMarkerDefinitionDto,
  UpdateAuthenticityMarkerDefinitionDto,
  TestAuthenticityDto,
  TestAuthenticityResponse,
  ListVersionsResponse,
  DomainExpertiseVersionWithSnapshotDto,
  // Learning types (Slice 10)
  ListResearchOutcomesQuery,
  ListResearchOutcomesResponse,
  CorrectOutcomeDto,
  GetResearchOutcomeResponse,
  ToolEffectivenessQuery,
  GetToolEffectivenessResponse,
  GetToolEffectivenessTrendResponse,
  ListAnomaliesQuery,
  ListAnomaliesResponse,
  ResolveAnomalyDto,
  TriggerCalibrationResponse,
  GetCalibrationHistoryQuery,
  GetCalibrationHistoryResponse,
  LearningDashboardQuery,
  GetLearningDashboardResponse,
  // Tool Debugger types
  ListToolsResponseDto,
  ExecuteToolRequestDto,
  ExecuteToolResponseDto,
  SearchDebuggerItemsResponseDto,
} from '@listforge/api-types';
import { baseQueryWithErrorHandling } from './baseQueryWithErrorHandling';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ['User', 'Org', 'OrgMember', 'MarketplaceAccount', 'MarketplaceListing', 'Item', 'ResearchRun', 'ChatSession', 'SettingsVersion', 'SettingsAuditLog', 'DomainExpertiseModule', 'LookupTable', 'LookupEntry', 'ValueDriver', 'Decoder', 'AuthenticityMarker', 'DomainExpertiseVersion', 'ResearchOutcome', 'ToolEffectiveness', 'ResearchAnomaly', 'CalibrationHistory'],
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
    enableTeam: builder.mutation<
      EnableTeamResponse,
      { orgId: string; data: EnableTeamRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/enable-team`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        'User', // Re-fetch user to get updated currentOrg
      ],
    }),
    disableTeam: builder.mutation<DisableTeamResponse, { orgId: string }>({
      query: ({ orgId }) => ({
        url: `/orgs/${orgId}/disable-team`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        'User', // Re-fetch user to get updated currentOrg
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

    // Marketplace endpoints - Facebook
    getFacebookAuthUrl: builder.query<GetFacebookAuthUrlResponse, void>({
      query: () => '/marketplaces/facebook/auth-url',
    }),
    exchangeFacebookCode: builder.mutation<ExchangeFacebookCodeResponse, ExchangeFacebookCodeRequest>({
      query: (body) => ({
        url: '/marketplaces/facebook/exchange-code',
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

    refreshMarketplaceAccount: builder.mutation<RefreshMarketplaceAccountResponse, string>({
      query: (accountId) => ({
        url: `/marketplaces/accounts/${accountId}/refresh`,
        method: 'POST',
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

    getResearchActivityLog: builder.query<GetResearchActivityLogResponse, string>({
      query: (id) => `/research-runs/${id}/activity`,
      providesTags: (_result, _error, id) => [{ type: 'ResearchRun', id }],
    }),

    // Phase 7 Slice 1: ItemResearch endpoints
    getLatestResearch: builder.query<GetLatestResearchResponse, string>({
      query: (itemId) => `/items/${itemId}/research/latest`,
      providesTags: (_result, _error, itemId) => [
        { type: 'Item', id: itemId },
        'ResearchRun',
      ],
    }),
    getResearchHistory: builder.query<
      GetResearchHistoryResponse,
      { itemId: string; page?: number; pageSize?: number }
    >({
      query: ({ itemId, page = 1, pageSize = 10 }) => ({
        url: `/items/${itemId}/research/history`,
        params: { page, pageSize },
      }),
      providesTags: (_result, _error, { itemId }) => [
        { type: 'Item', id: itemId },
        'ResearchRun',
      ],
    }),

    // Phase 7 Slice 4: Resume research endpoint
    resumeResearch: builder.mutation<TriggerResearchResponse, string>({
      query: (runId) => ({
        url: `/research-runs/${runId}/resume`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, runId) => [
        { type: 'ResearchRun', id: runId },
        'ResearchRun',
      ],
    }),
    // Research Flow Control endpoints
    pauseResearch: builder.mutation<PauseResearchResponse, string>({
      query: (runId) => ({
        url: `/research-runs/${runId}/pause`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, runId) => [
        { type: 'ResearchRun', id: runId },
        'ResearchRun',
      ],
    }),
    stopResearch: builder.mutation<StopResearchResponse, string>({
      query: (runId) => ({
        url: `/research-runs/${runId}/stop`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, runId) => [
        { type: 'ResearchRun', id: runId },
        'ResearchRun',
      ],
    }),

    // Chat endpoints - Phase 6 Sub-Phase 9 + Phase 7 Slice 5
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

    // Phase 7 Slice 5: Chat session endpoints
    createChatSession: builder.mutation<
      CreateChatSessionResponse,
      { itemId: string; data: CreateChatSessionRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/items/${itemId}/chat/sessions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: 'Item', id: itemId },
      ],
    }),

    getChatMessages: builder.query<
      GetChatMessagesResponse,
      { itemId: string; sessionId: string; page?: number; pageSize?: number }
    >({
      query: ({ itemId, sessionId, page, pageSize }) => ({
        url: `/items/${itemId}/chat/sessions/${sessionId}/messages`,
        params: {
          ...(page !== undefined ? { page: String(page) } : {}),
          ...(pageSize !== undefined ? { pageSize: String(pageSize) } : {}),
        },
      }),
      providesTags: (_result, _error, { itemId, sessionId }) => [
        { type: 'Item', id: itemId },
        { type: 'ChatSession', id: sessionId },
      ],
    }),

    // General Purpose Chat endpoints
    createGeneralChatSession: builder.mutation<
      { session: ChatSessionDto },
      CreateGeneralChatSessionRequest
    >({
      query: (data) => ({
        url: '/chat/sessions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ChatSession'],
    }),

    getChatSessions: builder.query<
      ListChatSessionsResponse,
      { type?: string; limit?: number }
    >({
      query: (params) => ({
        url: '/chat/sessions',
        params,
      }),
      providesTags: ['ChatSession'],
    }),

    getChatSession: builder.query<ChatSessionDto, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: `/chat/sessions/${sessionId}`,
      }),
      providesTags: (_result, _error, { sessionId }) => [
        { type: 'ChatSession', id: sessionId },
      ],
    }),

    getGeneralChatMessages: builder.query<
      GetChatMessagesResponse,
      { sessionId: string; page?: number; pageSize?: number }
    >({
      query: ({ sessionId, page, pageSize }) => ({
        url: `/chat/sessions/${sessionId}/messages`,
        params: {
          ...(page !== undefined ? { page: String(page) } : {}),
          ...(pageSize !== undefined ? { pageSize: String(pageSize) } : {}),
        },
      }),
      providesTags: (_result, _error, { sessionId }) => [
        { type: 'ChatSession', id: sessionId },
      ],
    }),

    updateChatSession: builder.mutation<
      ChatSessionDto,
      { sessionId: string; updates: UpdateChatSessionRequest }
    >({
      query: ({ sessionId, updates }) => ({
        url: `/chat/sessions/${sessionId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: 'ChatSession', id: sessionId },
      ],
    }),

    deleteChatSession: builder.mutation<
      { success: boolean },
      { sessionId: string }
    >({
      query: ({ sessionId }) => ({
        url: `/chat/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatSession'],
    }),

    // Slice 7: Auto-publish settings endpoints
    getAutoPublishSettings: builder.query<GetAutoPublishSettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/auto-publish`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateAutoPublishSettings: builder.mutation<
      UpdateAutoPublishSettingsResponse,
      { orgId: string; data: UpdateAutoPublishSettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/auto-publish`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: 'Org', id: orgId }],
    }),

    // ============================================================================
    // Organization Settings Endpoints
    // ============================================================================

    // Workflow Settings
    getWorkflowSettings: builder.query<GetWorkflowSettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/workflow`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateWorkflowSettings: builder.mutation<
      UpdateWorkflowSettingsResponse,
      { orgId: string; data: UpdateWorkflowSettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/workflow`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-workflow` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Notification Settings
    getNotificationSettings: builder.query<GetNotificationSettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/notifications`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateNotificationSettings: builder.mutation<
      UpdateNotificationSettingsResponse,
      { orgId: string; data: UpdateNotificationSettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/notifications`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-notification` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Team Settings
    getTeamSettings: builder.query<GetTeamSettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/team`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateTeamSettings: builder.mutation<
      UpdateTeamSettingsResponse,
      { orgId: string; data: UpdateTeamSettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/team`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-team` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Inventory Settings
    getInventorySettings: builder.query<GetInventorySettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/inventory`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateInventorySettings: builder.mutation<
      UpdateInventorySettingsResponse,
      { orgId: string; data: UpdateInventorySettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/inventory`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-inventory` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Marketplace Default Settings
    getMarketplaceDefaultSettings: builder.query<GetMarketplaceDefaultSettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/marketplace-defaults`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateMarketplaceDefaultSettings: builder.mutation<
      UpdateMarketplaceDefaultSettingsResponse,
      { orgId: string; data: UpdateMarketplaceDefaultSettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/marketplace-defaults`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-marketplaceDefaults` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Billing Settings
    getBillingSettings: builder.query<GetBillingSettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/billing`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateBillingSettings: builder.mutation<
      UpdateBillingSettingsResponse,
      { orgId: string; data: UpdateBillingSettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/billing`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-billing` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Security Settings
    getSecuritySettings: builder.query<GetSecuritySettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/security`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateSecuritySettings: builder.mutation<
      UpdateSecuritySettingsResponse,
      { orgId: string; data: UpdateSecuritySettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/security`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-security` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Research Settings
    getResearchSettings: builder.query<GetResearchSettingsResponse, string>({
      query: (orgId) => `/orgs/${orgId}/settings/research`,
      providesTags: (_result, _error, orgId) => [{ type: 'Org', id: orgId }],
    }),
    updateResearchSettings: builder.mutation<
      UpdateResearchSettingsResponse,
      { orgId: string; data: UpdateResearchSettingsRequest }
    >({
      query: ({ orgId, data }) => ({
        url: `/orgs/${orgId}/settings/research`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: 'Org', id: orgId },
        { type: 'SettingsVersion', id: `${orgId}-research` },
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // ============================================================================
    // Settings Audit & Version History Endpoints
    // ============================================================================

    // Get version history for a settings type
    getSettingsVersions: builder.query<
      GetSettingsVersionsResponse,
      { orgId: string; settingsType: SettingsType }
    >({
      query: ({ orgId, settingsType }) => `/orgs/${orgId}/settings/${settingsType}/versions`,
      providesTags: (_result, _error, { orgId, settingsType }) => [
        { type: 'SettingsVersion', id: `${orgId}-${settingsType}` },
      ],
    }),

    // Get audit logs for an organization
    getSettingsAuditLogs: builder.query<
      GetSettingsAuditLogsResponse,
      { orgId: string; params?: GetSettingsAuditLogsRequest }
    >({
      query: ({ orgId, params = {} }) => ({
        url: `/orgs/${orgId}/settings/audit-logs`,
        params: params as Record<string, string>,
      }),
      providesTags: (_result, _error, { orgId }) => [
        { type: 'SettingsAuditLog', id: orgId },
      ],
    }),

    // Preview what a revert would change
    previewSettingsRevert: builder.query<
      PreviewSettingsRevertResponse,
      { orgId: string; versionId: string }
    >({
      query: ({ orgId, versionId }) => `/orgs/${orgId}/settings/versions/${versionId}/preview`,
    }),

    // Revert to a previous version
    revertSettings: builder.mutation<
      RevertSettingsResponse,
      { orgId: string; versionId: string; data: RevertSettingsRequest }
    >({
      query: ({ orgId, versionId, data }) => ({
        url: `/orgs/${orgId}/settings/versions/${versionId}/revert`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, _error, { orgId }) => {
        const settingsType = result?.newVersion?.settingsType;
        return [
          { type: 'Org', id: orgId },
          // Invalidate the specific settings type version cache
          settingsType
            ? { type: 'SettingsVersion', id: `${orgId}-${settingsType}` }
            : 'SettingsVersion',
          { type: 'SettingsAuditLog', id: orgId },
        ];
      },
    }),

    // Admin: Get settings audit logs across all orgs
    getAdminSettingsAuditLogs: builder.query<
      GetSettingsAuditLogsResponse,
      GetAdminSettingsAuditLogsRequest
    >({
      query: (params) => ({
        url: '/admin/settings-audit-logs',
        params: params as Record<string, string>,
      }),
      providesTags: ['SettingsAuditLog'],
    }),

    // Admin: Get version history for any org
    getAdminSettingsVersions: builder.query<
      GetSettingsVersionsResponse,
      { orgId: string; settingsType: SettingsType }
    >({
      query: ({ orgId, settingsType }) => `/admin/orgs/${orgId}/settings/${settingsType}/versions`,
      providesTags: (_result, _error, { orgId, settingsType }) => [
        { type: 'SettingsVersion', id: `${orgId}-${settingsType}` },
      ],
    }),

    // Slice 7: Retry failed publish endpoint
    retryItemPublish: builder.mutation<
      { success: boolean },
      { itemId: string; listingId: string }
    >({
      query: ({ itemId, listingId }) => ({
        url: `/items/${itemId}/marketplace-listings/${listingId}/retry`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: 'Item', id: itemId },
        'MarketplaceListing',
      ],
    }),

    // ============================================================================
    // Domain Expertise Endpoints (Slice 9.1)
    // ============================================================================

    // Module endpoints
    listDomainExpertiseModules: builder.query<
      ListDomainExpertiseModulesResponse,
      ListModulesQuery | void
    >({
      query: (params = {}) => ({
        url: '/admin/domain-expertise/modules',
        params: params as Record<string, string>,
      }),
      providesTags: ['DomainExpertiseModule'],
    }),

    getDomainExpertiseModule: builder.query<
      DomainExpertiseModuleWithRelationsDto,
      string
    >({
      query: (id) => `/admin/domain-expertise/modules/${id}`,
      providesTags: (_result, _error, id) => [
        { type: 'DomainExpertiseModule', id },
      ],
    }),

    createDomainExpertiseModule: builder.mutation<
      DomainExpertiseModuleDto,
      CreateDomainExpertiseModuleDto
    >({
      query: (body) => ({
        url: '/admin/domain-expertise/modules',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DomainExpertiseModule'],
    }),

    updateDomainExpertiseModule: builder.mutation<
      DomainExpertiseModuleDto,
      { id: string; data: UpdateDomainExpertiseModuleDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/modules/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DomainExpertiseModule', id },
        'DomainExpertiseModule',
      ],
    }),

    deleteDomainExpertiseModule: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/domain-expertise/modules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DomainExpertiseModule'],
    }),

    duplicateDomainExpertiseModule: builder.mutation<
      DomainExpertiseModuleDto,
      string
    >({
      query: (id) => ({
        url: `/admin/domain-expertise/modules/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['DomainExpertiseModule'],
    }),

    publishDomainExpertiseModule: builder.mutation<
      DomainExpertiseModuleDto,
      { id: string; data: PublishModuleDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/modules/${id}/publish`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DomainExpertiseModule', id },
        'DomainExpertiseModule',
        'DomainExpertiseVersion',
      ],
    }),

    rollbackDomainExpertiseModule: builder.mutation<
      DomainExpertiseModuleDto,
      { id: string; data: RollbackModuleDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/modules/${id}/rollback`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DomainExpertiseModule', id },
        'DomainExpertiseModule',
        'DomainExpertiseVersion',
        'LookupTable',
        'LookupEntry',
        'ValueDriver',
        'Decoder',
        'AuthenticityMarker',
      ],
    }),

    listDomainExpertiseVersions: builder.query<
      ListVersionsResponse,
      string
    >({
      query: (moduleId) => `/admin/domain-expertise/modules/${moduleId}/versions`,
      providesTags: (_result, _error, moduleId) => [
        { type: 'DomainExpertiseVersion', id: moduleId },
      ],
    }),

    getDomainExpertiseVersion: builder.query<
      DomainExpertiseVersionWithSnapshotDto,
      { moduleId: string; versionId: string }
    >({
      query: ({ moduleId, versionId }) =>
        `/admin/domain-expertise/modules/${moduleId}/versions/${versionId}`,
      providesTags: (_result, _error, { versionId }) => [
        { type: 'DomainExpertiseVersion', id: versionId },
      ],
    }),

    // Lookup Table endpoints
    listLookupTables: builder.query<
      ListLookupTablesResponse,
      { moduleId?: string } | void
    >({
      query: (params = {}) => ({
        url: '/admin/domain-expertise/lookup-tables',
        params: params as Record<string, string>,
      }),
      providesTags: ['LookupTable'],
    }),

    getLookupTable: builder.query<LookupTableDto, string>({
      query: (id) => `/admin/domain-expertise/lookup-tables/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LookupTable', id }],
    }),

    createLookupTable: builder.mutation<
      LookupTableDto,
      CreateLookupTableDto
    >({
      query: (body) => ({
        url: '/admin/domain-expertise/lookup-tables',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LookupTable'],
    }),

    updateLookupTable: builder.mutation<
      LookupTableDto,
      { id: string; data: UpdateLookupTableDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/lookup-tables/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LookupTable', id },
        'LookupTable',
      ],
    }),

    deleteLookupTable: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/domain-expertise/lookup-tables/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LookupTable', 'LookupEntry'],
    }),

    importLookupEntries: builder.mutation<
      BulkOperationResponse,
      { tableId: string; data: ImportLookupEntriesDto }
    >({
      query: ({ tableId, data }) => ({
        url: `/admin/domain-expertise/lookup-tables/${tableId}/import`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { tableId }) => [
        { type: 'LookupTable', id: tableId },
        'LookupEntry',
      ],
    }),

    exportLookupEntries: builder.query<
      { entries: Array<{ key: string; values: Record<string, unknown> }> },
      string
    >({
      query: (tableId) => `/admin/domain-expertise/lookup-tables/${tableId}/export`,
    }),

    // Lookup Entry endpoints
    listLookupEntries: builder.query<
      ListLookupEntriesResponse,
      { tableId: string; params?: ListLookupEntriesQuery }
    >({
      query: ({ tableId, params = {} }) => ({
        url: `/admin/domain-expertise/lookup-tables/${tableId}/entries`,
        params: params as Record<string, string>,
      }),
      providesTags: (_result, _error, { tableId }) => [
        { type: 'LookupEntry', id: tableId },
      ],
    }),

    createLookupEntry: builder.mutation<
      LookupEntryDto,
      { tableId: string; data: CreateLookupEntryDto }
    >({
      query: ({ tableId, data }) => ({
        url: `/admin/domain-expertise/lookup-tables/${tableId}/entries`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { tableId }) => [
        { type: 'LookupEntry', id: tableId },
        { type: 'LookupTable', id: tableId },
      ],
    }),

    updateLookupEntry: builder.mutation<
      LookupEntryDto,
      { entryId: string; data: UpdateLookupEntryDto }
    >({
      query: ({ entryId, data }) => ({
        url: `/admin/domain-expertise/entries/${entryId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['LookupEntry'],
    }),

    deleteLookupEntry: builder.mutation<{ success: boolean }, string>({
      query: (entryId) => ({
        url: `/admin/domain-expertise/entries/${entryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LookupEntry', 'LookupTable'],
    }),

    bulkLookupEntries: builder.mutation<
      BulkOperationResponse,
      { tableId: string; data: BulkLookupEntriesDto }
    >({
      query: ({ tableId, data }) => ({
        url: `/admin/domain-expertise/lookup-tables/${tableId}/entries/bulk`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { tableId }) => [
        { type: 'LookupEntry', id: tableId },
        { type: 'LookupTable', id: tableId },
      ],
    }),

    // Value Driver endpoints
    listValueDrivers: builder.query<
      { valueDrivers: ValueDriverDefinitionDto[] },
      string
    >({
      query: (moduleId) => `/admin/domain-expertise/modules/${moduleId}/value-drivers`,
      providesTags: (_result, _error, moduleId) => [
        { type: 'ValueDriver', id: moduleId },
      ],
    }),

    createValueDriver: builder.mutation<
      ValueDriverDefinitionDto,
      { moduleId: string; data: CreateValueDriverDefinitionDto }
    >({
      query: ({ moduleId, data }) => ({
        url: `/admin/domain-expertise/modules/${moduleId}/value-drivers`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { moduleId }) => [
        { type: 'ValueDriver', id: moduleId },
        { type: 'DomainExpertiseModule', id: moduleId },
      ],
    }),

    updateValueDriver: builder.mutation<
      ValueDriverDefinitionDto,
      { id: string; data: UpdateValueDriverDefinitionDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/value-drivers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['ValueDriver'],
    }),

    deleteValueDriver: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/domain-expertise/value-drivers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ValueDriver'],
    }),

    reorderValueDrivers: builder.mutation<
      { success: boolean },
      { moduleId: string; data: ReorderValueDriversDto }
    >({
      query: ({ moduleId, data }) => ({
        url: `/admin/domain-expertise/modules/${moduleId}/value-drivers/reorder`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { moduleId }) => [
        { type: 'ValueDriver', id: moduleId },
      ],
    }),

    // Decoder endpoints
    listDecoders: builder.query<
      { decoders: DecoderDefinitionDto[] },
      string
    >({
      query: (moduleId) => `/admin/domain-expertise/modules/${moduleId}/decoders`,
      providesTags: (_result, _error, moduleId) => [
        { type: 'Decoder', id: moduleId },
      ],
    }),

    createDecoder: builder.mutation<
      DecoderDefinitionDto,
      { moduleId: string; data: CreateDecoderDefinitionDto }
    >({
      query: ({ moduleId, data }) => ({
        url: `/admin/domain-expertise/modules/${moduleId}/decoders`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { moduleId }) => [
        { type: 'Decoder', id: moduleId },
        { type: 'DomainExpertiseModule', id: moduleId },
      ],
    }),

    updateDecoder: builder.mutation<
      DecoderDefinitionDto,
      { id: string; data: UpdateDecoderDefinitionDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/decoders/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Decoder'],
    }),

    deleteDecoder: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/domain-expertise/decoders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Decoder'],
    }),

    testDecoder: builder.mutation<
      TestDecoderResponse,
      { id: string; data: TestDecoderDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/decoders/${id}/test`,
        method: 'POST',
        body: data,
      }),
    }),

    validateDecoderPattern: builder.mutation<
      ValidatePatternResponse,
      ValidatePatternDto
    >({
      query: (body) => ({
        url: '/admin/domain-expertise/decoders/validate-pattern',
        method: 'POST',
        body,
      }),
    }),

    // Authenticity Marker endpoints
    listAuthenticityMarkers: builder.query<
      { markers: AuthenticityMarkerDefinitionDto[] },
      string
    >({
      query: (moduleId) => `/admin/domain-expertise/modules/${moduleId}/authenticity-markers`,
      providesTags: (_result, _error, moduleId) => [
        { type: 'AuthenticityMarker', id: moduleId },
      ],
    }),

    createAuthenticityMarker: builder.mutation<
      AuthenticityMarkerDefinitionDto,
      { moduleId: string; data: CreateAuthenticityMarkerDefinitionDto }
    >({
      query: ({ moduleId, data }) => ({
        url: `/admin/domain-expertise/modules/${moduleId}/authenticity-markers`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { moduleId }) => [
        { type: 'AuthenticityMarker', id: moduleId },
        { type: 'DomainExpertiseModule', id: moduleId },
      ],
    }),

    updateAuthenticityMarker: builder.mutation<
      AuthenticityMarkerDefinitionDto,
      { id: string; data: UpdateAuthenticityMarkerDefinitionDto }
    >({
      query: ({ id, data }) => ({
        url: `/admin/domain-expertise/authenticity-markers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AuthenticityMarker'],
    }),

    deleteAuthenticityMarker: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/domain-expertise/authenticity-markers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AuthenticityMarker'],
    }),

    // Testing endpoints
    testDecodePipeline: builder.mutation<
      TestDecoderResponse,
      { moduleId: string; data: TestDecoderDto }
    >({
      query: ({ moduleId, data }) => ({
        url: `/admin/domain-expertise/modules/${moduleId}/test-decode`,
        method: 'POST',
        body: data,
      }),
    }),

    testValueDrivers: builder.mutation<
      TestValueDriversResponse,
      { moduleId: string; data: TestValueDriversDto }
    >({
      query: ({ moduleId, data }) => ({
        url: `/admin/domain-expertise/modules/${moduleId}/test-value-drivers`,
        method: 'POST',
        body: data,
      }),
    }),

    testAuthenticity: builder.mutation<
      TestAuthenticityResponse,
      { moduleId: string; data: TestAuthenticityDto }
    >({
      query: ({ moduleId, data }) => ({
        url: `/admin/domain-expertise/modules/${moduleId}/test-authenticity`,
        method: 'POST',
        body: data,
      }),
    }),

    // ============================================================================
    // Learning Endpoints (Slice 10)
    // ============================================================================

    // Research Outcomes
    listResearchOutcomes: builder.query<
      ListResearchOutcomesResponse,
      ListResearchOutcomesQuery | void
    >({
      query: (params = {}) => ({
        url: '/learning/outcomes',
        params: params as Record<string, string>,
      }),
      providesTags: ['ResearchOutcome'],
    }),

    getResearchOutcome: builder.query<GetResearchOutcomeResponse, string>({
      query: (id) => `/learning/outcomes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ResearchOutcome', id }],
    }),

    correctResearchOutcome: builder.mutation<
      GetResearchOutcomeResponse,
      { id: string; data: CorrectOutcomeDto }
    >({
      query: ({ id, data }) => ({
        url: `/learning/outcomes/${id}/correct`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ResearchOutcome', id },
        'ResearchOutcome',
      ],
    }),

    // Tool Effectiveness
    getToolEffectiveness: builder.query<
      GetToolEffectivenessResponse,
      ToolEffectivenessQuery | void
    >({
      query: (params = {}) => ({
        url: '/learning/tool-effectiveness',
        params: params as Record<string, string>,
      }),
      providesTags: ['ToolEffectiveness'],
    }),

    getToolEffectivenessTrends: builder.query<
      GetToolEffectivenessTrendResponse,
      { periodDays?: number }
    >({
      query: ({ periodDays }) => ({
        url: '/learning/tool-effectiveness/trends',
        params: periodDays ? { periodDays: String(periodDays) } : {},
      }),
      providesTags: ['ToolEffectiveness'],
    }),

    // Anomalies
    listAnomalies: builder.query<
      ListAnomaliesResponse,
      ListAnomaliesQuery | void
    >({
      query: (params = {}) => ({
        url: '/learning/anomalies',
        params: params as Record<string, string>,
      }),
      providesTags: ['ResearchAnomaly'],
    }),

    resolveAnomaly: builder.mutation<
      { anomaly: unknown },
      { id: string; data: ResolveAnomalyDto }
    >({
      query: ({ id, data }) => ({
        url: `/learning/anomalies/${id}/resolve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ResearchAnomaly', id },
        'ResearchAnomaly',
      ],
    }),

    // Calibration
    triggerCalibration: builder.mutation<TriggerCalibrationResponse, void>({
      query: () => ({
        url: '/learning/calibrate',
        method: 'POST',
      }),
      invalidatesTags: ['ToolEffectiveness', 'CalibrationHistory'],
    }),

    getCalibrationHistory: builder.query<
      GetCalibrationHistoryResponse,
      GetCalibrationHistoryQuery | void
    >({
      query: (params = {}) => ({
        url: '/admin/learning/calibration/history',
        params: params as Record<string, string>,
      }),
      providesTags: ['CalibrationHistory'],
    }),

    // Dashboard
    getLearningDashboard: builder.query<
      GetLearningDashboardResponse,
      LearningDashboardQuery | void
    >({
      query: (params = {}) => ({
        url: '/learning/dashboard',
        params: params as Record<string, string>,
      }),
      providesTags: ['ResearchOutcome', 'ToolEffectiveness', 'ResearchAnomaly'],
    }),

    // Admin Learning Endpoints
    getGlobalToolEffectiveness: builder.query<
      GetToolEffectivenessResponse,
      ToolEffectivenessQuery | void
    >({
      query: (params = {}) => ({
        url: '/admin/learning/global-effectiveness',
        params: params as Record<string, string>,
      }),
      providesTags: ['ToolEffectiveness'],
    }),

    getAllAnomalies: builder.query<
      ListAnomaliesResponse,
      ListAnomaliesQuery | void
    >({
      query: (params = {}) => ({
        url: '/admin/learning/all-anomalies',
        params: params as Record<string, string>,
      }),
      providesTags: ['ResearchAnomaly'],
    }),

    // ============================================================================
    // Tool Debugger Endpoints
    // ============================================================================

    listDebuggerTools: builder.query<ListToolsResponseDto, void>({
      query: () => '/admin/tool-debugger/tools',
    }),

    searchDebuggerItems: builder.query<
      SearchDebuggerItemsResponseDto,
      { query?: string; limit?: number }
    >({
      query: (params) => ({
        url: '/admin/tool-debugger/items',
        params: {
          ...(params.query ? { query: params.query } : {}),
          ...(params.limit ? { limit: String(params.limit) } : {}),
        },
      }),
    }),

    executeDebuggerTool: builder.mutation<
      ExecuteToolResponseDto,
      ExecuteToolRequestDto
    >({
      query: (body) => ({
        url: '/admin/tool-debugger/execute',
        method: 'POST',
        body,
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
  useEnableTeamMutation,
  useDisableTeamMutation,
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
  useGetFacebookAuthUrlQuery,
  useExchangeFacebookCodeMutation,
  useListMarketplaceAccountsQuery,
  useDeleteMarketplaceAccountMutation,
  useRefreshMarketplaceAccountMutation,
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
  useGetResearchActivityLogQuery,
  // Phase 7 Slice 1: ItemResearch hooks
  useGetLatestResearchQuery,
  useGetResearchHistoryQuery,
  // Phase 7 Slice 4: Resume research hook
  useResumeResearchMutation,
  usePauseResearchMutation,
  useStopResearchMutation,
  // Chat hooks
  useSendItemChatMessageMutation,
  // Phase 7 Slice 5: Chat session hooks
  useCreateChatSessionMutation,
  useGetChatMessagesQuery,
  // General Purpose Chat hooks
  useCreateGeneralChatSessionMutation,
  useGetChatSessionsQuery,
  useGetChatSessionQuery,
  useGetGeneralChatMessagesQuery,
  useUpdateChatSessionMutation,
  useDeleteChatSessionMutation,
  // Slice 7: Auto-publish settings hooks
  useGetAutoPublishSettingsQuery,
  useUpdateAutoPublishSettingsMutation,
  useRetryItemPublishMutation,
  // Organization Settings hooks
  useGetWorkflowSettingsQuery,
  useUpdateWorkflowSettingsMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useGetTeamSettingsQuery,
  useUpdateTeamSettingsMutation,
  useGetInventorySettingsQuery,
  useUpdateInventorySettingsMutation,
  useGetMarketplaceDefaultSettingsQuery,
  useUpdateMarketplaceDefaultSettingsMutation,
  useGetBillingSettingsQuery,
  useUpdateBillingSettingsMutation,
  useGetSecuritySettingsQuery,
  useUpdateSecuritySettingsMutation,
  // Research Settings hooks
  useGetResearchSettingsQuery,
  useUpdateResearchSettingsMutation,
  // Settings Audit & Version History hooks
  useGetSettingsVersionsQuery,
  useGetSettingsAuditLogsQuery,
  useLazyPreviewSettingsRevertQuery,
  useRevertSettingsMutation,
  useGetAdminSettingsAuditLogsQuery,
  useGetAdminSettingsVersionsQuery,
  // Domain Expertise hooks (Slice 9.1)
  // Module hooks
  useListDomainExpertiseModulesQuery,
  useGetDomainExpertiseModuleQuery,
  useCreateDomainExpertiseModuleMutation,
  useUpdateDomainExpertiseModuleMutation,
  useDeleteDomainExpertiseModuleMutation,
  useDuplicateDomainExpertiseModuleMutation,
  usePublishDomainExpertiseModuleMutation,
  useRollbackDomainExpertiseModuleMutation,
  useListDomainExpertiseVersionsQuery,
  useGetDomainExpertiseVersionQuery,
  // Lookup Table hooks
  useListLookupTablesQuery,
  useGetLookupTableQuery,
  useCreateLookupTableMutation,
  useUpdateLookupTableMutation,
  useDeleteLookupTableMutation,
  useImportLookupEntriesMutation,
  useLazyExportLookupEntriesQuery,
  // Lookup Entry hooks
  useListLookupEntriesQuery,
  useCreateLookupEntryMutation,
  useUpdateLookupEntryMutation,
  useDeleteLookupEntryMutation,
  useBulkLookupEntriesMutation,
  // Value Driver hooks
  useListValueDriversQuery,
  useCreateValueDriverMutation,
  useUpdateValueDriverMutation,
  useDeleteValueDriverMutation,
  useReorderValueDriversMutation,
  // Decoder hooks
  useListDecodersQuery,
  useCreateDecoderMutation,
  useUpdateDecoderMutation,
  useDeleteDecoderMutation,
  useTestDecoderMutation,
  useValidateDecoderPatternMutation,
  // Authenticity Marker hooks
  useListAuthenticityMarkersQuery,
  useCreateAuthenticityMarkerMutation,
  useUpdateAuthenticityMarkerMutation,
  useDeleteAuthenticityMarkerMutation,
  // Testing hooks
  useTestDecodePipelineMutation,
  useTestValueDriversMutation,
  useTestAuthenticityMutation,
  // Learning hooks (Slice 10)
  useListResearchOutcomesQuery,
  useGetResearchOutcomeQuery,
  useCorrectResearchOutcomeMutation,
  useGetToolEffectivenessQuery,
  useGetToolEffectivenessTrendsQuery,
  useListAnomaliesQuery,
  useResolveAnomalyMutation,
  useTriggerCalibrationMutation,
  useGetCalibrationHistoryQuery,
  useGetLearningDashboardQuery,
  useGetGlobalToolEffectivenessQuery,
  useGetAllAnomaliesQuery,
  // Tool Debugger hooks
  useListDebuggerToolsQuery,
  useSearchDebuggerItemsQuery,
  useLazySearchDebuggerItemsQuery,
  useExecuteDebuggerToolMutation,
} = api;

