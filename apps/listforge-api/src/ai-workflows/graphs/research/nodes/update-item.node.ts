import { ResearchGraphState } from '../research-graph.state';
import { ItemUpdateFromResearch } from '@listforge/core-types';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';

/**
 * Tools interface for item updates
 */
export interface UpdateItemTools {
  updateItem: (params: {
    itemId: string;
    updates: ItemUpdateFromResearch;
  }) => Promise<{ success: boolean; updatedFields: string[] }>;
}

/**
 * Update Item Node
 *
 * Persists discovered product data to the Item entity.
 * Overwrites existing fields with AI-discovered data.
 * Runs after deep identification is complete.
 */
export async function updateItemNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: UpdateItemTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.updateItem) {
    throw new Error('UpdateItemTools not provided in config.configurable.tools');
  }

  // Start item update operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'item_update',
      title: 'Updating Item',
      message: 'Applying discovered product data to item',
      stepId: 'update_item',
    });
  }

  try {
    const discoveredData = state.discoveredProductData;
    const productId = state.productIdentification;

    if (!discoveredData && !productId) {
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'item_update',
          title: 'Updating Item',
          message: 'Skipped - no new data discovered',
          stepId: 'update_item',
          data: { skipped: true, fieldsUpdated: 0 },
        });
      }
      return { itemUpdated: false };
    }

    // Build the update object from discovered data
    const updates: ItemUpdateFromResearch = {};
    const updatedFieldsList: string[] = [];

    // Title - use discovered title if available
    if (discoveredData?.title) {
      updates.title = discoveredData.title;
      updatedFieldsList.push('title');
    } else if (productId?.brand && productId?.model) {
      updates.title = `${productId.brand} ${productId.model}`.trim();
      updatedFieldsList.push('title');
    }

    // Description - use discovered description
    if (discoveredData?.description) {
      updates.description = discoveredData.description;
      updatedFieldsList.push('description');
    }

    // Condition
    if (discoveredData?.condition) {
      updates.condition = discoveredData.condition;
      updatedFieldsList.push('condition');
    }

    // Category path
    if (discoveredData?.category && discoveredData.category.length > 0) {
      updates.categoryPath = discoveredData.category;
      updatedFieldsList.push('categoryPath');
    }

    // Build attributes array from various sources
    const attributes: Array<{ key: string; value: string; source: 'ai' | 'user' | 'imported'; confidence?: number }> = [];
    const overallConfidence = discoveredData?.confidence || productId?.confidence || 0;

    // Add brand
    const brand = discoveredData?.brand || productId?.brand;
    if (brand) {
      attributes.push({ key: 'Brand', value: brand, source: 'ai', confidence: overallConfidence });
    }

    // Add model
    const model = discoveredData?.model || productId?.model;
    if (model) {
      attributes.push({ key: 'Model', value: model, source: 'ai', confidence: overallConfidence });
    }

    // Add MPN
    const mpn = discoveredData?.mpn || productId?.mpn;
    if (mpn) {
      attributes.push({ key: 'MPN', value: mpn, source: 'ai', confidence: overallConfidence });
    }

    // Add UPC
    const upc = discoveredData?.upc || productId?.upc;
    if (upc) {
      attributes.push({ key: 'UPC', value: upc, source: 'ai', confidence: overallConfidence });
    }

    // Add specifications from discovered data
    if (discoveredData?.specifications) {
      for (const [key, value] of Object.entries(discoveredData.specifications)) {
        if (!attributes.some((a) => a.key.toLowerCase() === key.toLowerCase())) {
          attributes.push({
            key: formatAttributeKey(key),
            value: String(value),
            source: 'ai',
            confidence: overallConfidence,
          });
        }
      }
    }

    // Add attributes from product identification
    if (productId?.attributes) {
      for (const [key, value] of Object.entries(productId.attributes)) {
        if (!attributes.some((a) => a.key.toLowerCase() === key.toLowerCase())) {
          attributes.push({
            key: formatAttributeKey(key),
            value: String(value),
            source: 'ai',
            confidence: overallConfidence,
          });
        }
      }
    }

    if (attributes.length > 0) {
      updates.attributes = attributes;
      updatedFieldsList.push(`attributes`);
    }

    // Confidence score
    const confidence = discoveredData?.confidence || productId?.confidence || 0;
    if (confidence > 0) {
      updates.aiConfidenceScore = confidence;
      updatedFieldsList.push('aiConfidenceScore');
    }

    // Emit progress
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'item_update',
        message: `Updating ${updatedFieldsList.length} fields...`,
        stepId: 'update_item',
        data: { fieldsToUpdate: updatedFieldsList },
      });
    }

    // Execute the update
    const result = await tools.updateItem({
      itemId: state.itemId,
      updates,
    });

    // Complete the operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'item_update',
        title: 'Updating Item',
        message: result.success
          ? `Updated ${result.updatedFields.length} fields`
          : 'No changes made',
        stepId: 'update_item',
        data: {
          success: result.success,
          updatedFields: result.updatedFields,
          title: updates.title,
          brand,
          model,
          attributeCount: attributes.length,
          confidence,
        },
      });
    }

    return { itemUpdated: result.success };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'item_update',
        title: 'Updating Item',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'update_item',
      });
    }
    throw error;
  }
}

/**
 * Format attribute key for display (capitalize words, handle camelCase)
 */
function formatAttributeKey(key: string): string {
  // Handle camelCase by adding spaces
  const spaced = key.replace(/([A-Z])/g, ' $1').trim();

  // Capitalize first letter of each word
  return spaced
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
