import { ResearchGraphState } from '../research-graph.state';
import { ResearchPlannerService } from '../../../services/research-planner.service';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { FieldEvaluationResult } from '@listforge/core-types';

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

    // Evaluate field states
    const evaluation = tools.researchPlanner.evaluateFieldStates(
      fieldStates,
      constraints,
      currentCost,
      currentIteration,
    );

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
        },
      });
    }

    // Determine if we're done
    const done = evaluation.decision !== 'continue';

    return {
      fieldEvaluation: evaluation,
      done,
      iteration: currentIteration + 1,
      overallConfidence: summary.completionScore,
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
