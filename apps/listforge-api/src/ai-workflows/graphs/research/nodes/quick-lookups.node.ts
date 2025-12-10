import { ResearchGraphState } from '../research-graph.state';
import { FieldResearchService, ResearchExecutionContext } from '../../../services/field-research.service';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { ResearchTask, ItemFieldStates } from '@listforge/core-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tools interface for quick_lookups node
 */
export interface QuickLookupsTools {
  fieldResearchService: FieldResearchService;
  fieldStateManager: FieldStateManagerService;
}

/**
 * Quick Lookups Node
 *
 * Phase 1: Fast Data Lookups
 * Runs UPC database lookup and Keepa/Amazon lookups if identifiers are available.
 * These are high-confidence, fast data sources.
 *
 * Executes:
 * - UPC database lookup (if UPC available)
 * - Keepa lookup for Amazon data (if UPC or brand+model available)
 */
export async function quickLookupsNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: QuickLookupsTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.fieldResearchService || !tools?.fieldStateManager) {
    throw new Error(
      'FieldResearchService and FieldStateManagerService are required',
    );
  }

  // Start operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'quick_lookups',
      title: 'Quick Data Lookups',
      message: 'Looking up product data from UPC and Amazon databases',
      stepId: 'quick_lookups',
    });
  }

  try {
    const item = state.item;
    const fieldStates = state.fieldStates;
    const researchContext = state.researchContext;

    if (!item || !fieldStates) {
      throw new Error('Item and fieldStates are required');
    }

    // Get current field values
    const currentValues = getCurrentFieldValues(fieldStates);
    const upc = currentValues.upc as string | undefined;
    const brand = currentValues.brand as string | undefined;
    const model = currentValues.model as string | undefined;
    const mpn = currentValues.mpn as string | undefined;

    // Build execution context
    const context: ResearchExecutionContext = {
      itemId: state.itemId,
      organizationId: state.organizationId,
      images: item.media || [],
      upc,
      brand,
      model,
      mpn,
      currentFields: currentValues,
    };

    const tasks: ResearchTask[] = [];
    let updatedFieldStates = fieldStates;
    let totalCost = 0;
    const updatedFields: string[] = [];
    const lookupResults: string[] = [];

    // UPC lookup task (if UPC available and service configured)
    if (upc && researchContext?.upcDatabaseConfigured) {
      const upcTask: ResearchTask = {
        id: uuidv4(),
        targetFields: ['brand', 'title', 'description', 'category'],
        tool: 'upc_lookup',
        priority: 95,
        estimatedCost: 0.001,
        estimatedTimeMs: 500,
        reasoning: `UPC lookup for ${upc}`,
      };
      tasks.push(upcTask);
    }

    // Keepa lookup task (if UPC or brand+model available and service configured)
    if (researchContext?.keepaConfigured && (upc || (brand && model))) {
      const keepaTask: ResearchTask = {
        id: uuidv4(),
        targetFields: ['brand', 'title', 'category', 'price_reference', 'demand_indicator'],
        tool: 'keepa_lookup',
        priority: 90,
        estimatedCost: 0.01,
        estimatedTimeMs: 1000,
        reasoning: upc
          ? `Keepa lookup via UPC ${upc}`
          : `Keepa lookup via ${brand} ${model}`,
      };
      tasks.push(keepaTask);
    }

    if (tasks.length === 0) {
      // No lookups possible
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'quick_lookups',
          title: 'Quick Data Lookups',
          message: 'No identifiers available for database lookups',
          stepId: 'quick_lookups',
          data: { lookupsPerformed: 0, fieldsUpdated: 0 },
        });
      }

      return { fieldStates };
    }

    // Log progress
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'quick_lookups',
        message: `Running ${tasks.length} database lookups`,
        stepId: 'quick_lookups',
        data: { lookups: tasks.map(t => t.tool) },
      });
    }

    // Execute tasks in parallel
    const results = await Promise.all(
      tasks.map(task => tools.fieldResearchService.executeTask(task, context)),
    );

    // Process results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const task = tasks[i];

      if (result.success && result.fieldUpdates) {
        lookupResults.push(`${task.tool}: success`);

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
              if (!updatedFields.includes(update.fieldName)) {
                updatedFields.push(update.fieldName);
              }
            }
          }
        }
      } else {
        lookupResults.push(`${task.tool}: ${result.error || 'no data'}`);
      }

      totalCost += result.cost;
    }

    // Complete operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'quick_lookups',
        title: 'Quick Data Lookups',
        message: `Completed ${tasks.length} lookups, updated ${updatedFields.length} fields`,
        stepId: 'quick_lookups',
        data: {
          lookupsPerformed: tasks.length,
          fieldsUpdated: updatedFields.length,
          updatedFields,
          lookupResults,
          cost: totalCost,
        },
      });
    }

    // Update research cost
    const newTotalCost = (state.currentResearchCost || 0) + totalCost;

    return {
      fieldStates: updatedFieldStates,
      currentResearchCost: newTotalCost,
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'quick_lookups',
        title: 'Quick Data Lookups',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'quick_lookups',
      });
    }
    throw error;
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
