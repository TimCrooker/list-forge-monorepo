/**
 * Utility functions for creating research warnings
 */

import { ResearchWarning } from '../graphs/research/research-graph.state';

/**
 * Create a warning for API failure
 */
export function createApiFailureWarning(
  source: string,
  apiName: string,
  errorMessage: string,
  impact: string,
  metadata?: Record<string, any>,
): ResearchWarning {
  return {
    severity: determineApiFailureSeverity(apiName),
    category: 'api_failure',
    message: `${apiName} failed: ${errorMessage}`,
    source,
    impact,
    timestamp: new Date(),
    metadata: {
      api: apiName,
      error: errorMessage,
      ...metadata,
    },
  };
}

/**
 * Create a warning for missing data
 */
export function createDataMissingWarning(
  source: string,
  dataType: string,
  impact: string,
  metadata?: Record<string, any>,
): ResearchWarning {
  return {
    severity: 'medium',
    category: 'data_missing',
    message: `Missing ${dataType}`,
    source,
    impact,
    timestamp: new Date(),
    metadata: {
      dataType,
      ...metadata,
    },
  };
}

/**
 * Create a warning for low confidence
 */
export function createLowConfidenceWarning(
  source: string,
  confidence: number,
  threshold: number,
  reason: string,
  metadata?: Record<string, any>,
): ResearchWarning {
  return {
    severity: confidence < 0.5 ? 'high' : 'medium',
    category: 'low_confidence',
    message: `Low confidence (${(confidence * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}%): ${reason}`,
    source,
    impact: 'Research results may be less accurate',
    timestamp: new Date(),
    metadata: {
      confidence,
      threshold,
      reason,
      ...metadata,
    },
  };
}

/**
 * Create a warning for rate limiting
 */
export function createRateLimitWarning(
  source: string,
  apiName: string,
  retryAfter?: number,
  metadata?: Record<string, any>,
): ResearchWarning {
  return {
    severity: 'medium',
    category: 'rate_limit',
    message: `Rate limited by ${apiName}${retryAfter ? ` (retry after ${retryAfter}s)` : ''}`,
    source,
    impact: 'Some data sources were skipped',
    timestamp: new Date(),
    metadata: {
      api: apiName,
      retryAfter,
      ...metadata,
    },
  };
}

/**
 * Determine severity based on which API failed
 */
function determineApiFailureSeverity(apiName: string): 'low' | 'medium' | 'high' {
  // Sold listings are critical for pricing
  if (apiName.includes('sold') || apiName.includes('Sold')) {
    return 'high';
  }
  // Active listings and Amazon are important but not critical
  if (apiName.includes('active') || apiName.includes('Amazon')) {
    return 'medium';
  }
  // Other APIs are nice-to-have
  return 'low';
}
