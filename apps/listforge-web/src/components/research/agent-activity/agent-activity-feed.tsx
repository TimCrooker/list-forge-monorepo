import * as React from 'react'
import { ArrowDown, Loader2 } from 'lucide-react'
import { cn, Button, Badge } from '@listforge/ui'
import { OperationWidget } from './operation-widget'
import { useGroupedOperations } from './use-grouped-operations'
import { getOperationRenderer } from './operation-renderers'
import { OperationRendererErrorBoundary } from './operation-renderer-error-boundary'
import type { AgentOperationEvent, GroupedOperation } from '@listforge/core-types'

export interface AgentActivityFeedProps {
  /**
   * Array of operation events to display
   */
  events: AgentOperationEvent[]
  /**
   * Whether the feed is receiving live updates
   */
  isLive?: boolean
  /**
   * Whether to auto-scroll to new items
   */
  autoScroll?: boolean
  /**
   * Callback when auto-scroll state changes
   */
  onAutoScrollChange?: (enabled: boolean) => void
  /**
   * Callback when an operation is clicked
   */
  onOperationClick?: (operationId: string) => void
  /**
   * Whether the feed is in initial loading state
   */
  isLoading?: boolean
  /**
   * Custom empty state component
   */
  emptyComponent?: React.ReactNode
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Whether all operations should be expanded
   */
  expandAll?: boolean
}

/**
 * AgentActivityFeed - Displays agent operations as collapsible widgets
 *
 * Groups events by operationId and renders each operation as a collapsible
 * widget with type-specific expanded content.
 */
export const AgentActivityFeed = React.forwardRef<
  { expandAll: () => void; collapseAll: () => void },
  AgentActivityFeedProps
