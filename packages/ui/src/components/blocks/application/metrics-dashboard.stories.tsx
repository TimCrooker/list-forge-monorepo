import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MetricsDashboard, AdminMetricCard, type MetricData } from './metrics-dashboard'
import {
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Package,
  BarChart3,
  Eye,
  Download,
  Upload,
  Clock,
  Calendar,
  Target,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Server,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Video,
  Mic,
  Headphones,
  Camera,
  Image,
  FileText,
  File,
  Folder,
  Archive,
  Trash,
  Settings,
  Wrench,
  Lock,
  Unlock,
  Key,
  UserPlus,
  UserMinus,
  UserCheck,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  Link,
  Paperclip,
  Send,
  Inbox,
  Search,
  Filter,
  RefreshCw,
  RotateCw,
  Loader,
  MoreVertical,
} from 'lucide-react'

const meta = {
  title: 'Blocks/Application/MetricsDashboard',
  component: MetricsDashboard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MetricsDashboard>

export default meta
type Story = StoryObj<typeof meta>

// Generate sample sparkline data
const generateSparkline = (count: number, min: number, max: number) => {
  return Array.from({ length: count }, () => ({
    value: Math.floor(Math.random() * (max - min + 1)) + min,
  }))
}

// Sample metrics data
const basicMetrics: MetricData[] = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: 45231.89,
    unit: '$',
    description: 'Total revenue for the current period',
    trend: {
      value: 20.1,
      direction: 'up',
    },
    status: 'success',
    sparkline: generateSparkline(12, 30000, 50000),
    lastUpdated: new Date(),
    icon: DollarSign,
  },
  {
    id: 'users',
    label: 'Active Users',
    value: 2350,
    description: 'Number of active users',
    trend: {
      value: 180.1,
      direction: 'up',
    },
    status: 'success',
    sparkline: generateSparkline(12, 1000, 3000),
    lastUpdated: new Date(),
    icon: Users,
  },
  {
    id: 'orders',
    label: 'Orders',
    value: 12234,
    description: 'Total orders processed',
    trend: {
      value: 19,
      direction: 'up',
    },
    status: 'success',
    sparkline: generateSparkline(12, 8000, 15000),
    lastUpdated: new Date(),
    icon: ShoppingCart,
  },
  {
    id: 'conversion',
    label: 'Conversion Rate',
    value: 3.24,
    unit: '%',
    description: 'Overall conversion rate',
    trend: {
      value: -2.4,
      direction: 'down',
    },
    status: 'warning',
    sparkline: generateSparkline(12, 2, 5),
    lastUpdated: new Date(),
    icon: Target,
  },
]

const systemMetrics: MetricData[] = [
  {
    id: 'cpu',
    label: 'CPU Usage',
    value: 42,
    unit: '%',
    description: 'Current CPU utilization',
    trend: {
      value: -5.2,
      direction: 'down',
    },
    status: 'success',
    sparkline: generateSparkline(12, 30, 60),
    lastUpdated: new Date(),
    icon: Cpu,
  },
  {
    id: 'memory',
    label: 'Memory Usage',
    value: 6.8,
    unit: 'GB',
    description: 'of 16 GB total',
    status: 'warning',
    progress: {
      value: 6.8,
      max: 16,
    },
    lastUpdated: new Date(),
    icon: Database,
  },
  {
    id: 'disk',
    label: 'Disk I/O',
    value: 124,
    unit: 'MB/s',
    description: 'Current disk throughput',
    trend: {
      value: 8.4,
      direction: 'up',
    },
    status: 'success',
    sparkline: generateSparkline(12, 80, 150),
    lastUpdated: new Date(),
    icon: HardDrive,
  },
  {
    id: 'network',
    label: 'Network Traffic',
    value: 892,
    unit: 'Mb/s',
    description: 'Current network throughput',
    status: 'success',
    sparkline: generateSparkline(12, 500, 1000),
    lastUpdated: new Date(),
    icon: Wifi,
  },
]

