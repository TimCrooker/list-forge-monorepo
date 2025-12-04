import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  OverviewCards,
  OverviewMetricCard,
  ProgressCard,
  OverviewComparisonCard,
  StatGrid,
  type MetricCardProps,
} from './overview-cards'
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
  Smartphone,
  Monitor,
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
  title: 'Blocks/Application/OverviewCards',
  component: OverviewCards,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OverviewCards>

export default meta
type Story = StoryObj<typeof meta>

// Sample metric cards data
const basicMetrics: MetricCardProps[] = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    description: '+20.1% from last month',
    change: 20.1,
    trend: 'up',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: 'Subscriptions',
    value: '+2350',
    description: '+180.1% from last month',
    change: 180.1,
    trend: 'up',
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: 'Sales',
    value: '+12,234',
    description: '+19% from last month',
    change: 19,
    trend: 'up',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    title: 'Active Now',
    value: '+573',
    description: '+201 since last hour',
    icon: <Activity className="h-4 w-4" />,
  },
]

const performanceMetrics: MetricCardProps[] = [
  {
    title: 'Page Views',
    value: '2.4M',
    change: 12.5,
    changeLabel: 'vs last week',
    trend: 'up',
    icon: <Eye className="h-4 w-4" />,
  },
  {
    title: 'Bounce Rate',
    value: '42.3%',
    change: -5.4,
    changeLabel: 'vs last week',
    trend: 'down',
    icon: <TrendingDown className="h-4 w-4" />,
  },
  {
    title: 'Session Duration',
    value: '3m 42s',
    change: 8.1,
    changeLabel: 'vs last week',
    trend: 'up',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    title: 'Conversion Rate',
    value: '3.24%',
    change: 2.1,
    changeLabel: 'vs last week',
    trend: 'up',
    icon: <Target className="h-4 w-4" />,
  },
]

export const Default: Story = {
  args: {
    cards: basicMetrics,
    columns: 4,
  },
}

export const TwoColumns: Story = {
  args: {
    cards: basicMetrics.slice(0, 2),
    columns: 2,
  },
}

export const ThreeColumns: Story = {
  args: {
    cards: basicMetrics.slice(0, 3),
    columns: 3,
  },
}

export const SixColumns: Story = {
  args: {
    cards: [
      { title: 'Users', value: '1,234', icon: <Users className="h-4 w-4" /> },
      { title: 'Revenue', value: '$12.3K', icon: <DollarSign className="h-4 w-4" /> },
      { title: 'Orders', value: '456', icon: <ShoppingCart className="h-4 w-4" /> },
      { title: 'Products', value: '89', icon: <Package className="h-4 w-4" /> },
      { title: 'Reviews', value: '4.8', icon: <Star className="h-4 w-4" /> },
      { title: 'Support', value: '24/7', icon: <Headphones className="h-4 w-4" /> },
    ],
    columns: 6,
  },
}

export const WithActions: Story = {
  args: {
    cards: [],
  },
  render: () => {
    const cardsWithActions: MetricCardProps[] = [
      {
        title: 'Total Users',
        value: '10,482',
        change: 12.5,
        trend: 'up',
        icon: <Users className="h-4 w-4" />,
        onAction: () => {
          // View users
        },
        actionLabel: 'View all users',
      },
      {
        title: 'Revenue',
        value: '$54,321',
        change: 8.2,
        trend: 'up',
        icon: <DollarSign className="h-4 w-4" />,
        onAction: () => {
          // View revenue
        },
        actionLabel: 'Revenue report',
      },
      {
        title: 'Active Projects',
        value: '24',
        change: -2.4,
        trend: 'down',
        icon: <Folder className="h-4 w-4" />,
        onAction: () => {
          // View projects
        },
        actionLabel: 'Manage projects',
      },
      {
        title: 'Team Members',
        value: '48',
        change: 4.1,
        trend: 'up',
        icon: <Users className="h-4 w-4" />,
        onAction: () => {
          // View team
        },
        actionLabel: 'Team settings',
      },
    ]

    return <OverviewCards cards={cardsWithActions} />
  },
}

