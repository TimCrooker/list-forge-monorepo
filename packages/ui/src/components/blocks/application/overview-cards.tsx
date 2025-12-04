import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  href?: string
  onAction?: () => void
  actionLabel?: string
  loading?: boolean
  className?: string
}

export interface OverviewCardsProps {
  cards: MetricCardProps[]
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

export interface ProgressCardProps {
  title: string
  value: number
  max?: number
  description?: string
  unit?: string
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'
  className?: string
}

export interface ComparisonCardProps {
  title: string
  current: {
    label: string
    value: string | number
  }
  previous: {
    label: string
    value: string | number
  }
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export const OverviewMetricCard = ({
  title,
  value,
  description,
  change,
  changeLabel,
  trend = 'neutral',
  icon,
  href,
  onAction,
  actionLabel,
  loading = false,
  className,
}: MetricCardProps) => {
  const isPositive = trend === 'up' || (change && change > 0)
  const isNegative = trend === 'down' || (change && change < 0)

  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon ? (
          <div className="text-muted-foreground">{icon}</div>
        ) : onAction ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAction}>{actionLabel}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {(description || change !== undefined) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {change !== undefined && (
                  <span
                    className={cn(
                      'flex items-center gap-0.5',
                      isPositive && 'text-green-600',
                      isNegative && 'text-red-600',
                    )}
                  >
                    {isPositive ? (
                      <ArrowUpIcon className="h-3 w-3" />
                    ) : isNegative ? (
                      <ArrowDownIcon className="h-3 w-3" />
                    ) : null}
                    {Math.abs(change)}%
                  </span>
                )}
                {changeLabel && <span>{changeLabel}</span>}
                {description && !changeLabel && <span>{description}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  )

  if (href) {
    return (
      <a className="block transition-colors hover:bg-muted/50" href={href}>
        <Card className={cn('cursor-pointer', className)}>{content}</Card>
      </a>
    )
  }

  return <Card className={className}>{content}</Card>
}

export const OverviewCards = ({ cards, columns = 4, className = '' }: OverviewCardsProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }

  return (
    <div className={cn(`grid gap-4 ${gridCols[columns]}`, className)}>
      {cards.map((card, index) => (
        <OverviewMetricCard key={index} {...card} />
      ))}
    </div>
  )
}

export const ProgressCard = ({
  title,
  value,
  max = 100,
  description,
  unit = '%',
  icon,
  color = 'primary',
  className,
}: ProgressCardProps) => {
  const percentage = (value / max) * 100

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    destructive: 'bg-destructive',
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">
            {value}
            <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            of {max}
            {unit}
          </span>
        </div>
        <Progress className="h-2" value={percentage} />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

export const OverviewComparisonCard = ({
  title,
  current,
  previous,
  change = 0,
  changeLabel = '',
  icon = null,
  className = '',
}: ComparisonCardProps) => {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{current.label}</p>
            <p className="text-2xl font-bold">{current.value}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{previous.label}</p>
            <p className="text-2xl font-bold text-muted-foreground">{previous.value}</p>
          </div>
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Badge
              className="gap-1"
              variant={isPositive ? 'default' : isNegative ? 'destructive' : 'secondary'}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : isNegative ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {Math.abs(change)}%
            </Badge>
            {changeLabel && <span className="text-sm text-muted-foreground">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export interface StatGridProps {
  stats: {
    label: string
    value: string | number
    icon?: React.ReactNode
  }[]
  className?: string
}

export const StatGrid = ({ stats, className }: StatGridProps) => {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col items-center justify-center space-y-2 p-4',
                index < stats.length - 1 && 'border-r',
              )}
            >
              {stat.icon && <div className="text-muted-foreground">{stat.icon}</div>}
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground text-center">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
