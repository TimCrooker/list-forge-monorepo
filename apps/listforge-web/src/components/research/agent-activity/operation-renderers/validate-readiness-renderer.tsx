import {
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Badge, Progress } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface ValidateReadinessData {
  isReady?: boolean
  completionScore?: number
  requiredComplete?: string // "7/7"
  recommendedComplete?: string // "3/5"
  warningsCount?: number
  missingFieldsCount?: number
  totalCost?: number
  totalIterations?: number
  fieldsNeedingUserInput?: string[]
}

/**
 * Parse fraction string to get numerator and denominator
 */
function parseFraction(fraction: string): { num: number; denom: number } {
  const parts = fraction.split('/')
  return {
    num: parseInt(parts[0], 10) || 0,
    denom: parseInt(parts[1], 10) || 1,
  }
}

/**
 * Dual progress bar component
 */
function DualProgress({
  requiredComplete,
  recommendedComplete,
}: {
  requiredComplete?: string
  recommendedComplete?: string
}) {
  const required = requiredComplete ? parseFraction(requiredComplete) : null
  const recommended = recommendedComplete
    ? parseFraction(recommendedComplete)
    : null

  const requiredPct = required
    ? Math.round((required.num / required.denom) * 100)
    : 0
  const recommendedPct = recommended
    ? Math.round((recommended.num / recommended.denom) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 gap-3">
      {required && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Required</span>
            <span className="font-medium">{requiredComplete}</span>
          </div>
          <Progress
            value={requiredPct}
            className="h-2"
          />
        </div>
      )}
      {recommended && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Recommended</span>
            <span className="font-medium">{recommendedComplete}</span>
          </div>
          <Progress
            value={recommendedPct}
            className="h-2"
          />
        </div>
      )}
    </div>
  )
}

/**
 * Renderer for validate_readiness operations
 * Shows final readiness validation summary
 */
export default function ValidateReadinessRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as ValidateReadinessData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No readiness data available
      </div>
    )
  }

  const isReady = data.isReady !== false
  const completionPercent = data.completionScore
    ? Math.round(data.completionScore)
    : 0

  return (
    <div className="space-y-3 text-sm">
      {/* Hero status banner */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${
          isReady
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
            : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
        }`}
      >
        <div className="flex items-center gap-2">
          {isReady ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          )}
          <span
            className={`text-sm font-semibold ${
              isReady
                ? 'text-green-700 dark:text-green-300'
                : 'text-orange-700 dark:text-orange-300'
            }`}
          >
            {isReady ? 'Ready to Publish' : 'Needs Attention'}
          </span>
        </div>
        <Badge
          variant={isReady ? 'default' : 'secondary'}
          className="text-xs"
        >
          {completionPercent}% Complete
        </Badge>
      </div>

      {/* Dual progress bars */}
      {(data.requiredComplete || data.recommendedComplete) && (
        <DualProgress
          requiredComplete={data.requiredComplete}
          recommendedComplete={data.recommendedComplete}
        />
      )}

      {/* Fields needing user input */}
      {data.fieldsNeedingUserInput && data.fieldsNeedingUserInput.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-orange-600 dark:text-orange-400 font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>Needs Your Input</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {data.fieldsNeedingUserInput.map((field) => (
              <Badge
                key={field}
                variant="outline"
                className="text-[10px] border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400"
              >
                {field.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Research stats row */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
        {data.totalCost !== undefined && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>Cost: ${data.totalCost.toFixed(4)}</span>
          </div>
        )}
        {data.totalIterations !== undefined && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{data.totalIterations} iteration{data.totalIterations !== 1 ? 's' : ''}</span>
          </div>
        )}
        {data.warningsCount !== undefined && data.warningsCount > 0 && (
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="h-3 w-3" />
            <span>{data.warningsCount} warning{data.warningsCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

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
