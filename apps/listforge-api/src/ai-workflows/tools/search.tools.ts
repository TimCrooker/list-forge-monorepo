import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext } from './index';

// ============================================================================
// Schemas
// ============================================================================

export const SearchItemsSchema = z.object({
  query: z.string().optional().describe('Text search query (searches title, description, attributes)'),
  status: z.enum(['draft', 'ready', 'listed', 'sold', 'archived']).optional().describe('Filter by lifecycle status'),
  aiReviewState: z.enum(['pending', 'approved', 'rejected', 'needs_work']).optional().describe('Filter by AI review state'),
  minPrice: z.number().optional().describe('Minimum price filter'),
  maxPrice: z.number().optional().describe('Maximum price filter'),
  category: z.string().optional().describe('Filter by category path'),
  limit: z.number().min(1).max(50).default(10).describe('Max results to return'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'defaultPrice']).default('updatedAt').describe('Sort field'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
});

export const SearchResearchSchema = z.object({
  itemId: z.string().describe('Item ID to get research data for (required)'),
  query: z.string().optional().describe('Search query for research data'),
  minConfidence: z.number().min(0).max(1).optional().describe('Minimum confidence score'),
  hasPriceBands: z.boolean().optional().describe('Only include items with price recommendations'),
  limit: z.number().min(1).max(50).default(10).describe('Max results to return'),
});

export const SearchEvidenceSchema = z.object({
  itemId: z.string().optional().describe('Filter to specific item'),
  type: z.enum(['sold_listing', 'active_listing', 'product_page', 'price_guide', 'ai_analysis']).optional().describe('Evidence type filter'),
  source: z.string().optional().describe('Source filter (e.g., "ebay", "amazon")'),
  query: z.string().optional().describe('Text search in evidence data'),
  minPrice: z.number().optional().describe('Minimum price filter'),
  maxPrice: z.number().optional().describe('Maximum price filter'),
  limit: z.number().min(1).max(50).default(20).describe('Max results to return'),
});

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Search Items Tool
 *
 * Searches the user's inventory items with various filters.
 * Useful for finding specific items or getting counts by status.
 */
export function searchItemsTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof SearchItemsSchema>) => {
      const ctx = getToolContext();

      try {
        // Build search query
        const searchQuery: any = {
          organizationId: ctx.organizationId,
          limit: input.limit,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        };

        if (input.query) searchQuery.query = input.query;
        if (input.status) searchQuery.lifecycleStatus = input.status;
        if (input.aiReviewState) searchQuery.aiReviewState = input.aiReviewState;
        if (input.minPrice) searchQuery.minPrice = input.minPrice;
        if (input.maxPrice) searchQuery.maxPrice = input.maxPrice;
        if (input.category) searchQuery.categoryPath = input.category;

        const results = await deps.searchItems(ctx.organizationId, searchQuery);

        if (!results || results.length === 0) {
          return JSON.stringify({
            found: 0,
            items: [],
            message: 'No items found matching your criteria.',
          });
        }

        // Format results
        const formattedItems = results.slice(0, input.limit).map((item) => ({
          id: item.id,
          title: item.title || '(No title)',
          price: item.defaultPrice ? `$${item.defaultPrice.toFixed(2)}` : null,
          condition: item.condition,
          status: item.lifecycleStatus,
          aiReviewState: item.aiReviewState,
          category: item.categoryPath?.join(' > ') || null,
          mediaCount: item.media?.length || 0,
          updatedAt: item.updatedAt,
        }));

        return JSON.stringify({
          found: results.length,
          showing: formattedItems.length,
          items: formattedItems,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to search items: ${message}`,
        });
      }
    },
    {
      name: 'search_items',
      description: `Search the user's inventory items.

Filters:
- query: Text search in title, description, attributes
- status: draft, ready, listed, sold, archived
- aiReviewState: pending, approved, rejected, needs_work
- minPrice/maxPrice: Price range
- category: Category path filter

Sorting: createdAt, updatedAt, title, defaultPrice (asc/desc)

Returns matching items with basic info. Use get_item_snapshot for full details.`,
      schema: SearchItemsSchema,
    },
  );
}

/**
 * Search Research Tool
 *
 * Searches across research data for items.
 * Useful for finding items with specific research characteristics.
 */
export function searchResearchTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof SearchResearchSchema>) => {
      const ctx = getToolContext();

      try {
        const research = await deps.getLatestResearch(input.itemId, ctx.organizationId);

        if (!research) {
          return JSON.stringify({
            found: 0,
            message: `No research found for item ${input.itemId}`,
          });
        }

        return JSON.stringify({
          found: 1,
          results: [{
            itemId: input.itemId,
            generatedAt: research.data.generatedAt,
            priceBands: research.data.priceBands?.length || 0,
            demandSignals: research.data.demandSignals?.length || 0,
            missingInfo: research.data.missingInfo?.length || 0,
            hasMarketplaceCategory: !!research.data.marketplaceCategory,
            confidence: research.data.productId?.confidence,
          }],
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to search research: ${message}`,
        });
      }
    },
    {
      name: 'search_research',
      description: `Get research data for a specific item.

Required:
- itemId: Item ID to get research data for

Optional Filters:
- query: Text search in research data
- minConfidence: Minimum confidence score (0-1)
- hasPriceBands: Only items with price recommendations

Returns research summary including price bands, demand signals, and confidence scores. Use get_research_data for full details.`,
      schema: SearchResearchSchema,
    },
  );
}

