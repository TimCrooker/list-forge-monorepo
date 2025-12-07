import { ChatGraphState } from '../chat-graph.state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ChatActionDto } from '@listforge/api-types';

/**
 * Tools interface for research handling
 */
export interface ResearchHandlingTools {
  llm: BaseChatModel;
  startResearchJob: (params: { itemId: string }) => Promise<{ jobId: string; status: string }>;
  isResearchStale: (params: { itemId: string }) => Promise<boolean>;
}

const RESEARCH_INTENT_PROMPT = `You are a research assistant handler.

When a user wants to run research or check research status, determine:
1. Do they want to start new research? (e.g., "Run new research", "Refresh pricing", "Update research")
2. Are they asking why something is recommended? (e.g., "Why is the price $X?", "How did you calculate this?")
3. Are they checking research status? (e.g., "Is research done?", "What's the research status?")

Respond in JSON format:
{
  "action": "start_research" | "explain_reasoning" | "check_status",
  "message": "User-friendly response message"
}

If you cannot determine, respond with: {"error": "Cannot determine research intent"}`;

/**
 * Handle research node
 * Processes research-related intents: starting research, checking status, explaining reasoning
 * Phase 7 Slice 7
 */
export async function handleResearchNode(
  state: ChatGraphState,
  config?: { configurable?: { tools?: ResearchHandlingTools; [key: string]: any }; [key: string]: any },
): Promise<Partial<ChatGraphState>> {
  const tools = config?.configurable?.tools;
  if (!tools || !tools.llm || !tools.startResearchJob || !tools.isResearchStale) {
    throw new Error('Required tools not provided in config.configurable.tools');
  }

  const { llm, startResearchJob, isResearchStale } = tools;

  // Build context with current research state
  const contextParts: string[] = [];
  if (state.research) {
    contextParts.push('Current research data:');
    if (state.research.priceBands && state.research.priceBands.length > 0) {
      const targetPrice = state.research.priceBands.find((p) => p.label === 'target');
      if (targetPrice) {
        contextParts.push(`Target price: $${targetPrice.amount.toFixed(2)}`);
      }
    }
    contextParts.push(`Research generated: ${state.research.generatedAt}`);
  } else {
    contextParts.push('No research data available yet.');
  }

  // Determine research intent
  const response = await llm.invoke([
    new SystemMessage(RESEARCH_INTENT_PROMPT),
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
      // Could not determine intent - treat as question
      return {
        intent: 'question',
        response: `I understand you're asking about research, but I'm not sure exactly what you'd like. You can ask me to "run new research", "check research status", or ask "why is the price $X?"`,
      };
    }

    // Handle different research actions
    if (parsed.action === 'start_research') {
      // Check if research is stale
      const stale = await isResearchStale({ itemId: state.itemId });

      // Start research job
      const result = await startResearchJob({ itemId: state.itemId });

      // Create action for tracking research
      const action: ChatActionDto = {
        type: 'start_research',
        field: 'research',
        value: result.jobId,
        label: 'Research started',
        applied: true,
      };

      const staleMessage = stale
        ? ' Your previous research was over 7 days old, so I\'ve started fresh research.'
        : '';

      return {
        activeResearchJobId: result.jobId,
        proposedActions: [action],
        response: `${parsed.message || 'I\'ve started a new research job for this item.'}${staleMessage} You can track progress in the Research tab.`,
      };
    } else if (parsed.action === 'explain_reasoning') {
      // Use existing research to explain reasoning
      if (!state.research) {
        return {
          response:
            "I don't have research data for this item yet. Would you like me to run research first?",
          proposedActions: [
            {
              type: 'start_research',
              field: 'research',
              value: state.itemId,
              label: 'Run Research',
              applied: false,
            },
          ],
        };
      }

      // Build explanation from research data
      let explanation = parsed.message || 'Based on the research data:';
      if (state.research.priceBands && state.research.priceBands.length > 0) {
        const targetPrice = state.research.priceBands.find((p) => p.label === 'target');
        if (targetPrice) {
          explanation += `\n\nTarget price: $${targetPrice.amount.toFixed(2)} (${Math.round(targetPrice.confidence * 100)}% confidence)`;
          explanation += `\nReasoning: ${targetPrice.reasoning}`;
        }
      }
      if (state.research.demandSignals && state.research.demandSignals.length > 0) {
        explanation += '\n\nMarket signals:';
        state.research.demandSignals.slice(0, 3).forEach((signal) => {
          explanation += `\n- ${signal.metric}: ${signal.value} ${signal.unit}`;
        });
      }

      return {
        response: explanation,
      };
    } else if (parsed.action === 'check_status') {
      // Check research status
      if (!state.research) {
        return {
          response: 'No research has been run for this item yet. Would you like me to start research?',
          proposedActions: [
            {
              type: 'start_research',
              field: 'research',
              value: state.itemId,
              label: 'Run Research',
              applied: false,
            },
          ],
        };
      }

      const stale = await isResearchStale({ itemId: state.itemId });
      const staleMessage = stale
        ? ' However, this research is over 7 days old and may be outdated.'
        : '';

      return {
        response: `Research was completed on ${new Date(state.research.generatedAt).toLocaleDateString()}.${staleMessage} Would you like me to run fresh research?`,
        proposedActions: stale
          ? [
              {
                type: 'start_research',
                field: 'research',
                value: state.itemId,
                label: 'Refresh Research',
                applied: false,
              },
            ]
          : [],
      };
    }

    // Fallback
    return {
      response: parsed.message || 'I can help you with research. What would you like to know?',
    };
  } catch (error) {
    // JSON parse failed - treat as question
    return {
      intent: 'question',
      response: `I understand you're asking about research, but I'm having trouble understanding exactly what you'd like. Could you rephrase your request?`,
    };
  }
}
