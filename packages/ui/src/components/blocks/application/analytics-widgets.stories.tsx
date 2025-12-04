import type { Meta, StoryObj } from '@storybook/react'
import {
  AnalyticsCard,
  PerformanceMetrics,
  ConversionFunnel,
  RealtimeMetrics,
  AnalyticsDashboard,
  MetricComparison,
  type ChartData,
} from './analytics-widgets'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, ShoppingCart, Download, Calendar, Target } from 'lucide-react'

const meta = {
  title: 'Blocks/Application/AnalyticsWidgets',
  component: AnalyticsCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnalyticsCard>

export default meta
type Story = StoryObj<typeof meta>

// Sample chart data
const sampleChartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Revenue',
      data: [3000, 4500, 3800, 5200, 4800, 6000],
      color: '#10b981',
    },
    {
      label: 'Users',
      data: [1200, 1800, 1500, 2100, 1900, 2400],
      color: '#3b82f6',
    },
  ],
}

const sampleChartData2: ChartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Page Views',
      data: [1200, 1800, 1500, 2100, 1900, 2400, 2800],
      color: '#8b5cf6',
    },
  ],
}

export const Default: Story = {
  args: {
    title: 'Revenue Overview',
    description: 'Monthly revenue and user growth',
    metric: {
      value: 45231.89,
      unit: '$',
      change: 20.1,
      trend: 'up',
      target: 50000,
    },
    chart: sampleChartData,
    timeRange: '7d',
  },
}

export const WithoutChart: Story = {
  args: {
    title: 'Active Users',
    description: 'Current number of active users',
    metric: {
      value: 2350,
      change: 180.1,
      trend: 'up',
      target: 3000,
    },
  },
}

export const WithoutMetric: Story = {
  args: {
    title: 'Page Views',
    description: 'Daily page view statistics',
    chart: sampleChartData2,
    timeRange: '7d',
  },
}

export const PerformanceMetricsExample: Story = {
  args: {
    title: 'Performance',
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <PerformanceMetrics
        title="System Performance"
        metrics={[
          {
            name: 'CPU Usage',
            value: 42,
            target: 80,
            unit: '%',
            color: '#10b981',
          },
          {
            name: 'Memory Usage',
            value: 6.8,
            target: 16,
            unit: 'GB',
            color: '#3b82f6',
          },
          {
            name: 'Disk Space',
            value: 75,
            target: 100,
            unit: 'GB',
            color: '#8b5cf6',
          },
          {
            name: 'Network I/O',
            value: 892,
            target: 1000,
            unit: 'Mb/s',
            color: '#f59e0b',
          },
        ]}
      />
    </div>
  ),
}

export const ConversionFunnelExample: Story = {
  args: {
    title: 'Conversion',
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <ConversionFunnel
        title="Sales Funnel"
        steps={[
          {
            name: 'Visitors',
            value: 10000,
            percentage: 100,
          },
          {
            name: 'Sign Ups',
            value: 2500,
            percentage: 25,
          },
          {
            name: 'Trials',
            value: 1000,
            percentage: 10,
          },
          {
            name: 'Conversions',
            value: 250,
            percentage: 2.5,
          },
        ]}
      />
    </div>
  ),
}

export const RealtimeMetricsExample: Story = {
  args: {
    title: 'Realtime',
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <RealtimeMetrics
        metrics={[
          {
            id: 'users',
            label: 'Active Users',
            value: 2350,
            icon: <Users className="h-4 w-4" />,
            color: '#10b981',
            sparkline: [2100, 2200, 2150, 2300, 2250, 2350],
          },
          {
            id: 'revenue',
            label: 'Revenue',
            value: 45231.89,
            icon: <DollarSign className="h-4 w-4" />,
            color: '#3b82f6',
            sparkline: [40000, 42000, 41000, 44000, 43000, 45231.89],
          },
          {
            id: 'orders',
            label: 'Orders',
            value: 12234,
            icon: <ShoppingCart className="h-4 w-4" />,
            color: '#8b5cf6',
            sparkline: [10000, 11000, 10500, 11500, 12000, 12234],
          },
          {
            id: 'conversion',
            label: 'Conversion Rate',
            value: 3.24,
            icon: <Target className="h-4 w-4" />,
            color: '#f59e0b',
            sparkline: [2.8, 2.9, 3.0, 3.1, 3.2, 3.24],
          },
        ]}
        updateInterval={5000}
      />
    </div>
  ),
}

