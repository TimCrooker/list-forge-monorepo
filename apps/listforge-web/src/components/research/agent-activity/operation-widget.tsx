import * as React from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@listforge/ui'
import { OperationStatusBadge } from './operation-status-badge'
import { getOperationIcon, getOperationLabel } from './operation-renderers'
import type { GroupedOperation } from '@listforge/core-types'

interface OperationWidgetProps {
  operation: GroupedOperation
  defaultExpanded?: boolean
  isExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  renderContent?: (operation: GroupedOperation) => React.ReactNode
  className?: string
}

export function OperationWidget({
  operation,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onExpandedChange,
  renderContent,
  className,
}: OperationWidgetProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded)

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const setIsExpanded = React.useCallback((expanded: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(expanded)
    }
    onExpandedChange?.(expanded)
  }, [controlledExpanded, onExpandedChange])

  const Icon = getOperationIcon(operation.operationType)
  const label = getOperationLabel(operation.operationType)

  // Get display message - either summary (when completed) or latest progress
  const displayMessage = operation.summary || getLatestMessage(operation)

  const isClickable = operation.status !== 'pending'
  const showExpandIcon = isClickable && (operation.events.length > 1 || operation.summary)

  return (
    <div
      className={cn(
        'group border rounded-lg transition-all duration-200',
        operation.status === 'failed'
          ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
          : operation.status === 'in_progress'
            ? 'border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20'
            : 'border-border bg-card hover:bg-accent/50',
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => isClickable && setIsExpanded(!isExpanded)}
        disabled={!isClickable}
        className={cn(
          'w-full flex items-center gap-3 p-3 text-left',
          isClickable && 'cursor-pointer',
          !isClickable && 'cursor-default'
        )}
      >
        {/* Expand/collapse icon */}
        <div className="flex-shrink-0 w-4">
          {showExpandIcon ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : null}
        </div>

        {/* Operation icon */}
        <div className="flex-shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Title and message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{operation.title || label}</span>
          </div>
          {displayMessage && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {displayMessage}
            </p>
          )}
        </div>

        {/* Status badge */}
        <OperationStatusBadge status={operation.status} size="md" />
      </button>

      {/* Expanded content */}
      {isExpanded && renderContent && (
        <div className="px-3 pb-3 pt-0">
          <div className="pl-8 border-l-2 border-muted ml-2">
            <div className="pl-4">
              {renderContent(operation)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Gets the latest message to display (from progress or started events)
 */
function getLatestMessage(operation: GroupedOperation): string | undefined {
  // Find the latest progress event
  const progressEvents = operation.events.filter(
    (event) => event.eventType === 'progress'
  )
  if (progressEvents.length > 0) {
    return progressEvents[progressEvents.length - 1].message
  }

  // Fall back to started event message
  const startedEvent = operation.events.find((event) => event.eventType === 'started')
  return startedEvent?.message
}

OperationWidget.displayName = 'OperationWidget'
