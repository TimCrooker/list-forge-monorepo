import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AreaChart, StackedAreaChart, SimpleAreaChart, ComparisonAreaChart } from './area-chart'

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

const categoryData = [
  { name: 'Electronics', category: 'Electronics', online: 4000, retail: 2400, wholesale: 1800 },
  { name: 'Clothing', category: 'Clothing', online: 3000, retail: 1398, wholesale: 2200 },
  { name: 'Food', category: 'Food', online: 2000, retail: 9800, wholesale: 2800 },
  { name: 'Books', category: 'Books', online: 2780, retail: 3908, wholesale: 3200 },
  { name: 'Sports', category: 'Sports', online: 1890, retail: 4800, wholesale: 3800 },
]

const dailyData = Array.from({ length: 30 }, (_, i) => ({
  name: new Date(2024, 0, i + 1).toISOString().split('T')[0],
  date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
  current: Math.random() * 100,
  previous: Math.random() * 100,
}))

const meta: Meta<typeof AreaChart> = {
  title: 'Blocks/DataDisplay/AreaChart',
  component: AreaChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Monthly Metrics',
    description: 'Overview of sales, revenue, and users',
    data: monthlyData,
    areas: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb' },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a' },
      { dataKey: 'users', name: 'Users', color: '#9333ea' },
    ],
    height: 400,
  },
}

export const Stacked: Story = {
  args: {
    ...Default.args,
    stacked: true,
  },
}

export const WithoutGradient: Story = {
  args: {
    ...Default.args,
    areas: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb', gradient: false },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a', gradient: false },
      { dataKey: 'users', name: 'Users', color: '#9333ea', gradient: false },
    ],
  },
}

export const CustomOpacity: Story = {
  args: {
    ...Default.args,
    areas: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb', fillOpacity: 0.3 },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a', fillOpacity: 0.3 },
      { dataKey: 'users', name: 'Users', color: '#9333ea', fillOpacity: 0.3 },
    ],
  },
}

export const LinearLines: Story = {
  args: {
    ...Default.args,
    areas: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb', curved: false },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a', curved: false },
      { dataKey: 'users', name: 'Users', color: '#9333ea', curved: false },
    ],
  },
}

export const DottedLines: Story = {
  args: {
    ...Default.args,
    areas: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb', strokeDasharray: '5 5' },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a', strokeDasharray: '5 5' },
      { dataKey: 'users', name: 'Users', color: '#9333ea', strokeDasharray: '5 5' },
    ],
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

export const SingleArea: Story = {
  args: {
    ...Default.args,
    areas: [{ dataKey: 'sales', name: 'Sales', color: '#2563eb' }],
  },
}

export const StackedAreaChartExample: Story = {
  args: {
    data: categoryData,
    areas: [],
  },
  render: () => (
    <StackedAreaChart
      title="Category Performance"
      description="Sales by channel and category"
      data={categoryData}
      categories={[
        { key: 'online', name: 'Online', color: '#2563eb' },
        { key: 'retail', name: 'Retail', color: '#16a34a' },
        { key: 'wholesale', name: 'Wholesale', color: '#9333ea' },
      ]}
      height={400}
    />
  ),
}

export const SimpleAreaChartExample: Story = {
  args: {
    data: monthlyData,
    areas: [],
  },
  render: () => (
    <SimpleAreaChart
      title="Monthly Sales"
      description="Total sales by month"
      data={monthlyData}
      dataKey="sales"
      color="#2563eb"
      showGradient
      height={400}
    />
  ),
}

export const ComparisonAreaChartExample: Story = {
  args: {
    data: dailyData,
    areas: [],
  },
  render: () => (
    <ComparisonAreaChart
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
