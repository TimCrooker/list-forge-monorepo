import { useState } from 'react'
import {
  DollarSign,
  Package,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import {
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@listforge/ui'
import type { OperationRendererProps } from './index'

/**
 * Validation criteria for a comp
 */
interface ValidationCriteria {
  brand?: boolean
  model?: boolean
  condition?: boolean
  recency?: boolean
  variant?: boolean
}

/**
 * Comp listing with optional validation data
 */
interface CompListing {
  title: string
  price?: number
  currency?: string
  source?: string
  url?: string
  soldDate?: string
  condition?: string
  type?: 'sold_listing' | 'active_listing'
  relevanceScore?: number
  validation?: {
    isValid?: boolean
    overallScore?: number
    criteria?: ValidationCriteria
    reasoning?: string
  }
}

interface CompSearchData {
  query?: string
  queries?: string[]
  source?: string
  totalComps?: number
  totalFound?: number
  comps?: CompListing[]
  soldListings?: number
  activeListings?: number
}

/**
 * Filter type for showing comps
 */
type FilterType = 'all' | 'validated' | 'filtered'

/**
 * Validation badge mini-indicator
 */
function ValidationIndicator({ validation }: { validation?: CompListing['validation'] }) {
  if (!validation) return null

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${
              validation.isValid
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {validation.isValid ? (
              <CheckCircle2 className="h-2.5 w-2.5" />
            ) : (
              <XCircle className="h-2.5 w-2.5" />
            )}
            <span>{validation.isValid ? 'Valid' : 'Filtered'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-xs">
          {validation.reasoning || (validation.isValid ? 'Passes validation' : 'Did not pass validation')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Renderer for comparable search operations
 * Slice 3: Enhanced with filter controls for validated/all comps
 */
export default function CompSearchRenderer({
  operation,
}: OperationRendererProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  // Extract data from events
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const completedData = completedEvent?.data as CompSearchData | undefined

  // Collect comps from progress events
  const allComps: CompListing[] = []
  for (const event of operation.events) {
    if (event.eventType === 'progress' && event.data) {
      const data = event.data as CompSearchData
      if (data.comps) allComps.push(...data.comps)
    }
  }

  // Also add from completed
  if (completedData?.comps) allComps.push(...completedData.comps)

  // Deduplicate by title
  const uniqueComps = allComps.filter(
    (comp, index, self) =>
      index === self.findIndex((c) => c.title === comp.title)
  )

  // Check if any comps have validation data
  const hasValidationData = uniqueComps.some((c) => c.validation !== undefined)

  // Filter comps based on filter type
  const filteredComps = uniqueComps.filter((comp) => {
    if (filter === 'all') return true
    if (filter === 'validated') return comp.validation?.isValid === true
    if (filter === 'filtered') return comp.validation?.isValid === false
    return true
  })

  // Count validated vs filtered
  const validatedCount = uniqueComps.filter((c) => c.validation?.isValid).length
  const filteredOutCount = uniqueComps.filter((c) => c.validation && !c.validation.isValid).length
  const pendingCount = uniqueComps.filter((c) => !c.validation).length

  // Calculate price stats from displayed comps
  const prices = filteredComps
    .filter((c) => c.price && c.price > 0)
    .map((c) => c.price!)
  const minPrice = prices.length > 0 ? Math.min(...prices) : null
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null
  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null

  const queries = completedData?.queries
  const source = completedData?.source
  const soldListings = completedData?.soldListings
  const activeListings = completedData?.activeListings

  return (
    <div className="space-y-3 text-sm">
      {/* Search info */}
      {(queries || source) && (
        <div className="space-y-1">
          {source && (
            <Badge variant="outline" className="text-[10px]">
              {source}
            </Badge>
          )}
          {queries && queries.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Searched: {queries.map((q, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <span className="italic">"{q}"</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      {(typeof soldListings === 'number' || typeof activeListings === 'number') && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {typeof soldListings === 'number' && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {soldListings} sold
            </span>
          )}
          {typeof activeListings === 'number' && (
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {activeListings} active
            </span>
          )}
        </div>
      )}

      {/* Price range summary */}
      {prices.length > 0 && (
        <div className="flex items-center gap-4 p-2 bg-muted/30 rounded">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium">Price Range</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>
              <span className="text-muted-foreground">Low:</span>{' '}
              <span className="font-medium">${minPrice}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Avg:</span>{' '}
              <span className="font-medium">${avgPrice}</span>
            </span>
            <span>
              <span className="text-muted-foreground">High:</span>{' '}
              <span className="font-medium">${maxPrice}</span>
            </span>
          </div>
        </div>
      )}

      {/* Filter controls - Slice 3 */}
      {uniqueComps.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Comparables ({filteredComps.length}
              {filter !== 'all' && ` of ${uniqueComps.length}`})
            </span>
          </div>

          {/* Filter buttons - show only if validation data exists */}
          {hasValidationData && (
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-muted-foreground mr-1" />
              <Button
                variant={filter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setFilter('all')}
              >
                All ({uniqueComps.length})
              </Button>
              <Button
                variant={filter === 'validated' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setFilter('validated')}
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 text-green-500" />
                Valid ({validatedCount})
              </Button>
              {filteredOutCount > 0 && (
                <Button
                  variant={filter === 'filtered' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => setFilter('filtered')}
                >
                  <XCircle className="h-2.5 w-2.5 mr-0.5 text-gray-400" />
                  Filtered ({filteredOutCount})
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note about pending validation */}
      {pendingCount > 0 && pendingCount === uniqueComps.length && (
        <div className="text-[10px] text-muted-foreground italic">
          Validation pending - will be processed in analysis step
        </div>
      )}

      {/* Listings */}
      {filteredComps.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {filteredComps.slice(0, 10).map((comp, index) => (
            <div
              key={index}
              className={`flex items-center justify-between gap-2 p-2 rounded text-xs ${
                comp.validation?.isValid === false
                  ? 'bg-gray-50 dark:bg-gray-900/30 opacity-60'
                  : 'bg-muted/20'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {comp.url ? (
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 truncate flex items-center gap-1"
                    >
                      <span className="truncate">{comp.title}</span>
                      <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="truncate">{comp.title}</span>
                  )}
                  <ValidationIndicator validation={comp.validation} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                  {comp.condition && <span>{comp.condition}</span>}
                  {comp.soldDate && <span>Sold {comp.soldDate}</span>}
                  {comp.type === 'active_listing' && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {typeof comp.relevanceScore === 'number' && (
                  <span
                    className={`text-[10px] ${
                      comp.relevanceScore >= 0.7
                        ? 'text-green-600 dark:text-green-400'
                        : comp.relevanceScore >= 0.5
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-400'
                    }`}
                  >
                    {(comp.relevanceScore * 100).toFixed(0)}%
                  </span>
                )}
                {comp.price && (
                  <Badge variant="secondary" className="text-[10px]">
                    ${comp.price}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {filteredComps.length > 10 && (
            <span className="text-xs text-muted-foreground">
              +{filteredComps.length - 10} more listings
            </span>
          )}
        </div>
      )}

      {/* Empty state for filter */}
      {filteredComps.length === 0 && uniqueComps.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No comparables match the current filter.{' '}
          <button
            className="text-blue-500 hover:underline"
            onClick={() => setFilter('all')}
          >
            Show all
          </button>
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
