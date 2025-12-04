import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DashboardShell, DashboardLayout, type NavigationItem } from './dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Home,
  Users,
  Settings,
  BarChart3,
  FileText,
  HelpCircle,
  Package,
  ShoppingCart,
  CreditCard,
  Activity,
  Zap,
  Shield,
  Bell,
  Search,
  Calendar,
  Mail,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserPlus,
  Eye,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Folder,
  Database,
  Cloud,
  Lock,
  Unlock,
  Key,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Smartphone,
  Monitor,
  Server,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Code,
  Terminal,
  Bug,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react'

const meta = {
  title: 'Blocks/Application/DashboardShell',
  component: DashboardShell,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardShell>

export default meta
type Story = StoryObj<typeof meta>

// Sample navigation items
const navigation: NavigationItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: <Home className="h-4 w-4" />,
    href: '#dashboard',
    active: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    href: '#analytics',
    badge: 'New',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Users className="h-4 w-4" />,
    href: '#users',
    badge: 1284,
  },
  {
    id: 'products',
    label: 'Products',
    icon: <Package className="h-4 w-4" />,
    href: '#products',
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: <ShoppingCart className="h-4 w-4" />,
    href: '#orders',
    badge: 12,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    href: '#settings',
  },
]

// Extended navigation with groups
const extendedNavigation: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Home className="h-4 w-4" />,
    active: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      { id: 'overview', label: 'Overview' },
      { id: 'reports', label: 'Reports' },
      { id: 'insights', label: 'Insights' },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    icon: <ShoppingCart className="h-4 w-4" />,
    children: [
      { id: 'products', label: 'Products', badge: 128 },
      { id: 'orders', label: 'Orders', badge: 24 },
      { id: 'customers', label: 'Customers' },
      { id: 'discounts', label: 'Discounts' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: <FileText className="h-4 w-4" />,
    children: [
      { id: 'posts', label: 'Posts' },
      { id: 'pages', label: 'Pages' },
      { id: 'media', label: 'Media Library' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: <Settings className="h-4 w-4" />,
    children: [
      { id: 'general', label: 'General' },
      { id: 'security', label: 'Security' },
      { id: 'integrations', label: 'Integrations' },
      { id: 'api', label: 'API Keys' },
    ],
  },
]

// Dashboard content component
const DashboardContent = () => (
  <div className="p-6 space-y-6">
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back! Here's what's happening with your business today.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 text-green-500" /> +20.1% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+2350</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 text-green-500" /> +180.1% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sales</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12,234</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="inline h-3 w-3 text-green-500" /> +19% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+573</div>
          <p className="text-xs text-muted-foreground">
            <TrendingDown className="inline h-3 w-3 text-red-500" /> -4% from last hour
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Chart placeholder - Revenue over time
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>You made 265 sales this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[
              { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '+$1,999.00' },
              { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '+$39.00' },
              { name: 'Isabella Nguyen', email: 'isabella@email.com', amount: '+$299.00' },
            ].map((sale, i) => (
              <div key={i} className="flex items-center">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{sale.name}</p>
                  <p className="text-sm text-muted-foreground">{sale.email}</p>
                </div>
                <div className="font-medium">{sale.amount}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

export const Default: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => {
    const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system')

    return (
      <DashboardLayout
        user={{
          name: 'John Doe',
          email: 'john.doe@example.com',
          avatar: 'https://github.com/shadcn.png',
        }}
        navigation={navigation}
        notifications={5}
        onSearch={query => {
          // Search: query
        }}
        onNotificationClick={() => {
          // Notifications clicked
        }}
        onProfileClick={() => {
          // Profile clicked
        }}
        onLogout={() => {
          // Logout clicked
        }}
        onNavigate={item => {
          // Navigate to: item
        }}
        showThemeToggle
        theme={theme}
        onThemeChange={setTheme}
      >
        <DashboardContent />
      </DashboardLayout>
    )
  },
}

export const WithCustomLogo: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => (
    <DashboardLayout
      logo={
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold">PowerDash</span>
        </div>
      }
      user={{
        name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
      }}
      navigation={navigation}
      notifications={12}
    >
      <DashboardContent />
    </DashboardLayout>
  ),
}

export const WithExtendedNavigation: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => (
    <DashboardLayout
      navigation={extendedNavigation}
      user={{
        name: 'Admin User',
        email: 'admin@example.com',
      }}
      footer={
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              All systems operational
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help & Support
          </Button>
        </div>
      }
    >
      <DashboardContent />
    </DashboardLayout>
  ),
}

export const MinimalDashboard: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => (
    <DashboardLayout
      navigation={[
        { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" />, active: true },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
      ]}
      showThemeToggle={false}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Minimal Dashboard</h1>
        <p className="text-muted-foreground">A clean, minimal dashboard layout.</p>
      </div>
    </DashboardLayout>
  ),
}

export const DeveloperDashboard: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => {
    const devNavigation: NavigationItem[] = [
      { id: 'overview', label: 'Overview', icon: <Monitor className="h-4 w-4" />, active: true },
      { id: 'projects', label: 'Projects', icon: <Folder className="h-4 w-4" />, badge: 8 },
      { id: 'deployments', label: 'Deployments', icon: <Cloud className="h-4 w-4" />, badge: 3 },
      { id: 'databases', label: 'Databases', icon: <Database className="h-4 w-4" /> },
      { id: 'api', label: 'API', icon: <Code className="h-4 w-4" /> },
      { id: 'logs', label: 'Logs', icon: <Terminal className="h-4 w-4" /> },
      { id: 'monitoring', label: 'Monitoring', icon: <Activity className="h-4 w-4" /> },
    ]

    return (
      <DashboardLayout
        logo={
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded bg-black flex items-center justify-center">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <span className="font-mono font-bold">DevOps</span>
          </div>
        }
        navigation={devNavigation}
        user={{
          name: 'Dev User',
          email: 'dev@company.com',
        }}
        notifications={2}
      >
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Developer Dashboard</h1>
            <p className="text-muted-foreground">Monitor your applications and infrastructure.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <Progress value={80} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">80% success rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2M</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.12%</div>
                <p className="text-xs text-green-600">Within normal range</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="deployments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="deployments">Recent Deployments</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="prs">Pull Requests</TabsTrigger>
            </TabsList>
            <TabsContent value="deployments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Deployments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        project: 'api-server',
                        status: 'success',
                        time: '2 minutes ago',
                        commit: 'feat: add auth',
                      },
                      {
                        project: 'web-app',
                        status: 'success',
                        time: '15 minutes ago',
                        commit: 'fix: navigation bug',
                      },
                      {
                        project: 'worker',
                        status: 'failed',
                        time: '1 hour ago',
                        commit: 'chore: update deps',
                      },
                    ].map((deployment, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{deployment.project}</p>
                          <p className="text-xs text-muted-foreground">{deployment.commit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={deployment.status === 'success' ? 'default' : 'destructive'}
                          >
                            {deployment.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{deployment.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    )
  },
}
