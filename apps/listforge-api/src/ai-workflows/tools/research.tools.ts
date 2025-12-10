import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext } from './index';

// ============================================================================
// Schemas
// ============================================================================

const GetResearchDataSchema = z.object({
  itemId: z.string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric with hyphens/underscores only')
    .describe('The item ID to get research for'),
});

const SearchCompsSchema = z.object({
  itemId: z.string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric')
    .optional()
    .describe('Item ID to search comps for (uses item attributes)'),
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(200, 'Query too long')
    .optional()
    .describe('Search query for comps (brand, model, keywords)'),
  marketplace: z.enum(['ebay', 'amazon']).default('ebay').describe('Marketplace to search'),
  soldOnly: z.boolean().default(true).describe('Only search sold/completed listings'),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(10)
    .describe('Max number of comps to return'),
  minPrice: z.number()
    .nonnegative('Minimum price cannot be negative')
    .optional()
    .describe('Minimum price filter'),
  maxPrice: z.number()
    .positive('Maximum price must be positive')
    .optional()
    .describe('Maximum price filter'),
  condition: z.string()
    .max(50, 'Condition string too long')
    .optional()
    .describe('Condition filter (e.g., "used", "new")'),
}).refine(
  (data) => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
  { message: 'Minimum price must be less than or equal to maximum price', path: ['minPrice'] },
).refine(
  (data) => data.itemId || data.query,
  { message: 'Either itemId or query must be provided', path: ['query'] },
);

const TriggerResearchSchema = z.object({
  itemId: z.string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric')
    .describe('The item ID to research'),
  runType: z.enum(['initial_intake', 'pricing_refresh', 'manual_request'])
    .default('manual_request')
    .describe('Type of research run'),
  priority: z.enum(['low', 'normal', 'high']).default('normal').describe('Job priority'),
});

const GetPricingAnalysisSchema = z.object({
  itemId: z.string()
    .min(1, 'Item ID cannot be empty')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Item ID must be alphanumeric')
    .describe('The item ID to analyze pricing for'),
});

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Get Research Data Tool
 *
 * Returns the latest research data for an item including:
 * - Price bands (floor, target, ceiling)
 * - Pricing strategies with time-to-sell estimates
 * - Demand signals
 * - Missing information hints
 * - Marketplace category
 * - Field completion status
 */
