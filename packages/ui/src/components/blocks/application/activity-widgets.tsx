import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  Clock,
  Calendar,
  User,
  FileText,
  MessageSquare,
  GitCommit,
  GitPullRequest,
  GitMerge,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

export interface ActivityWidgetItem {
  id: string
  type: 'action' | 'comment' | 'status' | 'commit' | 'deployment' | 'alert'
  title: string
  description?: string
  timestamp: string
  user?: {
    name: string
    avatar?: string
  }
  status?: 'success' | 'error' | 'warning' | 'info'
  metadata?: Record<string, any>
}

export interface ActivityWidgetProps {
  activities: ActivityWidgetItem[]
  title?: string
  description?: string
  showTimestamps?: boolean
  showAvatars?: boolean
  maxItems?: number
  onViewAll?: () => void
  className?: string
}

export interface ActivityTimelineProps {
  items: ActivityWidgetItem[]
  orientation?: 'vertical' | 'horizontal'
  showConnectors?: boolean
  className?: string
}

export interface RecentActivityProps {
  activities: ActivityWidgetItem[]
  groupByDate?: boolean
  className?: string
}

const activityIcons = {
  action: <Activity className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  status: <CheckCircle2 className="h-4 w-4" />,
  commit: <GitCommit className="h-4 w-4" />,
  deployment: <GitMerge className="h-4 w-4" />,
  alert: <AlertCircle className="h-4 w-4" />,
}

const statusColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

export const ActivityWidget = ({
  activities,
  title = 'Recent Activity',
  description,
  showTimestamps = true,
  showAvatars = true,
  maxItems,
  onViewAll,
  className,
}: ActivityWidgetProps) => {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge variant="secondary">{activities.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {displayActivities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No recent activity</p>
            ) : (
              displayActivities.map(activity => (
                <div key={activity.id} className="flex gap-3">
                  {showAvatars && (
                    <div className="flex-shrink-0">
                      {activity.user ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full bg-muted',
                            activity.status && statusColors[activity.status],
                          )}
                        >
                          {activityIcons[activity.type]}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm">
                          {activity.user && (
                            <span className="font-medium">{activity.user.name} </span>
                          )}
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                        )}
                      </div>
                      {showTimestamps && (
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {onViewAll && activities.length > (maxItems || 0) && (
        <CardFooter>
          <Button className="w-full" variant="outline" onClick={onViewAll}>
            View all activity
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export const ActivityTimeline = ({
  items,
  orientation = 'vertical',
  showConnectors = true,
  className,
}: ActivityTimelineProps) => {
  if (orientation === 'horizontal') {
    return (
      <ScrollArea className={cn('w-full', className)}>
        <div className="flex gap-8 p-4">
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-col items-center">
              <div className="relative">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2',
                    item.status === 'success' && 'border-green-500 bg-green-50',
                    item.status === 'error' && 'border-red-500 bg-red-50',
                    item.status === 'warning' && 'border-yellow-500 bg-yellow-50',
                    (!item.status || item.status === 'info') && 'border-primary bg-primary/10',
                  )}
                >
                  {activityIcons[item.type]}
                </div>
                {showConnectors && index < items.length - 1 && (
                  <div className="absolute left-full top-1/2 h-0.5 w-8 -translate-y-1/2 bg-border" />
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="relative flex flex-col items-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2',
                item.status === 'success' && 'border-green-500 bg-green-50',
                item.status === 'error' && 'border-red-500 bg-red-50',
                item.status === 'warning' && 'border-yellow-500 bg-yellow-50',
                (!item.status || item.status === 'info') && 'border-primary bg-primary/10',
              )}
            >
              {activityIcons[item.type]}
            </div>
            {showConnectors && index < items.length - 1 && (
              <div className="h-full w-0.5 bg-border" />
            )}
          </div>

          <div className="flex-1 pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.status && (
                  <Badge
                    className="text-xs"
                    variant={
                      item.status === 'success'
                        ? 'default'
                        : item.status === 'error'
                        ? 'destructive'
                        : item.status === 'warning'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {item.status}
                  </Badge>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const RecentActivity = ({
  activities,
  groupByDate = true,
  className,
}: RecentActivityProps) => {
  const groupedActivities = React.useMemo(() => {
    if (!groupByDate) return { All: activities }

    const groups: Record<string, ActivityWidgetItem[]> = {}

    activities.forEach(activity => {
      const date = new Date(activity.timestamp)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let key: string
      if (date.toDateString() === today.toDateString()) {
        key = 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday'
      } else {
        key = date.toLocaleDateString()
      }

      if (!groups[key]) groups[key] = []
      groups[key].push(activity)
    })

    return groups
  }, [activities, groupByDate])

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedActivities).map(([date, items]) => (
        <div key={date} className="space-y-3">
          {groupByDate && <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>}
          <div className="space-y-2">
            {items.map(activity => (
              <Card key={activity.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5', activity.status && statusColors[activity.status])}>
                    {activityIcons[activity.type]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.user && (
                        <>
                          <User className="h-3 w-3" />
                          <span>{activity.user.name}</span>
                          <span>•</span>
                        </>
                      )}
                      <Clock className="h-3 w-3" />
                      <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export interface ActivitySummaryProps {
  data: {
    total: number
    trend: 'up' | 'down' | 'neutral'
    trendValue?: number
    byType: Record<string, number>
  }
  className?: string
}

export const ActivitySummary = ({ data, className }: ActivitySummaryProps) => {
  const topTypes = Object.entries(data.byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activity Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{data.total}</p>
            <p className="text-sm text-muted-foreground">Total activities</p>
          </div>
          {data.trendValue !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1',
                data.trend === 'up' && 'text-green-500',
                data.trend === 'down' && 'text-red-500',
              )}
            >
              {data.trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : data.trend === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{data.trendValue}%</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Top Activities</p>
          {topTypes.map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activityIcons[type as keyof typeof activityIcons]}
                <span className="text-sm capitalize">{type}</span>
              </div>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
