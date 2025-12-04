import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PieChart, DonutChart, HalfDonutChart, SimplePieChart } from './pie-chart'

// Sample data
const salesData = [
  { name: 'Electronics', value: 4000, color: '#2563eb' },
  { name: 'Clothing', value: 3000, color: '#16a34a' },
  { name: 'Food', value: 2000, color: '#9333ea' },
  { name: 'Books', value: 1800, color: '#ca8a04' },
  { name: 'Sports', value: 1200, color: '#dc2626' },
]

const revenueData = [
  { name: 'Online', value: 5000, color: '#2563eb' },
  { name: 'Retail', value: 3500, color: '#16a34a' },
  { name: 'Wholesale', value: 2500, color: '#9333ea' },
]

const meta: Meta<typeof PieChart> = {
  title: 'Blocks/DataDisplay/PieChart',
  component: PieChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Sales by Category',
    description: 'Distribution of sales across different categories',
    data: salesData,
    height: 400,
  },
}

export const Donut: Story = {
  args: {
    ...Default.args,
    innerRadius: 60,
  },
}

export const WithPadding: Story = {
  args: {
    ...Default.args,
    paddingAngle: 2,
  },
}

export const WithCornerRadius: Story = {
  args: {
    ...Default.args,
    cornerRadius: 8,
  },
}

export const CustomAngles: Story = {
  args: {
    ...Default.args,
    startAngle: 0,
    endAngle: 360,
  },
}

export const CustomColors: Story = {
  args: {
    ...Default.args,
    colors: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4'],
  },
}

export const ValueLabels: Story = {
  args: {
    ...Default.args,
    labelType: 'value',
  },
}

export const NameLabels: Story = {
  args: {
    ...Default.args,
    labelType: 'name',
  },
}

export const CustomLabelFormat: Story = {
  args: {
    ...Default.args,
    labelType: 'custom',
    formatLabel: (value, { name, percent }) => `${name}: $${value.toLocaleString()}`,
  },
}

export const OutsideLabels: Story = {
  args: {
    ...Default.args,
    labelPosition: 'outside',
  },
}

export const CustomTooltipFormat: Story = {
  args: {
    ...Default.args,
    formatTooltip: value => `$${value.toLocaleString()}`,
  },
}

export const WithCenterLabel: Story = {
  args: {
    ...Default.args,
    centerLabel: {
      value: '$12,000',
      subtitle: 'Total Sales',
    },
  },
}

export const WithoutAnimation: Story = {
  args: {
    ...Default.args,
    animate: false,
  },
}

export const LegendTop: Story = {
  args: {
    ...Default.args,
    legendPosition: 'top',
  },
}

export const LegendLeft: Story = {
  args: {
    ...Default.args,
    legendPosition: 'left',
  },
}

export const LegendRight: Story = {
  args: {
    ...Default.args,
    legendPosition: 'right',
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

export const DonutChartExample: Story = {
  args: {
    data: [],
  },
  render: () => (
    <DonutChart
      title="Revenue by Channel"
      description="Distribution of revenue across different channels"
      data={revenueData}
      centerValue="$11,000"
      centerSubtitle="Total Revenue"
      height={400}
    />
  ),
}

export const HalfDonutChartExample: Story = {
  args: {
    data: [],
  },
  render: () => (
    <HalfDonutChart
      title="Revenue by Channel"
      description="Distribution of revenue across different channels"
      data={revenueData}
      centerValue="$11,000"
      centerSubtitle="Total Revenue"
      height={400}
    />
  ),
}

export const SimplePieChartExample: Story = {
  args: {
    data: [],
  },
  render: () => (
    <SimplePieChart
      title="Sales by Category"
      description="Distribution of sales across different categories"
      data={salesData}
      height={400}
    />
  ),
}
