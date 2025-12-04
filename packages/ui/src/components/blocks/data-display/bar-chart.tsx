import * as React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
  Cell,
  ReferenceLine,
  Brush,
  LabelList,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface BarChartData {
  name: string
  [key: string]: any
}

export interface BarConfig {
  dataKey: string
  color?: string
  name?: string
  stackId?: string
  radius?: number | [number, number, number, number]
  showLabel?: boolean
  labelPosition?: 'top' | 'inside' | 'insideTop' | 'insideBottom'
}

export interface BarChartProps {
  title?: string
  description?: string
  data: BarChartData[]
  bars: BarConfig[]
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
  formatLabel?: (value: any) => string
  orientation?: 'vertical' | 'horizontal'
  stacked?: boolean
  referenceLines?: Array<{
    y?: number
    x?: string | number
    label?: string
    color?: string
  }>
  animate?: boolean
  barSize?: number
  maxBarSize?: number
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

export const BarChart = ({
  title,
  description,
  data,
  bars,
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
  formatLabel,
  orientation = 'vertical',
  stacked = false,
  referenceLines = [],
  animate = true,
  barSize,
  maxBarSize,
}: BarChartProps) => {
  const isHorizontal = orientation === 'horizontal'

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
            <RechartsBarChart
              barSize={barSize}
              data={data}
              layout={isHorizontal ? 'horizontal' : 'vertical'}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />}

              {isHorizontal ? (
                <>
                  <XAxis
                    className="text-xs"
                    label={
                      xAxisLabel
                        ? { value: xAxisLabel, position: 'insideBottom', offset: -5 }
                        : undefined
                    }
                    tickFormatter={formatXAxis}
                    type="number"
                  />
                  <YAxis
                    className="text-xs"
                    dataKey={xAxisKey}
                    label={
                      yAxisLabel
                        ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                        : undefined
                    }
                    tickFormatter={formatYAxis}
                    type="category"
                  />
                </>
              ) : (
                <>
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
                      yAxisLabel
                        ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                        : undefined
                    }
                    tickFormatter={formatYAxis}
                  />
                </>
              )}

              {showTooltip && <Tooltip content={<CustomTooltip formatTooltip={formatTooltip} />} />}

              {showLegend && <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px' }} />}

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

              {bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  animationDuration={animate ? 1000 : 0}
                  dataKey={bar.dataKey}
                  fill={bar.color || `hsl(var(--chart-${index + 1}))`}
                  maxBarSize={maxBarSize}
                  name={bar.name || bar.dataKey}
                  radius={bar.radius}
                  stackId={stacked ? 'stack' : bar.stackId}
                >
                  {bar.showLabel && (
                    <LabelList
                      className="fill-foreground text-xs"
                      dataKey={bar.dataKey}
                      formatter={formatLabel}
                      position={bar.labelPosition || 'top'}
                    />
                  )}
                </Bar>
              ))}

              {showBrush && <Brush dataKey={xAxisKey} height={30} stroke="hsl(var(--primary))" />}
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Pre-configured chart variants
export const GroupedBarChart = ({
  data,
  categories,
  ...props
}: Omit<BarChartProps, 'bars'> & {
  categories: Array<{ key: string; name: string; color?: string }>
}) => {
  const bars: BarConfig[] = categories.map((category, index) => ({
    dataKey: category.key,
    name: category.name,
    color: category.color || `hsl(var(--chart-${index + 1}))`,
    radius: [4, 4, 0, 0],
  }))

  return <BarChart bars={bars} data={data} stacked={false} {...props} />
}

export const StackedBarChart = ({
  data,
  categories,
  ...props
}: Omit<BarChartProps, 'bars' | 'stacked'> & {
  categories: Array<{ key: string; name: string; color?: string }>
}) => {
  const bars: BarConfig[] = categories.map((category, index) => ({
    dataKey: category.key,
    name: category.name,
    color: category.color || `hsl(var(--chart-${index + 1}))`,
    stackId: 'stack',
  }))

  return <BarChart stacked bars={bars} data={data} {...props} />
}

export const SimpleBarChart = ({
  data,
  dataKey,
  color = 'hsl(var(--primary))',
  showLabels = false,
  ...props
}: Omit<BarChartProps, 'bars'> & {
  dataKey: string
  color?: string
  showLabels?: boolean
}) => {
  const bars: BarConfig[] = [
    {
      dataKey,
      color,
      radius: [4, 4, 0, 0],
      showLabel: showLabels,
      labelPosition: 'top',
    },
  ]

  return <BarChart bars={bars} data={data} showLegend={false} {...props} />
}
