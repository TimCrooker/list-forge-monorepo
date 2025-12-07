/**
 * Research Types - Phase 6 Sub-Phase 8
 *
 * Types for ItemResearchRun entity and research workflows.
 */

/**
 * Type of research run
 */
export type ResearchRunType =
  | 'initial_intake'    // First-time research during AI capture
  | 'pricing_refresh'   // Re-run pricing research
  | 'manual_request';   // User-triggered manual research

/**
 * Status of a research run
 */
export type ResearchRunStatus =
  | 'pending'    // Queued but not started
  | 'running'    // Currently executing
  | 'success'    // Completed successfully
  | 'error';     // Failed with error
