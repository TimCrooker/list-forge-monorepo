import { ResearchGraphState } from '../research-graph.state';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import type { OCRExtractionResult, UPCLookupResult, AmazonProductMatch } from '@listforge/core-types';

/**
 * Tools interface for identifier extraction
 */
export interface ExtractIdentifiersTools {
  extractOCR: (imageUrls: string[]) => Promise<OCRExtractionResult>;
  lookupUPC: (code: string) => Promise<UPCLookupResult>;
  // Amazon UPC lookup
  lookupAmazonByUpc?: (params: { upc: string }) => Promise<AmazonProductMatch | null>;
}

/**
 * Extract Identifiers Node - Slice 2: Enhanced Product Identification
 *
 * Performs dedicated OCR extraction and UPC lookup to find product identifiers.
 * Runs early in the research pipeline (after load_context, before/parallel with deep_identify).
 *
 * This node:
 * 1. Extracts text from product images using dedicated OCR
 * 2. Identifies UPCs, model numbers, serial numbers, etc.
 * 3. Looks up product data via UPC database if barcode found
 * 4. Updates graph state with extracted identifiers
 */
export async function extractIdentifiersNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      tools?: ExtractIdentifiersTools;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const tools = config?.configurable?.tools;
  const activityLogger = config?.configurable?.activityLogger;

  if (!tools?.extractOCR || !tools?.lookupUPC) {
    throw new Error('ExtractIdentifiersTools not provided in config.configurable.tools');
  }

  // Get image URLs from item
  const imageUrls = state.item?.media
    ?.filter((m) => m.type === 'image')
    .map((m) => m.url) || [];

  if (imageUrls.length === 0) {
    return {
      ocrResult: null,
      upcLookupResult: null,
    };
  }

  // Start OCR extraction operation
  let ocrOpId: string | undefined;
  if (activityLogger) {
    ocrOpId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'ocr_extraction',
      title: 'Text Extraction',
      message: `Extracting text from ${imageUrls.length} image(s)`,
      stepId: 'extract_identifiers',
      data: {
        imageCount: imageUrls.length,
      },
    });
  }

  let ocrResult: OCRExtractionResult | null = null;
  let upcLookupResult: UPCLookupResult | null = null;
  let amazonMatch: AmazonProductMatch | null = null;
  let amazonAsin: string | null = null;

  try {
    // Step 1: Extract text using OCR
    ocrResult = await tools.extractOCR(imageUrls);

    // Complete OCR operation
    if (activityLogger && ocrOpId) {
      const foundIdentifiers: string[] = [];
      if (ocrResult.upc) foundIdentifiers.push(`UPC: ${ocrResult.upc}`);
      if (ocrResult.ean) foundIdentifiers.push(`EAN: ${ocrResult.ean}`);
      if (ocrResult.modelNumber) foundIdentifiers.push(`Model: ${ocrResult.modelNumber}`);
      if (ocrResult.mpn) foundIdentifiers.push(`MPN: ${ocrResult.mpn}`);
      if (ocrResult.serialNumber) foundIdentifiers.push(`S/N: ${ocrResult.serialNumber}`);

      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId: ocrOpId,
        operationType: 'ocr_extraction',
        title: 'Text Extraction',
        message: foundIdentifiers.length > 0
          ? `Found: ${foundIdentifiers.join(', ')}`
          : `Extracted ${ocrResult.rawText.length} text snippet(s)`,
        stepId: 'extract_identifiers',
        data: {
          upc: ocrResult.upc,
          ean: ocrResult.ean,
          modelNumber: ocrResult.modelNumber,
          mpn: ocrResult.mpn,
          serialNumber: ocrResult.serialNumber,
          rawTextCount: ocrResult.rawText.length,
          rawText: ocrResult.rawText.slice(0, 10), // Limit for display
          labels: ocrResult.labels,
          confidence: ocrResult.confidence,
        },
      });
    }

    // Step 2: Look up UPC if found
    const upcCode = ocrResult.upc || ocrResult.ean;
    if (upcCode) {
      let upcOpId: string | undefined;
      if (activityLogger) {
        upcOpId = await activityLogger.startOperation({
          researchRunId: state.researchRunId,
          itemId: state.itemId,
          operationType: 'upc_lookup',
          title: 'UPC Lookup',
          message: `Looking up product data for ${upcCode}`,
          stepId: 'extract_identifiers',
          data: {
            upc: upcCode,
          },
        });
      }

      try {
        upcLookupResult = await tools.lookupUPC(upcCode);

        if (activityLogger && upcOpId) {
          if (upcLookupResult.found) {
            await activityLogger.completeOperation({
              researchRunId: state.researchRunId,
              itemId: state.itemId,
              operationId: upcOpId,
              operationType: 'upc_lookup',
              title: 'UPC Lookup',
              message: `Found: ${upcLookupResult.brand || ''} ${upcLookupResult.name || ''}`.trim() || 'Product found',
              stepId: 'extract_identifiers',
              data: {
                found: true,
                upc: upcLookupResult.upc,
                brand: upcLookupResult.brand,
                name: upcLookupResult.name,
                category: upcLookupResult.category,
                imageUrl: upcLookupResult.imageUrl,
                cached: upcLookupResult.cached,
              },
            });
          } else {
            await activityLogger.completeOperation({
              researchRunId: state.researchRunId,
              itemId: state.itemId,
              operationId: upcOpId,
              operationType: 'upc_lookup',
              title: 'UPC Lookup',
              message: 'No product found in UPC database',
              stepId: 'extract_identifiers',
              data: {
                found: false,
                upc: upcCode,
              },
            });
          }
        }
      } catch (error) {
        if (activityLogger && upcOpId) {
          await activityLogger.failOperation({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationId: upcOpId,
            operationType: 'upc_lookup',
            title: 'UPC Lookup',
            error: error instanceof Error ? error.message : String(error),
            stepId: 'extract_identifiers',
          });
        }
        // Don't throw - UPC lookup failure shouldn't stop the pipeline
      }

      // Step 3: Amazon UPC-to-ASIN lookup (valuable for pricing/research)
      if (tools.lookupAmazonByUpc) {
        let amazonOpId: string | undefined;
        if (activityLogger) {
          amazonOpId = await activityLogger.startOperation({
            researchRunId: state.researchRunId,
            itemId: state.itemId,
            operationType: 'upc_lookup',
            title: 'Amazon UPC Lookup',
            message: `Looking up Amazon product for ${upcCode}`,
            stepId: 'extract_identifiers',
            data: {
              upc: upcCode,
            },
          });
        }

        try {
          amazonMatch = await tools.lookupAmazonByUpc({ upc: upcCode });

          if (amazonMatch) {
            amazonAsin = amazonMatch.asin;
          }

          if (activityLogger && amazonOpId) {
            if (amazonMatch) {
              await activityLogger.completeOperation({
                researchRunId: state.researchRunId,
                itemId: state.itemId,
                operationId: amazonOpId,
                operationType: 'upc_lookup',
                title: 'Amazon UPC Lookup',
                message: `Found ASIN: ${amazonMatch.asin} - ${amazonMatch.title}`,
                stepId: 'extract_identifiers',
                data: {
                  found: true,
                  asin: amazonMatch.asin,
                  title: amazonMatch.title,
                  brand: amazonMatch.brand,
                  category: amazonMatch.category,
                  salesRank: amazonMatch.salesRank,
                  confidence: amazonMatch.confidence,
                },
              });
            } else {
              await activityLogger.completeOperation({
                researchRunId: state.researchRunId,
                itemId: state.itemId,
                operationId: amazonOpId,
                operationType: 'upc_lookup',
                title: 'Amazon UPC Lookup',
                message: 'No Amazon product found for this UPC',
                stepId: 'extract_identifiers',
                data: {
                  found: false,
                  upc: upcCode,
                },
              });
            }
          }
        } catch (error) {
          if (activityLogger && amazonOpId) {
            await activityLogger.failOperation({
              researchRunId: state.researchRunId,
              itemId: state.itemId,
              operationId: amazonOpId,
              operationType: 'upc_lookup',
              title: 'Amazon UPC Lookup',
              error: error instanceof Error ? error.message : String(error),
              stepId: 'extract_identifiers',
            });
          }
          // Don't throw - Amazon lookup failure shouldn't stop the pipeline
        }
      }
    }

    // Build enhanced identification from extracted data
    const enhancedIdentification = buildEnhancedIdentification(ocrResult, upcLookupResult, amazonMatch, state);

    return {
      ocrResult,
      upcLookupResult,
      // Update product identification with OCR/UPC data
      productIdentification: enhancedIdentification,
      // Boost confidence if we found identifiers
      identificationConfidence: Math.max(
        state.identificationConfidence || 0,
        ocrResult.confidence,
        upcLookupResult?.found ? 0.8 : 0,
        amazonMatch?.confidence || 0,
      ),
      // Store Amazon match and ASIN for later use in search_comps and analyze_comps
      amazonMatches: amazonMatch ? [amazonMatch] : undefined,
      amazonAsin,
    };
  } catch (error) {
    if (activityLogger && ocrOpId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId: ocrOpId,
        operationType: 'ocr_extraction',
        title: 'Text Extraction',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'extract_identifiers',
      });
    }
    throw error;
  }
}

