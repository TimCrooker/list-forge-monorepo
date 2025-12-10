import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import * as SecureStore from 'expo-secure-store';
import { API_URL, STORAGE_KEYS } from '../constants';
import type { RootState } from '../store';

// Mobile-specific base query that uses SecureStore for token storage
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: async (headers, { getState }) => {
    // Try to get token from Redux state first
    const token = (getState() as RootState).auth.token;

    // Fallback to secure storage if not in state
    const storedToken = token || await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);

    if (storedToken) {
      headers.set('authorization', `Bearer ${storedToken}`);
    }

    return headers;
  },
});

// Create the API instance
// We'll define endpoints as needed for mobile-specific operations
export const api = createApi({
  baseQuery,
  reducerPath: 'api',
  tagTypes: ['Item', 'Capture', 'Research', 'Chat'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<
      { token: string; userId: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Item endpoints
    getItems: builder.query({
      query: () => '/items',
      providesTags: ['Item'],
    }),

    createItem: builder.mutation({
      query: (formData) => ({
        url: '/items',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Item'],
    }),

    // Quick evaluation endpoint
    quickEval: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/items/quick-eval',
        method: 'POST',
        body: formData,
      }),
    }),

    // Barcode lookup endpoint
    barcodeSearch: builder.mutation<
      any,
      { barcode: string }
    >({
      query: ({ barcode }) => ({
        url: '/items/barcode-lookup',
        method: 'POST',
        body: { barcode },
      }),
    }),

    // Register device token for push notifications
    registerDeviceToken: builder.mutation<
      { success: boolean },
      { token: string; platform: 'ios' | 'android' }
    >({
      query: (body) => ({
        url: '/users/device-token',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetItemsQuery,
  useCreateItemMutation,
  useQuickEvalMutation,
  useBarcodeSearchMutation,
  useRegisterDeviceTokenMutation,
} = api;
