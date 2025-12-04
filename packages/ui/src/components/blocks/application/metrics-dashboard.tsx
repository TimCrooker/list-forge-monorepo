import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

export type MetricStatus = 'success' | 'warning' | 'error' | 'neutral'
export type MetricTrend = 'up' | 'down' | 'neutral'

export interface MetricData {
  id: string
  label: string
  value: string | number
  unit?: string
  description?: string
  trend?: {
    value: number
    direction: MetricTrend
  }
  status?: MetricStatus
  sparkline?: Array<{ value: number }>
  progress?: {
    value: number
    max: number
  }
  lastUpdated?: Date
  icon?: React.ElementType
}

export interface AdminMetricCardProps extends MetricData {
  loading?: boolean
  onClick?: () => void
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export interface MetricsDashboardProps {
  metrics: MetricData[]
  columns?: number
  loading?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
  onRefresh?: () => void | Promise<void>
  className?: string
}

function getTrendIcon(direction: MetricTrend) {
  switch (direction) {
    case 'up':
      return TrendingUp
    case 'down':
      return TrendingDown
    default:
      return Minus
  }
}

function getStatusIcon(status: MetricStatus) {
  switch (status) {
    case 'success':
      return CheckCircle
    case 'warning':
      return AlertCircle
    case 'error':
      return XCircle
    default:
      return Activity
  }
}

function getStatusColor(status: MetricStatus): string {
  switch (status) {
    case 'success':
      return 'text-green-600'
    case 'warning':
      return 'text-yellow-600'
    case 'error':
      return 'text-red-600'
    default:
      return 'text-muted-foreground'
  }
}

export const AdminMetricCard = ({
  label,
  value,
  unit,
  description,
  trend,
  status,
  sparkline,
  progress,
  lastUpdated,
  icon: Icon,
  loading = false,
  onClick,
  variant = 'default',
  className,
}: AdminMetricCardProps) => {
  const TrendIcon = trend ? getTrendIcon(trend.direction) : null
  const StatusIcon = status ? getStatusIcon(status) : null

  if (loading) {
    return (
      <Card
        className={cn(
          'relative',
          onClick && 'cursor-pointer hover:shadow-md transition-shadow',
          className,
        )}
      >
        <CardHeader className={cn(variant === 'compact' && 'pb-2')}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32 mt-2" />
        </CardHeader>
        {variant !== 'compact' && (
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        )}
      </Card>
    )
  }

  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
      ? 'text-red-600'
      : 'text-muted-foreground'

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        className,
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(variant === 'compact' && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
              {trend && (
                <div className={cn('flex items-center gap-1', trendColor)}>
                  {TrendIcon && <TrendIcon className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {trend.value > 0 ? '+' : ''}
                    {trend.value}%
                  </span>
                </div>
              )}
            </div>
            {description && variant !== 'compact' && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className={cn('h-5 w-5', status && getStatusColor(status))} />}
            {StatusIcon && !Icon && (
              <StatusIcon className={cn('h-5 w-5', status && getStatusColor(status))} />
            )}
          </div>
        </div>
      </CardHeader>

      {variant === 'detailed' && (
        <CardContent className="space-y-4">
          {sparkline && sparkline.length > 0 && (
            <div className="h-16 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={sparkline}>
                  <Line
                    dataKey="value"
                    dot={false}
                    stroke={
                      status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#8884d8'
                    }
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        return (
                          <div className="bg-background border rounded px-2 py-1">
                            <p className="text-sm">{payload[0].value}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round((progress.value / progress.max) * 100)}%</span>
              </div>
              <Progress value={(progress.value / progress.max) * 100} />
            </div>
          )}

          {lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      )}

      {status && (
        <div
          className={cn(
            'absolute top-0 right-0 w-1 h-full',
            status === 'success' && 'bg-green-500',
            status === 'warning' && 'bg-yellow-500',
            status === 'error' && 'bg-red-500',
            status === 'neutral' && 'bg-gray-500',
          )}
        />
      )}
    </Card>
  )
}

export const MetricsDashboard = ({
  metrics,
  columns = 4,
  loading = false,
  autoRefresh = false,
  refreshInterval = 30000,
  onRefresh,
  className,
}: MetricsDashboardProps) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  React.useEffect(() => {
    if (!autoRefresh || !onRefresh) return

    const interval = setInterval(async () => {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, onRefresh])

  const gridCols =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
    }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={cn('space-y-6', className)}>
      {autoRefresh && isRefreshing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse" />
          Refreshing metrics...
        </div>
      )}

      <div className={cn('grid gap-4', gridCols)}>
        {metrics.map(metric => (
          <AdminMetricCard
            key={metric.id}
            {...metric}
            loading={loading}
            variant={columns > 4 ? 'compact' : 'default'}
          />
        ))}
      </div>

      {metrics.length === 0 && !loading && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No metrics available</p>
        </div>
      )}
    </div>
  )
}