const performanceMetrics: MetricData[] = [
  {
    id: 'requests',
    label: 'Requests/sec',
    value: 1842,
    description: 'Current request rate',
    trend: {
      value: 12.1,
      direction: 'up',
    },
    status: 'success',
    sparkline: generateSparkline(12, 1000, 2000),
    lastUpdated: new Date(),
    icon: Server,
  },
  {
    id: 'response',
    label: 'Response Time',
    value: 142,
    unit: 'ms',
    description: 'Average response time',
    trend: {
      value: -8.3,
      direction: 'down',
    },
    status: 'success',
    sparkline: generateSparkline(12, 100, 200),
    lastUpdated: new Date(),
    icon: Clock,
  },
  {
    id: 'errors',
    label: 'Error Rate',
    value: 0.08,
    unit: '%',
    description: 'Current error rate',
    trend: {
      value: 15.2,
      direction: 'up',
    },
    status: 'error',
    sparkline: generateSparkline(12, 0, 1),
    lastUpdated: new Date(),
    icon: AlertCircle,
  },
  {
    id: 'uptime',
    label: 'Uptime',
    value: 99.98,
    unit: '%',
    description: 'System uptime',
    status: 'success',
    sparkline: generateSparkline(12, 99, 100),
    lastUpdated: new Date(),
    icon: CheckCircle,
  },
]

export const Default: Story = {
  args: {
    metrics: basicMetrics,
    columns: 4,
  },
}

export const TwoColumns: Story = {
  args: {
    metrics: basicMetrics.slice(0, 2),
    columns: 2,
  },
}

export const ThreeColumns: Story = {
  args: {
    metrics: basicMetrics.slice(0, 3),
    columns: 3,
  },
}

export const LoadingState: Story = {
  args: {
    metrics: basicMetrics,
    loading: true,
  },
}

export const SystemMetrics: Story = {
  args: {
    metrics: systemMetrics,
    columns: 4,
  },
}

export const PerformanceMetrics: Story = {
  args: {
    metrics: performanceMetrics,
    columns: 4,
  },
}

export const MixedStatuses: Story = {
  args: {
    metrics: [],
  },
  render: () => {
    const mixedMetrics: MetricData[] = [
      {
        id: 'growth',
        label: 'Growth Rate',
        value: 24.5,
        unit: '%',
        description: 'User growth rate',
        trend: {
          value: 24.5,
          direction: 'up',
        },
        status: 'success',
        icon: TrendingUp,
      },
      {
        id: 'churn',
        label: 'Churn Rate',
        value: 5.2,
        unit: '%',
        description: 'User churn rate',
        trend: {
          value: -12.3,
          direction: 'down',
        },
        status: 'success',
        icon: TrendingDown,
      },
      {
        id: 'errors',
        label: 'Error Rate',
        value: 0.08,
        unit: '%',
        description: 'System error rate',
        trend: {
          value: 15.2,
          direction: 'up',
        },
        status: 'error',
        icon: AlertCircle,
      },
      {
        id: 'status',
        label: 'System Status',
        value: 'Healthy',
        description: 'Overall system health',
        status: 'success',
        icon: CheckCircle,
      },
    ]

    return <MetricsDashboard metrics={mixedMetrics} />
  },
}

export const WithProgress: Story = {
  args: {
    metrics: [],
  },
  render: () => {
    const progressMetrics: MetricData[] = [
      {
        id: 'storage',
        label: 'Storage Used',
        value: 75,
        unit: 'GB',
        description: 'of 100 GB total',
        status: 'warning',
        progress: {
          value: 75,
          max: 100,
        },
        icon: HardDrive,
      },
      {
        id: 'quota',
        label: 'API Quota',
        value: 8500,
        unit: ' calls',
        description: 'of 10,000 calls',
        status: 'warning',
        progress: {
          value: 8500,
          max: 10000,
        },
        icon: Globe,
      },
      {
        id: 'seats',
        label: 'Team Seats',
        value: 42,
        unit: ' users',
        description: 'of 50 seats',
        status: 'success',
        progress: {
          value: 42,
          max: 50,
        },
        icon: Users,
      },
      {
        id: 'projects',
        label: 'Projects',
        value: 95,
        unit: ' projects',
        description: 'of 100 projects',
        status: 'error',
        progress: {
          value: 95,
          max: 100,
        },
        icon: Folder,
      },
    ]

    return <MetricsDashboard metrics={progressMetrics} />
  },
}

