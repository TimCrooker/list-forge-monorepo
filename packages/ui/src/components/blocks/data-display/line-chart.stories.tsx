import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { LineChart, MetricsLineChart, ComparisonLineChart } from './line-chart'

// Sample data
const monthlyData = [
  { name: 'Jan', sales: 4000, revenue: 2400, users: 1800 },
  { name: 'Feb', sales: 3000, revenue: 1398, users: 2200 },
  { name: 'Mar', sales: 2000, revenue: 9800, users: 2800 },
  { name: 'Apr', sales: 2780, revenue: 3908, users: 3200 },
  { name: 'May', sales: 1890, revenue: 4800, users: 3800 },
  { name: 'Jun', sales: 2390, revenue: 3800, users: 4200 },
  { name: 'Jul', sales: 3490, revenue: 4300, users: 4800 },
]

const dailyData = Array.from({ length: 30 }, (_, i) => ({
  name: new Date(2024, 0, i + 1).toISOString().split('T')[0],
  date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
  current: Math.random() * 100,
  previous: Math.random() * 100,
}))

const meta = {
  title: 'Blocks/DataDisplay/LineChart',
  component: LineChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Monthly Metrics',
    description: 'Overview of sales, revenue, and users',
    data: monthlyData,
    lines: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb' },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a' },
      { dataKey: 'users', name: 'Users', color: '#9333ea' },
    ],
    height: 400,
  },
}

export const WithGradient: Story = {
  args: {
    ...Default.args,
    gradient: true,
  },
}

export const WithoutGrid: Story = {
  args: {
    ...Default.args,
    showGrid: false,
  },
}

export const WithoutLegend: Story = {
  args: {
    ...Default.args,
    showLegend: false,
  },
}

export const WithoutTooltip: Story = {
  args: {
    ...Default.args,
    showTooltip: false,
  },
}

export const WithBrush: Story = {
  args: {
    ...Default.args,
    showBrush: true,
  },
}

export const WithReferenceLines: Story = {
  args: {
    ...Default.args,
    referenceLines: [
      { y: 3000, label: 'Target', color: '#dc2626' },
      { y: 2000, label: 'Minimum', color: '#ca8a04' },
    ],
  },
}

export const CustomFormatters: Story = {
  args: {
    ...Default.args,
    formatYAxis: value => `$${value.toLocaleString()}`,
    formatXAxis: value => value.toUpperCase(),
    formatTooltip: value => `$${value.toLocaleString()}`,
  },
}

export const CustomLabels: Story = {
  args: {
    ...Default.args,
    xAxisLabel: 'Month',
    yAxisLabel: 'Value',
  },
}

export const CustomHeight: Story = {
  args: {
    ...Default.args,
    height: 200,
  },
}

export const CustomClassName: Story = {
  args: {
    ...Default.args,
    className: 'bg-gray-50',
  },
}

export const SingleLine: Story = {
  args: {
    ...Default.args,
    lines: [{ dataKey: 'sales', name: 'Sales', color: '#2563eb' }],
  },
}

export const DottedLine: Story = {
  args: {
    ...Default.args,
    lines: [{ dataKey: 'sales', name: 'Sales', color: '#2563eb', strokeDasharray: '5 5' }],
  },
}

export const WithoutDots: Story = {
  args: {
    ...Default.args,
    lines: [{ dataKey: 'sales', name: 'Sales', color: '#2563eb', showDots: false }],
  },
}

export const LinearLine: Story = {
  args: {
    ...Default.args,
    lines: [{ dataKey: 'sales', name: 'Sales', color: '#2563eb', curved: false }],
  },
}

export const MetricsChart: Story = {
  args: {
    data: monthlyData,
    lines: [],
  },
  render: () => (
    <MetricsLineChart
      title="Monthly Metrics"
      description="Overview of key performance indicators"
      data={monthlyData}
      metrics={[
        { key: 'sales', name: 'Sales', color: '#2563eb' },
        { key: 'revenue', name: 'Revenue', color: '#16a34a' },
        { key: 'users', name: 'Users', color: '#9333ea' },
      ]}
      height={400}
    />
  ),
}

export const ComparisonChart: Story = {
  args: {
    data: dailyData,
    lines: [],
  },
  render: () => (
    <ComparisonLineChart
      title="Daily Comparison"
      description="Current vs Previous Period"
      data={dailyData}
      currentKey="current"
      previousKey="previous"
      currentLabel="Current Period"
      previousLabel="Previous Period"
      height={400}
    />
  ),
}
