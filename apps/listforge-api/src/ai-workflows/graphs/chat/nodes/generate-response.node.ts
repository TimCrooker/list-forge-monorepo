import { ChatGraphState } from '../chat-graph.state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * Tools interface for response generation
 */
export interface ResponseGenerationTools {
  llm: BaseChatModel;
  onToken?: (token: string) => void;
}

const CHAT_SYSTEM_PROMPT = `You are a helpful AI assistant for ListForge, an AI-powered multi-marketplace listing tool.

Your role is to help users understand their items better by answering questions about:
- Pricing recommendations (based on research data)
- Item condition and attributes
- Market insights and demand signals
- Listing optimization suggestions

You have access to:
1. Item details (title, description, condition, attributes, photos)
2. Research data (price bands, demand signals, missing information hints)

Guidelines:
- Be concise and helpful
- Reference specific data when available (e.g., "Based on recent research, the target price is $X")
- If research data is missing, acknowledge it and provide general guidance
- Use a friendly, professional tone
- Format prices as USD (e.g., $150.00)
- If asked about pricing, reference the price bands (floor, target, ceiling) if available
- If the user wants to update a field, acknowledge it but note that they can use action buttons to apply changes

Respond naturally to the user's question.`;

/**
 * Generate response node
 * Uses LLM to generate a contextual response based on item and research data
 */
export async function generateResponseNode(
  state: ChatGraphState,
  config?: { configurable?: { tools?: ResponseGenerationTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ChatGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools || !tools.llm) {
    throw new Error('LLM not provided in config.configurable.tools.llm');
  }

  const { llm } = tools;

  // If response and actions already exist (from handle_action node), preserve them
  if (state.response && state.proposedActions && state.proposedActions.length > 0) {
    return {
      response: state.response,
      proposedActions: state.proposedActions,
    };
  }

  // Build context from item and research
  const contextParts: string[] = [];

  if (state.item) {
    contextParts.push('## Item Information');
    if (state.item.title) contextParts.push(`Title: ${state.item.title}`);
    if (state.item.description) contextParts.push(`Description: ${state.item.description}`);
    if (state.item.condition) contextParts.push(`Condition: ${state.item.condition}`);
    if (state.item.defaultPrice) contextParts.push(`Current Price: $${state.item.defaultPrice.toFixed(2)}`);
    if (state.item.attributes && state.item.attributes.length > 0) {
      const attrs = state.item.attributes.map((a) => `${a.key}: ${a.value}`).join(', ');
      contextParts.push(`Attributes: ${attrs}`);
    }
  }

  if (state.research) {
    contextParts.push('\n## Research Data');
    if (state.research.priceBands && state.research.priceBands.length > 0) {
      contextParts.push('### Price Recommendations:');
      state.research.priceBands.forEach((band) => {
        contextParts.push(
          `- ${band.label.charAt(0).toUpperCase() + band.label.slice(1)}: $${band.amount.toFixed(2)} (${(band.confidence * 100).toFixed(0)}% confidence) - ${band.reasoning}`,
        );
      });
    }
    if (state.research.demandSignals && state.research.demandSignals.length > 0) {
      contextParts.push('### Market Signals:');
      state.research.demandSignals.forEach((signal) => {
        contextParts.push(`- ${signal.metric}: ${signal.value} ${signal.unit}`);
      });
    }
    if (state.research.missingInfo && state.research.missingInfo.length > 0) {
      contextParts.push('### Missing Information:');
      state.research.missingInfo.forEach((info) => {
        contextParts.push(`- ${info.field} (${info.importance}): ${info.reason}`);
      });
    }
  }

  const context = contextParts.join('\n');

  // Generate response
  const messages = [
    new SystemMessage(CHAT_SYSTEM_PROMPT),
    new HumanMessage(
      context
        ? `Context:\n${context}\n\nUser Question: ${state.userMessage}`
        : `User Question: ${state.userMessage}`,
    ),
  ];

  // If streaming is enabled, use stream method
  if (tools.onToken) {
    let fullResponse = '';
    const stream = await llm.stream(messages);

    for await (const chunk of stream) {
      const token = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
      fullResponse += token;
      tools.onToken(token);
    }

    return {
      response: fullResponse,
    };
  }

  // Otherwise, use regular invoke
  const response = await llm.invoke(messages);
  const responseText = typeof response.content === 'string' ? response.content : String(response.content);

  return {
    response: responseText,
    // Preserve proposedActions if they exist (from handle_action node)
    ...(state.proposedActions ? { proposedActions: state.proposedActions } : {}),
  };
}