>(({
  events,
  isLive = false,
  autoScroll = true,
  onAutoScrollChange: _onAutoScrollChange,
  onOperationClick: _onOperationClick,
  isLoading = false,
  emptyComponent,
  className,
  expandAll: externalExpandAll,
}, ref) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const prevOperationsLengthRef = React.useRef(0)
  const seenOperationIdsRef = React.useRef<Set<string>>(new Set())

  const [isAtBottom, setIsAtBottom] = React.useState(true)
  const [newOperationsCount, setNewOperationsCount] = React.useState(0)
  const [userHasScrolled, setUserHasScrolled] = React.useState(false)
  const [expandedOperations, setExpandedOperations] = React.useState<Set<string>>(new Set())

  // Group events into operations
  const operations = useGroupedOperations(events)

  // Handle expand all control via ref
  React.useImperativeHandle(ref, () => ({
    expandAll: () => {
      const allOperationIds = new Set(operations.map(op => op.operationId))
      setExpandedOperations(allOperationIds)
    },
    collapseAll: () => {
      setExpandedOperations(new Set())
    },
  }), [operations])

  // Handle external expandAll prop
  React.useEffect(() => {
    if (externalExpandAll !== undefined) {
      if (externalExpandAll) {
        const allOperationIds = new Set(operations.map(op => op.operationId))
        setExpandedOperations(allOperationIds)
      } else {
        setExpandedOperations(new Set())
      }
    }
  }, [externalExpandAll, operations])

  // Check if user is at bottom of scroll
  const checkIfAtBottom = React.useCallback(() => {
    if (!scrollContainerRef.current) return false

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const atBottom = distanceFromBottom <= 100

    setIsAtBottom(atBottom)
    return atBottom
  }, [])

  // Scroll to bottom
  const scrollToBottom = React.useCallback((smooth = false) => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop =
              scrollContainerRef.current.scrollHeight
          }
        })
      })
    }

    setNewOperationsCount(0)
  }, [])

  // Handle new operations - auto-expand them by default
  React.useEffect(() => {
    const operationsAdded = operations.length - prevOperationsLengthRef.current

    if (operationsAdded > 0) {
      // Find new operation IDs that haven't been seen before
      const newOperationIds = operations
        .map(op => op.operationId)
        .filter(id => !seenOperationIdsRef.current.has(id))

      // Auto-expand new operations
      if (newOperationIds.length > 0) {
        setExpandedOperations(prev => {
          const next = new Set(prev)
          newOperationIds.forEach(id => {
            next.add(id)
            seenOperationIdsRef.current.add(id)
          })
          return next
        })
      }

      if (autoScroll && isAtBottom) {
        scrollToBottom(false)
      } else if (!isAtBottom && userHasScrolled) {
        setNewOperationsCount((prev) => prev + operationsAdded)
      }
    }

    // Track all current operation IDs
    operations.forEach(op => {
      seenOperationIdsRef.current.add(op.operationId)
    })

    prevOperationsLengthRef.current = operations.length
  }, [operations, autoScroll, isAtBottom, userHasScrolled, scrollToBottom])

  // Handle scroll events
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let scrollTimeout: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      setUserHasScrolled(true)
      checkIfAtBottom()

      if (scrollTimeout) clearTimeout(scrollTimeout)

      scrollTimeout = setTimeout(() => {
        checkIfAtBottom()
      }, 150)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [checkIfAtBottom])

  // Initial scroll to bottom and expand all operations on first load
  React.useEffect(() => {
    if (operations.length > 0 && autoScroll && !userHasScrolled) {
      scrollToBottom(false)
    }
  }, [operations.length, autoScroll, userHasScrolled, scrollToBottom])

  // Expand all operations on initial load (when operations first appear)
  React.useEffect(() => {
    if (operations.length > 0 && expandedOperations.size === 0 && seenOperationIdsRef.current.size === 0) {
      const allOperationIds = new Set(operations.map(op => op.operationId))
      setExpandedOperations(allOperationIds)
      operations.forEach(op => {
        seenOperationIdsRef.current.add(op.operationId)
      })
    }
  }, [operations, expandedOperations.size])

  // Render operation content using the appropriate renderer
  // CRITICAL FIX: Wrap in error boundary to prevent single operation from crashing entire feed
  const renderOperationContent = React.useCallback(
    (operation: GroupedOperation) => {
      const Renderer = getOperationRenderer(operation.operationType)
      return (
        <OperationRendererErrorBoundary
          operationType={operation.operationType}
          operationId={operation.operationId}
        >
          <Renderer operation={operation} />
        </OperationRendererErrorBoundary>
      )
    },
    []
  )

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full min-h-[200px]',
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {operations.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            {emptyComponent || (
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  No activity yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Operations will appear here as they execute
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-3">
            {operations.map((operation) => {
              const isExpanded = expandedOperations.has(operation.operationId)

              return (
                <OperationWidget
                  key={operation.operationId}
                  operation={operation}
                  isExpanded={isExpanded}
                  onExpandedChange={(expanded) => {
                    setExpandedOperations(prev => {
                      const next = new Set(prev)
                      if (expanded) {
                        next.add(operation.operationId)
                      } else {
                        next.delete(operation.operationId)
                      }
                      return next
                    })
                  }}
                  renderContent={renderOperationContent}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                />
              )
            })}
          </div>
        )}

        {/* Bottom anchor */}
        <div ref={bottomRef} className="h-px" />
      </div>

      {/* Floating scroll-to-bottom button */}
      {!isAtBottom && operations.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={() => scrollToBottom(true)}
            size="sm"
            className="shadow-lg animate-in slide-in-from-bottom-2 duration-300"
          >
            {newOperationsCount > 0 && (
              <Badge variant="secondary" className="mr-2 px-1.5 py-0.5 text-xs">
                +{newOperationsCount}
              </Badge>
            )}
            <ArrowDown className="h-4 w-4 mr-1" />
            {newOperationsCount > 0 ? 'New activity' : 'Scroll to bottom'}
          </Button>
        </div>
      )}

      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className="text-[10px] bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          >
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </Badge>
        </div>
      )}
    </div>
  )
})

AgentActivityFeed.displayName = 'AgentActivityFeed'