export const SingleMetricCard: Story = {
  args: {
    metrics: [],
  },
  render: () => (
    <div className="max-w-sm">
      <AdminMetricCard
        id="mrr"
        label="Monthly Recurring Revenue"
        value={124592}
        unit="$"
        description="Based on current subscriptions"
        trend={{
          value: 18.4,
          direction: 'up',
        }}
        status="success"
        sparkline={generateSparkline(12, 100000, 150000)}
        lastUpdated={new Date()}
        icon={DollarSign}
        variant="detailed"
      />
    </div>
  ),
}

export const CompactVariants: Story = {
  args: {
    metrics: [],
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AdminMetricCard
        id="revenue"
        label="Revenue"
        value={45231.89}
        unit="$"
        trend={{
          value: 20.1,
          direction: 'up',
        }}
        status="success"
        icon={DollarSign}
        variant="compact"
      />
      <AdminMetricCard
        id="users"
        label="Users"
        value={2350}
        trend={{
          value: 180.1,
          direction: 'up',
        }}
        status="success"
        icon={Users}
        variant="compact"
      />
      <AdminMetricCard
        id="orders"
        label="Orders"
        value={12234}
        trend={{
          value: 19,
          direction: 'up',
        }}
        status="success"
        icon={ShoppingCart}
        variant="compact"
      />
      <AdminMetricCard
        id="conversion"
        label="Conversion"
        value={3.24}
        unit="%"
        trend={{
          value: -2.4,
          direction: 'down',
        }}
        status="warning"
        icon={Target}
        variant="compact"
      />
    </div>
  ),
}

export const DetailedVariants: Story = {
  args: {
    metrics: [],
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <AdminMetricCard
        id="system-performance"
        label="System Performance"
        value={98.5}
        unit="%"
        description="Overall system performance score"
        trend={{
          value: 2.1,
          direction: 'up',
        }}
        status="success"
        sparkline={generateSparkline(12, 90, 100)}
        lastUpdated={new Date()}
        icon={Zap}
        variant="detailed"
      />
      <AdminMetricCard
        id="security-score"
        label="Security Score"
        value={92.3}
        unit="%"
        description="Current security rating"
        trend={{
          value: -1.2,
          direction: 'down',
        }}
        status="warning"
        sparkline={generateSparkline(12, 85, 95)}
        lastUpdated={new Date()}
        icon={Shield}
        variant="detailed"
      />
    </div>
  ),
}

export const WithAutoRefresh: Story = {
  args: {
    metrics: basicMetrics,
    autoRefresh: true,
    refreshInterval: 5000,
    onRefresh: () => {
      // Refreshing metrics...
    },
  },
}

export const InteractiveCards: Story = {
  args: {
    metrics: [],
  },
  render: () => {
    const interactiveMetrics: MetricData[] = [
      {
        id: 'users',
        label: 'Active Users',
        value: 2350,
        description: 'Click to view user details',
        trend: {
          value: 180.1,
          direction: 'up',
        },
        status: 'success',
        sparkline: generateSparkline(12, 1000, 3000),
        lastUpdated: new Date(),
        icon: Users,
      },
      {
        id: 'revenue',
        label: 'Revenue',
        value: 45231.89,
        unit: '$',
        description: 'Click to view revenue report',
        trend: {
          value: 20.1,
          direction: 'up',
        },
        status: 'success',
        sparkline: generateSparkline(12, 30000, 50000),
        lastUpdated: new Date(),
        icon: DollarSign,
      },
    ]

    return <MetricsDashboard metrics={interactiveMetrics} columns={2} />
  },
}
