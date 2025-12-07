/**
 * Standardized API error response format
 * All errors from the API will follow this structure
 */
export interface ApiErrorResponse {
  /** HTTP status code */
  statusCode: number;

  /** Machine-readable error code for frontend handling */
  errorCode: string;

  /** Human-readable error message for display */
  message: string;

  /** Detailed error messages (e.g., validation errors) */
  details?: string[];

  /** Request timestamp */
  timestamp: string;

  /** Request path */
  path: string;
}

/**
 * Standard error codes for the application
 */
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  ORG_ACCESS_DENIED: 'ORG_ACCESS_DENIED',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  MARKETPLACE_ACCOUNT_NOT_FOUND: 'MARKETPLACE_ACCOUNT_NOT_FOUND',
  META_LISTING_NOT_FOUND: 'META_LISTING_NOT_FOUND',

  // Validation errors (400)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_STATE: 'INVALID_STATE',
  STATE_EXPIRED: 'STATE_EXPIRED',

  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  ACCOUNT_ALREADY_CONNECTED: 'ACCOUNT_ALREADY_CONNECTED',

  // Business logic errors (422)
  UNPROCESSABLE: 'UNPROCESSABLE',
  LISTING_NOT_READY: 'LISTING_NOT_READY',
  ACCOUNT_NOT_ACTIVE: 'ACCOUNT_NOT_ACTIVE',

  // External service errors (502)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EBAY_API_ERROR: 'EBAY_API_ERROR',
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Human-readable messages for error codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  UNAUTHORIZED: 'You must be logged in to access this resource',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again',

  // Authorization
  FORBIDDEN: 'You do not have permission to perform this action',
  ADMIN_REQUIRED: 'This action requires administrator privileges',
  ORG_ACCESS_DENIED: 'You do not have access to this organization',

  // Not found
  NOT_FOUND: 'The requested resource was not found',
  USER_NOT_FOUND: 'User not found',
  ITEM_NOT_FOUND: 'Item not found',
  ORG_NOT_FOUND: 'Organization not found',
  MARKETPLACE_ACCOUNT_NOT_FOUND: 'Marketplace account not found',
  META_LISTING_NOT_FOUND: 'Listing not found',

  // Validation
  BAD_REQUEST: 'Invalid request',
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_STATE: 'Invalid OAuth state parameter',
  STATE_EXPIRED: 'OAuth state has expired. Please try connecting again',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment before trying again',

  // Conflict
  CONFLICT: 'This action conflicts with existing data',
  USER_ALREADY_EXISTS: 'A user with this email already exists',
  ACCOUNT_ALREADY_CONNECTED: 'This marketplace account is already connected',

  // Business logic
  UNPROCESSABLE: 'Unable to process this request',
  LISTING_NOT_READY: 'This listing is not ready for publishing',
  ACCOUNT_NOT_ACTIVE: 'This marketplace account is not active',

  // External services
  EXTERNAL_SERVICE_ERROR: 'An external service error occurred',
  EBAY_API_ERROR: 'Failed to communicate with eBay',
  OPENAI_API_ERROR: 'Failed to process with AI',

  // Server
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
};

