/**
 * Simple logger utility for LangGraph nodes
 *
 * Nodes are pure functions without access to NestJS Logger,
 * so we use a lightweight logger that can be easily replaced
 * with a proper logging service if needed.
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('ResearchGraph');

/**
 * Log debug message from a node
 */
export function logNodeDebug(nodeName: string, message: string, context?: Record<string, unknown>): void {
  if (context) {
    logger.debug(`[${nodeName}] ${message}`, JSON.stringify(context));
  } else {
    logger.debug(`[${nodeName}] ${message}`);
  }
}

/**
 * Log info message from a node
 */
export function logNodeInfo(nodeName: string, message: string, context?: Record<string, unknown>): void {
  if (context) {
    logger.log(`[${nodeName}] ${message}`, JSON.stringify(context));
  } else {
    logger.log(`[${nodeName}] ${message}`);
  }
}

/**
 * Log warning from a node
 */
export function logNodeWarn(nodeName: string, message: string, context?: Record<string, unknown>): void {
  if (context) {
    logger.warn(`[${nodeName}] ${message}`, JSON.stringify(context));
  } else {
    logger.warn(`[${nodeName}] ${message}`);
  }
}

/**
 * Log error from a node
 */
export function logNodeError(nodeName: string, message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (context) {
    logger.error(`[${nodeName}] ${message}: ${errorMessage}`, JSON.stringify(context));
  } else {
    logger.error(`[${nodeName}] ${message}: ${errorMessage}`);
  }
}
