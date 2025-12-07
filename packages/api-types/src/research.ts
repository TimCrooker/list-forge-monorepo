import { ResearchRunType, ResearchRunStatus } from '@listforge/core-types';
import { EvidenceBundleDto } from './evidence';

/**
 * Research API Types - Phase 6 Sub-Phase 8
 *
 * Request and response types for ItemResearchRun endpoints.
 */

// ============================================================================
// ItemResearchRun DTOs
// ============================================================================

/**
 * Full ItemResearchRun DTO
 */
export interface ItemResearchRunDto {
  id: string;
  itemId: string;
  runType: ResearchRunType;
  status: ResearchRunStatus;
  pipelineVersion: string | null;
  startedAt: string; // ISO date string
  completedAt: string | null; // ISO date string
  errorMessage: string | null;
  summary: string | null;
}

/**
 * Lightweight summary DTO for lists
 */
export interface ItemResearchRunSummaryDto {
  id: string;
  runType: ResearchRunType;
  status: ResearchRunStatus;
  startedAt: string; // ISO date string
  completedAt: string | null; // ISO date string
  summary: string | null;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request to trigger a new research run
 */
export interface TriggerResearchRequest {
  runType?: ResearchRunType; // Optional, defaults to 'manual_request'
}

/**
 * Response after triggering research
 */
export interface TriggerResearchResponse {
  researchRun: ItemResearchRunDto;
}

/**
 * Response for listing research runs
 */
export interface ListResearchRunsResponse {
  researchRuns: ItemResearchRunSummaryDto[];
  total: number;
}

/**
 * Response for getting a single research run
 */
export interface GetResearchRunResponse {
  researchRun: ItemResearchRunDto;
}

/**
 * Response for getting evidence for a research run
 */
export interface GetResearchRunEvidenceResponse {
  evidence: EvidenceBundleDto | null;
}
