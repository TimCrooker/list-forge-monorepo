import { ResearchGraphState, ItemSnapshot } from '../research-graph.state';
import { ItemResearchData } from '@listforge/core-types';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';

/**
 * Tools interface for research graph nodes
 */
export interface ResearchTools {
  getItemSnapshot: (params: { itemId: string }) => Promise<ItemSnapshot>;
  getLatestResearch: (params: { itemId: string }) => Promise<ItemResearchData | null>;
}

/**
 * Load context node
 * Loads item data and existing research
 */
export async function loadContextNode(
  state: ResearchGraphState,
  config?: { configurable?: { tools?: ResearchTools; activityLogger?: ResearchActivityLoggerService; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools) {
    throw new Error('ResearchTools not provided in config.configurable.tools');
  }

  // Start load context operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'load_context',
      title: 'Loading Context',
      message: 'Loading item data and existing research',
      stepId: 'load_context',
    });
  }

  try {
    // Load item snapshot
    const item = await tools.getItemSnapshot({ itemId: state.itemId });

    // Emit progress with item info
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'load_context',
        message: `Loaded: ${item.title || 'Untitled'}`,
        stepId: 'load_context',
        data: {
          title: item.title,
          mediaCount: item.media?.length || 0,
          hasDescription: !!item.description,
          condition: item.condition,
        },
      });
    }

    // Load existing research if any
    const existingResearch = await tools.getLatestResearch({ itemId: state.itemId });

    // Complete the operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'load_context',
        title: 'Loading Context',
        message: existingResearch
          ? `Loaded item with ${item.media?.length || 0} photos and existing research`
          : `Loaded item with ${item.media?.length || 0} photos`,
        stepId: 'load_context',
        data: {
          title: item.title,
          mediaCount: item.media?.length || 0,
          hasExistingResearch: !!existingResearch,
          priceBandsCount: existingResearch?.priceBands?.length || 0,
        },
      });
    }

    return {
      item,
      existingResearch,
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'load_context',
        title: 'Loading Context',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'load_context',
      });
    }
    throw error;
  }
}
