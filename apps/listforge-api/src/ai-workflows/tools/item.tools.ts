import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext } from './index';

// ============================================================================
// Schemas
// ============================================================================

export const GetItemSnapshotSchema = z.object({
  itemId: z.string().describe('The item ID to get snapshot for'),
});

export const GetItemFacetSchema = z.object({
  itemId: z.string().describe('The item ID'),
  facet: z.enum([
    'general',
    'pricing',
    'attributes',
    'media',
    'research',
    'history',
    'marketplace',
  ]).describe(`The facet to retrieve:
- general: Basic info (title, description, condition, status)
- pricing: Price bands, strategies, demand signals
- attributes: Item attributes and specifications
- media: Photos and media files
- research: Latest research data summary
- history: Update history and changes
- marketplace: Marketplace-specific data and listings`),
});

export const UpdateItemFieldSchema = z.object({
  itemId: z.string().describe('The item ID to update'),
  field: z.enum([
    'title',
    'subtitle',
    'description',
    'condition',
    'defaultPrice',
    'quantity',
    'currency',
    'priceMin',
    'priceMax',
    'pricingStrategy',
    'shippingType',
    'flatRateAmount',
    'domesticOnly',
    'weight',
    'dimensions',
    'location',
    'costBasis',
    'tags',
    'categoryPath',
    'categoryId',
    'userNotes',
  ]).describe('The field to update'),
  value: z.any().describe('The new value for the field'),
});

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Get Item Snapshot Tool
 *
 * Returns a quick summary of an item with key metrics and available facets.
 * Use this first when you need to understand an item before diving into details.
 */
export function getItemSnapshotTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof GetItemSnapshotSchema>) => {
      const ctx = getToolContext();

      try {
        const item = await deps.getItem(ctx.organizationId, input.itemId);

        if (!item) {
          return JSON.stringify({
            error: true,
            message: `Item ${input.itemId} not found`,
          });
        }

        // Build snapshot with key info
        const snapshot = {
          id: item.id,
          title: item.title || '(No title)',
          description: item.description ?
            (item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description)
            : null,
          condition: item.condition,
          price: item.defaultPrice ? `$${item.defaultPrice.toFixed(2)} ${item.currency || 'USD'}` : null,
          quantity: item.quantity,
          status: {
            lifecycle: item.lifecycleStatus,
            aiReview: item.aiReviewState,
          },
          mediaCount: item.media?.length || 0,
          attributeCount: item.attributes?.length || 0,
          category: item.categoryPath?.join(' > ') || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,

          // Available facets for follow-up
          availableFacets: [
            'general',
            'pricing',
            'attributes',
            'media',
            'research',
            'history',
            'marketplace',
          ],
        };

        return JSON.stringify(snapshot, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to get item snapshot: ${message}`,
        });
      }
    },
    {
      name: 'get_item_snapshot',
      description: `Get a quick summary of an item with key metrics.
Returns: title, condition, price, status, counts for media/attributes, and list of available facets.
Use this first to understand an item, then use get_item_facet for specific details.`,
      schema: GetItemSnapshotSchema,
    },
  );
}

/**
 * Get Item Facet Tool
 *
 * Returns detailed data for a specific facet of an item.
 * Use after get_item_snapshot to dive into specific areas.
 */
export function getItemFacetTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof GetItemFacetSchema>) => {
      const ctx = getToolContext();

      try {
        const item = await deps.getItem(ctx.organizationId, input.itemId);

        if (!item) {
          return JSON.stringify({
            error: true,
            message: `Item ${input.itemId} not found`,
          });
        }

        let facetData: any;

        switch (input.facet) {
          case 'general':
            facetData = {
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
              description: item.description,
              condition: item.condition,
              lifecycleStatus: item.lifecycleStatus,
              aiReviewState: item.aiReviewState,
              aiConfidenceScore: item.aiConfidenceScore,
              quantity: item.quantity,
              userNotes: item.userNotes,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
            break;

          case 'pricing':
            facetData = {
              defaultPrice: item.defaultPrice,
              currency: item.currency,
              priceMin: item.priceMin,
              priceMax: item.priceMax,
              pricingStrategy: item.pricingStrategy,
              costBasis: item.costBasis,
              // If we have research data, include price bands
              // This requires a separate call to get research
              note: 'For full pricing analysis with comps, use get_research_data tool',
            };
            break;

          case 'attributes':
            facetData = {
              categoryPath: item.categoryPath,
              categoryId: item.categoryId,
              attributes: item.attributes || [],
              attributeCount: item.attributes?.length || 0,
            };
            break;

          case 'media':
            facetData = {
              mediaCount: item.media?.length || 0,
              media: (item.media || []).map((m: any) => ({
                id: m.id,
                type: m.type,
                url: m.url,
                isPrimary: m.isPrimary,
              })),
              primaryImage: item.media?.find((m: any) => m.isPrimary)?.url ||
                item.media?.[0]?.url || null,
            };
            break;

          case 'research':
            // Get latest research data
            const research = await deps.getLatestResearch(input.itemId, ctx.organizationId);
            if (!research) {
              facetData = {
                hasResearch: false,
                message: 'No research data available. Use trigger_research to start research.',
              };
            } else {
              facetData = {
                hasResearch: true,
                generatedAt: research.data.generatedAt,
                version: research.data.version,
                priceBands: research.data.priceBands,
                pricingStrategies: research.data.pricingStrategies,
                demandSignals: research.data.demandSignals,
                missingInfo: research.data.missingInfo,
                competitorCount: research.data.competitorCount,
                marketplaceCategory: research.data.marketplaceCategory,
                fieldCompletion: research.data.fieldCompletion,
              };
            }
            break;

          case 'history':
            facetData = {
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              // History would require additional queries to audit log
              // For now, just return timestamps
              note: 'Full change history not yet implemented',
            };
            break;

          case 'marketplace':
            facetData = {
              shippingType: item.shippingType,
              flatRateAmount: item.flatRateAmount,
              domesticOnly: item.domesticOnly,
              weight: item.weight,
              dimensions: item.dimensions,
              location: item.location,
              // Marketplace listings would require additional query
              note: 'For marketplace listings, check the marketplace service',
            };
            break;

          default:
            facetData = { error: true, message: `Unknown facet: ${input.facet}` };
        }

        return JSON.stringify({
          itemId: input.itemId,
          facet: input.facet,
          data: facetData,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to get item facet: ${message}`,
        });
      }
    },
    {
      name: 'get_item_facet',
      description: `Get detailed data for a specific aspect of an item.

Facets:
- general: Basic info (title, description, condition, status)
- pricing: Prices, strategy, cost basis
- attributes: Item attributes and category
- media: Photos and media files
- research: Latest research data (prices, comps, market signals)
- history: Update history and timestamps
- marketplace: Shipping, location, marketplace-specific data`,
      schema: GetItemFacetSchema,
    },
  );
}