export const AnalyticsDashboardExample: Story = {
  args: {
    title: 'Dashboard',
  },
  render: () => (
    <AnalyticsDashboard
      title="Business Analytics"
      description="Overview of key business metrics"
      dateRange={{
        start: new Date('2024-01-01'),
        end: new Date('2024-03-31'),
      }}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Revenue"
          description="Monthly revenue"
          metric={{
            value: 45231.89,
            unit: '$',
            change: 20.1,
            trend: 'up',
            target: 50000,
          }}
          chart={sampleChartData}
        />
        <AnalyticsCard
          title="Users"
          description="Active users"
          metric={{
            value: 2350,
            change: 180.1,
            trend: 'up',
            target: 3000,
          }}
        />
        <AnalyticsCard
          title="Orders"
          description="Total orders"
          metric={{
            value: 12234,
            change: 19,
            trend: 'up',
          }}
        />
        <AnalyticsCard
          title="Conversion"
          description="Conversion rate"
          metric={{
            value: 3.24,
            unit: '%',
            change: -2.4,
            trend: 'down',
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <PerformanceMetrics
          title="System Performance"
          metrics={[
            {
              name: 'CPU Usage',
              value: 42,
              target: 80,
              unit: '%',
              color: '#10b981',
            },
            {
              name: 'Memory Usage',
              value: 6.8,
              target: 16,
              unit: 'GB',
              color: '#3b82f6',
            },
            {
              name: 'Disk Space',
              value: 75,
              target: 100,
              unit: 'GB',
              color: '#8b5cf6',
            },
            {
              name: 'Network I/O',
              value: 892,
              target: 1000,
              unit: 'Mb/s',
              color: '#f59e0b',
            },
          ]}
        />
        <ConversionFunnel
          title="Sales Funnel"
          steps={[
            {
              name: 'Visitors',
              value: 10000,
              percentage: 100,
            },
            {
              name: 'Sign Ups',
              value: 2500,
              percentage: 25,
            },
            {
              name: 'Trials',
              value: 1000,
              percentage: 10,
            },
            {
              name: 'Conversions',
              value: 250,
              percentage: 2.5,
            },
          ]}
        />
      </div>
    </AnalyticsDashboard>
  ),
}

export const MetricComparisonExample: Story = {
  args: {
    title: 'Comparison',
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricComparison
        current={{ label: 'This Month', value: 45231.89, unit: '$' }}
        previous={{ label: 'Last Month', value: 37645.32, unit: '$' }}
        format="currency"
      />
      <MetricComparison
        current={{ label: 'This Week', value: 2350 }}
        previous={{ label: 'Last Week', value: 2100 }}
        format="number"
      />
      <MetricComparison
        current={{ label: 'Today', value: 3.24, unit: '%' }}
        previous={{ label: 'Yesterday', value: 3.32, unit: '%' }}
        format="percentage"
      />
    </div>
  ),
}

export const WithTimeRangeSelector: Story = {
  args: {
    title: 'With Time Range',
  },
  render: () => (
    <AnalyticsCard
      title="Page Views"
      description="Daily page view statistics"
      metric={{
        value: 12450,
        change: 12.5,
        trend: 'up',
      }}
      chart={sampleChartData2}
      timeRange="7d"
      onTimeRangeChange={range => {
        // Time range changed: range
      }}
    />
  ),
}

export const WithTarget: Story = {
  args: {
    title: 'With Target',
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <AnalyticsCard
        title="Monthly Revenue"
        description="Progress towards monthly goal"
        metric={{
          value: 45231.89,
          unit: '$',
          change: 20.1,
          trend: 'up',
          target: 50000,
        }}
      />
      <AnalyticsCard
        title="User Growth"
        description="Progress towards user target"
        metric={{
          value: 2350,
          change: 180.1,
          trend: 'up',
          target: 3000,
        }}
      />
    </div>
  ),
}

export const MultipleCharts: Story = {
  args: {
    title: 'Multiple Charts',
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <AnalyticsCard
        title="Revenue vs Users"
        description="Correlation between revenue and user growth"
        chart={sampleChartData}
      />
      <AnalyticsCard
        title="Daily Page Views"
        description="Page view trends over the week"
        chart={sampleChartData2}
      />
    </div>
  ),
}

export const LoadingState: Story = {
  args: {
    title: 'Loading',
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <AnalyticsCard
        title="Loading..."
        description="Loading metrics..."
        metric={{
          value: 0,
          change: 0,
          trend: 'neutral',
        }}
      />
      <AnalyticsCard title="Loading..." description="Loading chart..." chart={sampleChartData} />
    </div>
  ),
}
