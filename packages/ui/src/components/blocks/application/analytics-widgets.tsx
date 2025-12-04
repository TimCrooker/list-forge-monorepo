import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
  }[]
}

export interface AnalyticsMetricData {
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  target?: number
  unit?: string
}

export interface AnalyticsCardProps {
  title: string
  description?: string
  metric?: AnalyticsMetricData
  chart?: ChartData
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
  className?: string
}

export interface PerformanceMetricsProps {
  metrics: {
    name: string
    value: number
    target: number
    unit?: string
    color?: string
  }[]
  title?: string
  className?: string
}

export interface ConversionFunnelProps {
  steps: {
    name: string
    value: number
    percentage: number
  }[]
  title?: string
  className?: string
}

export const AnalyticsCard = ({
  title,
  description,
  metric,
  chart,
  timeRange = '7d',
  onTimeRangeChange,
  className,
}: AnalyticsCardProps) => {
  const timeRanges = [
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onTimeRangeChange && (
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {metric && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {metric.value}
                {metric.unit && (
                  <span className="text-lg font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                )}
              </div>
              {metric.change !== undefined && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm',
                    metric.trend === 'up' && 'text-green-600',
                    metric.trend === 'down' && 'text-red-600',
                  )}
                >
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>
            {metric.target && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span>
                    {metric.target}
                    {metric.unit}
                  </span>
                </div>
                <Progress className="h-2" value={(Number(metric.value) / metric.target) * 100} />
              </div>
            )}
          </div>
        )}

        {chart && (
          <div className="mt-4 space-y-3">
            {/* Simplified chart visualization - in real app, use a charting library */}
            <div className="h-[200px] flex items-end justify-between gap-2">
              {chart.labels.map((label, index) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-muted rounded-t relative">
                    {chart.datasets.map((dataset, datasetIndex) => (
                      <div
                        key={datasetIndex}
                        className="w-full bg-primary rounded-t"
                        style={{
                          height: `${(dataset.data[index] / Math.max(...dataset.data)) * 150}px`,
                          backgroundColor: dataset.color,
                          opacity: 0.8 - datasetIndex * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const PerformanceMetrics = ({
  metrics,
  title = 'Performance Metrics',
  className,
}: PerformanceMetricsProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map(metric => {
          const percentage = (metric.value / metric.target) * 100
          const isExceeding = percentage > 100

          return (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric.name}</span>
                <span className="text-sm text-muted-foreground">
                  {metric.value}
                  {metric.unit} / {metric.target}
                  {metric.unit}
                </span>
              </div>
              <div className="relative">
                <Progress
                  className="h-2"
                  style={
                    {
                      '--progress-background': metric.color || undefined,
                    } as React.CSSProperties
                  }
                  value={Math.min(percentage, 100)}
                />
                {isExceeding && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Badge className="text-xs" variant="default">
                      +{Math.round(percentage - 100)}%
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(percentage)}% of target</span>
                {isExceeding ? (
                  <span className="text-green-600">Exceeding target</span>
                ) : percentage >= 80 ? (
                  <span className="text-yellow-600">Near target</span>
                ) : (
                  <span className="text-red-600">Below target</span>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export const ConversionFunnel = ({
  steps,
  title = 'Conversion Funnel',
  className,
}: ConversionFunnelProps) => {
  const maxValue = Math.max(...steps.map(s => s.value))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const widthPercentage = (step.value / maxValue) * 100
            const dropoffRate =
              index > 0 ? ((steps[index - 1].value - step.value) / steps[index - 1].value) * 100 : 0

            return (
              <div key={step.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{step.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{step.value.toLocaleString()}</span>
                    <Badge className="text-xs" variant="secondary">
                      {step.percentage}%
                    </Badge>
                  </div>
                </div>
                <div
                  className="h-8 bg-primary/20 rounded relative overflow-hidden"
                  style={{ width: `${widthPercentage}%` }}
                >
                  <div className="h-full bg-primary rounded" />
                </div>
                {dropoffRate > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {dropoffRate.toFixed(1)}% drop-off from previous step
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export interface RealtimeMetricsProps {
  metrics: {
    id: string
    label: string
    value: number | string
    icon?: React.ReactNode
    color?: string
    sparkline?: number[]
  }[]
  updateInterval?: number
  className?: string
}

export const RealtimeMetrics = ({
  metrics,
  updateInterval = 5000,
  className,
}: RealtimeMetricsProps) => {
  const [isLive, setIsLive] = React.useState(true)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Realtime Metrics</CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500',
              )}
            />
            <span className="text-sm text-muted-foreground">{isLive ? 'Live' : 'Paused'}</span>
            <Button size="sm" variant="outline" onClick={() => setIsLive(!isLive)}>
              {isLive ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map(metric => (
            <div
              key={metric.id}
              className="space-y-2 p-3 rounded-lg border"
              style={{
                borderColor: metric.color ? `${metric.color}20` : undefined,
                backgroundColor: metric.color ? `${metric.color}05` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                {metric.icon && <div className="text-muted-foreground">{metric.icon}</div>}
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.sparkline && (
                <div className="h-8 flex items-end gap-0.5">
                  {metric.sparkline.map((value, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-primary/50 rounded-t"
                      style={{
                        height: `${(value / Math.max(...(metric.sparkline || []))) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export interface AnalyticsDashboardProps {
  children: React.ReactNode
  title?: string
  description?: string
  dateRange?: { start: Date; end: Date }
  onDateRangeChange?: (range: { start: Date; end: Date }) => void
  actions?: React.ReactNode
  className?: string
}

export const AnalyticsDashboard = ({
  children,
  title = 'Analytics Dashboard',
  description,
  dateRange,
  onDateRangeChange,
  actions,
  className,
}: AnalyticsDashboardProps) => {
  const formatDateRange = (range?: { start: Date; end: Date }) => {
    if (!range) return 'Select date range'
    return `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onDateRangeChange && (
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button className="gap-2" variant="outline">
                <Calendar className="h-4 w-4" />
                {formatDateRange(dateRange)}
              </Button>
              <Button size="icon" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {actions}
        </div>
      </div>

      {children}
    </div>
  )
}

export interface MetricComparisonProps {
  current: {
    label: string
    value: number
    unit?: string
  }
  previous: {
    label: string
    value: number
    unit?: string
  }
  format?: 'percentage' | 'currency' | 'number'
  className?: string
}

export const MetricComparison = ({
  current,
  previous,
  format = 'number',
  className,
}: MetricComparisonProps) => {
  const change = ((current.value - previous.value) / previous.value) * 100
  const isPositive = change > 0

  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value)
      case 'percentage':
        return `${value}%`
      default:
        return value.toLocaleString()
    }
  }

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{current.label}</p>
        <p className="text-2xl font-bold">
          {formatValue(current.value)}
          {current.unit && (
            <span className="text-lg font-normal text-muted-foreground ml-1">{current.unit}</span>
          )}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{previous.label}</p>
        <p className="text-2xl font-bold text-muted-foreground">
          {formatValue(previous.value)}
          {previous.unit && <span className="text-lg font-normal ml-1">{previous.unit}</span>}
        </p>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <div
          className={cn('flex items-center gap-1', isPositive ? 'text-green-600' : 'text-red-600')}
        >
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {isPositive ? 'increase' : 'decrease'} from {previous.label.toLowerCase()}
        </span>
      </div>
    </div>
  )
}
