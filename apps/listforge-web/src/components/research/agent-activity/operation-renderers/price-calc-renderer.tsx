import { TrendingUp, TrendingDown, Target, Info } from 'lucide-react'
import { Badge, Progress } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface PriceBand {
  label: 'floor' | 'target' | 'ceiling'
  amount: number
  currency?: string
  confidence?: number
  reasoning?: string
}

interface PriceCalcData {
  priceBands?: PriceBand[]
  floor?: number
  target?: number
  ceiling?: number
  currency?: string
  confidence?: number
  reasoning?: string
  compsUsed?: number
  methodology?: string
}

const bandConfig = {
  floor: {
    icon: TrendingDown,
    label: 'Floor',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900',
  },
  target: {
    icon: Target,
    label: 'Target',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
  },
  ceiling: {
    icon: TrendingUp,
    label: 'Ceiling',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
  },
}

/**
 * Renderer for price calculation operations
 * Shows price bands, confidence, and reasoning
 */
export default function PriceCalcRenderer({
  operation,
}: OperationRendererProps) {
  // Extract data from completed event
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as PriceCalcData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No pricing data available
      </div>
    )
  }

  // Build price bands from either structured or flat data
  const priceBands: PriceBand[] =
    data.priceBands ||
    [
      data.floor && {
        label: 'floor' as const,
        amount: data.floor,
        currency: data.currency,
      },
      data.target && {
        label: 'target' as const,
        amount: data.target,
        currency: data.currency,
      },
      data.ceiling && {
        label: 'ceiling' as const,
        amount: data.ceiling,
        currency: data.currency,
      },
    ].filter(Boolean) as PriceBand[]

  const confidence = data.confidence
    ? Math.round(data.confidence * 100)
    : undefined
  const currency = data.currency || 'USD'

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Price bands */}
      {priceBands.length > 0 && (
        <div className="grid gap-2">
          {priceBands.map((band) => {
            const config = bandConfig[band.label]
            const Icon = config.icon

            return (
              <div
                key={band.label}
                className={`flex items-center justify-between p-3 rounded border ${config.bg}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className="text-xs font-medium">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${config.color}`}>
                    {formatPrice(band.amount)}
                  </span>
                  {band.confidence !== undefined && (
                    <Badge variant="secondary" className="text-[10px]">
                      {Math.round(band.confidence * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Overall confidence */}
      {confidence !== undefined && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overall Confidence</span>
            <span
              className={
                confidence >= 80
                  ? 'text-green-600 font-medium'
                  : confidence >= 50
                    ? 'text-yellow-600 font-medium'
                    : 'text-red-600 font-medium'
              }
            >
              {confidence}%
            </span>
          </div>
          <Progress value={confidence} className="h-1.5" />
        </div>
      )}

      {/* Methodology/reasoning */}
      {(data.reasoning || data.methodology) && (
        <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            {data.reasoning || data.methodology}
          </p>
        </div>
      )}

      {/* Comps used */}
      {data.compsUsed !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Based on</span>
          <Badge variant="outline" className="text-[10px]">
            {data.compsUsed} comparable{data.compsUsed !== 1 ? 's' : ''}
          </Badge>
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
