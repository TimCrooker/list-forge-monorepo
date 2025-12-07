import { ChatGraphState } from '../chat-graph.state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * Tools interface for intent routing
 */
export interface IntentRoutingTools {
  llm: BaseChatModel;
}

const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for a chat assistant.

Classify the user's message into one of these categories:
- "question": User is asking for information or clarification (e.g., "What price should I list this for?", "What condition is this item?")
- "action": User wants to update or change something (e.g., "Set the price to $150", "Change the title to iPhone 13 Pro", "Mark this as used condition")
- "research": User wants to run research, check research status, or asks why AI recommends something (e.g., "Run new research", "Why is the price $X?", "Refresh the pricing data", "Check research status")
- "unknown": Cannot determine intent

Respond with ONLY the category name: question, action, research, or unknown`;

/**
 * Route intent node
 * Classifies user message to determine if it's a question, action, or research request
 * Phase 7 Slice 6 + Slice 7
 */
export async function routeIntentNode(
  state: ChatGraphState,
  config?: { configurable?: { tools?: IntentRoutingTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ChatGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools || !tools.llm) {
    throw new Error('LLM not provided in config.configurable.tools.llm');
  }

  const { llm } = tools;

  // Classify intent
  const response = await llm.invoke([
    new SystemMessage(INTENT_CLASSIFICATION_PROMPT),
    new HumanMessage(state.userMessage),
  ]);

  const responseText = typeof response.content === 'string' ? response.content : String(response.content);
  const intent = responseText.trim().toLowerCase();

  // Validate intent
  if (intent === 'question' || intent === 'action' || intent === 'research') {
    return { intent: intent as 'question' | 'action' | 'research' };
  }

  return { intent: 'unknown' };
}
