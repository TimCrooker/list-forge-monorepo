import { ResearchGraphState } from '../research-graph.state';
import { MissingInfoHint } from '@listforge/core-types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * Tools interface for missing info assessment
 */
export interface MissingInfoTools {
  llm: BaseChatModel;
}

const MISSING_INFO_PROMPT = `You are a research quality analyst. Identify missing information that would improve research accuracy and pricing confidence.

Consider:
- Product identifiers (UPC, MPN, model number)
- Key attributes (size, capacity, color, etc.)
- Condition details
- Completeness information

For each missing piece, classify importance:
- **required**: Critical for accurate pricing (e.g., model number for electronics)
- **recommended**: Would significantly improve confidence (e.g., capacity for electronics)
- **optional**: Nice to have but not critical (e.g., color for most items)

Respond in JSON:
{
  "missingInfo": [
    {
      "field": string (e.g., "model_number", "capacity", "color"),
      "importance": "required" | "recommended" | "optional",
      "reason": string,
      "suggestedPrompt": string (optional question to ask user)
    }
  ]
}`;

/**
 * Assess missing info node
 * Identifies gaps in information that would improve research
 */
export async function assessMissingNode(
  state: ResearchGraphState,
  config?: { configurable?: { llm?: BaseChatModel; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  const response = await llm.invoke([
    new SystemMessage(MISSING_INFO_PROMPT),
    new HumanMessage(
      JSON.stringify(
        {
          item: {
            title: state.item?.title,
            description: state.item?.description,
            condition: state.item?.condition,
            attributes: state.item?.attributes || [],
          },
          productId: state.productIdentification,
          confidence: state.overallConfidence,
          compCount: state.comps.length,
        },
        null,
        2,
      ),
    ),
  ]);

  // Parse missing info
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  let missingInfo: MissingInfoHint[] = [];
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      missingInfo = (parsed.missingInfo || []).map((hint: any) => ({
        field: hint.field || '',
        importance: hint.importance || 'optional',
        reason: hint.reason || '',
        suggestedPrompt: hint.suggestedPrompt,
      }));
    }
  } catch (error) {
    // Fallback: generate basic missing info hints
    if (!state.productIdentification?.model) {
      missingInfo.push({
        field: 'model_number',
        importance: 'recommended',
        reason: 'Model number would improve comp matching accuracy',
        suggestedPrompt: 'What is the model number of this item?',
      });
    }
  }

  return {
    missingInfo,
    messages: [response],
  };
}
