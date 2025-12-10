import { ResearchGraphState } from '../research-graph.state';
import { FieldResearchService, ResearchExecutionContext } from '../../../services/field-research.service';
import { FieldStateManagerService } from '../../../services/field-state-manager.service';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { ResearchTask, ItemFieldStates, FieldDataSource } from '@listforge/core-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tools interface for extract_from_images node
 */
export interface ExtractFromImagesTools {
  fieldResearchService: FieldResearchService;
  fieldStateManager: FieldStateManagerService;
}

/**
 * Extract From Images Node
 *
 * Phase 1: Fast Extraction
 * Runs OCR and vision analysis on item images to extract initial field values.
 * This is the first research step - quick, parallel image processing.
 *
 * Extracts:
 * - UPC/EAN barcodes via OCR
 * - Model numbers and serial numbers
 * - Brand identification
 * - Color, material, condition via vision
 */
export async function extractFromImagesNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: ExtractFromImagesTools;
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
      operationType: 'extract_from_images',
      title: 'Analyzing Images',
      message: 'Extracting text and attributes from product images',
      stepId: 'extract_from_images',
    });
  }

  try {
    const item = state.item;
    const fieldStates = state.fieldStates;

    if (!item || !fieldStates) {
      throw new Error('Item and fieldStates are required');
    }

    // Check if we have images
    const images = item.media?.filter(m => m.type === 'image') || [];
    if (images.length === 0) {
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'extract_from_images',
          title: 'Analyzing Images',
          message: 'No images to analyze',
          stepId: 'extract_from_images',
          data: { imageCount: 0, fieldsUpdated: 0 },
        });
      }

      return { fieldStates };
    }

    // Build execution context
    const context: ResearchExecutionContext = {
      itemId: state.itemId,
      organizationId: state.organizationId,
      images,
      currentFields: getCurrentFieldValues(fieldStates),
    };

    // Determine which fields could benefit from image extraction
    const imageExtractableFields = [
      'upc',
      'brand',
      'model',
      'mpn',
      'color',
      'material',
      'size',
      'condition',
      'year_manufactured',
    ];

    const fieldsNeedingResearch = imageExtractableFields.filter(fieldName => {
      const field = fieldStates.fields[fieldName];
      // Research if field doesn't exist or has low confidence
      return !field || field.confidence.value < 0.7 || field.status !== 'complete';
    });

    if (fieldsNeedingResearch.length === 0) {
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'extract_from_images',
          title: 'Analyzing Images',
          message: 'All image-extractable fields already complete',
          stepId: 'extract_from_images',
          data: { imageCount: images.length, fieldsUpdated: 0 },
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
        operationType: 'extract_from_images',
        message: `Analyzing ${images.length} images for ${fieldsNeedingResearch.length} fields`,
        stepId: 'extract_from_images',
        data: { imageCount: images.length, targetFields: fieldsNeedingResearch },
      });
    }

    // Execute parallel OCR and vision analysis tasks
    const ocrTask: ResearchTask = {
      id: uuidv4(),
      targetFields: ['upc', 'brand', 'model', 'mpn', 'size', 'year_manufactured'].filter(
        f => fieldsNeedingResearch.includes(f),
      ),
      tool: 'ocr_extraction',
      priority: 100,
      estimatedCost: 0.005,
      estimatedTimeMs: 1500,
      reasoning: 'OCR extraction for text-based identifiers',
    };

    const visionTask: ResearchTask = {
      id: uuidv4(),
      targetFields: ['brand', 'model', 'color', 'material', 'condition'].filter(
        f => fieldsNeedingResearch.includes(f),
      ),
      tool: 'vision_analysis',
      priority: 90,
      estimatedCost: 0.01,
      estimatedTimeMs: 2000,
      reasoning: 'Vision analysis for visual attributes',
    };

    // Execute tasks in parallel
    const [ocrResult, visionResult] = await Promise.all([
      ocrTask.targetFields.length > 0
        ? tools.fieldResearchService.executeTask(ocrTask, context)
        : null,
      visionTask.targetFields.length > 0
        ? tools.fieldResearchService.executeTask(visionTask, context)
        : null,
    ]);

    // Update field states with results
    let updatedFieldStates = fieldStates;
    let totalCost = 0;
    const updatedFields: string[] = [];

    // Process OCR results
    if (ocrResult?.success && ocrResult.fieldUpdates) {
      for (const update of ocrResult.fieldUpdates) {
        if (update.value !== null && update.value !== undefined) {
          updatedFieldStates = tools.fieldStateManager.updateField(
            updatedFieldStates,
            update.fieldName,
            update.value,
            update.source,
          );
          updatedFields.push(update.fieldName);
        }
      }
      totalCost += ocrResult.cost;
    }

    // Process vision results
    if (visionResult?.success && visionResult.fieldUpdates) {
      for (const update of visionResult.fieldUpdates) {
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
      totalCost += visionResult.cost;
    }

    // Complete operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'extract_from_images',
        title: 'Analyzing Images',
        message: `Extracted ${updatedFields.length} field(s) from images`,
        stepId: 'extract_from_images',
        data: {
          imageCount: images.length,
          fieldsUpdated: updatedFields.length,
          updatedFields,
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
        operationType: 'extract_from_images',
        title: 'Analyzing Images',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'extract_from_images',
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