/**
 * Update Item Field Tool
 *
 * Updates a single field on an item.
 * Returns the updated item data.
 */
export function updateItemFieldTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof UpdateItemFieldSchema>) => {
      const ctx = getToolContext();

      try {
        // Validate and transform value based on field type
        let value = input.value;

        // Price fields should be numbers
        if (['defaultPrice', 'priceMin', 'priceMax', 'flatRateAmount', 'costBasis'].includes(input.field)) {
          const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
          if (isNaN(numValue) || numValue < 0) {
            return JSON.stringify({
              error: true,
              message: `Invalid value for ${input.field}: must be a positive number`,
            });
          }
          value = numValue;
        }

        // Quantity must be positive integer
        if (input.field === 'quantity') {
          const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
          if (isNaN(numValue) || numValue < 1 || !Number.isInteger(numValue)) {
            return JSON.stringify({
              error: true,
              message: 'Invalid value for quantity: must be a positive integer',
            });
          }
          value = numValue;
        }

        // Boolean fields
        if (input.field === 'domesticOnly') {
          value = value === true || value === 'true' || value === '1';
        }

        // Build update request
        const updateRequest = {
          [input.field]: value,
        };

        // Update item
        const updatedItem = await deps.updateItem(ctx.organizationId, input.itemId, updateRequest);

        return JSON.stringify({
          success: true,
          itemId: input.itemId,
          field: input.field,
          newValue: value,
          updatedAt: updatedItem.updatedAt,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to update item: ${message}`,
        });
      }
    },
    {
      name: 'update_item_field',
      description: `Update a single field on an item.

Updatable fields:
- title, subtitle, description: Text fields
- condition: Item condition
- defaultPrice, priceMin, priceMax: Prices (numbers)
- quantity: Item quantity (integer >= 1)
- currency: Currency code (e.g., "USD")
- pricingStrategy: "aggressive", "balanced", or "premium"
- shippingType, flatRateAmount, domesticOnly: Shipping settings
- weight, dimensions, location: Physical attributes
- costBasis: Original cost for profit calculation
- tags: Array of tag strings
- categoryPath, categoryId: Category assignment
- userNotes: User's notes

Returns success/error status and the new value.`,
      schema: UpdateItemFieldSchema,
    },
  );
}
