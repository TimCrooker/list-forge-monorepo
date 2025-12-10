import { ResearchPlan } from '@listforge/core-types';
import { ResearchGraphState } from '../research-graph.state';
import { createNodeLogger } from '../../../utils/node-logger';
import {
  PLANNING_PROMPT,
  IMAGE_ANALYSIS_CONTEXT_TEMPLATE,
  PLANNING_CONFIG,
} from '../../../config/research.constants';
import OpenAI from 'openai';

const logger = createNodeLogger('plan-research');

/**
 * Plan Research Node (Pre-Act Pattern)
 *
 * Analyzes item images and hints to generate a structured research plan.
 * Uses medium-depth planning (~1000 tokens) to:
 * - Assess what can be determined from images
 * - Identify the best strategy for product identification
 * - Plan the tool sequence for research
 * - Anticipate potential challenges
 * - Define success criteria
 *
 * This planning step improves research accuracy by 20-40% (Pre-Act Pattern).
 */
export async function planResearchNode(
  state: ResearchGraphState,
): Promise<Partial<ResearchGraphState>> {
  logger.info(`Planning research for item ${state.itemId}`);

  try {
    // Build context from item data
    const item = state.item;
    if (!item) {
      logger.warn('No item data available for planning, skipping');
      return { researchPlan: null };
    }

    // Build image analysis context if available
    let imageAnalysisContext = '';
    if (state.mediaAnalysis) {
      const analysis = state.mediaAnalysis;
      imageAnalysisContext = IMAGE_ANALYSIS_CONTEXT_TEMPLATE.replace(
        '{imageAnalysisResults}',
        JSON.stringify(
          {
            category: analysis.category,
            brand: analysis.brand,
            model: analysis.model,
            condition: analysis.condition,
            color: analysis.color,
            size: analysis.size,
            attributes: analysis.attributes,
            extractedText: analysis.extractedText,
            confidence: analysis.confidence,
          },
          null,
          2,
        ),
      );
    }

    // Build the planning prompt
    const prompt = PLANNING_PROMPT
      .replace('{userTitleHint}', item.title || 'Not provided')
      .replace('{userDescriptionHint}', item.description || 'Not provided')
      .replace('{imageCount}', String(item.media?.length || 0))
      .replace('{userNotes}', getNotesFromAttributes(item.attributes))
      .replace('{condition}', item.condition || 'Not specified')
      .replace('{imageAnalysisContext}', imageAnalysisContext);

    // Call OpenAI to generate the research plan
    const openai = new OpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a product research specialist. Generate a structured research plan in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: PLANNING_CONFIG.MAX_TOKENS,
      temperature: PLANNING_CONFIG.TEMPERATURE,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('No response from LLM for research planning');
      return { researchPlan: null };
    }

    // Parse the response
    const planData = JSON.parse(content);

    // Validate and construct the ResearchPlan
    const researchPlan: ResearchPlan = {
      visualAssessment: {
        category: planData.visualAssessment?.category || null,
        brandIndicators: planData.visualAssessment?.brandIndicators || [],
        conditionEstimate: planData.visualAssessment?.conditionEstimate || null,
        visibleText: planData.visualAssessment?.visibleText || [],
      },
      identificationStrategy: {
        primaryApproach:
          planData.identificationStrategy?.primaryApproach ||
          'Visual analysis and web search',
        fallbackApproaches:
          planData.identificationStrategy?.fallbackApproaches || [],
        expectedConfidence:
          planData.identificationStrategy?.expectedConfidence || 0.5,
      },
      toolSequence: (planData.toolSequence || []).map(
        (item: { tool: string; inputs: string; expectedYield: string; priority?: number }) => ({
          tool: item.tool,
          inputs: item.inputs,
          expectedYield: item.expectedYield,
          priority: item.priority,
        }),
      ),
      challenges: (planData.challenges || []).map(
        (item: { risk: string; mitigation: string }) => ({
          risk: item.risk,
          mitigation: item.mitigation,
        }),
      ),
      successCriteria: {
        identification:
          planData.successCriteria?.identification ||
          'Product identified with brand and model',
        minimumFields: planData.successCriteria?.minimumFields || [
          'title',
          'category',
          'condition',
        ],
      },
      generatedAt: new Date().toISOString(),
      reasoning: PLANNING_CONFIG.INCLUDE_REASONING
        ? buildReasoningSummary(planData)
        : undefined,
    };

    logger.info(`Research plan generated`, {
      category: researchPlan.visualAssessment.category,
      toolCount: researchPlan.toolSequence.length,
      challengeCount: researchPlan.challenges.length,
      expectedConfidence: researchPlan.identificationStrategy.expectedConfidence,
    });

    return { researchPlan };
  } catch (error) {
    logger.error('Failed to generate research plan', error);
    // Return null plan - research will continue without planning
    return { researchPlan: null };
  }
}

/**
 * Extract notes from item attributes
 */
function getNotesFromAttributes(
  attributes: Array<{ key: string; value: string }> | undefined,
): string {
  if (!attributes || attributes.length === 0) {
    return 'None';
  }

  const notesAttr = attributes.find(
    (a) => a.key.toLowerCase() === 'notes' || a.key.toLowerCase() === 'user_notes',
  );
  if (notesAttr) {
    return notesAttr.value;
  }

  // Return first few attributes as context
  return attributes
    .slice(0, 3)
    .map((a) => `${a.key}: ${a.value}`)
    .join(', ');
}

/**
 * Build a reasoning summary from the plan data
 */
function buildReasoningSummary(planData: Record<string, unknown>): string {
  const parts: string[] = [];

  const visualAssessment = planData.visualAssessment as Record<string, unknown> | undefined;
  const identificationStrategy = planData.identificationStrategy as Record<string, unknown> | undefined;
  const toolSequence = planData.toolSequence as Array<{ tool: string }> | undefined;
  const challenges = planData.challenges as Array<{ risk: string }> | undefined;

  if (visualAssessment?.category) {
    parts.push(`Category assessment: ${visualAssessment.category}`);
  }

  if (identificationStrategy?.primaryApproach) {
    parts.push(`Primary strategy: ${identificationStrategy.primaryApproach}`);
  }

  if (toolSequence && toolSequence.length > 0) {
    parts.push(`Tool sequence: ${toolSequence.map((t) => t.tool).join(' → ')}`);
  }

  if (challenges && challenges.length > 0) {
    parts.push(`Key challenges: ${challenges.map((c) => c.risk).join(', ')}`);
  }

  if (identificationStrategy?.expectedConfidence !== undefined) {
    parts.push(
      `Expected confidence: ${((identificationStrategy.expectedConfidence as number) * 100).toFixed(0)}%`,
    );
  }

  return parts.join('\n');
}
