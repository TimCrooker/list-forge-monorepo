/**
 * MarketplaceErrorSanitizer
 *
 * Sanitizes error messages to prevent leakage of sensitive information
 * such as API keys, credentials, file paths, and internal implementation details.
 *
 * This utility ensures that errors returned to clients are safe while preserving
 * full error details in server-side logs for debugging.
 */

export interface SafeError {
  message: string;
  category: ErrorCategory;
  originalType?: string;
}

export enum ErrorCategory {
  EBAY_API_ERROR = 'EBAY_API_ERROR',
  AMAZON_API_ERROR = 'AMAZON_API_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class MarketplaceErrorSanitizer {
  /**
   * Sensitive patterns to redact from error messages
   *
   * These patterns match common sensitive data that should never be
   * exposed to clients.
   */
  private static readonly SENSITIVE_PATTERNS = [
    // API Keys and Tokens (20+ alphanumeric characters)
    { pattern: /[A-Za-z0-9_-]{20,}/g, replacement: '[REDACTED_TOKEN]' },

    // Base64 encoded credentials (Basic Auth)
    { pattern: /Basic\s+[A-Za-z0-9+/=]+/gi, replacement: 'Basic [REDACTED]' },

    // Bearer tokens
    { pattern: /Bearer\s+[A-Za-z0-9_\-\.]+/gi, replacement: 'Bearer [REDACTED]' },

    // Authorization headers
    { pattern: /Authorization:\s*[^\s]+/gi, replacement: 'Authorization: [REDACTED]' },

    // File paths (Unix and Windows)
    { pattern: /\/(?:home|Users|var|usr|opt|etc)\/[^\s]*/g, replacement: '[PATH]' },
    { pattern: /[A-Z]:\\(?:Users|Program Files|Windows)[^\s]*/g, replacement: '[PATH]' },

    // IP addresses (optional - keep for debugging, redact in production)
    // { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[IP]' },

    // Email addresses (partial redaction)
    { pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '$1@[DOMAIN]' },

    // Connection strings
    { pattern: /(?:postgresql|mysql|mongodb):\/\/[^\s]+/gi, replacement: '[DATABASE_URL]' },
    { pattern: /redis:\/\/[^\s]+/gi, replacement: '[REDIS_URL]' },

    // Generic secret patterns
    { pattern: /(?:password|passwd|pwd|secret|api[_-]?key|token)[\s:=]+[^\s]+/gi, replacement: '[REDACTED_SECRET]' },
  ];

  /**
   * Error keywords that indicate specific error categories
   */
  private static readonly ERROR_KEYWORDS = {
    [ErrorCategory.EBAY_API_ERROR]: ['ebay', 'ebay api', 'ebay error'],
    [ErrorCategory.AMAZON_API_ERROR]: ['amazon', 'sp-api', 'selling partner', 'mws'],
    [ErrorCategory.INVALID_CREDENTIALS]: ['unauthorized', '401', 'invalid credentials', 'authentication failed', 'invalid token'],
    [ErrorCategory.CONFIGURATION_ERROR]: ['not configured', 'missing config', 'environment variable'],
    [ErrorCategory.NETWORK_ERROR]: ['econnrefused', 'enotfound', 'etimedout', 'network', 'fetch failed'],
    [ErrorCategory.EXTERNAL_SERVICE_ERROR]: ['api error', 'service unavailable', '503', '502', 'bad gateway'],
  };

