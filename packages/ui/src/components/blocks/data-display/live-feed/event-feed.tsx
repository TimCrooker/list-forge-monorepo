import * as React from 'react'
import { LiveFeed } from './live-feed'
import type { LiveFeedItem, LiveFeedProps } from './live-feed'
import { Badge } from '../../../ui/badge'
import { Button } from '../../../ui/button'
import { Eye, ChevronRight } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { formatDistanceToNow } from 'date-fns'

export interface EventFeedItem extends LiveFeedItem {
  timestamp: Date | string
  type: string
  status?: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'processing'
  message?: string
  metadata?: Record<string, any>
}

export interface EventFeedProps
  extends Omit<LiveFeedProps<EventFeedItem>, 'renderItem' | 'autoScroll'> {
  onEventClick?: (event: EventFeedItem) => void
  onMetadataClick?: (key: string, value: any) => void
  onStatusClick?: (status: EventFeedItem['status']) => void
  renderActions?: (event: EventFeedItem) => React.ReactNode
  showTimestamp?: boolean
  showStatus?: boolean
  showActions?: boolean
  timeFormat?: 'relative' | 'absolute' | 'both'
  statusVariant?: 'badge' | 'dot' | 'none'
  dense?: boolean
  autoScroll?: boolean
  onAutoScrollChange?: (checked: boolean) => void
  showAutoScrollToggle?: boolean
}

const statusColors = {
  success: 'bg-green-500/10 text-green-700 border-green-500/20',
  error: 'bg-red-500/10 text-red-700 border-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  pending: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  processing: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
}

const statusDotColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  pending: 'bg-gray-500',
  processing: 'bg-purple-500 animate-pulse',
}

export function EventFeed({
  items,
  onEventClick,
  onMetadataClick,
  onStatusClick,
  renderActions,
  showTimestamp = true,
  showStatus = true,
  showActions = true,
  timeFormat = 'relative',
  statusVariant = 'badge',
  dense = false,
  autoScroll = true,
  onAutoScrollChange,
  showAutoScrollToggle = false,
  ...props
}: EventFeedProps) {
  const renderEventItem = React.useCallback(
    (event: EventFeedItem, index: number) => {
      const timestamp =
        typeof event.timestamp === 'string' ? new Date(event.timestamp) : event.timestamp

      const isRecent = Date.now() - timestamp.getTime() < 60000 // Within last minute

      return (
        <div
          className={cn(
            'group flex items-center gap-3 border-b border-border/50 transition-colors hover:bg-muted/50',
            dense ? 'py-2 px-3' : 'py-3 px-4',
            onEventClick && 'cursor-pointer',
            isRecent && 'bg-primary/5',
          )}
          onClick={() => onEventClick?.(event)}
        >
          {/* Status indicator */}
          {showStatus && event.status && (
            <div className="flex-shrink-0">
              {statusVariant === 'badge' ? (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-medium cursor-pointer hover:bg-muted/80 transition-colors',
                    statusColors[event.status],
                  )}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onStatusClick?.(event.status!)
                  }}
                >
                  {event.status}
                </Badge>
              ) : statusVariant === 'dot' ? (
                <div
                  className={cn('h-2 w-2 rounded-full', statusDotColors[event.status])}
                  title={event.status}
                />
              ) : null}
            </div>
          )}

          {/* Event content */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-baseline gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn('font-mono font-medium', dense ? 'text-[10px]' : 'text-xs')}
              >
                {event.type}
              </Badge>
              {showTimestamp && (
                <span
                  className={cn(
                    'text-muted-foreground flex-shrink-0',
                    dense ? 'text-[10px]' : 'text-xs',
                    isRecent && 'text-green-600 font-medium',
                  )}
                >
                  {timeFormat === 'relative' && formatDistanceToNow(timestamp, { addSuffix: true })}
                  {timeFormat === 'absolute' && timestamp.toLocaleString()}
                  {timeFormat === 'both' && (
                    <>
                      {formatDistanceToNow(timestamp, { addSuffix: true })}
                      <span className="text-muted-foreground/50 ml-1">
                        ({timestamp.toLocaleTimeString()})
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>

            {event.message && (
              <p
                className={cn(
                  'text-muted-foreground truncate',
                  dense ? 'text-xs mt-0.5' : 'text-sm mt-1',
                )}
              >
                {event.message}
              </p>
            )}

            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className={cn('flex flex-wrap gap-1.5 w-full', dense ? 'mt-1' : 'mt-2')}>
                {Object.entries(event.metadata)
                  .filter(([key]) => !key.endsWith('Display'))
                  .map(([key, value]) => {
                    const displayValue =
                      (event.metadata && event.metadata[`${key}Display`]) || value
                    return (
                      <span
                        key={key}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          onMetadataClick?.(key, value)
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono cursor-pointer hover:bg-muted/80 transition-colors',
                          dense ? 'text-[10px]' : 'text-xs',
                        )}
                      >
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">{String(displayValue)}</span>
                      </span>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {renderActions ? (
                renderActions(event)
              ) : (
                <Button
                  variant="ghost"
                  size={dense ? 'sm' : 'default'}
                  className={dense ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onEventClick?.(event)
                  }}
                >
                  {onEventClick ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      )
    },
    [
      onEventClick,
      onMetadataClick,
      onStatusClick,
      renderActions,
      showTimestamp,
      showStatus,
      showActions,
      timeFormat,
      statusVariant,
      dense,
    ],
  )

  return (
    <LiveFeed<EventFeedItem>
      {...props}
      items={items}
      autoScroll={autoScroll}
      renderItem={renderEventItem}
      itemClassName="transition-all duration-200"
    />
  )
}

EventFeed.displayName = 'EventFeed'
