import {
  Zap,
  Check,
  X,
  AlertCircle,
  Database,
  DollarSign,
} from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface QuickLookupsData {
  lookupsPerformed?: number
  fieldsUpdated?: number
  updatedFields?: string[]
  lookupResults?: string[] // e.g. ["upc_lookup: success", "keepa_lookup: no data"]
  lookups?: string[] // Alternative format: just the lookup names
  cost?: number
}

/**
 * Parse lookup result string to extract status
 */
function parseLookupResult(result: string): {
  name: string
  status: 'success' | 'failed' | 'no_data'
  message?: string
} {
  const parts = result.split(':').map((s) => s.trim())
  const name = parts[0] || result
  const statusPart = parts[1]?.toLowerCase() || ''

  if (statusPart.includes('success')) {
    return { name, status: 'success' }
  } else if (statusPart.includes('no data') || statusPart.includes('not found')) {
    return { name, status: 'no_data', message: parts[1] }
  } else {
    return { name, status: 'failed', message: parts[1] }
  }
}

/**
 * Lookup result indicator
 */
function LookupResult({
  name,
  status,
  message,
}: {
  name: string
  status: 'success' | 'failed' | 'no_data'
  message?: string
}) {
  const displayName = name
    .replace(/_lookup/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  const statusConfig = {
    success: {
      icon: Check,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/30',
      label: 'Success',
    },
    no_data: {
      icon: AlertCircle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      label: 'No data',
    },
    failed: {
      icon: X,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      label: 'Failed',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={`flex items-center justify-between p-2 rounded ${config.bg}`}
    >
      <div className="flex items-center gap-2">
        <Database className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{displayName}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {message && status !== 'success' && (
          <span className="text-[10px] text-muted-foreground">{message}</span>
        )}
        <div className={`flex items-center gap-1 ${config.color}`}>
          <Icon className="h-3 w-3" />
          <span className="text-[10px]">{config.label}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Renderer for quick_lookups operations
 * Shows UPC/Keepa database lookup results
 */
export default function QuickLookupsRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as QuickLookupsData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No lookup data available
      </div>
    )
  }

  // Handle case where no lookups were possible
  if (data.lookupsPerformed === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-4 w-4" />
        <span>No identifiers available for database lookups</span>
      </div>
    )
  }

  // Parse lookup results
  const parsedResults = (data.lookupResults || []).map(parseLookupResult)

  return (
    <div className="space-y-3 text-sm">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-medium">
            {data.lookupsPerformed || parsedResults.length} lookup
            {(data.lookupsPerformed || parsedResults.length) !== 1 ? 's' : ''}{' '}
            performed
          </span>
        </div>
        {data.fieldsUpdated !== undefined && (
          <Badge
            variant={data.fieldsUpdated > 0 ? 'default' : 'secondary'}
            className="text-[10px]"
          >
            {data.fieldsUpdated} field{data.fieldsUpdated !== 1 ? 's' : ''}{' '}
            updated
          </Badge>
        )}
      </div>

      {/* Lookup results list */}
      {parsedResults.length > 0 && (
        <div className="space-y-1.5">
          {parsedResults.map((result, index) => (
            <LookupResult
              key={index}
              name={result.name}
              status={result.status}
              message={result.message}
            />
          ))}
        </div>
      )}

      {/* Updated fields */}
      {data.updatedFields && data.updatedFields.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Updated Fields
          </div>
          <div className="flex flex-wrap gap-1">
            {data.updatedFields.map((field) => (
              <Badge key={field} variant="secondary" className="text-[10px]">
                <Check className="h-2.5 w-2.5 mr-1 text-green-500" />
                {field.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Cost indicator */}
      {data.cost !== undefined && data.cost > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          <span>Cost: ${data.cost.toFixed(4)}</span>
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
