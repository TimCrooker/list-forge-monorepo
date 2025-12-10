import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  Users,
  Star,
  Activity,
} from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface DemandAnalysisData {
  demandLevel?: 'high' | 'medium' | 'low'
  salesRank?: number
  offerCount?: number
  reviewCount?: number
  rating?: number
  signals?: string[]
  salesVelocity?: number
  competitionLevel?: string
  priceStability?: string
}

const demandConfig = {
  high: {
    icon: TrendingUp,
    label: 'High Demand',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  },
  medium: {
    icon: Minus,
    label: 'Medium Demand',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
  },
  low: {
    icon: TrendingDown,
    label: 'Low Demand',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  },
}

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Renderer for demand_analysis operations
 * Shows market demand signals and indicators
 */
export default function DemandAnalysisRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as DemandAnalysisData | undefined

  // Handle no data case gracefully
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
        <span>Demand analysis data not available</span>
      </div>
    )
  }

  const demandLevel = data.demandLevel || 'medium'
  const config = demandConfig[demandLevel]
  const DemandIcon = config.icon

  return (
    <div className="space-y-3 text-sm">
      {/* Demand level badge */}
      {data.demandLevel && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded border ${config.bg}`}
        >
          <DemandIcon className={`h-4 w-4 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
      )}

      {/* Market metrics grid */}
      {(data.salesRank !== undefined ||
        data.offerCount !== undefined ||
        data.reviewCount !== undefined ||
        data.rating !== undefined) && (
        <div className="grid grid-cols-2 gap-2">
          {data.salesRank !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-xs">
                <div className="text-muted-foreground">Sales Rank</div>
                <div className="font-medium">{formatNumber(data.salesRank)}</div>
              </div>
            </div>
          )}
          {data.offerCount !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-xs">
                <div className="text-muted-foreground">Sellers</div>
                <div className="font-medium">{data.offerCount}</div>
              </div>
            </div>
          )}
          {data.reviewCount !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-xs">
                <div className="text-muted-foreground">Reviews</div>
                <div className="font-medium">{formatNumber(data.reviewCount)}</div>
              </div>
            </div>
          )}
          {data.rating !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Star className="h-3.5 w-3.5 text-yellow-500" />
              <div className="text-xs">
                <div className="text-muted-foreground">Rating</div>
                <div className="font-medium">{data.rating.toFixed(1)}/5</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional signals */}
      {data.signals && data.signals.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Demand Signals
          </div>
          <div className="flex flex-wrap gap-1">
            {data.signals.map((signal, index) => (
              <Badge key={index} variant="secondary" className="text-[10px]">
                {signal}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Competition/price stability info */}
      {(data.competitionLevel || data.priceStability) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {data.competitionLevel && (
            <span>Competition: {data.competitionLevel}</span>
          )}
          {data.priceStability && (
            <span>Price: {data.priceStability}</span>
          )}
        </div>
      )}

      {/* Error state */}
      {operation.error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-600 dark:text-red-400">
            {operation.error}
          </p>
        </div>
      )}
    </div>
  )
}
