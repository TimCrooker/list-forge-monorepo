import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './chart'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChartContainer>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { month: 'Jan', revenue: 4000, expenses: 2400 },
  { month: 'Feb', revenue: 3000, expenses: 1398 },
  { month: 'Mar', revenue: 2000, expenses: 9800 },
  { month: 'Apr', revenue: 2780, expenses: 3908 },
  { month: 'May', revenue: 1890, expenses: 4800 },
  { month: 'Jun', revenue: 2390, expenses: 3800 },
]

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--chart-2))',
  },
}

export const BarChartExample: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-[600px]">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartContainer>
  ),
}

export const LineChartExample: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-[600px]">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-revenue)' }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-expenses)' }}
        />
      </LineChart>
    </ChartContainer>
  ),
}

export const AreaChartExample: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-[600px]">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stackId="1"
          stroke="var(--color-revenue)"
          fill="var(--color-revenue)"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stackId="1"
          stroke="var(--color-expenses)"
          fill="var(--color-expenses)"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ChartContainer>
  ),
}

const singleData = [
  { name: 'Page A', value: 400 },
  { name: 'Page B', value: 300 },
  { name: 'Page C', value: 300 },
  { name: 'Page D', value: 200 },
  { name: 'Page E', value: 278 },
  { name: 'Page F', value: 189 },
]

const singleChartConfig = {
  value: {
    label: 'Page Views',
    color: 'hsl(var(--chart-1))',
  },
}

export const SimpleBarChart: Story = {
  render: () => (
    <ChartContainer config={singleChartConfig} className="h-[300px] w-[600px]">
      <BarChart data={singleData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartContainer>
  ),
}
