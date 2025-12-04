import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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
} from '@listforge/api-types';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - check for Vite env var
    // In Vite, this will be replaced at build time
    // For TypeScript compilation, we use a type assertion
    const env = (typeof import.meta !== 'undefined' && (import.meta as any).env)
      ? (import.meta as any).env.VITE_API_URL
      : undefined;
    return env || 'http://localhost:3001';
  }
  // Node environment
  return process.env.API_URL || 'http://localhost:3001';
};

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api`,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Org', 'OrgMember'],
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
    listUsers: builder.query<{ users: any[] }, void>({
      query: () => '/admin/users',
      providesTags: ['User'],
    }),
    listOrgsAdmin: builder.query<{ orgs: any[] }, void>({
      query: () => '/admin/orgs',
      providesTags: ['Org'],
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
      invalidatesTags: ['User'],
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
  useListOrgsAdminQuery,
  useUpdateUserAdminMutation,
} = api;

