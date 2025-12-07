import { ChatGraphState, ItemSnapshot } from '../chat-graph.state';
import { ItemResearchData } from '@listforge/core-types';

/**
 * Tools interface for chat graph nodes
 */
export interface ChatTools {
  getItemSnapshot: (params: { itemId: string }) => Promise<ItemSnapshot>;
  getLatestResearch: (params: { itemId: string }) => Promise<ItemResearchData | null>;
}

/**
 * Load context node
 * Loads item data and existing research for chat context
 */
export async function loadContextNode(
  state: ChatGraphState,
  config?: { configurable?: { tools?: ChatTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ChatGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools) {
    throw new Error('ChatTools not provided in config.configurable.tools');
  }

  const item = await tools.getItemSnapshot({ itemId: state.itemId });
  const research = await tools.getLatestResearch({ itemId: state.itemId });

  return {
    item,
    research,
  };
}
