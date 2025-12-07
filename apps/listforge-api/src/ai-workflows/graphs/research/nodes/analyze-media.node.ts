import { ResearchGraphState, MediaAnalysisResult } from '../research-graph.state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { prepareImageUrls } from '../../../utils/image-utils';

/**
 * Tools interface for media analysis
 */
export interface MediaAnalysisTools {
  llm: BaseChatModel;
}

const MEDIA_ANALYSIS_PROMPT = `You are an expert product analyst. Analyze the provided product images and extract:

1. **Product Category**: What type of product is this?
2. **Brand**: Can you identify the brand? Look for logos, labels.
3. **Model/Version**: Any model numbers, version indicators?
4. **Condition**: Rate 1-5 (1=poor, 5=like new). Note any damage.
5. **Key Features**: Size, color, capacity, material, etc.
6. **Text Extraction**: Any visible text (serial numbers, labels, UPC codes, etc.)
7. **Completeness**: Is this a complete item or missing parts?

Respond in JSON format:
{
  "category": string,
  "brand": string | null,
  "model": string | null,
  "condition": string,
  "attributes": { [key: string]: string | number | boolean },
  "extractedText": { [label: string]: string },
  "confidence": number (0-1)
}`;

/**
 * Analyze media node
 * Performs vision analysis on item images
 */
export async function analyzeMediaNode(
  state: ResearchGraphState,
  config?: { configurable?: { llm?: BaseChatModel; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  if (!state.item?.media?.length) {
    return { mediaAnalysis: null };
  }

  // Get image URLs (limit to 4 for cost)
  const imageUrls = state.item.media
    .filter((m) => m.type === 'image')
    .slice(0, 4)
    .map((m) => m.url);

  if (imageUrls.length === 0) {
    return { mediaAnalysis: null };
  }

  // Convert local URLs to base64 so OpenAI can access them
  const preparedUrls = await prepareImageUrls(imageUrls);

  const imageContents = preparedUrls.map((url) => ({
    type: 'image_url' as const,
    image_url: { url },
  }));

  const response = await llm.invoke([
    new SystemMessage(MEDIA_ANALYSIS_PROMPT),
    new HumanMessage({
      content: [
        { type: 'text', text: 'Analyze these product images:' },
        ...imageContents,
      ],
    }),
  ]);

  // Parse response
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  let analysis: MediaAnalysisResult;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      analysis = {
        category: parsed.category || null,
        brand: parsed.brand || null,
        model: parsed.model || null,
        condition: parsed.condition || null,
        attributes: parsed.attributes || {},
        extractedText: parsed.extractedText || {},
        confidence: parsed.confidence || 0.5,
      };
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    // Fallback
    analysis = {
      category: null,
      brand: null,
      model: null,
      condition: null,
      attributes: {},
      extractedText: {},
      confidence: 0.3,
    };
  }

  return {
    mediaAnalysis: analysis,
    messages: [response],
  };
}
