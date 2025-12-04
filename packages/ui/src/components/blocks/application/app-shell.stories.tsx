import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AppShell } from './app-shell'
import { AppSidebar } from './app-sidebar'
import { AppNavbar } from './app-navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

const meta = {
  title: 'Blocks/Application/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

// Sample navigation data
const navigation = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', icon: Home, active: true },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: 'New' },
      { id: 'customers', label: 'Customers', icon: Users, badge: 12 },
      { id: 'products', label: 'Products', icon: Package },
      {
        id: 'orders',
        label: 'Orders',
        icon: ShoppingCart,
        badge: 3,
        badgeVariant: 'destructive' as const,
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'billing', label: 'Billing', icon: CreditCard },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        children: [
          { id: 'general', label: 'General' },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ],
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { id: 'help', label: 'Help Center', icon: HelpCircle },
      { id: 'contact', label: 'Contact Us', disabled: true },
    ],
  },
]

// Sample user data
const user = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://github.com/shadcn.png',
}

// Sample notifications
const notifications = {
  count: 5,
  items: [
    {
      id: '1',
      title: 'New order received',
      description: 'Order #12345 has been placed',
      timestamp: '5 minutes ago',
      read: false,
    },
    {
      id: '2',
      title: 'Payment processed',
      description: 'Payment for order #12344 completed',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      title: 'New customer registered',
      description: 'Sarah Johnson joined your platform',
      timestamp: '2 hours ago',
      read: true,
    },
  ],
}

export const Default: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => {
    const [activeItem, setActiveItem] = React.useState('home')
    const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system')

    const sidebar = (
      <AppSidebar
        logo={
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Acme Inc</span>
          </div>
        }
        navigation={navigation}
        onNavigate={item => setActiveItem(item.id)}
        footer={
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">john@example.com</p>
              </div>
            </div>
          </div>
        }
      />
    )

    const navbar = (
      <AppNavbar
        user={user}
        notifications={notifications}
        search={{
          placeholder: 'Search anything...',
          onSearch: query => {
            // Search: query
          },
          showCommandKey: true,
        }}
        theme={{
          current: theme,
          onChange: setTheme,
        }}
        userMenu={{
          onProfile: () => {
            // Profile clicked
          },
          onSettings: () => {
            // Settings clicked
          },
          onHelp: () => {
            // Help clicked
          },
          onLogout: () => {
            // Logout clicked
          },
        }}
      />
    )

    const footer = (
      <footer className="border-t bg-muted/50 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2024 Acme Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </footer>
    )

    return (
      <AppShell sidebar={sidebar} navbar={navbar} footer={footer}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2350</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12,234</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    )
  },
}

export const MinimalShell: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Minimal App Shell</h1>
        <p className="text-muted-foreground mb-6">
          This example shows the AppShell with just content - no sidebar, navbar, or footer.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Content Area</CardTitle>
            <CardDescription>
              The AppShell component provides a flexible layout structure that can be used with or
              without its optional components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your main application content goes here.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  ),
}

export const WithNavbarOnly: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => {
    const navbar = (
      <AppNavbar
        title="My Application"
        user={user}
        search={{
          placeholder: 'Search...',
          onSearch: query => {
            // Search: query
          },
        }}
      />
    )

    return (
      <AppShell navbar={navbar}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Navbar Only Layout</h1>
          <p className="text-muted-foreground">
            This configuration shows the AppShell with just a navbar - useful for simple
            applications.
          </p>
        </div>
      </AppShell>
    )
  },
}

export const WithSidebarOnly: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => {
    const sidebar = (
      <AppSidebar logo={<h2 className="font-bold text-lg">My App</h2>} navigation={navigation} />
    )

    return (
      <AppShell sidebar={sidebar}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Sidebar Only Layout</h1>
          <p className="text-muted-foreground">
            This configuration shows the AppShell with just a sidebar - great for navigation-heavy
            applications.
          </p>
        </div>
      </AppShell>
    )
  },
}

export const CustomContentPadding: Story = {
  args: {
    children: <div>Content</div>,
  },
  render: () => {
    const navbar = <AppNavbar title="Custom Padding Example" user={user} />

    return (
      <AppShell navbar={navbar} contentClassName="p-0">
        <div className="bg-muted/50 min-h-full">
          <div className="bg-background m-6 p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Custom Content Padding</h1>
            <p className="text-muted-foreground">
              This example demonstrates how to customize the content area padding using the
              contentClassName prop.
            </p>
          </div>
        </div>
      </AppShell>
    )
  },
}
