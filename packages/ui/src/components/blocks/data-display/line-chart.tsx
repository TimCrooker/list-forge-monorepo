import * as React from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
  Area,
  ReferenceLine,
  Brush,
  Dot,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface LineChartData {
  name: string
  [key: string]: any
}

export interface LineConfig {
  dataKey: string
  color?: string
  name?: string
  strokeWidth?: number
  strokeDasharray?: string
  showDots?: boolean
  curved?: boolean
}

export interface LineChartProps {
  title?: string
  description?: string
  data: LineChartData[]
  lines: LineConfig[]
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showBrush?: boolean
  className?: string
  xAxisKey?: string
  yAxisLabel?: string
  xAxisLabel?: string
  formatYAxis?: (value: any) => string
  formatXAxis?: (value: any) => string
  formatTooltip?: (value: any) => string
  referenceLines?: Array<{
    y?: number
    x?: string | number
    label?: string
    color?: string
  }>
  gradient?: boolean
  animate?: boolean
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatTooltip,
}: TooltipProps<any, any> & { formatTooltip?: (value: any) => string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatTooltip ? formatTooltip(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const LineChart = ({
  title,
  description,
  data,
  lines,
  height = 350,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showBrush = false,
  className,
  xAxisKey = 'name',
  yAxisLabel,
  xAxisLabel,
  formatYAxis,
  formatXAxis,
  formatTooltip,
  referenceLines = [],
  gradient = false,
  animate = true,
}: LineChartProps) => {
  const chartId = React.useId()

  return (
    <Card className={cn('w-full', className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {gradient && (
                <defs>
                  {lines.map((line, index) => (
                    <linearGradient
                      key={index}
                      id={`gradient-${chartId}-${index}`}
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={line.color || `hsl(var(--chart-${index + 1}))`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={line.color || `hsl(var(--chart-${index + 1}))`}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
                </defs>
              )}

              {showGrid && <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />}

              <XAxis
                className="text-xs"
                dataKey={xAxisKey}
                label={
                  xAxisLabel
                    ? { value: xAxisLabel, position: 'insideBottom', offset: -5 }
                    : undefined
                }
                tickFormatter={formatXAxis}
              />

              <YAxis
                className="text-xs"
                label={
                  yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined
                }
                tickFormatter={formatYAxis}
              />

              {showTooltip && <Tooltip content={<CustomTooltip formatTooltip={formatTooltip} />} />}

              {showLegend && <Legend iconType="line" wrapperStyle={{ paddingTop: '20px' }} />}

              {referenceLines.map((refLine, index) => (
                <ReferenceLine
                  key={index}
                  label={refLine.label}
                  stroke={refLine.color || 'hsl(var(--destructive))'}
                  strokeDasharray="3 3"
                  x={refLine.x}
                  y={refLine.y}
                />
              ))}

              {lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  activeDot={line.showDots !== false ? { r: 6 } : false}
                  animationDuration={animate ? 1000 : 0}
                  dataKey={line.dataKey}
                  dot={line.showDots === true}
                  fill={gradient ? `url(#gradient-${chartId}-${index})` : undefined}
                  name={line.name || line.dataKey}
                  stroke={line.color || `hsl(var(--chart-${index + 1}))`}
                  strokeDasharray={line.strokeDasharray}
                  strokeWidth={line.strokeWidth || 2}
                  type={line.curved !== false ? 'monotone' : 'linear'}
                />
              ))}

              {showBrush && <Brush dataKey={xAxisKey} height={30} stroke="hsl(var(--primary))" />}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Pre-configured chart variants for common use cases
export const MetricsLineChart = ({
  data,
  metrics,
  ...props
}: Omit<LineChartProps, 'lines'> & {
  metrics: Array<{ key: string; name: string; color?: string }>
}) => {
  const lines: LineConfig[] = metrics.map((metric, index) => ({
    dataKey: metric.key,
    name: metric.name,
    color: metric.color || `hsl(var(--chart-${index + 1}))`,
    curved: true,
    showDots: false,
  }))

  return <LineChart data={data} lines={lines} {...props} />
}

export const ComparisonLineChart = ({
  data,
  currentKey,
  previousKey,
  currentLabel = 'Current Period',
  previousLabel = 'Previous Period',
  ...props
}: Omit<LineChartProps, 'lines'> & {
  currentKey: string
  previousKey: string
  currentLabel?: string
  previousLabel?: string
}) => {
  const lines: LineConfig[] = [
    {
      dataKey: currentKey,
      name: currentLabel,
      color: 'hsl(var(--primary))',
      strokeWidth: 3,
      curved: true,
    },
    {
      dataKey: previousKey,
      name: previousLabel,
      color: 'hsl(var(--muted-foreground))',
      strokeWidth: 2,
      strokeDasharray: '5 5',
      curved: true,
    },
  ]

  return <LineChart data={data} lines={lines} {...props} />
}
