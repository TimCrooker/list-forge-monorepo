import { ResearchGraphState } from '../research-graph.state';
import { ResearchPlannerService } from '../../../services/research-planner.service';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { FieldEvaluationResult, ItemFieldStates, ResearchTaskHistory } from '@listforge/core-types';
import { MAX_CONSECUTIVE_NO_PROGRESS } from '@listforge/core-types';
import { createHash } from 'crypto';
import { Logger } from '@nestjs/common';
import { ResearchMetrics } from '../../../utils/telemetry';

const logger = new Logger('EvaluateFieldsNode');

/**
 * Compute a hash of field states for stuck detection.
 * Only considers field values and confidence scores.
 */
function hashFieldStates(fieldStates: ItemFieldStates): string {
  const hashInput = Object.entries(fieldStates.fields)
    .map(([name, field]) => `${name}:${JSON.stringify(field.value)}:${field.confidence.value}`)
    .sort()
    .join('|');
  return createHash('md5').update(hashInput).digest('hex');
}

/**
 * Tools interface for evaluate_fields node
 */
export interface EvaluateFieldsTools {
  researchPlanner: ResearchPlannerService;
  fieldStateManager: FieldStateManagerService;
}

/**
 * Evaluate Fields Node
 *
 * Phase 2: Adaptive Research Loop
 * Evaluates current field states and decides whether to:
 * - continue: More research needed, fields below threshold
 * - complete: All required fields meet confidence thresholds
 * - stop_with_warnings: Budget/iteration exhausted but not complete
 *
 * This is the decision point in the adaptive research loop.
 */
export async function evaluateFieldsNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: EvaluateFieldsTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.researchPlanner || !tools?.fieldStateManager) {
    throw new Error('ResearchPlannerService and FieldStateManagerService are required');
  }

  // Start operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'evaluate_fields',
      title: 'Evaluating Progress',
      message: 'Checking field completion and deciding next action',
      stepId: 'evaluate_fields',
    });
  }

  try {
    const fieldStates = state.fieldStates;
    const constraints = state.researchConstraints;

    if (!fieldStates || !constraints) {
      throw new Error('fieldStates and researchConstraints are required');
    }

    const currentCost = state.currentResearchCost || 0;
    const currentIteration = state.iteration || 0;

    // ========================================================================
    // BULLETPROOFING: Stuck detection via field state hash comparison
    // ========================================================================
    const currentHash = hashFieldStates(fieldStates);
    const existingHistory = state.taskHistory || {
      attemptsByTool: {},
      failedTools: [],
      consecutiveNoProgress: 0,
      lastFieldStatesHash: null,
    };

    // Check if we're stuck (same hash as last evaluation)
    const isStuck =
      existingHistory.lastFieldStatesHash === currentHash &&
      existingHistory.consecutiveNoProgress >= MAX_CONSECUTIVE_NO_PROGRESS;

    if (isStuck) {
      logger.warn(
        `Stuck detected: field states unchanged for ${existingHistory.consecutiveNoProgress} iterations`,
      );

      // Record stuck detection metric
      ResearchMetrics.stuckDetected({ organization_id: state.organizationId });
      ResearchMetrics.consecutiveNoProgress(existingHistory.consecutiveNoProgress, {
        organization_id: state.organizationId,
      });
    }

    // Evaluate field states
    let evaluation = tools.researchPlanner.evaluateFieldStates(
      fieldStates,
      constraints,
      currentCost,
      currentIteration,
    );

    // Override evaluation if stuck
    if (isStuck && evaluation.decision === 'continue') {
      logger.warn('Overriding continue decision due to stuck state');
      evaluation = {
        ...evaluation,
        decision: 'stop_with_warnings',
        reason: `Research stuck: No progress in ${existingHistory.consecutiveNoProgress} consecutive iterations`,
      };
    }

    // Get summary for logging
    const summary = tools.fieldStateManager.getSummary(fieldStates);

    // Log the decision
    if (activityLogger && operationId) {
      const decisionMessages: Record<string, string> = {
        continue: `Continuing research: ${evaluation.fieldsNeedingResearch.length} fields need work`,
        complete: 'Research complete! All required fields meet confidence thresholds',
        stop_with_warnings: `Stopping: ${evaluation.reason}`,
      };

      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'evaluate_fields',
        title: 'Evaluating Progress',
        message: decisionMessages[evaluation.decision],
        stepId: 'evaluate_fields',
        data: {
          decision: evaluation.decision,
          reason: evaluation.reason,
          completionScore: summary.completionScore,
          requiredComplete: `${summary.requiredFieldsComplete}/${summary.requiredFieldsTotal}`,
          budgetRemaining: evaluation.budgetRemaining.toFixed(4),
          iterationsRemaining: evaluation.iterationsRemaining,
          fieldsNeedingResearch: evaluation.fieldsNeedingResearch.slice(0, 5),
          iteration: currentIteration,
          fieldStatesHash: currentHash.substring(0, 8), // For debugging
          consecutiveNoProgress: existingHistory.consecutiveNoProgress,
          isStuck,
        },
      });
    }

    // Determine if we're done
    const done = evaluation.decision !== 'continue';

    // Record loop metrics when exiting (not continuing)
    if (done) {
      // Map evaluation decision to exit reason
      let exitReason: 'complete' | 'budget' | 'iterations' | 'stuck' | 'error' = 'complete';
      if (isStuck) {
        exitReason = 'stuck';
      } else if (evaluation.reason?.includes('Budget')) {
        exitReason = 'budget';
      } else if (evaluation.reason?.includes('iterations')) {
        exitReason = 'iterations';
      } else if (evaluation.decision === 'complete') {
        exitReason = 'complete';
      }

      // Record metrics
      ResearchMetrics.loopIterations(currentIteration + 1, {
        exit_reason: exitReason,
        organization_id: state.organizationId,
      });
      ResearchMetrics.loopExitReason({
        reason: exitReason,
        organization_id: state.organizationId,
      });

      logger.log(
        `Research loop exiting at iteration ${currentIteration + 1}: ${exitReason} (${evaluation.reason})`,
      );
    }

    // Update taskHistory with current hash
    const updatedTaskHistory: ResearchTaskHistory = {
      ...existingHistory,
      lastFieldStatesHash: currentHash,
    };

    return {
      fieldEvaluation: evaluation,
      done,
      iteration: currentIteration + 1,
      overallConfidence: summary.completionScore,
      taskHistory: updatedTaskHistory,
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'evaluate_fields',
        title: 'Evaluating Progress',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'evaluate_fields',
      });
    }
    throw error;
  }
}

/**
 * Conditional edge function for the evaluate_fields node
 * Returns the next node name based on evaluation decision
 */
export function shouldContinueResearch(state: ResearchGraphState): string {
  const evaluation = state.fieldEvaluation;

  if (!evaluation) {
    // If no evaluation, assume we need to continue
    return 'plan_next_research';
  }

  switch (evaluation.decision) {
    case 'continue':
      return 'plan_next_research';
    case 'complete':
      return 'validate_readiness';
    case 'stop_with_warnings':
      return 'validate_readiness';
    default:
      return 'validate_readiness';
  }
}
