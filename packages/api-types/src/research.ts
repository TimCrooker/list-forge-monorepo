import {
  ResearchRunType,
  ResearchRunStatus,
  ItemResearchData,
} from '@listforge/core-types';
import { EvidenceBundleDto } from './evidence';

/**
 * Research API Types - Phase 6 Sub-Phase 8 + Phase 7 Slice 1
 *
 * Request and response types for ItemResearchRun and ItemResearch endpoints.
 */

// ============================================================================
// Phase 7 Slice 4: Step History Types (defined first for ItemResearchRunDto)
// ============================================================================

/**
 * Step history entry for tracking node execution
 */
export interface StepHistoryEntry {
  node: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'success' | 'error';
  error?: string;
}

// ============================================================================
// ItemResearchRun DTOs
// ============================================================================

/**
 * Full ItemResearchRun DTO
 * Phase 7 Slice 4: Added stepCount and stepHistory
 */
export interface ItemResearchRunDto {
  id: string;
  itemId: string;
  runType: ResearchRunType;
  status: ResearchRunStatus;
  pipelineVersion: string | null;
  currentNode: string | null; // Phase 7 Slice 2: Current node in graph for progress
  startedAt: string; // ISO date string
  completedAt: string | null; // ISO date string
  errorMessage: string | null;
  summary: string | null;
  stepCount?: number; // Phase 7 Slice 4: Number of steps executed
  stepHistory?: StepHistoryEntry[]; // Phase 7 Slice 4: Step-by-step execution history
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

// ============================================================================
// Phase 7 Slice 1: ItemResearch DTOs
// ============================================================================

/**
 * Full ItemResearch DTO - structured research conclusions
 */
export interface ItemResearchDto {
  id: string;
  itemId: string;
  data: ItemResearchData;
  schemaVersion: string;
  createdAt: string; // ISO date string
  researchRunId?: string;
  isCurrent: boolean;
}

/**
 * Response for getting latest research for an item
 */
export interface GetLatestResearchResponse {
  research: ItemResearchDto | null;
}

/**
 * Response for getting research history for an item
 */
export interface GetResearchHistoryResponse {
  researches: ItemResearchDto[];
  total: number;
}

// ============================================================================
// Phase 7 Slice 2: Research Job Status DTO
// ============================================================================

/**
 * Research job status DTO for polling job progress
 */
export interface ResearchJobStatusDto {
  id: string;
  itemId: string;
  status: ResearchRunStatus;
  currentNode?: string;
  stepCount: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// ============================================================================
// Phase 7 Slice 4: Resume Types
// ============================================================================

/**
 * Extended ItemResearchRun DTO with step history
 */
export interface ItemResearchRunWithHistoryDto extends ItemResearchRunDto {
  stepCount: number;
  stepHistory?: StepHistoryEntry[];
  canResume?: boolean;
}

/**
 * Response for resuming a research run
 */
export interface ResumeResearchResponse {
  researchRun: ItemResearchRunDto;
  message: string;
}