export const WithLinks: Story = {
  args: {
    cards: [],
  },
  render: () => {
    const cardsWithLinks: MetricCardProps[] = [
      {
        title: 'Documentation',
        value: '156',
        description: 'Total articles',
        icon: <FileText className="h-4 w-4" />,
        href: '#docs',
      },
      {
        title: 'API Endpoints',
        value: '48',
        description: 'Active endpoints',
        icon: <Globe className="h-4 w-4" />,
        href: '#api',
      },
      {
        title: 'Integrations',
        value: '12',
        description: 'Connected services',
        icon: <Link className="h-4 w-4" />,
        href: '#integrations',
      },
      {
        title: 'Webhooks',
        value: '8',
        description: 'Active webhooks',
        icon: <Zap className="h-4 w-4" />,
        href: '#webhooks',
      },
    ]

    return <OverviewCards cards={cardsWithLinks} />
  },
}

export const LoadingState: Story = {
  args: {
    cards: [],
  },
  render: () => {
    const loadingCards: MetricCardProps[] = [
      { title: 'Loading...', value: '', loading: true },
      { title: 'Loading...', value: '', loading: true },
      { title: 'Loading...', value: '', loading: true },
      { title: 'Loading...', value: '', loading: true },
    ]

    return <OverviewCards cards={loadingCards} />
  },
}

export const MixedTrends: Story = {
  args: {
    cards: [],
  },
  render: () => {
    const mixedCards: MetricCardProps[] = [
      {
        title: 'Growth Rate',
        value: '+24.5%',
        change: 24.5,
        trend: 'up',
        changeLabel: 'Great progress',
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      },
      {
        title: 'Churn Rate',
        value: '5.2%',
        change: -12.3,
        trend: 'down',
        changeLabel: 'Improving',
        icon: <TrendingDown className="h-4 w-4 text-green-500" />,
      },
      {
        title: 'Error Rate',
        value: '0.08%',
        change: 15.2,
        trend: 'up',
        changeLabel: 'Needs attention',
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      },
      {
        title: 'Uptime',
        value: '99.98%',
        change: 0,
        trend: 'neutral',
        changeLabel: 'Stable',
        icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
      },
    ]

    return <OverviewCards cards={mixedCards} />
  },
}

export const SingleMetricCard: Story = {
  args: {
    cards: [],
  },
  render: () => (
    <div className="max-w-sm">
      <OverviewMetricCard
        title="Monthly Recurring Revenue"
        value="$124,592"
        description="Based on current subscriptions"
        change={18.4}
        trend="up"
        icon={<DollarSign className="h-4 w-4" />}
      />
    </div>
  ),
}

export const ProgressCards: Story = {
  args: {
    cards: [],
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ProgressCard
        title="Storage Used"
        value={75}
        max={100}
        unit="GB"
        description="25GB remaining"
        icon={<HardDrive className="h-4 w-4" />}
        color="primary"
      />
      <ProgressCard
        title="API Quota"
        value={8500}
        max={10000}
        unit=" calls"
        description="Resets in 5 days"
        icon={<Globe className="h-4 w-4" />}
        color="warning"
      />
      <ProgressCard
        title="Team Seats"
        value={42}
        max={50}
        unit=" users"
        description="8 seats available"
        icon={<Users className="h-4 w-4" />}
        color="success"
      />
      <ProgressCard
        title="Projects"
        value={95}
        max={100}
        unit=" projects"
        description="Upgrade for more"
        icon={<Folder className="h-4 w-4" />}
        color="destructive"
      />
    </div>
  ),
}

export const ComparisonCards: Story = {
  args: {
    cards: [],
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <OverviewComparisonCard
        title="Revenue Comparison"
        current={{ label: 'This Month', value: '$48,592' }}
        previous={{ label: 'Last Month', value: '$41,234' }}
        change={18}
        changeLabel="month over month"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <OverviewComparisonCard
        title="User Growth"
        current={{ label: 'Current Users', value: '12,543' }}
        previous={{ label: '30 Days Ago', value: '10,234' }}
        change={22.5}
        changeLabel="growth rate"
        icon={<Users className="h-4 w-4" />}
      />
      <OverviewComparisonCard
        title="Performance"
        current={{ label: 'Current Score', value: '94/100' }}
        previous={{ label: 'Last Week', value: '89/100' }}
        change={5.6}
        changeLabel="improvement"
        icon={<Zap className="h-4 w-4" />}
      />
    </div>
  ),
}

