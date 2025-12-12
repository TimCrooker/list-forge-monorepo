/**
 * Learning and Feedback Loop Types - Slice 10
 *
 * Types for tracking research outcomes, tool effectiveness,
 * calibration, and anomaly detection.
 */

// =============================================================================
// OUTCOME QUALITY
// =============================================================================

/**
 * Overall quality assessment of a research outcome
 */
export type OutcomeQuality = 'excellent' | 'good' | 'fair' | 'poor';

// =============================================================================
// ANOMALY TYPES
// =============================================================================

/**
 * Types of anomalies detected in research patterns
 */
export type AnomalyType =
  | 'price_deviation'           // Consistent over/under pricing
  | 'tool_failure_spike'        // Sudden increase in tool failures
  | 'confidence_miscalibration' // Confidence doesn't match actual accuracy
  | 'category_misidentification'// Frequent category errors
  | 'slow_sales';               // Items not selling at predicted rate

/**
 * Severity levels for anomalies
 */
export type AnomalySeverity = 'info' | 'warning' | 'critical';

// =============================================================================
// TOOL USAGE TRACKING
// =============================================================================

/**
 * Record of tool usage during research
 */
export interface ToolUsageRecord {
  /** Tool type identifier */
  toolType: string;
  /** Confidence score reported by the tool (0-1) */
  confidence: number;
  /** Fields that this tool provided data for */
  fieldsProvided: string[];
  /** Cost in USD for using this tool */
  cost: number;
  /** When the tool was executed */
  executedAt: string;
}

// =============================================================================
// RESEARCH OUTCOME
// =============================================================================

/**
 * Research outcome linking predictions to actual sales
 */
export interface ResearchOutcome {
  id: string;
  organizationId: string;
  itemId: string;
  researchRunId: string | null;
  marketplaceListingId: string | null;

  // Predictions at time of research
  predictedPriceFloor: number | null;
  predictedPriceTarget: number | null;
  predictedPriceCeiling: number | null;
  predictedCategory: string | null;
  identifiedBrand: string | null;
  identifiedModel: string | null;
  researchConfidence: number | null;
  toolsUsed: ToolUsageRecord[];

  // Actual outcomes
  listedPrice: number | null;
  soldPrice: number | null;
  soldAt: string | null;
  listedAt: string | null;
  daysToSell: number | null;
  marketplace: string | null;
  wasReturned: boolean;
  returnReason: string | null;

  // Calculated accuracy
  priceAccuracyRatio: number | null;
  identificationCorrect: boolean | null;
  priceWithinBands: boolean | null;
  outcomeQuality: OutcomeQuality | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TOOL EFFECTIVENESS
// =============================================================================

/**
 * Aggregated tool effectiveness metrics for a period
 */
export interface ToolEffectivenessMetrics {
  toolType: string;
  periodStart: string;
  periodEnd: string;

  // Usage metrics
  totalUses: number;
  contributedToSale: number;
  contributedToReturn: number;

  // Calculated metrics
  averagePriceAccuracy: number;
  averageConfidenceWhenUsed: number;
  identificationAccuracy: number;
  calibrationScore: number | null;

  // Weights
  currentWeight: number;
  suggestedWeight: number | null;

  // Derived metrics
  saleContributionRate: number;  // contributedToSale / totalUses
  returnRate: number;            // contributedToReturn / contributedToSale
}

// =============================================================================
// RESEARCH ANOMALY
// =============================================================================

/**
 * Detected anomaly in research patterns
 */
export interface ResearchAnomaly {
  id: string;
  organizationId: string;
  detectedAt: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  affectedItems: string[];
  toolType: string | null;
  pattern: Record<string, unknown> | null;
  suggestedAction: string | null;

  // Resolution tracking
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CALIBRATION
// =============================================================================

/**
 * Result of calibrating a tool's weight
 */
export interface CalibrationResult {
  toolType: string;
  previousWeight: number;
  newWeight: number;
  calibrationScore: number;
  dataPoints: number;
  reasoning: string;
  calibratedAt: string;
}

/**
 * Calibration run record
 */
export interface CalibrationRun {
  calibratedAt: string;
  triggeredBy: 'scheduled' | 'manual';
  results: CalibrationResult[];
}

// =============================================================================
// DASHBOARD SUMMARY
// =============================================================================

/**
 * Summary data for the learning dashboard
 */
export interface LearningDashboardSummary {
  period: {
    start: string;
    end: string;
  };

  // Aggregate metrics
  totalOutcomes: number;
  averagePriceAccuracy: number;
  identificationAccuracy: number;

  // Outcome distribution
  outcomesByQuality: Record<OutcomeQuality, number>;

  // Tool effectiveness
  toolEffectiveness: ToolEffectivenessMetrics[];

  // Anomalies
  activeAnomalies: ResearchAnomaly[];

  // Recent calibrations
  recentCalibrations: CalibrationResult[];
}
