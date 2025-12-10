import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  Clock,
  DollarSign,
} from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface FieldInfo {
  name: string
  displayName?: string
  required?: boolean
}

interface EvaluateFieldsData {
  decision?: 'continue' | 'complete' | 'stop_with_warnings'
  reason?: string
  completionScore?: number
  requiredComplete?: string // "5/7"
  budgetRemaining?: string
  iterationsRemaining?: number
  fieldsNeedingResearch?: (string | FieldInfo)[]
  iteration?: number
}

/**
 * Helper to extract field name from either string or object
 */
function getFieldName(field: string | FieldInfo): string {
  if (typeof field === 'string') {
    return field
  }
  return field.displayName || field.name || 'unknown'
}

/**
 * Helper to get unique key for a field
 */
function getFieldKey(field: string | FieldInfo, index: number): string {
  if (typeof field === 'string') {
    return field
  }
  return field.name || `field-${index}`
}

const decisionConfig = {
  continue: {
    icon: ArrowRight,
    label: 'Continuing Research',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
  },
  complete: {
    icon: CheckCircle2,
    label: 'Research Complete',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
  },
  stop_with_warnings: {
    icon: AlertTriangle,
    label: 'Stopped',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900',
  },
}

/**
 * Mini circular progress indicator
 */
function CircularProgress({
  value,
  size = 40,
}: {
  value: number
  size?: number
}) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const color =
    value >= 80
      ? 'text-green-500'
      : value >= 50
        ? 'text-yellow-500'
        : 'text-red-500'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-bold ${color}`}>{value}%</span>
      </div>
    </div>
  )
}

/**
 * Renderer for evaluate_fields operations
 * Shows field evaluation decision and progress
 */
export default function EvaluateFieldsRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as EvaluateFieldsData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No evaluation data available
      </div>
    )
  }

  const decision = data.decision || 'continue'
  const config = decisionConfig[decision]
  const DecisionIcon = config.icon
  const completionPercent = data.completionScore
    ? Math.round(data.completionScore * 100)
    : 0

  return (
    <div className="space-y-3 text-sm">
      {/* Decision indicator with progress */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded border ${config.bg}`}
        >
          <DecisionIcon className={`h-4 w-4 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
        <CircularProgress value={completionPercent} />
      </div>

      {/* Stop reason (if stopped) */}
      {decision === 'stop_with_warnings' && data.reason && (
        <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
          <span className="text-orange-700 dark:text-orange-300">
            {data.reason}
          </span>
        </div>
      )}

      {/* Progress metrics */}
      <div className="flex items-center gap-4 text-xs">
        {data.requiredComplete && (
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Required:</span>
            <span className="font-medium">{data.requiredComplete}</span>
          </div>
        )}
        {data.iteration !== undefined && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Iteration:</span>
            <span className="font-medium">{data.iteration}</span>
          </div>
        )}
      </div>

      {/* Fields needing research (if continuing) */}
      {decision === 'continue' &&
        data.fieldsNeedingResearch &&
        data.fieldsNeedingResearch.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Fields to Research
            </div>
            <div className="flex flex-wrap gap-1">
              {data.fieldsNeedingResearch.slice(0, 5).map((field, index) => (
                <Badge key={getFieldKey(field, index)} variant="outline" className="text-[10px]">
                  {getFieldName(field).replace(/_/g, ' ')}
                </Badge>
              ))}
              {data.fieldsNeedingResearch.length > 5 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{data.fieldsNeedingResearch.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

      {/* Budget/iterations remaining */}
      {(data.budgetRemaining || data.iterationsRemaining !== undefined) && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {data.budgetRemaining && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>Budget: ${data.budgetRemaining}</span>
            </div>
          )}
          {data.iterationsRemaining !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{data.iterationsRemaining} iterations left</span>
            </div>
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
