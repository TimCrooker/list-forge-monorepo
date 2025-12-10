import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Clock,
  BarChart3,
} from 'lucide-react'
import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@listforge/ui'
import type { OperationRendererProps } from './index'

/**
 * Validation criteria from the comp validation tool
 */
interface ValidationCriteria {
  brand?: boolean
  model?: boolean
  condition?: boolean
  recency?: boolean
  variant?: boolean
}

/**
 * Comp with validation data
 */
interface CompWithValidation {
  id?: string
  title?: string
  price?: number
  condition?: string
  relevanceScore?: number
  validation?: {
    isValid?: boolean
    overallScore?: number
    criteria?: ValidationCriteria
    reasoning?: string
  }
}

/**
 * Criteria breakdown stats
 */
interface CriteriaBreakdown {
  brand?: number
  model?: number
  condition?: number
  recency?: number
  variant?: number
}

/**
 * Validation badge component - shows a small check or X icon for a criterion
 */
function ValidationBadgeIcon({
  matches,
  label,
  tooltip,
}: {
  matches: boolean
  label: string
  tooltip?: string
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${
              matches
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {matches ? (
              <CheckCircle2 className="h-2.5 w-2.5" />
            ) : (
              <XCircle className="h-2.5 w-2.5" />
            )}
            <span>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-xs">
          {tooltip || (matches ? `${label} matches` : `${label} doesn't match`)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Validation badges row for a comp
 */
function ValidationBadges({ criteria }: { criteria?: ValidationCriteria }) {
  if (!criteria) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {typeof criteria.brand === 'boolean' && (
        <ValidationBadgeIcon matches={criteria.brand} label="Brand" />
      )}
      {typeof criteria.model === 'boolean' && (
        <ValidationBadgeIcon matches={criteria.model} label="Model" />
      )}
      {typeof criteria.condition === 'boolean' && (
        <ValidationBadgeIcon matches={criteria.condition} label="Cond" />
      )}
      {typeof criteria.recency === 'boolean' && (
        <ValidationBadgeIcon matches={criteria.recency} label="Recent" />
      )}
      {typeof criteria.variant === 'boolean' && (
        <ValidationBadgeIcon matches={criteria.variant} label="Variant" />
      )}
    </div>
  )
}

/**
 * Expandable comp item with validation details
 */
function CompItem({ comp }: { comp: CompWithValidation }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasValidation = !!comp.validation

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="bg-muted/30 rounded overflow-hidden">
        <CollapsibleTrigger className="w-full px-2 py-1.5 flex items-start justify-between gap-2 hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="truncate">{comp.title || 'Untitled'}</span>
              {hasValidation && (
                <Badge
                  variant={comp.validation?.isValid ? 'default' : 'secondary'}
                  className={`text-[10px] px-1 py-0 ${
                    comp.validation?.isValid
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {comp.validation?.isValid ? 'Valid' : 'Filtered'}
                </Badge>
              )}
            </div>
            {hasValidation && (
              <ValidationBadges criteria={comp.validation?.criteria} />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs flex-shrink-0">
            {typeof comp.price === 'number' && (
              <span className="font-medium">${comp.price.toFixed(2)}</span>
            )}
            {typeof comp.relevanceScore === 'number' && (
              <span
                className={
                  comp.relevanceScore >= 0.7
                    ? 'text-green-600 dark:text-green-400'
                    : comp.relevanceScore >= 0.5
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-500'
                }
              >
                {(comp.relevanceScore * 100).toFixed(0)}%
              </span>
            )}
            {hasValidation && (
              isExpanded ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {comp.validation?.reasoning && (
            <div className="px-2 py-2 border-t border-muted/50 text-xs text-muted-foreground bg-muted/20">
              <div className="font-medium mb-1 text-foreground/70">Validation Details</div>
              <p className="leading-relaxed">{comp.validation.reasoning}</p>
              {comp.condition && (
                <div className="mt-1 text-[10px] text-muted-foreground">
                  Condition: {comp.condition}
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

/**
 * Criteria breakdown visualization
 */
function CriteriaBreakdownChart({
  breakdown,
  total,
}: {
  breakdown?: CriteriaBreakdown
  total?: number
}) {
  if (!breakdown || !total || total === 0) return null

  const criteria = [
    { key: 'brand', label: 'Brand', icon: Tag, value: breakdown.brand ?? 0 },
    { key: 'model', label: 'Model', icon: Package, value: breakdown.model ?? 0 },
    { key: 'condition', label: 'Condition', icon: BarChart3, value: breakdown.condition ?? 0 },
    { key: 'recency', label: 'Recency', icon: Clock, value: breakdown.recency ?? 0 },
  ]

  return (
    <div className="space-y-2">
      <div className="font-medium text-xs uppercase text-muted-foreground">
        Criteria Match Rates
      </div>
      <div className="grid grid-cols-2 gap-2">
        {criteria.map(({ key, label, icon: Icon, value }) => {
          const percentage = Math.round((value / total) * 100)
          return (
            <div
              key={key}
              className="flex items-center gap-2 p-2 bg-muted/20 rounded"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{label}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percentage >= 70
                          ? 'bg-green-500'
                          : percentage >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-8">
                    {percentage}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Renderer for comp_analysis operations
 * Slice 3: Enhanced with validation badges and criteria breakdown
 */
export default function CompAnalysisRenderer({ operation }: OperationRendererProps) {
  const completedEvent = operation.events.find((e) => e.eventType === 'completed')
  const data = completedEvent?.data || {}

  const totalScored = data.totalScored as number | undefined
  const relevantCount = data.relevantCount as number | undefined
  const scoreDistribution = data.scoreDistribution as {
    high?: number
    medium?: number
    low?: number
  } | undefined

  // Slice 3: Validation data
  const validated = data.validated as { passed?: number; failed?: number } | undefined
  const criteriaBreakdown = data.criteriaBreakdown as CriteriaBreakdown | undefined
  const topComps = data.topComps as CompWithValidation[] | undefined
  const itemContext = data.itemContext as {
    brand?: string
    model?: string
    condition?: string
  } | undefined

  return (
    <div className="space-y-4 text-sm">
      {/* Item context used for validation */}
      {itemContext && (itemContext.brand || itemContext.model) && (
        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900/50">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            Validating Against
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {itemContext.brand && (
              <span className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                Brand: {itemContext.brand}
              </span>
            )}
            {itemContext.model && (
              <span className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                Model: {itemContext.model}
              </span>
            )}
            {itemContext.condition && (
              <span className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                Condition: {itemContext.condition}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Validation summary - Slice 3 */}
      {validated && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {validated.passed ?? 0}
            </div>
            <div className="text-xs text-green-600/70 dark:text-green-400/70">
              Validated
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-950/30 rounded-lg p-2 text-center">
            <div className="text-lg font-semibold text-gray-500">
              {validated.failed ?? 0}
            </div>
            <div className="text-xs text-gray-500/70">
              Filtered Out
            </div>
          </div>
        </div>
      )}

      {/* Fallback to score distribution if no validation data */}
      {!validated && scoreDistribution && (
        <div className="space-y-2">
          <div className="font-medium text-xs uppercase text-muted-foreground">
            Relevance Scoring
          </div>
          <div className="grid grid-cols-3 gap-2">
            {typeof scoreDistribution.high === 'number' && (
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {scoreDistribution.high}
                </div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70">
                  High Match
                </div>
              </div>
            )}
            {typeof scoreDistribution.medium === 'number' && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {scoreDistribution.medium}
                </div>
                <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
                  Moderate
                </div>
              </div>
            )}
            {typeof scoreDistribution.low === 'number' && (
              <div className="bg-gray-50 dark:bg-gray-950/30 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-gray-500">
                  {scoreDistribution.low}
                </div>
                <div className="text-xs text-gray-500/70">
                  Filtered Out
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Criteria breakdown - Slice 3 */}
      <CriteriaBreakdownChart breakdown={criteriaBreakdown} total={totalScored} />

      {/* Summary stats */}
      {(typeof totalScored === 'number' || typeof relevantCount === 'number') && (
        <div className="flex items-center gap-4 text-muted-foreground">
          {typeof totalScored === 'number' && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{totalScored} analyzed</span>
            </div>
          )}
          {typeof relevantCount === 'number' && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{relevantCount} validated</span>
            </div>
          )}
        </div>
      )}

      {/* Top matches with validation - Slice 3 Enhanced */}
      {topComps && topComps.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium text-xs uppercase text-muted-foreground">
            Top Validated Comparables
          </div>
          <div className="space-y-1.5">
            {topComps.slice(0, 5).map((comp, idx) => (
              <CompItem key={comp.id || idx} comp={comp} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
