/**
 * Learning and Feedback Loop API Types - Slice 10
 *
 * Request/response DTOs for the learning module endpoints.
 */
import type {
  OutcomeQuality,
  ResearchOutcome,
  ToolEffectivenessMetrics,
  ResearchAnomaly,
  CalibrationResult,
  LearningDashboardSummary,
  AnomalySeverity,
} from '@listforge/core-types';

// =============================================================================
// RESEARCH OUTCOMES
// =============================================================================

/**
 * Query parameters for listing research outcomes
 */
export interface ListResearchOutcomesQuery {
  quality?: OutcomeQuality;
  marketplace?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Response for listing research outcomes
 */
export interface ListResearchOutcomesResponse {
  outcomes: ResearchOutcome[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * DTO for correcting an outcome (manual override)
 */
export interface CorrectOutcomeDto {
  identificationCorrect?: boolean;
  outcomeQuality?: OutcomeQuality;
  correctionNotes?: string;
}

/**
 * Response for getting a single outcome
 */
export interface GetResearchOutcomeResponse {
  outcome: ResearchOutcome;
}

// =============================================================================
// TOOL EFFECTIVENESS
// =============================================================================

/**
 * Query parameters for tool effectiveness
 */
export interface ToolEffectivenessQuery {
  toolType?: string;
  periodDays?: number;
}

/**
 * Response for tool effectiveness metrics
 */
export interface GetToolEffectivenessResponse {
  tools: ToolEffectivenessMetrics[];
  periodStart: string;
  periodEnd: string;
}

/**
 * Single data point for tool effectiveness trend
 */
export interface ToolEffectivenessTrendPoint {
  date: string;
  toolType: string;
  averagePriceAccuracy: number;
  identificationAccuracy: number;
  calibrationScore: number | null;
  totalUses: number;
}

/**
 * Response for tool effectiveness trends
 */
export interface GetToolEffectivenessTrendResponse {
  trends: ToolEffectivenessTrendPoint[];
  toolTypes: string[];
  periodStart: string;
  periodEnd: string;
}

// =============================================================================
// ANOMALIES
// =============================================================================

/**
 * Query parameters for listing anomalies
 */
export interface ListAnomaliesQuery {
  resolved?: boolean;
  severity?: AnomalySeverity;
  limit?: number;
  offset?: number;
}

/**
 * Response for listing anomalies
 */
export interface ListAnomaliesResponse {
  anomalies: ResearchAnomaly[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * DTO for resolving an anomaly
 */
export interface ResolveAnomalyDto {
  resolutionNotes: string;
}

// =============================================================================
// CALIBRATION
// =============================================================================

/**
 * Response for triggering calibration
 */
export interface TriggerCalibrationResponse {
  success: boolean;
  results: CalibrationResult[];
  calibratedAt: string;
}

/**
 * Query for calibration history
 */
export interface GetCalibrationHistoryQuery {
  limit?: number;
}

/**
 * Response for calibration history
 */
export interface GetCalibrationHistoryResponse {
  calibrations: {
    calibratedAt: string;
    triggeredBy: 'scheduled' | 'manual';
    results: CalibrationResult[];
  }[];
}

// =============================================================================
// DASHBOARD
// =============================================================================

/**
 * Query parameters for learning dashboard
 */
export interface LearningDashboardQuery {
  periodDays?: number;
}

/**
 * Response for learning dashboard
 */
export interface GetLearningDashboardResponse {
  summary: LearningDashboardSummary;
}
