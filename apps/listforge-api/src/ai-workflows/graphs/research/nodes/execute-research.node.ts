import { ResearchGraphState } from '../research-graph.state';
import { FieldResearchService, ResearchExecutionContext } from '../../../services/field-research.service';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { ItemFieldStates } from '@listforge/core-types';

/**
 * Tools interface for execute_research node
 */
export interface ExecuteResearchTools {
  fieldResearchService: FieldResearchService;
  fieldStateManager: FieldStateManagerService;
}

/**
 * Execute Research Node
 *
 * Phase 2: Adaptive Research Loop
 * Executes the planned research task using FieldResearchService.
 * Updates field states with the results.
 *
 * This node:
 * 1. Takes the current task from state
 * 2. Executes it via FieldResearchService
 * 3. Updates field states with results
 * 4. Tracks research cost
 */
export async function executeResearchNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: ExecuteResearchTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.fieldResearchService || !tools?.fieldStateManager) {
    throw new Error('FieldResearchService and FieldStateManagerService are required');
  }

  const currentTask = state.currentTask;
  if (!currentTask) {
    // No task to execute
    return {};
  }

  // Start operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'execute_research',
      title: `Executing: ${currentTask.tool}`,
      message: `Researching: ${currentTask.targetFields.join(', ')}`,
      stepId: 'execute_research',
    });
  }

  try {
    const item = state.item;
    const fieldStates = state.fieldStates;

    if (!item || !fieldStates) {
      throw new Error('Item and fieldStates are required');
    }

    // Build execution context
    const currentValues = getCurrentFieldValues(fieldStates);
    const context: ResearchExecutionContext = {
      itemId: state.itemId,
      organizationId: state.organizationId,
      images: item.media || [],
      upc: currentValues.upc as string | undefined,
      brand: currentValues.brand as string | undefined,
      model: currentValues.model as string | undefined,
      mpn: currentValues.mpn as string | undefined,
      category: currentValues.category as string | undefined,
      extractedText: currentValues.extracted_text as string | undefined,
      currentFields: currentValues,
    };

    // Log progress
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'execute_research',
        message: `Running ${currentTask.tool}...`,
        stepId: 'execute_research',
        data: {
          tool: currentTask.tool,
          targetFields: currentTask.targetFields,
        },
      });
    }

    // Execute the task
    const result = await tools.fieldResearchService.executeTask(currentTask, context);

    // Update field states with results
    let updatedFieldStates = fieldStates;
    const updatedFields: string[] = [];
    const failedFields: string[] = [];

    if (result.success && result.fieldUpdates) {
      for (const update of result.fieldUpdates) {
        if (update.value !== null && update.value !== undefined) {
          // Only update if new value has higher confidence
          const existingField = updatedFieldStates.fields[update.fieldName];
          if (!existingField || update.source.confidence > existingField.confidence.value) {
            updatedFieldStates = tools.fieldStateManager.updateField(
              updatedFieldStates,
              update.fieldName,
              update.value,
              update.source,
            );
            updatedFields.push(update.fieldName);
          }
        }
      }
    } else {
      // Task failed - mark target fields as attempted
      for (const fieldName of currentTask.targetFields) {
        const field = updatedFieldStates.fields[fieldName];
        if (field) {
          failedFields.push(fieldName);
          // Increment attempt count (done in updateField when called with same value)
        }
      }
    }

    // Update total cost
    const newTotalCost = (state.currentResearchCost || 0) + result.cost;

    // Complete operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'execute_research',
        title: `Executed: ${currentTask.tool}`,
        message: result.success
          ? `Updated ${updatedFields.length} field(s): ${updatedFields.join(', ') || 'none'}`
          : `Failed: ${result.error}`,
        stepId: 'execute_research',
        data: {
          success: result.success,
          tool: currentTask.tool,
          updatedFields,
          failedFields,
          cost: result.cost,
          timeMs: result.timeMs,
          totalCost: newTotalCost,
          error: result.error,
        },
      });
    }

    return {
      fieldStates: updatedFieldStates,
      currentResearchCost: newTotalCost,
      currentTask: null, // Clear current task
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'execute_research',
        title: `Executed: ${currentTask.tool}`,
        error: error instanceof Error ? error.message : String(error),
        stepId: 'execute_research',
      });
    }

    // Don't throw - mark task as failed and continue
    const newTotalCost = (state.currentResearchCost || 0) + currentTask.estimatedCost * 0.5;

    return {
      currentResearchCost: newTotalCost,
      currentTask: null,
    };
  }
}

/**
 * Helper to get current field values as a simple object
 */
function getCurrentFieldValues(fieldStates: ItemFieldStates): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [name, field] of Object.entries(fieldStates.fields)) {
    if (field.value !== null && field.value !== undefined) {
      values[name] = field.value;
    }
  }
  return values;
}
