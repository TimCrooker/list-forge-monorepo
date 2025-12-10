import { ResearchGraphState } from '../research-graph.state';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { MarketplaceSchemaService } from '../../../services/marketplace-schema.service';
import { detectCategory, DetectCategoryInput } from '../tools/detect-category.tool';
import { logNodeWarn, logNodeError } from '../../../utils/node-logger';

/**
 * Detect Marketplace Schema Node - Slice 4
 *
 * Detects the eBay category for the item and fetches required/recommended fields.
 * Runs after update_item node to use the latest product identification data.
 *
 * Operations:
 * 1. Build product info from item, product identification, and media analysis
 * 2. Detect eBay category using MarketplaceSchemaService
 * 3. Fetch required and recommended fields for the category
 * 4. Calculate field completion based on item attributes
 * 5. Update state with marketplace category and field info
 */
export async function detectMarketplaceSchemaNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      activityLogger?: ResearchActivityLoggerService;
      marketplaceSchemaService?: MarketplaceSchemaService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const activityLogger = config?.configurable?.activityLogger;
  const schemaService = config?.configurable?.marketplaceSchemaService;

  if (!schemaService) {
    logNodeWarn('detect-marketplace-schema', 'MarketplaceSchemaService not provided, skipping category detection');
    return {};
  }

  // Start category detection operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'category_detection',
      title: 'Detecting Marketplace Category',
      message: 'Analyzing product to determine eBay category',
      stepId: 'detect_category',
      data: {
        hasProductId: !!state.productIdentification,
        hasMediaAnalysis: !!state.mediaAnalysis,
        brand: state.productIdentification?.brand || state.mediaAnalysis?.brand,
        model: state.productIdentification?.model || state.mediaAnalysis?.model,
      },
    });
  }

  try {
    // Build input for category detection
    const input: DetectCategoryInput = {
      item: state.item,
      productId: state.productIdentification,
      mediaAnalysis: state.mediaAnalysis,
    };

    // Detect category
    const result = await detectCategory(input, schemaService);

    if (!result.marketplaceCategory) {
      // No category detected - emit warning but don't fail
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'category_detection',
          title: 'Detecting Marketplace Category',
          message: 'Could not detect category - insufficient product information',
          stepId: 'detect_category',
          data: {
            detected: false,
            reason: 'Insufficient product information for category detection',
          },
        });
      }

      return {};
    }

    // Build summary for logging
    const requiredFieldsSummary = result.requiredFields.slice(0, 5).map(f => f.name);
    const missingFieldsSummary = result.fieldCompletion?.required.missing.slice(0, 5) || [];

    // Complete the operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'category_detection',
        title: 'Detecting Marketplace Category',
        message: `Detected: ${result.marketplaceCategory.categoryPath.join(' > ')}`,
        stepId: 'detect_category',
        data: {
          detected: true,
          categoryId: result.marketplaceCategory.categoryId,
          categoryPath: result.marketplaceCategory.categoryPath,
          categoryName: result.marketplaceCategory.categoryName,
          confidence: result.marketplaceCategory.confidence,
          conditionId: result.marketplaceCategory.conditionId,
          requiredFieldCount: result.requiredFields.length,
          recommendedFieldCount: result.recommendedFields.length,
          requiredFieldsSample: requiredFieldsSummary,
          fieldCompletion: result.fieldCompletion ? {
            requiredFilled: result.fieldCompletion.required.filled,
            requiredTotal: result.fieldCompletion.required.total,
            recommendedFilled: result.fieldCompletion.recommended.filled,
            recommendedTotal: result.fieldCompletion.recommended.total,
            readinessScore: Math.round(result.fieldCompletion.readinessScore * 100),
            missingRequired: missingFieldsSummary,
          } : null,
        },
      });
    }

    return {
      marketplaceCategory: result.marketplaceCategory,
      requiredFields: result.requiredFields,
      recommendedFields: result.recommendedFields,
      fieldCompletion: result.fieldCompletion,
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'category_detection',
        title: 'Detecting Marketplace Category',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'detect_category',
      });
    }

    // Don't throw - category detection is not critical, research can continue
    logNodeError('detect-marketplace-schema', 'Category detection failed', error);
    return {};
  }
}
