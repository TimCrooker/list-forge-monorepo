import { ResearchGraphState } from '../research-graph.state';
import type { MarketplaceListingPayload } from '@listforge/core-types';
import { ResearchActivityLoggerService } from '../../../../research/services/research-activity-logger.service';
import { ListingAssemblyService, ListingAssemblyInput } from '../../../services/listing-assembly.service';
import { logNodeWarn, logNodeDebug, logNodeError } from '../../../utils/node-logger';

/**
 * Tools interface for listing assembly
 */
export interface ListingAssemblyTools {
  listingAssemblyService: ListingAssemblyService;
}

/**
 * Assemble listing node
 * Slice 6: Generates complete, marketplace-ready listing payloads
 *
 * This node:
 * - Generates optimized titles (eBay 80-char limit)
 * - Creates structured descriptions with features, condition, specs
 * - Populates all required attributes from marketplace schema
 * - Determines listing status (READY_FOR_PUBLISH / READY_FOR_REVIEW / NEEDS_INFO)
 * - Validates the assembled listing
 */
export async function assembleListingNode(
  state: ResearchGraphState,
  config?: {
    configurable?: {
      listingAssemblyService?: ListingAssemblyService;
      activityLogger?: ResearchActivityLoggerService;
      [key: string]: any;
    };
    [key: string]: any;
  },
): Promise<Partial<ResearchGraphState>> {
  const listingAssemblyService = config?.configurable?.listingAssemblyService;
  const activityLogger = config?.configurable?.activityLogger;

  if (!listingAssemblyService) {
    logNodeWarn('assemble-listing', 'ListingAssemblyService not provided, skipping');
    return { listings: [] };
  }

  // Start listing assembly operation
  let operationId: string | undefined;
  if (activityLogger) {
    operationId = await activityLogger.startOperation({
      researchRunId: state.researchRunId,
      itemId: state.itemId,
      operationType: 'listing_assembly',
      title: 'Assembling Listing',
      message: 'Generating marketplace-ready listing with optimized title and description',
      stepId: 'assemble_listing',
      data: {
        hasProductId: Boolean(state.productIdentification),
        hasCategory: Boolean(state.marketplaceCategory),
        hasPricing: state.priceBands.length > 0,
      },
    });
  }

  try {
    // Prepare input for listing assembly
    const input: ListingAssemblyInput = {
      itemId: state.itemId,
      title: state.item?.title || null,
      description: state.item?.description || null,
      condition: state.item?.condition || null,
      attributes: state.item?.attributes || [],
      media: state.item?.media || [],
      defaultPrice: state.item?.defaultPrice || null,
      productIdentification: state.productIdentification,
      priceBands: state.priceBands,
      pricingStrategies: state.pricingStrategies || [],
      marketplaceCategory: state.marketplaceCategory,
      fieldCompletion: state.fieldCompletion,
      requiredFields: state.requiredFields || [],
      recommendedFields: state.recommendedFields || [],
    };

    // Emit progress
    if (activityLogger && operationId) {
      await activityLogger.emitProgress({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'listing_assembly',
        message: 'Generating optimized title and description...',
        stepId: 'assemble_listing',
      });
    }

    // Assemble eBay listing
    const ebayListing = await listingAssemblyService.assembleListingPayload(input, 'ebay');

    const listings: MarketplaceListingPayload[] = [ebayListing];

    // Calculate summary stats
    const readyCount = listings.filter((l) => l.status === 'READY_FOR_PUBLISH').length;
    const reviewCount = listings.filter((l) => l.status === 'READY_FOR_REVIEW').length;
    const needsInfoCount = listings.filter((l) => l.status === 'NEEDS_INFO').length;

    // Complete the operation
    if (activityLogger && operationId) {
      const statusSummary =
        readyCount > 0
          ? `Ready to publish`
          : reviewCount > 0
            ? `Ready for review`
            : `Needs more information`;

      await activityLogger.completeOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'listing_assembly',
        title: 'Assembling Listing',
        message: `${statusSummary} - ${ebayListing.payload.title.substring(0, 50)}${ebayListing.payload.title.length > 50 ? '...' : ''}`,
        stepId: 'assemble_listing',
        data: {
          marketplace: ebayListing.marketplace,
          status: ebayListing.status,
          statusReason: ebayListing.statusReason,
          confidence: ebayListing.confidence,
          title: ebayListing.payload.title,
          titleLength: ebayListing.payload.title.length,
          price: ebayListing.payload.price,
          categoryId: ebayListing.payload.categoryId,
          photoCount: ebayListing.payload.photos.length,
          attributeCount: Object.keys(ebayListing.payload.attributes).length,
          validation: ebayListing.validation,
          missingRequired: ebayListing.missingRequired,
          readyForPublish: readyCount,
          readyForReview: reviewCount,
          needsInfo: needsInfoCount,
        },
      });
    }

    logNodeDebug('assemble-listing', 'Assembled listings', {
      listingCount: listings.length,
      ready: readyCount,
      review: reviewCount,
      needsInfo: needsInfoCount,
    });

    // Update overallConfidence based on the best listing confidence
    // This ensures the confidence threshold check in shouldRefineNode works correctly
    const bestConfidence = Math.max(...listings.map((l) => l.confidence || 0), 0);

    return {
      listings,
      overallConfidence: bestConfidence,
    };
  } catch (error) {
    logNodeError('assemble-listing', 'Error assembling listing', error);

    if (activityLogger && operationId) {
      await activityLogger.failOperation({
        researchRunId: state.researchRunId,
        itemId: state.itemId,
        operationId,
        operationType: 'listing_assembly',
        title: 'Assembling Listing',
        error: error instanceof Error ? error.message : String(error),
        stepId: 'assemble_listing',
      });
    }

    // Return empty listings on error - don't fail the whole graph
    return { listings: [] };
  }
}

