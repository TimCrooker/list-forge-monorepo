import { ResearchGraphState, ResearchWarning } from '../research-graph.state';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { ItemFieldStates, MissingInfoHint } from '@listforge/core-types';

/**
 * Tools interface for validate_readiness node
 */
export interface ValidateReadinessTools {
  fieldStateManager: FieldStateManagerService;
}

/**
 * Validate Readiness Node
 *
 * Final validation step that:
 * 1. Checks if all required fields meet confidence thresholds
 * 2. Generates warnings for incomplete fields
 * 3. Calculates final readiness score
 * 4. Identifies fields that need user input
 *
 * This is the last step before persisting results.
 */
export async function validateReadinessNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: ValidateReadinessTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.fieldStateManager) {
    throw new Error('FieldStateManagerService is required');
  }

  // Start operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'validate_readiness',
      title: 'Validating Readiness',
      message: 'Checking if research is complete and ready for publishing',
      stepId: 'validate_readiness',
    });
  }

  try {
    const fieldStates = state.fieldStates;
    const constraints = state.researchConstraints;

    if (!fieldStates) {
      throw new Error('fieldStates is required');
    }

    // Check readiness using the constraints
    const requiredThreshold = constraints?.requiredConfidence ?? 0.75;
    const readinessCheck = tools.fieldStateManager.checkReadiness(fieldStates, requiredThreshold);

    // Get summary
    const summary = tools.fieldStateManager.getSummary(fieldStates);

    // Generate missing info hints
    const missingInfo: MissingInfoHint[] = [];
    const warnings: ResearchWarning[] = [];

    for (const [fieldName, field] of Object.entries(fieldStates.fields)) {
      // Check for fields that need user input
      if (field.status === 'user_required' || field.status === 'failed') {
        missingInfo.push({
          field: fieldName,
          importance: field.required ? 'required' : 'recommended',
          reason: field.status === 'failed'
            ? `Research failed for ${field.displayName}`
            : `${field.displayName} requires user input`,
          suggestedPrompt: `Please provide ${field.displayName}`,
        });

        if (field.required) {
          warnings.push({
            severity: 'high',
            category: 'data_missing',
            message: `Required field "${field.displayName}" is incomplete`,
            source: 'validate_readiness',
            impact: 'Item cannot be published without this field',
            timestamp: new Date(),
            metadata: { fieldName, status: field.status },
          });
        }
      }

      // Check for low confidence fields
      if (
        field.status === 'complete' &&
        field.confidence.value < requiredThreshold &&
        field.required
      ) {
        warnings.push({
          severity: 'medium',
          category: 'low_confidence',
          message: `Field "${field.displayName}" has low confidence (${Math.round(field.confidence.value * 100)}%)`,
          source: 'validate_readiness',
          impact: 'Consider reviewing before publishing',
          timestamp: new Date(),
          metadata: {
            fieldName,
            confidence: field.confidence.value,
            threshold: requiredThreshold,
          },
        });
      }
    }

    // Determine final status
    const isReady = readinessCheck.ready;
    const hasWarnings = warnings.length > 0;

    // Log completion
    if (activityLogger && operationId) {
      const statusMessage = isReady
        ? 'Research complete - ready to publish!'
        : `Research incomplete: ${summary.requiredFieldsComplete}/${summary.requiredFieldsTotal} required fields complete`;

      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'validate_readiness',
        title: 'Validating Readiness',
        message: statusMessage,
        stepId: 'validate_readiness',
        data: {
          isReady,
          completionScore: Math.round(summary.completionScore * 100),
          requiredComplete: `${summary.requiredFieldsComplete}/${summary.requiredFieldsTotal}`,
          recommendedComplete: `${summary.recommendedFieldsComplete}/${summary.recommendedFieldsTotal}`,
          warningsCount: warnings.length,
          missingFieldsCount: missingInfo.length,
          totalCost: state.currentResearchCost,
          totalIterations: state.iteration,
          fieldsNeedingUserInput: missingInfo.filter(m => m.importance === 'required').map(m => m.field),
        },
      });
    }

    // Build field completion for legacy compatibility
    const fieldCompletion = {
      readinessScore: summary.completionScore,
      required: {
        filled: summary.requiredFieldsComplete,
        total: summary.requiredFieldsTotal,
        missing: summary.fieldsNeedingResearch.filter(f => f.required).map(f => f.name),
      },
      recommended: {
        filled: summary.recommendedFieldsComplete,
        total: summary.recommendedFieldsTotal,
        missing: summary.fieldsNeedingResearch.filter(f => !f.required).map(f => f.name),
      },
    };

    return {
      fieldStates,
      missingInfo,
      warnings: [...(state.warnings || []), ...warnings],
      fieldCompletion,
      overallConfidence: summary.completionScore,
      done: true,
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'validate_readiness',
        title: 'Validating Readiness',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'validate_readiness',
      });
    }
    throw error;
  }
}