export const StatGridExample: Story = {
  args: {
    cards: [],
  },
  render: () => (
    <div className="space-y-4">
      <StatGrid
        stats={[
          { label: 'Total Users', value: '45.2K', icon: <Users className="h-5 w-5" /> },
          { label: 'Revenue', value: '$125K', icon: <DollarSign className="h-5 w-5" /> },
          { label: 'Growth', value: '+12.5%', icon: <TrendingUp className="h-5 w-5" /> },
          { label: 'Active Now', value: '1,234', icon: <Activity className="h-5 w-5" /> },
        ]}
      />

      <StatGrid
        stats={[
          { label: 'CPU Usage', value: '45%', icon: <Cpu className="h-5 w-5" /> },
          { label: 'Memory', value: '8.2GB', icon: <Database className="h-5 w-5" /> },
          { label: 'Storage', value: '124GB', icon: <HardDrive className="h-5 w-5" /> },
          { label: 'Network', value: '2.4Gb/s', icon: <Wifi className="h-5 w-5" /> },
        ]}
      />
    </div>
  ),
}

export const SystemMetrics: Story = {
  args: {
    cards: [],
  },
  render: () => {
    const systemCards: MetricCardProps[] = [
      {
        title: 'CPU Usage',
        value: '42%',
        change: -5.2,
        trend: 'down',
        changeLabel: 'vs last hour',
        icon: <Cpu className="h-4 w-4" />,
      },
      {
        title: 'Memory',
        value: '6.8 GB',
        description: 'of 16 GB',
        icon: <Database className="h-4 w-4" />,
      },
      {
        title: 'Disk I/O',
        value: '124 MB/s',
        change: 8.4,
        trend: 'up',
        icon: <HardDrive className="h-4 w-4" />,
      },
      {
        title: 'Network',
        value: '892 Mb/s',
        description: 'Inbound traffic',
        icon: <Wifi className="h-4 w-4" />,
      },
      {
        title: 'Requests/sec',
        value: '1,842',
        change: 12.1,
        trend: 'up',
        icon: <Server className="h-4 w-4" />,
      },
      {
        title: 'Response Time',
        value: '142ms',
        change: -8.3,
        trend: 'down',
        changeLabel: 'Improved',
        icon: <Clock className="h-4 w-4" />,
      },
    ]

    return <OverviewCards cards={systemCards} columns={6} />
  },
}

export const SocialMediaMetrics: Story = {
  args: {
    cards: [],
  },
  render: () => {
    const socialCards: MetricCardProps[] = [
      {
        title: 'Followers',
        value: '45.2K',
        change: 12.5,
        trend: 'up',
        icon: <Users className="h-4 w-4" />,
        href: '#followers',
      },
      {
        title: 'Engagement Rate',
        value: '4.8%',
        change: 0.8,
        trend: 'up',
        icon: <Heart className="h-4 w-4" />,
      },
      {
        title: 'Posts',
        value: '1,234',
        description: 'This month',
        icon: <Image className="h-4 w-4" />,
      },
      {
        title: 'Comments',
        value: '8.9K',
        change: 24.3,
        trend: 'up',
        icon: <MessageCircle className="h-4 w-4" />,
      },
      {
        title: 'Shares',
        value: '3.2K',
        change: -5.1,
        trend: 'down',
        icon: <Share2 className="h-4 w-4" />,
      },
      {
        title: 'Saves',
        value: '12.4K',
        change: 18.7,
        trend: 'up',
        icon: <Bookmark className="h-4 w-4" />,
      },
    ]

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Social Media Dashboard</h3>
        <OverviewCards cards={socialCards} columns={3} />
      </div>
    )
  },
}

export const EcommerceMetrics: Story = {
  args: {
    cards: [],
  },
  render: () => (
    <div className="space-y-6">
      <OverviewCards
        cards={[
          {
            title: 'Total Sales',
            value: '$89,432',
            change: 15.2,
            trend: 'up',
            icon: <ShoppingCart className="h-4 w-4" />,
          },
          {
            title: 'Orders',
            value: '1,234',
            change: 8.1,
            trend: 'up',
            icon: <Package className="h-4 w-4" />,
          },
          {
            title: 'Average Order',
            value: '$72.50',
            change: 6.8,
            trend: 'up',
            icon: <CreditCard className="h-4 w-4" />,
          },
          {
            title: 'Conversion Rate',
            value: '3.42%',
            change: -0.4,
            trend: 'down',
            icon: <Target className="h-4 w-4" />,
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <OverviewComparisonCard
          title="Sales Performance"
          current={{ label: 'Today', value: '$4,892' }}
          previous={{ label: 'Yesterday', value: '$3,721' }}
          change={31.4}
          icon={<TrendingUp className="h-4 w-4" />}
        />

        <ProgressCard
          title="Monthly Goal"
          value={68420}
          max={100000}
          unit="$"
          description="$31,580 remaining"
          color="primary"
        />
      </div>
    </div>
  ),
}