/**
 * Search Evidence Tool
 *
 * Searches evidence bundles (comps, product pages, etc.)
 */
export function searchEvidenceTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof SearchEvidenceSchema>) => {
      const ctx = getToolContext();

      try {
        const searchQuery: any = {
          organizationId: ctx.organizationId,
          limit: input.limit,
        };

        if (input.itemId) searchQuery.itemId = input.itemId;
        if (input.type) searchQuery.type = input.type;
        if (input.source) searchQuery.source = input.source;
        if (input.query) searchQuery.query = input.query;
        if (input.minPrice) searchQuery.minPrice = input.minPrice;
        if (input.maxPrice) searchQuery.maxPrice = input.maxPrice;

        const results = await deps.searchEvidence(ctx.organizationId, searchQuery);

        if (!results || results.length === 0) {
          return JSON.stringify({
            found: 0,
            evidence: [],
            message: 'No evidence found matching your criteria.',
          });
        }

        // Format results
        const formattedEvidence = results.slice(0, input.limit).map((ev: any) => ({
          id: ev.id,
          type: ev.type,
          source: ev.source,
          title: ev.title,
          price: ev.price ? `$${ev.price.toFixed(2)}` : null,
          condition: ev.condition,
          soldDate: ev.soldDate,
          relevanceScore: ev.relevanceScore ? Math.round(ev.relevanceScore * 100) + '%' : null,
          url: ev.url,
        }));

        // Calculate stats for sold listings
        const soldPrices = results
          .filter((e: any) => e.type === 'sold_listing' && e.price)
          .map((e: any) => e.price);

        const stats = soldPrices.length > 0 ? {
          soldCount: soldPrices.length,
          avgPrice: `$${(soldPrices.reduce((a: number, b: number) => a + b, 0) / soldPrices.length).toFixed(2)}`,
          minPrice: `$${Math.min(...soldPrices).toFixed(2)}`,
          maxPrice: `$${Math.max(...soldPrices).toFixed(2)}`,
        } : null;

        return JSON.stringify({
          found: results.length,
          stats,
          evidence: formattedEvidence,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to search evidence: ${message}`,
        });
      }
    },
    {
      name: 'search_evidence',
      description: `Search evidence bundles (comparable listings, product pages, etc.)

Filters:
- itemId: Filter to specific item's evidence
- type: sold_listing, active_listing, product_page, price_guide, ai_analysis
- source: ebay, amazon, etc.
- query: Text search
- minPrice/maxPrice: Price range

Returns evidence items with pricing stats for sold listings.`,
      schema: SearchEvidenceSchema,
    },
  );
}