/**
 * Build enhanced product identification from OCR, UPC, and Amazon data
 */
function buildEnhancedIdentification(
  ocrResult: OCRExtractionResult | null,
  upcLookupResult: UPCLookupResult | null,
  amazonMatch: AmazonProductMatch | null,
  state: ResearchGraphState,
): ResearchGraphState['productIdentification'] {
  const existing = state.productIdentification || {
    confidence: 0,
    attributes: {},
  };

  // Start with existing values
  let brand = existing.brand;
  let model = existing.model;
  let mpn = existing.mpn;
  let upc = existing.upc;
  let category = existing.category;
  let confidence = existing.confidence;

  // Override with UPC lookup data (highest confidence)
  if (upcLookupResult?.found) {
    if (upcLookupResult.brand) brand = upcLookupResult.brand;
    if (upcLookupResult.name) {
      // Name might contain model info
      if (!model && upcLookupResult.name.includes(brand || '')) {
        model = upcLookupResult.name.replace(brand || '', '').trim();
      }
    }
    if (upcLookupResult.category) {
      category = [upcLookupResult.category];
    }
    upc = upcLookupResult.upc;
    confidence = Math.max(confidence, 0.85);
  }

  // Enhance with Amazon match data (very high value for product ID)
  if (amazonMatch) {
    // Amazon brand/category are often more accurate
    if (amazonMatch.brand && !brand) {
      brand = amazonMatch.brand;
    }
    if (amazonMatch.category && !category?.length) {
      category = [amazonMatch.category];
    }
    // Boost confidence if we have a strong Amazon match
    if (amazonMatch.confidence > 0.8) {
      confidence = Math.max(confidence, amazonMatch.confidence);
    }
  }

  // Add OCR-extracted identifiers
  if (ocrResult) {
    if (ocrResult.upc && !upc) upc = ocrResult.upc;
    if (ocrResult.modelNumber && !model) model = ocrResult.modelNumber;
    if (ocrResult.mpn && !mpn) mpn = ocrResult.mpn;
    confidence = Math.max(confidence, ocrResult.confidence);
  }

  // Merge attributes from labels
  const attributes: Record<string, string | number | boolean> = { ...existing.attributes };
  if (ocrResult?.labels) {
    for (const [key, value] of Object.entries(ocrResult.labels)) {
      if (!attributes[key.toLowerCase()]) {
        attributes[key.toLowerCase()] = value;
      }
    }
  }

  // Add Amazon-specific attributes
  if (amazonMatch?.asin) {
    attributes['asin'] = amazonMatch.asin;
  }
  if (amazonMatch?.salesRank) {
    attributes['amazon_sales_rank'] = amazonMatch.salesRank;
  }

  return {
    confidence,
    brand,
    model,
    mpn,
    upc,
    category,
    attributes,
  };
}