export function getResearchDataTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof GetResearchDataSchema>) => {
      const ctx = getToolContext();

      try {
        const research = await deps.getLatestResearch(input.itemId, ctx.organizationId);

        if (!research) {
          return JSON.stringify({
            hasResearch: false,
            message: 'No research data available for this item. Use trigger_research to start research.',
            suggestion: 'Would you like me to start a research job for this item?',
          });
        }

        const data = research.data;

        // Calculate research age
        const researchDate = new Date(data.generatedAt);
        const ageInDays = Math.floor((Date.now() - researchDate.getTime()) / (1000 * 60 * 60 * 24));
        const isStale = ageInDays > 7;

        return JSON.stringify({
          hasResearch: true,
          itemId: input.itemId,
          generatedAt: data.generatedAt,
          ageInDays,
          isStale,
          staleMessage: isStale ? 'Research is over 7 days old. Consider refreshing.' : null,

          // Price recommendations
          priceBands: data.priceBands?.map(band => ({
            label: band.label,
            amount: band.amount,
            currency: band.currency,
            confidence: Math.round(band.confidence * 100) + '%',
            reasoning: band.reasoning,
          })),

          // Pricing strategies
          pricingStrategies: data.pricingStrategies?.map(strategy => ({
            strategy: strategy.strategy,
            label: strategy.label,
            price: strategy.price,
            currency: strategy.currency,
            estimatedDaysToSell: `${strategy.estimatedDaysToSell.min}-${strategy.estimatedDaysToSell.max} days`,
            confidence: Math.round(strategy.confidence * 100) + '%',
            reasoning: strategy.reasoning,
          })),

          // Market signals
          demandSignals: data.demandSignals?.map(signal => ({
            metric: signal.metric,
            value: signal.value,
            unit: signal.unit,
            period: signal.period,
            direction: signal.direction,
          })),

          // Missing info
          missingInfo: data.missingInfo?.map(info => ({
            field: info.field,
            importance: info.importance,
            reason: info.reason,
            suggestedPrompt: info.suggestedPrompt,
          })),

          // Marketplace category
          marketplaceCategory: data.marketplaceCategory ? {
            marketplace: data.marketplaceCategory.marketplace,
            categoryPath: data.marketplaceCategory.categoryPath.join(' > '),
            confidence: Math.round(data.marketplaceCategory.confidence * 100) + '%',
          } : null,

          // Field completion
          fieldCompletion: data.fieldCompletion ? {
            required: `${data.fieldCompletion.required.filled}/${data.fieldCompletion.required.total}`,
            requiredMissing: data.fieldCompletion.required.missing,
            recommended: `${data.fieldCompletion.recommended.filled}/${data.fieldCompletion.recommended.total}`,
            recommendedMissing: data.fieldCompletion.recommended.missing,
            readinessScore: Math.round(data.fieldCompletion.readinessScore * 100) + '%',
          } : null,

          competitorCount: data.competitorCount,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to get research data: ${message}`,
        });
      }
    },
    {
      name: 'get_research_data',
      description: `Get the latest research data for an item.

Returns:
- Price bands (floor, target, ceiling prices with confidence)
- Pricing strategies (aggressive/balanced/premium with time-to-sell estimates)
- Demand signals (sell-through rate, competition, price trends)
- Missing information hints
- Marketplace category detection
- Field completion status for listing readiness

If research is over 7 days old, it will be marked as stale.`,
      schema: GetResearchDataSchema,
    },
  );
}

/**
 * Search Comps Tool
 *
 * Searches for comparable listings on marketplaces.
 * Can search based on an item's attributes or a custom query.
 */
export function searchCompsTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof SearchCompsSchema>) => {
      const ctx = getToolContext();

      try {
        // Build search params
        const searchParams: any = {
          organizationId: ctx.organizationId,
          marketplace: input.marketplace,
          soldOnly: input.soldOnly,
          limit: input.limit,
        };

        // If itemId provided, get item attributes for search
        if (input.itemId) {
          const item = await deps.getItem(ctx.organizationId, input.itemId);
          if (item) {
            searchParams.title = item.title;
            searchParams.brand = item.attributes?.find((a: any) => a.key.toLowerCase() === 'brand')?.value;
            searchParams.model = item.attributes?.find((a: any) => a.key.toLowerCase() === 'model')?.value;
            searchParams.condition = item.condition;
          }
        }

        // Override with explicit query if provided
        if (input.query) {
          searchParams.query = input.query;
        }

        // Add filters
        if (input.minPrice) searchParams.minPrice = input.minPrice;
        if (input.maxPrice) searchParams.maxPrice = input.maxPrice;
        if (input.condition) searchParams.condition = input.condition;

        const results = await deps.searchComps(searchParams);

        if (!results || results.length === 0) {
          return JSON.stringify({
            found: 0,
            comps: [],
            message: 'No comparable listings found. Try broadening your search criteria.',
          });
        }

        // Format results
        const formattedComps = results.slice(0, input.limit).map((comp: any) => ({
          id: comp.id || comp.sourceId,
          title: comp.title,
          price: comp.price ? `$${comp.price.toFixed(2)}` : null,
          condition: comp.condition,
          soldDate: comp.soldDate,
          source: comp.source,
          url: comp.url,
          relevanceScore: comp.relevanceScore ? Math.round(comp.relevanceScore * 100) + '%' : null,
          validation: comp.validation ? {
            isValid: comp.validation.isValid,
            score: Math.round(comp.validation.overallScore * 100) + '%',
          } : null,
        }));

        // Calculate stats
        const prices = results
          .filter((c: any) => c.price)
          .map((c: any) => c.price);

        const stats = prices.length > 0 ? {
          count: prices.length,
          avgPrice: `$${(prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toFixed(2)}`,
          minPrice: `$${Math.min(...prices).toFixed(2)}`,
          maxPrice: `$${Math.max(...prices).toFixed(2)}`,
        } : null;

        return JSON.stringify({
          found: results.length,
          marketplace: input.marketplace,
          soldOnly: input.soldOnly,
          stats,
          comps: formattedComps,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to search comps: ${message}`,
        });
      }
    },
    {
      name: 'search_comps',
      description: `Search for comparable listings on marketplaces (eBay, Amazon).

Options:
- itemId: Use item's attributes for search (recommended)
- query: Custom search query (overrides itemId attributes)
- marketplace: "ebay" or "amazon" (default: ebay)
- soldOnly: Only completed sales (default: true for pricing)
- limit: Max results (default: 10, max: 50)
- minPrice/maxPrice: Price filters
- condition: Condition filter

Returns matching listings with prices, conditions, and relevance scores.`,
      schema: SearchCompsSchema,
    },
  );
}

/**
 * Trigger Research Tool
 *
 * Starts a new research job for an item.
 * Research includes product identification, comp search, pricing analysis.
 */
