import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistance } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  User,
  FileText,
  MessageSquare,
} from 'lucide-react'

export interface TimelineItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'default'
  title: string
  description?: string | React.ReactNode
  timestamp: Date | string
  user?: {
    name: string
    email?: string
    avatar?: string
  }
  icon?: React.ComponentType<{ className?: string }>
  metadata?: Record<string, any>
  actions?: React.ReactNode
}

export interface TimelineProps {
  items: TimelineItem[]
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  showConnector?: boolean
  reverseOrder?: boolean
}

const typeIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Activity,
  default: Clock,
}

const typeColors = {
  success: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  error: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
  info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  default: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
}

export const Timeline = ({
  items,
  className,
  variant = 'default',
  showConnector = true,
  reverseOrder = false,
}: TimelineProps) => {
  const sortedItems = reverseOrder ? [...items].reverse() : items

  return (
    <div className={cn('relative space-y-4', className)}>
      {sortedItems.map((item, index) => {
        const Icon = item.icon || typeIcons[item.type]
        const isLast = index === sortedItems.length - 1
        const timestamp =
          typeof item.timestamp === 'string' ? new Date(item.timestamp) : item.timestamp

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Connector line */}
            {showConnector && !isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                typeColors[item.type],
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              {variant === 'detailed' ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <time dateTime={timestamp.toISOString()}>
                            {formatDistance(timestamp, new Date(), { addSuffix: true })}
                          </time>
                          {item.user && (
                            <>
                              <span>•</span>
                              <span>{item.user.name}</span>
                            </>
                          )}
                        </div>
                        {item.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(item.metadata).map(([key, value]) => (
                              <Badge key={key} className="text-xs" variant="secondary">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {item.user?.avatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage alt={item.user.name} src={item.user.avatar} />
                          <AvatarFallback>
                            {item.user.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    {item.actions && <div className="mt-3 flex gap-2">{item.actions}</div>}
                  </CardContent>
                </Card>
              ) : (
                <div className="pb-4">
                  <h4 className="text-sm font-semibold">{item.title}</h4>
                  {item.description && variant !== 'compact' && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={timestamp.toISOString()}>
                      {formatDistance(timestamp, new Date(), { addSuffix: true })}
                    </time>
                    {item.user && (
                      <>
                        <span>•</span>
                        <span>{item.user.name}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
