import { ResearchGraphState } from '../research-graph.state';
import { ResearchEvidenceRecord } from '@listforge/core-types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * Tools interface for comp analysis
 */
export interface CompAnalysisTools {
  llm: BaseChatModel;
}

const COMP_RELEVANCE_PROMPT = `You are a market research analyst. Score the relevance of each comparable listing to the target item.

Consider:
- Product match (same brand/model)
- Condition similarity
- Completeness match
- Price reasonableness

For each comp, return a relevance score 0-1 where:
- 0.9-1.0: Excellent match (same product, similar condition)
- 0.7-0.9: Good match (same product, different condition or minor differences)
- 0.5-0.7: Fair match (similar product, different model/variant)
- 0.3-0.5: Poor match (different product but same category)
- 0.0-0.3: Not relevant

Respond with JSON array:
[
  {
    "id": "listing-id",
    "relevanceScore": number (0-1),
    "reasoning": "brief explanation"
  }
]`;

/**
 * Score comp relevance using LLM
 */
async function scoreCompRelevance(
  comps: ResearchEvidenceRecord[],
  item: ResearchGraphState['item'],
  productId: ResearchGraphState['productIdentification'],
  llm: BaseChatModel,
): Promise<ResearchEvidenceRecord[]> {
  if (comps.length === 0) {
    return [];
  }

  // Prepare context
  const context = {
    item: {
      title: item?.title,
      condition: item?.condition,
      attributes: item?.attributes || [],
    },
    productId: {
      brand: productId?.brand,
      model: productId?.model,
      category: productId?.category,
    },
    comps: comps.slice(0, 20).map((c) => ({
      id: c.id,
      title: c.title,
      price: c.price,
      condition: c.condition,
    })),
  };

  const response = await llm.invoke([
    new SystemMessage(COMP_RELEVANCE_PROMPT),
    new HumanMessage(JSON.stringify(context, null, 2)),
  ]);

  // Parse scores
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const scores = JSON.parse(jsonMatch[0]) as Array<{ id: string; relevanceScore: number; reasoning?: string }>;
      const scoreMap = new Map(scores.map((s) => [s.id, s.relevanceScore]));

      return comps.map((comp) => ({
        ...comp,
        relevanceScore: scoreMap.get(comp.id) ?? comp.relevanceScore,
      }));
    }
  } catch (error) {
    // Fallback: use simple heuristics
  }

  // Fallback: simple scoring based on title/condition match
  return comps.map((comp) => {
    let score = 0.5;

    // Boost if condition matches
    if (item?.condition && comp.condition === item.condition) {
      score += 0.2;
    }

    // Boost if title contains brand/model
    const titleLower = comp.title.toLowerCase();
    if (productId?.brand && titleLower.includes(productId.brand.toLowerCase())) {
      score += 0.2;
    }
    if (productId?.model && titleLower.includes(productId.model.toLowerCase())) {
      score += 0.1;
    }

    return {
      ...comp,
      relevanceScore: Math.min(1.0, score),
    };
  });
}

/**
 * Analyze comps node
 * Scores relevance of comparable listings
 */
export async function analyzeCompsNode(
  state: ResearchGraphState,
  config?: { configurable?: { llm?: BaseChatModel; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  if (state.comps.length === 0) {
    return {};
  }

  // Score relevance
  const scoredComps = await scoreCompRelevance(
    state.comps,
    state.item,
    state.productIdentification,
    llm,
  );

  // Filter to relevant comps (relevance >= 0.5)
  const relevantComps = scoredComps.filter((c) => c.relevanceScore >= 0.5);

  return {
    comps: relevantComps,
  };
}