  /**
   * Safe error messages for each category
   *
   * These are user-friendly messages that don't expose internal details.
   */
  private static readonly SAFE_MESSAGES = {
    [ErrorCategory.EBAY_API_ERROR]: 'Failed to communicate with eBay. Please try again later.',
    [ErrorCategory.AMAZON_API_ERROR]: 'Failed to communicate with Amazon. Please try again later.',
    [ErrorCategory.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again later.',
    [ErrorCategory.INVALID_CREDENTIALS]: 'Invalid marketplace credentials. Please reconnect your account.',
    [ErrorCategory.CONFIGURATION_ERROR]: 'Server configuration error. Please contact support.',
    [ErrorCategory.NETWORK_ERROR]: 'Network connection error. Please check your connection and try again.',
    [ErrorCategory.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again later.',
  };

  /**
   * Sanitize an error for safe client exposure
   *
   * @param error - The error to sanitize (Error object, string, or unknown)
   * @param isProduction - Whether running in production (more aggressive sanitization)
   * @returns Sanitized error with safe message and category
   */
  static sanitizeError(error: unknown, isProduction = false): SafeError {
    const category = this.categorizeError(error);
    const originalMessage = this.extractErrorMessage(error);
    const originalType = error instanceof Error ? error.constructor.name : typeof error;

    // In production, always use safe messages
    if (isProduction) {
      return {
        message: this.SAFE_MESSAGES[category],
        category,
        originalType,
      };
    }

    // In development, redact sensitive data but keep details
    const redactedMessage = this.redactSensitiveData(originalMessage);

    return {
      message: redactedMessage || this.SAFE_MESSAGES[category],
      category,
      originalType,
    };
  }

  /**
   * Redact sensitive data from a message
   *
   * @param message - The message to redact
   * @returns Message with sensitive data replaced
   */
  static redactSensitiveData(message: string): string {
    let sanitized = message;

    // Apply all redaction patterns
    for (const { pattern, replacement } of this.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    return sanitized;
  }

  /**
   * Categorize an error based on its message and type
   *
   * @param error - The error to categorize
   * @returns The error category
   */
  static categorizeError(error: unknown): ErrorCategory {
    const message = this.extractErrorMessage(error).toLowerCase();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(this.ERROR_KEYWORDS)) {
      if (keywords.some(keyword => message.includes(keyword.toLowerCase()))) {
        return category as ErrorCategory;
      }
    }

    // Default to unknown error
    return ErrorCategory.UNKNOWN_ERROR;
  }

  /**
   * Extract error message from various error types
   *
   * @param error - The error object
   * @returns The error message as a string
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message || error.toString();
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      // Try common error message properties
      const errorObj = error as Record<string, unknown>;

      if (typeof errorObj.message === 'string') {
        return errorObj.message;
      }

      if (typeof errorObj.error === 'string') {
        return errorObj.error;
      }

      if (typeof errorObj.statusText === 'string') {
        return errorObj.statusText;
      }

      // Fallback to JSON stringify
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    }

    return String(error);
  }

  /**
   * Check if an error message contains sensitive data
   *
   * Useful for logging/monitoring to detect if sanitization is working.
   *
   * @param message - The message to check
   * @returns True if sensitive data detected
   */
  static containsSensitiveData(message: string): boolean {
    return this.SENSITIVE_PATTERNS.some(({ pattern }) => {
      // Reset regex lastIndex to ensure consistent testing
      pattern.lastIndex = 0;
      return pattern.test(message);
    });
  }

  /**
   * Create a safe error response for API endpoints
   *
   * This is the primary method to use in catch blocks.
   *
   * @param error - The caught error
   * @param logger - Optional logger to log full error server-side
   * @param isProduction - Whether running in production
   * @returns Safe error object for client response
   */
  static createSafeResponse(
    error: unknown,
    logger?: { error: (message: string, trace?: string) => void },
    isProduction = false,
  ): SafeError {
    // Log full error server-side (unsanitized) for debugging
    if (logger) {
      const fullMessage = this.extractErrorMessage(error);
      const stack = error instanceof Error ? error.stack : undefined;
      logger.error(`Marketplace error: ${fullMessage}`, stack);
    }

    // Return sanitized error for client
    return this.sanitizeError(error, isProduction);
  }

  /**
   * Wrap an async function with error sanitization
   *
   * @param fn - The async function to wrap
   * @param logger - Optional logger
   * @param isProduction - Whether running in production
   * @returns Wrapped function that sanitizes errors
   */
  static wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    logger?: { error: (message: string, trace?: string) => void },
    isProduction = false,
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        const safeError = this.createSafeResponse(error, logger, isProduction);
        throw new Error(safeError.message);
      }
    }) as T;
  }
}
