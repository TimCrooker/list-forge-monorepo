import { ResearchGraphState } from '../research-graph.state';
import { MissingInfoHint } from '@listforge/core-types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { withTimeout, LLM_CALL_TIMEOUT_MS } from '../../../utils/timeout';

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
  config?: { configurable?: { llm?: BaseChatModel; activityLogger?: ResearchActivityLoggerService; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  const activityLogger = config?.configurable?.activityLogger;

  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  // Start reasoning operation for missing info assessment
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'reasoning',
      title: 'Checking for Gaps',
      message: 'Analyzing research completeness and identifying missing information',
      stepId: 'assess_missing',
      data: {
        currentConfidence: state.overallConfidence,
        compsCount: state.comps.length,
      },
    });
  }

  try {
    // PERFORMANCE FIX: Wrap LLM call with timeout
    const response = await withTimeout(
      () => llm.invoke([
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
      ]),
      LLM_CALL_TIMEOUT_MS,
      'Missing info assessment LLM call timed out',
    );

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
    } catch {
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

    const requiredCount = missingInfo.filter(m => m.importance === 'required').length;
    const recommendedCount = missingInfo.filter(m => m.importance === 'recommended').length;

    // Complete the operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'reasoning',
        title: 'Checking for Gaps',
        message: missingInfo.length > 0
          ? `Found ${missingInfo.length} gaps (${requiredCount} critical, ${recommendedCount} recommended)`
          : 'No critical information gaps detected',
        stepId: 'assess_missing',
        data: {
          missingInfo,
          totalGaps: missingInfo.length,
          requiredCount,
          recommendedCount,
          optionalCount: missingInfo.filter(m => m.importance === 'optional').length,
        },
      });
    }

    return {
      missingInfo,
      messages: [response],
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'reasoning',
        title: 'Checking for Gaps',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'assess_missing',
      });
    }
    throw error;
  }
}
