import { ResearchGraphState } from '../research-graph.state';
import { withSpan, ResearchMetrics, startTiming } from '../../../utils/telemetry';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { IdentificationValidatorService } from '../../../services/identification-validator.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('ValidateIdentificationNode');

/**
 * Validate Identification Node (Slice 6)
 *
 * Validation checkpoint that runs after market research to verify
 * our identification matches the evidence (comps, prices, attributes).
 *
 * Validation Checks:
 * 1. Price Sanity - Comp prices should match expected range
 * 2. Comp Matching - At least some comps should match well
 * 3. Attribute Consistency - Brand/model should be consistent across sources
 * 4. Visual Consistency - Item images should match comp images
 *
 * If validation fails with errors, triggers re-identification
 * with hints to guide the next attempt. Limited to maxReidentificationAttempts
 * to prevent infinite loops.
 */
export async function validateIdentificationNode(
  state: ResearchGraphState,
  config?: { configurable?: { activityLogger?: ResearchActivityLoggerService; identificationValidator?: IdentificationValidatorService; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const timing = startTiming();

  // Use 'deep_identify' as operation type (closest match in ResearchOperationType)
  return withSpan(
    'research.node.validate_identification',
    'deep_identify',
    async (span) => {
      span.setAttribute('research.run_id', state.researchRunId);
      span.setAttribute('research.item_id', state.itemId);
      span.setAttribute('research.reidentification_attempts', state.reidentificationAttempts || 0);

      const activityLogger = config?.configurable?.activityLogger;
      const validator = config?.configurable?.identificationValidator;

      if (!validator) {
        logger.error('IdentificationValidatorService not provided in config');
        throw new Error('IdentificationValidatorService not provided');
      }

      // Start activity operation
      let operationId: string | undefined;
      if (activityLogger) {
        operationId = await activityLogger.startOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationType: 'validation_checkpoint',
          title: 'Validating Identification',
          message: 'Checking identification against market evidence',
          stepId: 'validate_identification',
        });
      }

      try {
        // Log what we're validating
        logger.log(
          `Validating identification for item ${state.itemId} ` +
            `(${state.comps?.length || 0} comps, attempt ${(state.reidentificationAttempts || 0) + 1})`,
        );

        // Run validation
        const result = await validator.validate(state);

        // Record span attributes
        span.setAttribute('validation.is_valid', result.isValid);
        span.setAttribute('validation.confidence', result.confidence);
        span.setAttribute('validation.error_count', result.stats.errorCount);
        span.setAttribute('validation.warning_count', result.stats.warningCount);
        span.setAttribute('validation.should_reidentify', result.shouldReidentify);

        // Log completion
        if (activityLogger && operationId) {
          await activityLogger.completeOperation({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationId,
            operationType: 'validation_checkpoint',
            title: 'Validation Complete',
            message: result.isValid
              ? `Identification validated (${result.stats.passedChecks}/${result.stats.totalChecks} checks passed)`
              : `Validation issues found: ${result.stats.errorCount} errors, ${result.stats.warningCount} warnings`,
            stepId: 'validate_identification',
            data: {
              isValid: result.isValid,
              confidence: result.confidence,
              shouldReidentify: result.shouldReidentify,
              issues: result.issues.map((i) => ({
                type: i.type,
                severity: i.severity,
                message: i.message,
              })),
              stats: result.stats,
              reidentificationAttempts: (state.reidentificationAttempts || 0) + (result.shouldReidentify ? 1 : 0),
              maxAttempts: state.maxReidentificationAttempts || 2,
            },
          });
        }

        // Record metrics
        const durationMs = timing.stop();
        ResearchMetrics.nodeDuration(durationMs, { node: 'validate_identification' });
        ResearchMetrics.nodeExecuted({
          node: 'validate_identification',
          status: result.isValid ? 'success' : 'error',
        });

        // Determine if we should increment reidentification attempts
        const newAttempts = result.shouldReidentify
          ? (state.reidentificationAttempts || 0) + 1
          : state.reidentificationAttempts || 0;

        logger.log(
          `Validation result: isValid=${result.isValid}, shouldReidentify=${result.shouldReidentify}, ` +
            `attempts=${newAttempts}/${state.maxReidentificationAttempts || 2}`,
        );

        return {
          validationResult: result,
          reidentificationAttempts: newAttempts,
        };
      } catch (error) {
        logger.error(
          `Validation failed for item ${state.itemId}: ${error instanceof Error ? error.message : String(error)}`,
        );

        if (activityLogger && operationId) {
          await activityLogger.failOperation({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationId,
            operationType: 'validation_checkpoint',
            title: 'Validation Failed',
            error: error instanceof Error ? error.message : String(error),
            stepId: 'validate_identification',
          });
        }

        // Record error metrics
        ResearchMetrics.nodeDuration(timing.stop(), { node: 'validate_identification' });
        ResearchMetrics.nodeExecuted({
          node: 'validate_identification',
          status: 'error',
        });

        throw error;
      }
    },
    {
      'research.run_id': state.researchRunId,
      'research.item_id': state.itemId,
    },
  );
}

/**
 * Router function for validation checkpoint.
 * Determines next step based on validation result:
 *
 * - 'complete_market_goal': Validation passed or we've exceeded reidentification attempts
 * - 'reidentify': Validation failed and we should try re-identification
 *
 * @param state Current research graph state
 * @returns Next node name: 'complete_market_goal' or 'reidentify'
 */
export function validationCheckpointRouter(state: ResearchGraphState): string {
  const result = state.validationResult;
  const attempts = state.reidentificationAttempts || 0;
  const maxAttempts = state.maxReidentificationAttempts || 2;

  // If no validation result (shouldn't happen), proceed normally
  if (!result) {
    logger.warn('No validation result found, proceeding to complete_market_goal');
    return 'complete_market_goal';
  }

  // If valid, proceed to pricing
  if (result.isValid) {
    logger.log('Validation passed, proceeding to complete_market_goal');
    return 'complete_market_goal';
  }

  // If should reidentify and we haven't exceeded attempts
  if (result.shouldReidentify && attempts < maxAttempts) {
    logger.log(
      `Validation failed, triggering re-identification (attempt ${attempts + 1}/${maxAttempts})`,
    );
    return 'reidentify';
  }

  // Exceeded attempts or shouldn't reidentify - accept with warnings
  logger.log(
    `Validation has issues but proceeding (${result.stats.errorCount} errors, ${result.stats.warningCount} warnings, ` +
      `attempts=${attempts}/${maxAttempts})`,
  );
  return 'complete_market_goal';
}
