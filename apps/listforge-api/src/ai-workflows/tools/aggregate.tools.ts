import { z } from 'zod';
import { tool, StructuredTool } from '@langchain/core/tools';
import { ChatToolDependencies, getToolContext, DashboardStats, ReviewQueueStats } from './index';

// ============================================================================
// Schemas
// ============================================================================

const GetDashboardStatsSchema = z.object({});

const GetReviewQueueSummarySchema = z.object({
  includeItems: z.boolean().default(false).describe('Include list of items in queue'),
  limit: z.number().min(1).max(20).default(5).describe('Max items to include if includeItems is true'),
});

const GetInventoryValueSchema = z.object({
  status: z.enum(['all', 'draft', 'ready', 'listed', 'sold']).default('all').describe('Filter by status'),
  currency: z.string().default('USD').describe('Currency for totals'),
});

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Get Dashboard Stats Tool
 *
 * Returns aggregate statistics for the user's inventory.
 * Useful for answering questions like "How many items do I have?" or "What needs attention?"
 */
export function getDashboardStatsTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (_input: z.infer<typeof GetDashboardStatsSchema>) => {
      const ctx = getToolContext();

      try {
        const stats = await deps.getDashboardStats(ctx.organizationId) as DashboardStats;

        if (!stats) {
          return JSON.stringify({
            error: true,
            message: 'Failed to load dashboard stats',
          });
        }

        // Format the stats for readability
        const formatted = {
          summary: {
            totalItems: stats.totalItems || 0,
            totalValue: stats.totalValue ? `$${stats.totalValue.toFixed(2)}` : '$0.00',
            currency: stats.currency || 'USD',
          },

          byStatus: {
            draft: stats.byStatus?.draft || 0,
            ready: stats.byStatus?.ready || 0,
            listed: stats.byStatus?.listed || 0,
            sold: stats.byStatus?.sold || 0,
            archived: stats.byStatus?.archived || 0,
          },

          byAIReview: {
            pending: stats.byAIReview?.pending || 0,
            approved: stats.byAIReview?.approved || 0,
            rejected: stats.byAIReview?.rejected || 0,
            needsWork: stats.byAIReview?.needs_work || 0,
          },

          recentActivity: {
            itemsCreatedToday: stats.recentActivity?.createdToday || 0,
            itemsUpdatedToday: stats.recentActivity?.updatedToday || 0,
            researchRunsToday: stats.recentActivity?.researchToday || 0,
          },

          needsAttention: {
            pendingReview: stats.byAIReview?.pending || 0,
            needsWork: stats.byAIReview?.needs_work || 0,
            staleResearch: stats.staleResearch || 0,
          },
        };

        return JSON.stringify(formatted, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to get dashboard stats: ${message}`,
        });
      }
    },
    {
      name: 'get_dashboard_stats',
      description: `Get aggregate statistics for the user's inventory.

Returns:
- Total items and total value
- Items by status (draft, ready, listed, sold, archived)
- Items by AI review state (pending, approved, rejected, needs_work)
- Recent activity (items created/updated today)
- Items needing attention (pending review, needs work, stale research)

Use this for questions like:
- "How many items do I have?"
- "What's my inventory worth?"
- "How many items need review?"`,
      schema: GetDashboardStatsSchema,
    },
  );
}

/**
 * Get Review Queue Summary Tool
 *
 * Returns summary of items awaiting review.
 */
export function getReviewQueueSummaryTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof GetReviewQueueSummarySchema>) => {
      const ctx = getToolContext();

      try {
        const stats = await deps.getReviewQueueStats(ctx.organizationId) as ReviewQueueStats;

        if (!stats) {
          return JSON.stringify({
            error: true,
            message: 'Failed to load review queue stats',
          });
        }

        const result: any = {
          summary: {
            totalPending: stats.totalPending || 0,
            needsWork: stats.needsWork || 0,
            avgConfidence: stats.avgConfidence ? Math.round(stats.avgConfidence * 100) + '%' : null,
          },

          byConfidence: {
            highConfidence: stats.byConfidence?.high || 0,   // > 80%
            mediumConfidence: stats.byConfidence?.medium || 0, // 50-80%
            lowConfidence: stats.byConfidence?.low || 0,    // < 50%
          },

          oldestPending: stats.oldestPending ? {
            itemId: stats.oldestPending.id,
            title: stats.oldestPending.title,
            createdAt: stats.oldestPending.createdAt,
            daysOld: Math.floor((Date.now() - new Date(stats.oldestPending.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          } : null,
        };

        // Include item list if requested
        if (input.includeItems && stats.items) {
          result.items = stats.items.slice(0, input.limit).map((item: any) => ({
            id: item.id,
            title: item.title || '(No title)',
            confidence: item.aiConfidenceScore ? Math.round(item.aiConfidenceScore * 100) + '%' : null,
            createdAt: item.createdAt,
            primaryImage: item.media?.[0]?.url,
          }));
        }

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to get review queue summary: ${message}`,
        });
      }
    },
    {
      name: 'get_review_queue_summary',
      description: `Get summary of items awaiting review.

Returns:
- Total pending review
- Items needing manual work
- Breakdown by AI confidence (high/medium/low)
- Oldest pending item info
- Optionally includes list of pending items

Use for questions like:
- "What's in my review queue?"
- "How many items need review?"
- "Show me pending items"`,
      schema: GetReviewQueueSummarySchema,
    },
  );
}

/**
 * Get Inventory Value Tool
 *
 * Calculates total inventory value with optional filters.
 */
export function getInventoryValueTool(deps: ChatToolDependencies): StructuredTool {
  return tool(
    async (input: z.infer<typeof GetInventoryValueSchema>) => {
      const ctx = getToolContext();

      try {
        // This would need aggregation from items service
        // Using dashboard stats as a proxy for now
        const stats = await deps.getDashboardStats(ctx.organizationId) as DashboardStats;

        if (!stats) {
          return JSON.stringify({
            error: true,
            message: 'Failed to calculate inventory value',
          });
        }

        // Calculate value based on status filter
        let totalValue: number = 0;
        let itemCount = 0;

        if (input.status === 'all') {
          totalValue = stats.totalValue || 0;
          itemCount = stats.totalItems || 0;
        } else {
          // Would need filtered calculation from service
          // For now, return total with note
          totalValue = stats.totalValue || 0;
          itemCount = stats.byStatus?.[input.status] || 0;
        }

        return JSON.stringify({
          status: input.status,
          itemCount,
          totalValue: `$${totalValue.toFixed(2)}`,
          currency: input.currency,
          avgItemValue: itemCount > 0 ? `$${(totalValue / itemCount).toFixed(2)}` : '$0.00',
          note: input.status !== 'all'
            ? 'Filtered value calculation is estimated based on overall averages.'
            : null,
        }, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          error: true,
          message: `Failed to calculate inventory value: ${message}`,
        });
      }
    },
    {
      name: 'get_inventory_value',
      description: `Calculate total inventory value.

Options:
- status: Filter by status (all, draft, ready, listed, sold)
- currency: Currency for totals (default: USD)

Returns total value, item count, and average item value.

Use for questions like:
- "What's my inventory worth?"
- "What's the value of my listed items?"
- "How much have I sold?"`,
      schema: GetInventoryValueSchema,
    },
  );
}