export function triggerResearchTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof TriggerResearchSchema>) => {
      const ctx = getToolContext();

      try {
        // Check if item exists
        const item = await deps.getItem(ctx.organizationId, input.itemId);
        if (!item) {
          return JSON.stringify({
            error: true,
            message: `Item ${input.itemId} not found`,
          });
        }

        // Start research job
        const result = await deps.startResearchJob({
          itemId: input.itemId,
          priority: input.priority,
          options: {
            runType: input.runType,
          },
        });

        return JSON.stringify({
          success: true,
          jobId: result.jobId,
          status: result.status,
          itemId: input.itemId,
          runType: input.runType,
          message: `Research job started. Job ID: ${result.jobId}. You can track progress in the Research tab.`,
          note: 'Research typically takes 30-90 seconds depending on item complexity.',
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to start research: ${message}`,
        });
      }
    },
    {
      name: 'trigger_research',
      description: `Start a new research job for an item.

Research includes:
- Product identification (brand, model, attributes)
- Comparable sales search
- Price band calculation
- Demand signal analysis
- Marketplace category detection
- Listing readiness assessment

Run types:
- initial_intake: First-time research during capture
- pricing_refresh: Re-run pricing research only
- manual_request: User-triggered full research

Priority: low, normal, high (affects queue position)

Returns job ID for tracking. Research typically takes 30-90 seconds.`,
      schema: TriggerResearchSchema,
    },
  );
}

/**
 * Get Pricing Analysis Tool
 *
 * Returns a detailed pricing analysis for an item.
 * This is a convenience tool that combines research data with recommendations.
 */
export function getPricingAnalysisTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof GetPricingAnalysisSchema>) => {
      const ctx = getToolContext();

      try {
        // Get item
        const item = await deps.getItem(ctx.organizationId, input.itemId);
        if (!item) {
          return JSON.stringify({
            error: true,
            message: `Item ${input.itemId} not found`,
          });
        }

        // Get research
        const research = await deps.getLatestResearch(input.itemId, ctx.organizationId);

        const analysis: any = {
          itemId: input.itemId,
          title: item.title,
          currentPrice: item.defaultPrice ? `$${item.defaultPrice.toFixed(2)}` : 'Not set',
          currentStrategy: item.pricingStrategy || 'Not set',
        };

        if (!research) {
          analysis.hasResearch = false;
          analysis.message = 'No research data available. Run research for pricing recommendations.';
          analysis.recommendation = 'Use trigger_research to get pricing data.';
        } else {
          const data = research.data;
          analysis.hasResearch = true;
          analysis.researchAge = Math.floor(
            (Date.now() - new Date(data.generatedAt).getTime()) / (1000 * 60 * 60 * 24)
          ) + ' days ago';

          // Price bands
          if (data.priceBands?.length) {
            const floor = data.priceBands.find(b => b.label === 'floor');
            const target = data.priceBands.find(b => b.label === 'target');
            const ceiling = data.priceBands.find(b => b.label === 'ceiling');

            analysis.priceBands = {
              floor: floor ? `$${floor.amount.toFixed(2)}` : null,
              target: target ? `$${target.amount.toFixed(2)}` : null,
              ceiling: ceiling ? `$${ceiling.amount.toFixed(2)}` : null,
            };

            // Compare current price to bands
            if (item.defaultPrice && target) {
              const diff = item.defaultPrice - target.amount;
              const diffPercent = (diff / target.amount) * 100;
              if (diffPercent > 10) {
                analysis.priceAssessment = `Current price is ${diffPercent.toFixed(0)}% above target. May take longer to sell.`;
              } else if (diffPercent < -10) {
                analysis.priceAssessment = `Current price is ${Math.abs(diffPercent).toFixed(0)}% below target. May be leaving money on table.`;
              } else {
                analysis.priceAssessment = 'Current price is well-aligned with target.';
              }
            }
          }

          // Strategies
          if (data.pricingStrategies?.length) {
            analysis.strategies = data.pricingStrategies.map(s => ({
              name: s.label,
              price: `$${s.price.toFixed(2)}`,
              timeToSell: `${s.estimatedDaysToSell.min}-${s.estimatedDaysToSell.max} days`,
            }));
          }

          // Demand signals
          if (data.demandSignals?.length) {
            const sellThrough = data.demandSignals.find(s => s.metric === 'sell_through_rate');
            const competition = data.demandSignals.find(s => s.metric === 'active_competition');

            analysis.marketInsights = {};
            if (sellThrough) {
              analysis.marketInsights.sellThroughRate = `${sellThrough.value}${sellThrough.unit}`;
            }
            if (competition) {
              analysis.marketInsights.activeCompetitors = competition.value;
            }
          }
        }

        return JSON.stringify(analysis, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to get pricing analysis: ${message}`,
        });
      }
    },
    {
      name: 'get_pricing_analysis',
      description: `Get a comprehensive pricing analysis for an item.

Combines item data with research to provide:
- Current price vs recommended price bands
- Assessment of current pricing (too high/low/good)
- Available pricing strategies with time-to-sell
- Market insights (sell-through rate, competition)

Use this when users ask "what should I price this at?" or "is my price good?"`,
      schema: GetPricingAnalysisSchema,
    },
  );
}
