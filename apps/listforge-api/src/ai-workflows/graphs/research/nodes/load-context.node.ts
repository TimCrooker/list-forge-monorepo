import { ResearchGraphState, ItemSnapshot } from '../research-graph.state';
import { ItemResearchData } from '@listforge/core-types';

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
  config?: { configurable?: { tools?: ResearchTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools) {
    throw new Error('ResearchTools not provided in config.configurable.tools');
  }

  const item = await tools.getItemSnapshot({ itemId: state.itemId });
  const existingResearch = await tools.getLatestResearch({ itemId: state.itemId });

  return {
    item,
    existingResearch,
  };
}
