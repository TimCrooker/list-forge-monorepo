import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { BarChart, GroupedBarChart, StackedBarChart, SimpleBarChart } from './bar-chart'

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

const meta: Meta<typeof BarChart> = {
  title: 'Blocks/DataDisplay/BarChart',
  component: BarChart,
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
    bars: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb' },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a' },
      { dataKey: 'users', name: 'Users', color: '#9333ea' },
    ],
    height: 400,
  },
}

export const Horizontal: Story = {
  args: {
    ...Default.args,
    orientation: 'horizontal',
  },
}

export const Stacked: Story = {
  args: {
    ...Default.args,
    stacked: true,
  },
}

export const WithLabels: Story = {
  args: {
    ...Default.args,
    bars: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb', showLabel: true },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a', showLabel: true },
      { dataKey: 'users', name: 'Users', color: '#9333ea', showLabel: true },
    ],
  },
}

export const WithRoundedCorners: Story = {
  args: {
    ...Default.args,
    bars: [
      { dataKey: 'sales', name: 'Sales', color: '#2563eb', radius: 4 },
      { dataKey: 'revenue', name: 'Revenue', color: '#16a34a', radius: 4 },
      { dataKey: 'users', name: 'Users', color: '#9333ea', radius: 4 },
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
    formatLabel: value => `$${value.toLocaleString()}`,
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

export const CustomBarSize: Story = {
  args: {
    ...Default.args,
    barSize: 20,
  },
}

export const CustomClassName: Story = {
  args: {
    ...Default.args,
    className: 'bg-gray-50',
  },
}

export const SingleBar: Story = {
  args: {
    ...Default.args,
    bars: [{ dataKey: 'sales', name: 'Sales', color: '#2563eb' }],
  },
}

export const GroupedChart: Story = {
  args: {
    data: categoryData,
    bars: [],
  },
  render: () => (
    <GroupedBarChart
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

export const StackedChart: Story = {
  args: {
    data: categoryData,
    bars: [],
  },
  render: () => (
    <StackedBarChart
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

export const SimpleChart: Story = {
  args: {
    data: monthlyData,
    bars: [],
  },
  render: () => (
    <SimpleBarChart
      title="Monthly Sales"
      description="Total sales by month"
      data={monthlyData}
      dataKey="sales"
      color="#2563eb"
      showLabels
      height={400}
    />
  ),
}
