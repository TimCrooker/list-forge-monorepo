/**
 * Throttler Configuration for Marketplace OAuth Endpoints
 *
 * Prevents brute force attacks and state enumeration on OAuth flows.
 * Uses @nestjs/throttler to enforce rate limits per IP address.
 */

export interface ThrottlerOptions {
  ttl: number; // Time-to-live in milliseconds
  limit: number; // Maximum requests within TTL window
}

/**
 * Rate limiting configuration for marketplace endpoints
 *
 * These limits balance security (preventing abuse) with usability
 * (allowing legitimate OAuth flows to complete).
 */
export const MARKETPLACE_THROTTLER_OPTIONS = {
  /**
   * Auth URL generation - Prevent state parameter enumeration
   *
   * Limit: 5 requests per minute
   * Rationale: Users typically initiate OAuth once. Multiple rapid requests
   * could indicate an attempt to enumerate valid state parameters.
   */
  getAuthUrl: {
    ttl: 60000, // 1 minute
    limit: 5,
  } as ThrottlerOptions,

  /**
   * Code exchange - Prevent brute force on authorization codes
   *
   * Limit: 10 requests per 5 minutes
   * Rationale: Authorization codes are single-use and expire quickly.
   * Legitimate users exchange code once. Higher limit allows retries
   * for network issues, but prevents brute force attacks.
   */
  exchangeCode: {
    ttl: 300000, // 5 minutes
    limit: 10,
  } as ThrottlerOptions,

  /**
   * Manual token refresh - Prevent refresh spam
   *
   * Limit: 3 requests per minute
   * Rationale: Token refresh should be infrequent. Legitimate use cases:
   * - User clicks "Refresh" button
   * - Automatic refresh on token expiry
   * Too many refreshes could indicate token theft/abuse.
   */
  refreshTokens: {
    ttl: 60000, // 1 minute
    limit: 3,
  } as ThrottlerOptions,

  /**
   * Webhook endpoint - Higher limit for legitimate webhook traffic
   *
   * Limit: 100 requests per minute
   * Rationale: Webhooks are triggered by external marketplace events.
   * During high-activity periods (e.g., bulk listing updates), many
   * webhooks may arrive in quick succession. Higher limit accommodates
   * legitimate traffic while preventing DoS via webhook flooding.
   */
  webhook: {
    ttl: 60000, // 1 minute
    limit: 100,
  } as ThrottlerOptions,

  /**
   * Account listing - Normal API usage
   *
   * Limit: 20 requests per minute
   * Rationale: Users may refresh account list or poll for status updates.
   * Generous limit for normal UI interactions.
   */
  listAccounts: {
    ttl: 60000, // 1 minute
    limit: 20,
  } as ThrottlerOptions,

  /**
   * Account deletion - Prevent abuse
   *
   * Limit: 5 requests per minute
   * Rationale: Deleting accounts should be rare. Low limit prevents
   * accidental or malicious bulk deletions.
   */
  deleteAccount: {
    ttl: 60000, // 1 minute
    limit: 5,
  } as ThrottlerOptions,
} as const;

/**
 * Default throttler options for all marketplace endpoints
 *
 * Applied when no specific endpoint limit is defined.
 */
export const DEFAULT_MARKETPLACE_THROTTLER: ThrottlerOptions = {
  ttl: 60000, // 1 minute
  limit: 10, // 10 requests per minute (reasonable default)
};

/**
 * Helper to create Throttle decorator options
 *
 * @param config - Throttler options
 * @returns Decorator-compatible options object
 */
export function createThrottleOptions(config: ThrottlerOptions) {
  return {
    default: config,
  };
}
