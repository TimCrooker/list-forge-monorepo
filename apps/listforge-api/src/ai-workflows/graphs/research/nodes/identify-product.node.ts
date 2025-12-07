import { ResearchGraphState } from '../research-graph.state';
import { ProductIdentification } from '@listforge/core-types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * Tools interface for product identification
 */
export interface ProductIdentificationTools {
  llm: BaseChatModel;
  lookupByUpc?: (params: { upc: string }) => Promise<ProductIdentification | null>;
}

const PRODUCT_IDENTIFICATION_PROMPT = `You are a product identification expert. Based on the provided item information and media analysis, identify the product with high confidence.

Extract:
- Brand (if available)
- Model number (if available)
- MPN (Manufacturer Part Number, if available)
- UPC (if available)
- Category hierarchy
- Key attributes

Respond in JSON:
{
  "confidence": number (0-1),
  "brand": string | null,
  "model": string | null,
  "mpn": string | null,
  "upc": string | null,
  "category": string[],
  "attributes": { [key: string]: string | number | boolean }
}`;

/**
 * Identify product node
 * Identifies product details from context and media analysis
 */
export async function identifyProductNode(
  state: ResearchGraphState,
  config?: { configurable?: { llm?: BaseChatModel; lookupByUpc?: (params: { upc: string }) => Promise<ProductIdentification | null>; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  const lookupByUpc = config?.configurable?.lookupByUpc;

  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  // Try UPC lookup if available
  const upc = state.mediaAnalysis?.extractedText?.upc || state.mediaAnalysis?.extractedText?.UPC;
  if (upc && lookupByUpc) {
    try {
      const productMatch = await lookupByUpc({ upc });
      if (productMatch && productMatch.confidence > 0.8) {
        return {
          productIdentification: productMatch,
        };
      }
    } catch (error) {
      // Continue with LLM-based identification
    }
  }

  // Build context from item and media analysis
  const context = {
    title: state.item?.title,
    description: state.item?.description,
    attributes: state.item?.attributes || [],
    mediaAnalysis: state.mediaAnalysis,
  };

  const response = await llm.invoke([
    new SystemMessage(PRODUCT_IDENTIFICATION_PROMPT),
    new HumanMessage(JSON.stringify(context, null, 2)),
  ]);

  // Parse response
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  let productId: ProductIdentification;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      productId = {
        confidence: parsed.confidence || 0.5,
        brand: parsed.brand || null,
        model: parsed.model || null,
        mpn: parsed.mpn || null,
        upc: parsed.upc || null,
        category: parsed.category || [],
        attributes: parsed.attributes || {},
      };
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    // Fallback
    productId = {
      confidence: 0.3,
      brand: state.mediaAnalysis?.brand || null,
      model: state.mediaAnalysis?.model || null,
      category: state.mediaAnalysis?.category ? [state.mediaAnalysis.category] : [],
      attributes: state.mediaAnalysis?.attributes || {},
    };
  }

  return {
    productIdentification: productId,
    messages: [response],
  };
}
