import { ResearchGraphState } from '../research-graph.state';
import { ItemResearchData, ResearchEvidenceRecord } from '@listforge/core-types';

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
  config?: { configurable?: { tools?: PersistResultsTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools) {
    throw new Error('PersistResultsTools not provided in config.configurable.tools');
  }

  // Build research data
  const researchData: ItemResearchData = {
    productId: state.productIdentification || undefined,
    priceBands: state.priceBands,
    demandSignals: state.demandSignals,
    missingInfo: state.missingInfo,
    competitorCount: state.comps.filter((c) => c.type === 'active_listing').length,
    recommendedMarketplaces: determineMarketplaces(state),
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  // Save structured research
  await tools.saveItemResearch({
    itemId: state.itemId,
    researchRunId: state.researchRunId,
    data: researchData,
  });

  // Save evidence bundle
  await tools.saveEvidenceBundle({
    itemId: state.itemId,
    researchRunId: state.researchRunId,
    evidence: state.comps,
  });

  return { done: true };
}
