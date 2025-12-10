import { ResearchGraphState } from '../research-graph.state';
import { ItemResearchData, ResearchEvidenceRecord } from '@listforge/core-types';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';

/**
 * Tools interface for persisting results
 */
export interface PersistResultsTools {
  saveItemResearch: (params: {
    itemId: string;
    researchRunId: string;
    data: ItemResearchData;
  }) => Promise<{ researchId: string }>;
  saveEvidenceBundle: (params: {
    itemId: string;
    researchRunId: string;
    evidence: ResearchEvidenceRecord[];
  }) => Promise<{ bundleId: string; evidenceCount: number }>;
}

/**
 * Determine recommended marketplaces based on research
 */
function determineMarketplaces(state: ResearchGraphState): string[] {
  const marketplaces: string[] = ['ebay']; // Default

  // Could add logic based on product category, comp sources, etc.
  // For now, just return eBay as default

  return marketplaces;
}

/**
 * Persist results node
 * Saves research data and evidence bundle
 */
export async function persistResultsNode(
  state: ResearchGraphState,
  config?: { configurable?: { tools?: PersistResultsTools; activityLogger?: ResearchActivityLoggerService; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools) {
    throw new Error('PersistResultsTools not provided in config.configurable.tools');
  }

  // Start persist results operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'persist_results',
      title: 'Saving Results',
      message: 'Persisting research data and evidence to database',
      stepId: 'persist_results',
      data: {
        priceBandsCount: state.priceBands?.length || 0,
        compsCount: state.comps?.length || 0,
        listingsCount: state.listings?.length || 0,
      },
    });
  }

  try {
    // Build research data
    // Slice 4: Include marketplace category and field completion
    // Slice 5: Include pricing strategies
    // Slice 6: Include assembled listings
    const researchData: ItemResearchData = {
      productId: state.productIdentification || undefined,
      priceBands: state.priceBands,
      pricingStrategies: state.pricingStrategies?.length > 0 ? state.pricingStrategies : undefined, // Slice 5
      demandSignals: state.demandSignals,
      missingInfo: state.missingInfo,
      competitorCount: state.comps.filter((c) => c.type === 'active_listing').length,
      recommendedMarketplaces: determineMarketplaces(state),
      // Slice 4: Marketplace schema awareness
      marketplaceCategory: state.marketplaceCategory || undefined,
      fieldCompletion: state.fieldCompletion || undefined,
      // Slice 6: Assembled marketplace listings
      listings: state.listings?.length > 0 ? state.listings : undefined,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    // Emit progress
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'persist_results',
        message: 'Saving research data...',
        stepId: 'persist_results',
      });
    }

    // Save structured research
    const researchResult = await tools.saveItemResearch({
      itemId: state.itemId,
      researchRunId: state.researchRunId,
      data: researchData,
    });

    // Emit progress for evidence
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'persist_results',
        message: `Saving ${state.comps.length} evidence records...`,
        stepId: 'persist_results',
      });
    }

    // Save evidence bundle
    const evidenceResult = await tools.saveEvidenceBundle({
      itemId: state.itemId,
      researchRunId: state.researchRunId,
      evidence: state.comps,
    });

    // Complete the operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'persist_results',
        title: 'Saving Results',
        message: `Saved research data and ${evidenceResult.evidenceCount} evidence records`,
        stepId: 'persist_results',
        data: {
          researchId: researchResult.researchId,
          bundleId: evidenceResult.bundleId,
          evidenceCount: evidenceResult.evidenceCount,
          priceBandsCount: state.priceBands?.length || 0,
          pricingStrategiesCount: state.pricingStrategies?.length || 0, // Slice 5
          demandSignalsCount: state.demandSignals?.length || 0,
          // Slice 4: Include marketplace category info
          marketplaceCategory: state.marketplaceCategory ? {
            categoryId: state.marketplaceCategory.categoryId,
            categoryPath: state.marketplaceCategory.categoryPath,
            confidence: state.marketplaceCategory.confidence,
          } : null,
          fieldCompletion: state.fieldCompletion ? {
            readinessScore: Math.round((state.fieldCompletion.readinessScore || 0) * 100),
            requiredFilled: state.fieldCompletion.required.filled,
            requiredTotal: state.fieldCompletion.required.total,
          } : null,
          // Slice 6: Include listing info
          listingsCount: state.listings?.length || 0,
          listingStatus: state.listings?.[0]?.status || null,
        },
      });
    }

    return { done: true };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'persist_results',
        title: 'Saving Results',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'persist_results',
      });
    }
    throw error;
  }
}
