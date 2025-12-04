import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AppNavbar } from './app-navbar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Download,
  Plus,
  RefreshCw,
  Settings,
  Upload,
  Zap,
  Globe,
  Shield,
  Users,
  BarChart3,
  Code,
  Palette,
  Database,
  Cloud,
  Lock,
  Sparkles,
} from 'lucide-react'

const meta: Meta<typeof AppNavbar> = {
  title: 'Blocks/Application/AppNavbar',
  component: AppNavbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Story />
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Page Content</h1>
            <p className="text-muted-foreground">
              The navbar is displayed at the top. Try interacting with the various elements.
            </p>
          </div>
        </div>
      </SidebarProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

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
      title: 'New deployment completed',
      description: 'Your application has been successfully deployed to production',
      timestamp: '2 minutes ago',
      read: false,
    },
    {
      id: '2',
      title: 'Security alert',
      description: 'Unusual login activity detected from a new location',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      title: 'Team invitation',
      description: 'Sarah invited you to join the Design team',
      timestamp: '3 hours ago',
      read: false,
    },
    {
      id: '4',
      title: 'Payment processed',
      description: 'Your monthly subscription has been renewed',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: '5',
      title: 'New feature available',
      description: 'Check out our new analytics dashboard',
      timestamp: '2 days ago',
      read: true,
    },
  ],
}

export const Default: Story = {
  render: () => {
    const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system')
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

    return (
      <AppNavbar
        logo={
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold hidden sm:inline">Acme Inc</span>
          </div>
        }
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
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
    )
  },
}

export const WithNavigation: Story = {
  render: () => {
    const [activeNav, setActiveNav] = React.useState('dashboard')
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

    const navigation = [
      {
        label: 'Dashboard',
        onClick: () => setActiveNav('dashboard'),
        active: activeNav === 'dashboard',
      },
      {
        label: 'Projects',
        onClick: () => setActiveNav('projects'),
        active: activeNav === 'projects',
      },
      { label: 'Team', onClick: () => setActiveNav('team'), active: activeNav === 'team' },
      {
        label: 'Analytics',
        onClick: () => setActiveNav('analytics'),
        active: activeNav === 'analytics',
      },
    ]

    return (
      <AppNavbar
        title="Project Manager"
        user={user}
        navigation={navigation}
        notifications={notifications}
        search={{
          placeholder: 'Search projects...',
          onSearch: query => {
            // Search: query
          },
        }}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
    )
  },
}

export const WithCustomActions: Story = {
  render: () => (
    <AppNavbar
      logo={
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-blue-500" />
          <span className="font-semibold">CloudSync</span>
        </div>
      }
      user={user}
      actions={
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Upload className="h-4 w-4" />
          </Button>
          <div className="hidden sm:flex">
            <Button size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </div>
        </>
      }
      notifications={notifications}
    />
  ),
}

export const MinimalNavbar: Story = {
  render: () => <AppNavbar title="Simple App" user={user} />,
}

export const WithExtendedUserMenu: Story = {
  render: () => (
    <AppNavbar
      logo={
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-green-600" />
          <span className="font-semibold">SecureApp</span>
        </div>
      }
      user={user}
      userMenu={{
        onProfile: () => {
          // Profile
        },
        onSettings: () => {
          // Settings
        },
        onHelp: () => {
          // Help
        },
        onLogout: () => {
          // Logout
        },
        additionalItems: [
          {
            label: 'Billing',
            icon: <BarChart3 className="h-4 w-4" />,
            onClick: () => {
              // Billing
            },
            shortcut: '⌘B',
          },
          {
            label: 'API Keys',
            icon: <Code className="h-4 w-4" />,
            onClick: () => {
              // API Keys
            },
            shortcut: '⌘K',
          },
          {
            label: 'Appearance',
            icon: <Palette className="h-4 w-4" />,
            onClick: () => {
              // Appearance
            },
          },
        ],
      }}
    />
  ),
}

export const NoNotifications: Story = {
  render: () => (
    <AppNavbar
      title="Quiet App"
      user={user}
      notifications={{
        count: 0,
        items: [],
      }}
      search={{
        placeholder: 'Search...',
        onSearch: query => {
          // Search: query
        },
      }}
    />
  ),
}

export const ManyNotifications: Story = {
  render: () => (
    <AppNavbar
      logo={
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-purple-600" />
          <span className="font-semibold">NotifyHub</span>
        </div>
      }
      user={user}
      notifications={{
        count: 99,
        items: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          title: `Notification ${i + 1}`,
          description: `This is notification number ${i + 1} with some details`,
          timestamp: `${i + 1} hours ago`,
          read: i > 5,
        })),
      }}
    />
  ),
}

export const NonStickyNavbar: Story = {
  render: () => (
    <>
      <AppNavbar title="Non-Sticky Navbar" user={user} sticky={false} />
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Scroll down to see that the navbar is not sticky.</p>
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <p>Content block {i + 1}</p>
          </div>
        ))}
      </div>
    </>
  ),
}

export const CustomClassName: Story = {
  render: () => (
    <AppNavbar
      title="Custom Styled"
      user={user}
      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
      search={{
        placeholder: 'Search in style...',
        onSearch: query => {
          // Search: query
        },
      }}
    />
  ),
}

export const WithBrandingAndFeatures: Story = {
  render: () => {
    const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system')

    return (
      <AppNavbar
        logo={
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Enterprise</h1>
              <p className="text-xs text-muted-foreground">Pro Edition</p>
            </div>
          </div>
        }
        user={{
          name: 'Sarah Johnson',
          email: 'sarah.johnson@enterprise.com',
          avatar: 'https://i.pravatar.cc/150?u=sarah',
        }}
        notifications={{
          count: 12,
          items: notifications.items,
        }}
        search={{
          placeholder: 'Search across workspace...',
          onSearch: query => {
            // Search: query
          },
          showCommandKey: true,
        }}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden lg:flex">
              <Database className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            <Badge variant="outline" className="hidden lg:flex">
              <Lock className="h-3 w-3 mr-1" />
              Secure
            </Badge>
            <Button variant="default" size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>
        }
        theme={{
          current: theme,
          onChange: setTheme,
        }}
        userMenu={{
          onProfile: () => {
            // Profile
          },
          onSettings: () => {
            // Settings
          },
          onHelp: () => {
            // Help
          },
          onLogout: () => {
            // Logout
          },
          additionalItems: [
            {
              label: 'Workspace Settings',
              icon: <Settings className="h-4 w-4" />,
              onClick: () => {
                // Workspace Settings
              },
            },
            {
              label: 'Team Members',
              icon: <Users className="h-4 w-4" />,
              onClick: () => {
                // Team Members
              },
            },
          ],
        }}
      />
    )
  },
}
