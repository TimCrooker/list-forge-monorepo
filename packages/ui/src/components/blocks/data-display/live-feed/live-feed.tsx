import * as React from 'react'
import { ArrowDown, Loader2 } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Button } from '../../../ui/button'
import { Badge } from '../../../ui/badge'

export interface LiveFeedItem {
  id: string
  [key: string]: any
}

export interface LiveFeedProps<T extends LiveFeedItem> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  isLoadingInitial?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  autoScroll?: boolean
  onLoadMore?: () => void
  onScrollToBottom?: () => void
  loadingComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  className?: string
  itemClassName?: string
  variant?: 'default' | 'console' | 'compact'
  showScrollToBottom?: boolean
  newItemsThreshold?: number // Number of pixels from bottom to be considered "at bottom"
}

export function LiveFeed<T extends LiveFeedItem>({
  items,
  renderItem,
  isLoadingInitial = false,
  isLoadingMore = false,
  hasMore = false,
  autoScroll = true,
  onLoadMore,
  onScrollToBottom,
  loadingComponent,
  emptyComponent,
  className,
  itemClassName,
  variant = 'default',
  showScrollToBottom = true,
  newItemsThreshold = 100,
}: LiveFeedProps<T>) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const topSentinelRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const prevItemsLengthRef = React.useRef(items.length)
  const scrollAnchorRef = React.useRef<{ itemId: string; offsetTop: number } | null>(null)
  const isRestoringScrollRef = React.useRef(false)

  const [isAtBottom, setIsAtBottom] = React.useState(true)
  const [newItemsCount, setNewItemsCount] = React.useState(0)
  const [userHasScrolled, setUserHasScrolled] = React.useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false)

  // Check if user is at bottom of scroll
  const checkIfAtBottom = React.useCallback(() => {
    if (!scrollContainerRef.current) return false

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const atBottom = distanceFromBottom <= newItemsThreshold

    setIsAtBottom(atBottom)
    return atBottom
  }, [newItemsThreshold])

  // Scroll to bottom function
  const scrollToBottom = React.useCallback(
    (smooth = false) => {
      if (!scrollContainerRef.current) return

      const container = scrollContainerRef.current

      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      } else {
        // Double RAF for instant scroll after DOM update
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
            }
          })
        })
      }

      setNewItemsCount(0)
      onScrollToBottom?.()
    },
    [onScrollToBottom],
  )

  // Handle new items
  React.useEffect(() => {
    const itemsAdded = items.length - prevItemsLengthRef.current

    if (itemsAdded > 0) {
      if (autoScroll && isAtBottom) {
        // Clear scroll anchor when auto-scrolling to bottom
        scrollAnchorRef.current = null
        // Auto-scroll to bottom if enabled and user is at bottom
        scrollToBottom(false)
      } else if (!isAtBottom && userHasScrolled) {
        // User has scrolled up, increment new items counter
        setNewItemsCount(prev => prev + itemsAdded)
      }
    }

    prevItemsLengthRef.current = items.length
  }, [items.length, autoScroll, isAtBottom, userHasScrolled, scrollToBottom])

  // Handle scroll events
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let scrollTimeout: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      setUserHasScrolled(true)
      checkIfAtBottom()

      // Clear the timeout if it exists
      if (scrollTimeout) clearTimeout(scrollTimeout)

      // Reset scroll state after user stops scrolling
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

  // Save scroll anchor before loading more items at top
  const saveScrollAnchor = React.useCallback(() => {
    if (!scrollContainerRef.current || items.length === 0) return

    const container = scrollContainerRef.current
    const firstItem = container.querySelector('[data-feed-item]') as HTMLElement

    if (firstItem) {
      const itemId = firstItem.getAttribute('data-feed-item-id')
      if (itemId) {
        scrollAnchorRef.current = {
          itemId,
          offsetTop: firstItem.offsetTop - container.scrollTop,
        }
      }
    }
  }, [items.length])

  // Restore scroll position after loading more items at top
  React.useEffect(() => {
    if (isLoadingMore || !scrollAnchorRef.current || !scrollContainerRef.current) {
      return
    }

    // If we just finished loading and have an anchor
    if (isRestoringScrollRef.current) {
      return // Already restoring
    }

    const anchor = scrollAnchorRef.current
    const container = scrollContainerRef.current

    // Find the anchor element
    const anchorElement = container.querySelector(
      `[data-feed-item-id="${anchor.itemId}"]`,
    ) as HTMLElement

    if (anchorElement) {
      isRestoringScrollRef.current = true

      // Restore scroll position to maintain visual continuity
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current && anchorElement) {
            const newScrollTop = anchorElement.offsetTop - anchor.offsetTop
            scrollContainerRef.current.scrollTop = newScrollTop
            isRestoringScrollRef.current = false
            scrollAnchorRef.current = null
          }
        })
      })
    } else {
      scrollAnchorRef.current = null
    }
  }, [isLoadingMore, items.length])

  // Intersection Observer for loading more items at top
  React.useEffect(() => {
    if (!topSentinelRef.current || !hasMore || !onLoadMore || !initialLoadComplete) {
      // Don't observe until initial load is complete - prevents auto-loading on initial render
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (
          entry.isIntersecting &&
          !isLoadingMore &&
          !isLoadingInitial &&
          !isRestoringScrollRef.current
        ) {
          // Save scroll position before loading
          saveScrollAnchor()
          onLoadMore()
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0,
        rootMargin: '100px',
      },
    )

    observer.observe(topSentinelRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoadingMore, isLoadingInitial, onLoadMore, saveScrollAnchor, initialLoadComplete])

  // Scroll to bottom on initial load and mark initial load complete
  React.useEffect(() => {
    if (items.length > 0 && !initialLoadComplete) {
      if (autoScroll) {
        scrollToBottom(false)
      }
      // Mark initial load as complete after first render
      setInitialLoadComplete(true)
    }
  }, [items.length, initialLoadComplete, autoScroll, scrollToBottom])

  const variantStyles = {
    default: 'bg-card border border-border rounded-lg',
    console: 'bg-black/95 border border-green-500/20 rounded-lg font-mono text-green-400',
    compact: 'bg-muted/30 border border-border/50 rounded-md',
  }

  if (isLoadingInitial) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        {loadingComponent || (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          variantStyles[variant],
          className,
        )}
      >
        {/* Top sentinel for infinite scroll */}
        {hasMore && <div ref={topSentinelRef} className="h-4 w-full bg-transparent" />}

        {/* Loading indicator at top */}
        {isLoadingMore && (
          <div
            className={cn(
              'flex items-center justify-center gap-2 py-3 border-b',
              variant === 'console' ? 'border-green-500/20' : 'border-border',
            )}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading older items...</span>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            {emptyComponent || (
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">No items yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Items will appear here as they arrive
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item, index) => (
              <div
                key={item.id}
                data-feed-item="true"
                data-feed-item-id={item.id}
                className={cn(
                  'transition-colors duration-150',
                  itemClassName,
                  variant === 'console' &&
                    index === items.length - 1 &&
                    'animate-in fade-in duration-300',
                )}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}

        {/* Bottom anchor */}
        <div ref={bottomRef} className="h-px" />
      </div>

      {/* Floating scroll-to-bottom button */}
      {showScrollToBottom && !isAtBottom && items.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={() => scrollToBottom(true)}
            size="sm"
            className={cn(
              'shadow-lg animate-in slide-in-from-bottom-2 duration-300',
              variant === 'console' &&
                'bg-green-600 hover:bg-green-700 text-black border-green-400',
            )}
          >
            {newItemsCount > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  'mr-2 px-1.5 py-0.5 text-xs',
                  variant === 'console' && 'bg-green-400 text-black',
                )}
              >
                +{newItemsCount}
              </Badge>
            )}
            <ArrowDown className="h-4 w-4 mr-1" />
            {newItemsCount > 0 ? 'New items' : 'Scroll to bottom'}
          </Button>
        </div>
      )}
    </div>
  )
}

LiveFeed.displayName = 'LiveFeed'
