import { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiErrorResponse, ErrorMessages } from '@listforge/api-types';
import { toast } from 'sonner';

/**
 * Vite import.meta.env type for build-time environment variables
 */
interface ViteImportMeta {
  env?: {
    VITE_API_URL?: string;
  };
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment - check for Vite env var
    const viteImport = import.meta as unknown as ViteImportMeta;
    const env = viteImport.env?.VITE_API_URL;

    if (env) {
      return env;
    }

    // Check if we're in production (not localhost)
    const isProduction = window.location.hostname !== 'localhost' &&
                        window.location.hostname !== '127.0.0.1';

    if (isProduction) {
      // VITE_API_URL MUST be set for each environment (production, staging, preview, etc.)
      // This is a build-time variable - set it in Vercel's Environment Variables
      console.error(
        '❌ VITE_API_URL is not set!\n' +
        'This environment variable must be configured in Vercel for each environment:\n' +
        '  - Production: https://api.your-domain.com\n' +
        '  - Staging: https://api-staging.your-domain.com\n' +
        '  - Preview: https://api-preview.your-domain.com\n' +
        'Set this in Vercel Dashboard → Settings → Environment Variables'
      );
      // Return empty string - API calls will fail but with a clear error
      return '';
    }

    // Development fallback
    return 'http://localhost:3001';
  }
  // Node environment (SSR)
  return process.env.API_URL || 'http://localhost:3001';
};

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const baseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/api`,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Custom baseQuery that handles errors and shows toast notifications
 */
export const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // Handle errors
  if (result.error) {
    const error = result.error as FetchBaseQueryError;

    // Check if it's a standardized API error response
    if (error.status === 'FETCH_ERROR') {
      // Network error
      toast.error('Unable to connect to the server. Please check your internet connection.');
    } else if (error.status === 'PARSING_ERROR') {
      // Response parsing error
      toast.error('Received an invalid response from the server.');
    } else if (error.data && typeof error.data === 'object') {
      // Try to extract standardized error response
      const apiError = error.data as Partial<ApiErrorResponse>;

      // Check if it's a standardized API error response
      if ('errorCode' in apiError && 'message' in apiError && apiError.errorCode && apiError.message) {
        // Use the message from the API, or fall back to error code message
        const message = apiError.message ||
          (apiError.errorCode && ErrorMessages[apiError.errorCode as keyof typeof ErrorMessages]) ||
          'An error occurred';

        // Show details if available
        if (apiError.details && Array.isArray(apiError.details) && apiError.details.length > 0) {
          toast.error(message, {
            description: apiError.details.join(', '),
            duration: 5000,
          });
        } else {
          toast.error(message);
        }
      } else {
        // Fallback for non-standardized errors
        const status = typeof error.status === 'number' ? error.status : 0;
        if (status === 401) {
          toast.error('Your session has expired. Please log in again.');
          // Optionally redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
        } else if (status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else if (status === 404) {
          toast.error('The requested resource was not found.');
        } else if (status === 500) {
          toast.error('A server error occurred. Please try again later.');
        } else {
          // Try to extract message from error data
          const errorMessage = (apiError as { message?: string }).message ||
            'An unexpected error occurred. Please try again.';
          toast.error(errorMessage);
        }
      }
    } else {
      // Unknown error format
      toast.error('An unexpected error occurred. Please try again.');
    }
  }

  return result;
};

