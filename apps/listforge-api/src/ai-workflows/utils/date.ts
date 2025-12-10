/**
 * Date/Time Utilities
 *
 * Provides reusable date calculation functions to eliminate duplication
 */

/**
 * Time duration constants in milliseconds
 */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Get a date N days ago from now
 *
 * @param days - Number of days to subtract
 * @returns Date object representing N days ago
 */
export function getDaysAgo(days: number): Date {
  return new Date(Date.now() - days * TIME_MS.DAY);
}

/**
 * Get the age of a date in days
 *
 * @param date - The date to calculate age for
 * @returns Number of days between the date and now
 */
export function getAgeInDays(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return Math.floor((Date.now() - dateObj.getTime()) / TIME_MS.DAY);
}

/**
 * Check if a date is older than N days
 *
 * @param date - The date to check
 * @param days - Number of days threshold
 * @returns True if the date is older than the threshold
 */
export function isOlderThan(date: Date | string, days: number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < getDaysAgo(days).getTime();
}

/**
 * Check if research data is stale (>7 days old)
 * Commonly used throughout the application
 *
 * @param generatedAt - When the research was generated
 * @returns True if research is stale
 */
export function isResearchStale(generatedAt: Date | string): boolean {
  return isOlderThan(generatedAt, 7);
}

/**
 * Format a duration in milliseconds to a human-readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable duration string
 */
export function formatDuration(ms: number): string {
  if (ms < TIME_MS.MINUTE) {
    return `${Math.round(ms / TIME_MS.SECOND)}s`;
  }
  if (ms < TIME_MS.HOUR) {
    return `${Math.round(ms / TIME_MS.MINUTE)}m`;
  }
  if (ms < TIME_MS.DAY) {
    return `${Math.round(ms / TIME_MS.HOUR)}h`;
  }
  return `${Math.round(ms / TIME_MS.DAY)}d`;
}
