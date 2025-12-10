import { ResearchGraphState } from '../research-graph.state';
import { ResearchPlannerService, ResearchContext } from '../../../services/research-planner.service';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { ResearchTask, ItemFieldStates } from '@listforge/core-types';

/**
 * Tools interface for plan_next_research node
 */
export interface PlanNextResearchTools {
  researchPlanner: ResearchPlannerService;
  fieldStateManager: FieldStateManagerService;
}

/**
 * Plan Next Research Node
 *
 * Phase 2: Adaptive Research Loop
 * Uses ResearchPlannerService to select the best research task
 * based on current field states, available tools, and budget.
 *
 * Considers:
 * - Which fields need the most work
 * - Which tools can provide that data
 * - Cost/benefit of each tool
 * - Available identifiers (UPC, brand, model)
 */
export async function planNextResearchNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: PlanNextResearchTools;
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
      operationType: 'plan_next_research',
      title: 'Planning Research',
      message: 'Selecting the best research approach for incomplete fields',
      stepId: 'plan_next_research',
    });
  }

  try {
    const fieldStates = state.fieldStates;
    const constraints = state.researchConstraints;
    const researchContextState = state.researchContext;

    if (!fieldStates || !constraints) {
      throw new Error('fieldStates and researchConstraints are required');
    }

    const currentCost = state.currentResearchCost || 0;
    const existingCompsCount = state.comps?.length || 0;

    // Build research context from state
    const researchContext: ResearchContext = researchContextState || {
      hasUpc: hasFieldValue(fieldStates, 'upc'),
      hasBrand: hasFieldValue(fieldStates, 'brand'),
      hasModel: hasFieldValue(fieldStates, 'model'),
      hasCategory: hasFieldValue(fieldStates, 'category'),
      hasImages: (state.item?.media?.length || 0) > 0,
      imageCount: state.item?.media?.filter(m => m.type === 'image').length || 0,
      keepaConfigured: false,
      amazonConfigured: false,
      upcDatabaseConfigured: true,
    };

    // Plan the next task
    const task = tools.researchPlanner.planNextTask(
      fieldStates,
      constraints,
      researchContext,
      currentCost,
      existingCompsCount,
    );

    if (!task) {
      // No suitable task found - research is done or stuck
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'plan_next_research',
          title: 'Planning Research',
          message: 'No suitable research task found',
          stepId: 'plan_next_research',
          data: { taskPlanned: false, reason: 'No tool can provide missing field data' },
        });
      }

      return {
        currentTask: null,
        // Let conditional routing handle the flow to validate_readiness
      };
    }

    // Log the planned task
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'plan_next_research',
        title: 'Planning Research',
        message: `Planned: ${task.tool} for ${task.targetFields.join(', ')}`,
        stepId: 'plan_next_research',
        data: {
          taskPlanned: true,
          tool: task.tool,
          targetFields: task.targetFields,
          estimatedCost: task.estimatedCost,
          reasoning: task.reasoning,
          priority: task.priority,
        },
      });
    }

    return {
      currentTask: task,
      researchTasks: [...(state.researchTasks || []), task],
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'plan_next_research',
        title: 'Planning Research',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'plan_next_research',
      });
    }
    throw error;
  }
}

/**
 * Helper to check if a field has a value
 */
function hasFieldValue(fieldStates: ItemFieldStates, fieldName: string): boolean {
  const field = fieldStates.fields[fieldName];
  return field?.value !== null && field?.value !== undefined && field?.value !== '';
}
