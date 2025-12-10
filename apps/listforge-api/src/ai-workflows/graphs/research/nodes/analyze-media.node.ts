import { ResearchGraphState, MediaAnalysisResult } from '../research-graph.state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { prepareImageUrls } from '../../../utils/image-utils';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { withTimeout, LLM_CALL_TIMEOUT_MS } from '../../../utils/timeout';

/**
 * Tools interface for media analysis
 */
export interface MediaAnalysisTools {
  llm: BaseChatModel;
}

/**
 * Media Analysis Prompt - Slice 2: Enhanced with variant detection
 *
 * Explicitly extracts color, size, and edition/version variants for better product identification.
 */
const MEDIA_ANALYSIS_PROMPT = `You are an expert product analyst. Analyze the provided product images and extract:

1. **Product Category**: What type of product is this? (e.g., Electronics, Clothing, Home & Garden)
2. **Brand**: Can you identify the brand? Look for logos, labels, markings.
3. **Model/Version**: Any model numbers, version indicators, or product names?
4. **Condition**: Rate as: "new", "like_new", "very_good", "good", "acceptable", or "for_parts". Note any visible damage.

**IMPORTANT - Extract these variant details specifically:**
5. **Color**: What is the primary color of the product? Be specific (e.g., "Midnight Blue", "Rose Gold", "Matte Black")
6. **Size**: What size is this product? Include measurements if visible (e.g., "Medium", "10.5", "128GB", "15-inch")
7. **Edition/Version**: Is this a special edition, version, or variant? (e.g., "Pro Max", "Limited Edition", "Gen 3", "2023 Model")

8. **Key Features**: Other attributes like capacity, material, storage, etc.
9. **Text Extraction**: Any visible text (serial numbers, labels, UPC codes, part numbers)
10. **Completeness**: Is this a complete item or missing parts/accessories?

Respond in JSON format:
{
  "category": string,
  "brand": string | null,
  "model": string | null,
  "condition": string,
  "color": string | null,
  "size": string | null,
  "edition": string | null,
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
  config?: { configurable?: { llm?: BaseChatModel; activityLogger?: ResearchActivityLoggerService; [key: string]: any }; [key: string]: any },
): Promise<Partial<ResearchGraphState>> {
  const llm = config?.configurable?.llm;
  const activityLogger = config?.configurable?.activityLogger;

  if (!llm) {
    throw new Error('LLM not provided in config.configurable.llm');
  }

  // Start media analysis operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'media_analysis',
      title: 'Photo Analysis',
      message: 'Analyzing product photos with AI vision',
      stepId: 'analyze_media',
    });
  }

  try {
    if (!state.item?.media?.length) {
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'media_analysis',
          title: 'Photo Analysis',
          message: 'No photos found for analysis',
          stepId: 'analyze_media',
          data: { imageCount: 0, skipped: true },
        });
      }
      return { mediaAnalysis: null };
    }

    // Get image URLs (limit to 4 for cost)
    const imageUrls = state.item.media
      .filter((m) => m.type === 'image')
      .slice(0, 4)
      .map((m) => m.url);

    if (imageUrls.length === 0) {
      if (activityLogger && operationId) {
        await activityLogger.completeOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationId,
          operationType: 'media_analysis',
          title: 'Photo Analysis',
          message: 'No image URLs found for analysis',
          stepId: 'analyze_media',
          data: { imageCount: 0, skipped: true },
        });
      }
      return { mediaAnalysis: null };
    }

    // Emit progress
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'media_analysis',
        message: `Analyzing ${imageUrls.length} photo(s)...`,
        stepId: 'analyze_media',
        data: { imageCount: imageUrls.length },
      });
    }

    // Convert local URLs to base64 so OpenAI can access them
    const preparedUrls = await prepareImageUrls(imageUrls);

    const imageContents = preparedUrls.map((url) => ({
      type: 'image_url' as const,
      image_url: { url },
    }));

    // PERFORMANCE FIX: Wrap LLM call with timeout to prevent hanging
    const response = await withTimeout(
      () => llm.invoke([
        new SystemMessage(MEDIA_ANALYSIS_PROMPT),
        new HumanMessage({
          content: [
            { type: 'text', text: 'Analyze these product images:' },
            ...imageContents,
          ],
        }),
      ]),
      LLM_CALL_TIMEOUT_MS,
      'Media analysis LLM call timed out',
    );

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
          // Slice 2: Extract variant fields
          color: parsed.color || null,
          size: parsed.size || null,
          edition: parsed.edition || null,
          attributes: parsed.attributes || {},
          extractedText: parsed.extractedText || {},
          confidence: parsed.confidence || 0.5,
        };
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback
      analysis = {
        category: null,
        brand: null,
        model: null,
        condition: null,
        color: null,
        size: null,
        edition: null,
        attributes: {},
        extractedText: {},
        confidence: 0.3,
      };
    }

    // Build summary for completion message
    const results: string[] = [];
    if (analysis.category) results.push(`Category: ${analysis.category}`);
    if (analysis.brand) results.push(`Brand: ${analysis.brand}`);
    if (analysis.model) results.push(`Model: ${analysis.model}`);
    // Slice 2: Include variant info in summary
    if (analysis.color) results.push(`Color: ${analysis.color}`);
    if (analysis.size) results.push(`Size: ${analysis.size}`);

    // Complete the operation
    if (activityLogger && operationId) {
      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'media_analysis',
        title: 'Photo Analysis',
        message: results.length > 0
          ? `Detected: ${results.join(', ')}`
          : 'Analysis complete with limited detection',
        stepId: 'analyze_media',
        data: {
          imageCount: imageUrls.length,
          category: analysis.category,
          brand: analysis.brand,
          model: analysis.model,
          condition: analysis.condition,
          // Slice 2: Include variant fields in activity data
          color: analysis.color,
          size: analysis.size,
          edition: analysis.edition,
          confidence: analysis.confidence,
          attributes: analysis.attributes,
          extractedText: analysis.extractedText,
        },
      });
    }

    return {
      mediaAnalysis: analysis,
      messages: [response],
    };
  } catch (error) {
    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'media_analysis',
        title: 'Photo Analysis',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'analyze_media',
      });
    }
    throw error;
  }
}
