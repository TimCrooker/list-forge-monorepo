import { ChatGraphState } from '../chat-graph.state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ChatActionDto } from '@listforge/api-types';

/**
 * Tools interface for action handling
 */
export interface ActionHandlingTools {
  llm: BaseChatModel;
}

const ACTION_EXTRACTION_PROMPT = `You are an action extractor for a chat assistant.

When a user wants to update an item field, extract:
1. The field name (e.g., "title", "defaultPrice", "condition", "description")
2. The new value
3. A user-friendly label for the action

Available fields:
- title: Item title
- description: Item description
- condition: Item condition (e.g., "new", "used", "refurbished")
- defaultPrice: Price in USD (number)
- quantity: Quantity (integer)
- tags: Array of tags

Respond in JSON format:
{
  "field": "field_name",
  "value": "new_value",
  "label": "User-friendly description"
}

If you cannot extract a clear action, respond with: {"error": "Cannot extract action"}`;

/**
 * Handle action node
 * Extracts field and value from user message and generates action suggestion
 * Phase 7 Slice 6
 */
export async function handleActionNode(
  state: ChatGraphState,
  config?: { configurable?: { tools?: ActionHandlingTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ChatGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools || !tools.llm) {
    throw new Error('LLM not provided in config.configurable.tools.llm');
  }

  const { llm } = tools;

  // Build context with current item state
  const contextParts: string[] = [];
  if (state.item) {
    contextParts.push('Current item state:');
    if (state.item.title) contextParts.push(`Title: ${state.item.title}`);
    if (state.item.description) contextParts.push(`Description: ${state.item.description}`);
    if (state.item.condition) contextParts.push(`Condition: ${state.item.condition}`);
    if (state.item.defaultPrice) contextParts.push(`Price: $${state.item.defaultPrice.toFixed(2)}`);
  }

  // Extract action from user message
  const response = await llm.invoke([
    new SystemMessage(ACTION_EXTRACTION_PROMPT),
    new HumanMessage(
      contextParts.length > 0
        ? `${contextParts.join('\n')}\n\nUser request: ${state.userMessage}`
        : `User request: ${state.userMessage}`,
    ),
  ]);

  const responseText = typeof response.content === 'string' ? response.content : String(response.content);

  try {
    const parsed = JSON.parse(responseText.trim());

    if (parsed.error) {
      // Could not extract action - treat as question
      return {
        intent: 'question',
        proposedActions: [],
        response: `I understand you want to make a change, but I'm not sure exactly what you'd like to update. Could you be more specific? For example, "Set the price to $150" or "Change the title to iPhone 13 Pro".`,
      };
    }

    // Create action DTO
    const action: ChatActionDto = {
      type: 'update_field',
      field: parsed.field,
      value: parsed.value,
      label: parsed.label || `Update ${parsed.field} to ${parsed.value}`,
      applied: false,
    };

    // Generate response with action suggestion
    const responseMessage = `I can ${action.label}. Would you like me to apply this change?`;

    return {
      proposedActions: [action],
      response: responseMessage,
    };
  } catch (error) {
    // JSON parse failed - treat as question
    return {
      intent: 'question',
      proposedActions: [],
      response: `I understand you want to make a change, but I'm having trouble understanding exactly what you'd like to update. Could you rephrase your request?`,
    };
  }
}
