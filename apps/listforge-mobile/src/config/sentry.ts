import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Initialize Sentry for error tracking and crash reporting
 *
 * Configuration:
 * - DSN should be set in app.json extra.sentryDsn or environment variable
 * - Traces sample rate: 1.0 in development, 0.2 in production
 * - Automatically captures unhandled errors and promise rejections
 */
export function initializeSentry() {
  const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;

  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // Sample 20% of transactions in production
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds
    environment: __DEV__ ? 'development' : 'production',

    // Attach user context
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.data) {
        // Remove password, token fields
        const data = event.request.data as any;
        if (typeof data === 'object' && data !== null) {
          delete data.password;
          delete data.passwordHash;
          delete data.token;
          delete data.authToken;
        }
      }
      return event;
    },
  });

  console.log('Sentry initialized');
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}
