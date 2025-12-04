import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KPICard, MetricCard, SparklineCard, ComparisonCard } from './kpi-card'
import { DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react'

// Sample data
const sparklineData = [
  { value: 4000 },
  { value: 3000 },
  { value: 2000 },
  { value: 2780 },
  { value: 1890 },
  { value: 2390 },
  { value: 3490 },
]

const meta = {
  title: 'Blocks/DataDisplay/KPICard',
  component: KPICard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof KPICard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,231.89',
    subtitle: 'Monthly revenue',
    description: 'Total revenue for the current month',
    data: sparklineData,
    trend: {
      value: 20.1,
      isPositive: true,
      label: 'vs last month',
    },
    icon: DollarSign,
  },
}

export const WithBadge: Story = {
  args: {
    ...Default.args,
    badge: {
      text: 'New',
      variant: 'secondary',
    },
  },
}

export const WithComparison: Story = {
  args: {
    ...Default.args,
    comparison: {
      value: '$38,000',
      label: 'last month',
    },
  },
}

export const NegativeTrend: Story = {
  args: {
    ...Default.args,
    trend: {
      value: 12.5,
      isPositive: false,
      label: 'vs last month',
    },
  },
}

export const WithoutChart: Story = {
  args: {
    ...Default.args,
    showChart: false,
  },
}

export const AreaChart: Story = {
  args: {
    ...Default.args,
    chartType: 'area',
  },
}

export const BarChart: Story = {
  args: {
    ...Default.args,
    chartType: 'bar',
  },
}

export const CustomChartColor: Story = {
  args: {
    ...Default.args,
    chartColor: '#16a34a',
  },
}

export const CustomChartHeight: Story = {
  args: {
    ...Default.args,
    chartHeight: 100,
  },
}

export const CustomValueFormat: Story = {
  args: {
    ...Default.args,
    value: 45231.89,
    format: value => `$${value.toLocaleString()}`,
  },
}

export const CustomClassName: Story = {
  args: {
    ...Default.args,
    className: 'bg-gray-50',
  },
}

export const MetricCardExample: Story = {
  args: {
    title: 'Metric',
    value: 0,
  },
  render: () => (
    <MetricCard
      title="Active Users"
      value="2,345"
      subtitle="Total active users"
      description="Number of users who have performed an action in the last 30 days"
      change={12.5}
      changeLabel="vs last month"
      icon={Users}
      data={sparklineData}
    />
  ),
}

export const SparklineCardExample: Story = {
  args: {
    title: 'Metric',
    value: 0,
  },
  render: () => (
    <SparklineCard
      title="Revenue Trend"
      value="$45,231.89"
      subtitle="Monthly revenue"
      description="Revenue trend over the last 7 days"
      data={sparklineData}
      sparklineType="area"
      sparklineColor="#2563eb"
    />
  ),
}

export const ComparisonCardExample: Story = {
  args: {
    title: 'Metric',
    value: 0,
  },
  render: () => (
    <ComparisonCard
      title="Revenue"
      currentValue={45231.89}
      previousValue={38000}
      previousLabel="Previous month"
      format={value => `$${value.toLocaleString()}`}
      data={sparklineData}
    />
  ),
}

export const WithIcon: Story = {
  args: {
    ...Default.args,
    icon: TrendingUp,
  },
}

export const WithoutIcon: Story = {
  args: {
    ...Default.args,
    icon: undefined,
  },
}

export const WithoutSubtitle: Story = {
  args: {
    ...Default.args,
    subtitle: undefined,
  },
}

export const WithoutDescription: Story = {
  args: {
    ...Default.args,
    description: undefined,
  },
}

export const WithoutTrend: Story = {
  args: {
    ...Default.args,
    trend: undefined,
  },
}

export const WithoutComparison: Story = {
  args: {
    ...Default.args,
    comparison: undefined,
  },
}

export const WithoutData: Story = {
  args: {
    ...Default.args,
    data: undefined,
  },
}

export const WithCustomBadge: Story = {
  args: {
    ...Default.args,
    badge: {
      text: 'Hot',
      variant: 'destructive',
    },
  },
}

export const WithSecondaryBadge: Story = {
  args: {
    ...Default.args,
    badge: {
      text: 'Beta',
      variant: 'outline',
    },
  },
}
