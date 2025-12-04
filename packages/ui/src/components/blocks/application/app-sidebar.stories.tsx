import type { Meta, StoryObj } from '@storybook/react'
import { AppSidebar, NavItem, type NavGroup } from './app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  LogOut,
  User,
  ChevronRight,
  Inbox,
  Calendar,
  Star,
  Archive,
  Trash,
  Send,
  File,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Database,
  Cloud,
  Lock,
  Unlock,
  Key,
  Mail,
  MessageSquare,
  Phone,
  Video,
  Mic,
  Headphones,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
} from 'lucide-react'

const meta: Meta<typeof AppSidebar> = {
  title: 'Blocks/Application/AppSidebar',
  component: AppSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <SidebarProvider>
        <div className="flex h-screen">
          <Story />
          <div className="flex-1 p-6">
            <h1 className="text-2xl font-bold mb-4">Main Content Area</h1>
            <p className="text-muted-foreground">
              The sidebar is displayed on the left. Try interacting with the navigation items.
            </p>
          </div>
        </div>
      </SidebarProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Basic navigation structure
const basicNavigation: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', icon: Home, active: true },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
]

// Navigation with badges
const navigationWithBadges: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', icon: Home, active: true },
      { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 24 },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: 'New',
        badgeVariant: 'secondary',
      },
      { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: 3, badgeVariant: 'destructive' },
      { id: 'tasks', label: 'Tasks', icon: CheckCircle, badge: 12, badgeVariant: 'outline' },
    ],
  },
]

// Complex navigation with groups and nested items
const complexNavigation: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Dashboard', icon: Home, active: true },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: 'Pro' },
      {
        id: 'inbox',
        label: 'Inbox',
        icon: Inbox,
        badge: 128,
        children: [
          { id: 'all', label: 'All Messages', badge: 128 },
          { id: 'unread', label: 'Unread', badge: 48, badgeVariant: 'destructive' },
          { id: 'starred', label: 'Starred', icon: Star },
          { id: 'sent', label: 'Sent', icon: Send },
          { id: 'archive', label: 'Archive', icon: Archive },
          { id: 'trash', label: 'Trash', icon: Trash },
        ],
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'projects', label: 'Projects', icon: FileText },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      {
        id: 'team',
        label: 'Team',
        icon: Users,
        children: [
          { id: 'members', label: 'Members', badge: 8 },
          { id: 'roles', label: 'Roles & Permissions' },
          { id: 'invites', label: 'Pending Invites', badge: 2 },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        children: [
          { id: 'general', label: 'General' },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'billing', label: 'Billing', icon: CreditCard },
          { id: 'api', label: 'API Keys', icon: Key },
        ],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      { id: 'docs', label: 'Documentation', icon: FileText },
      { id: 'help', label: 'Help Center', icon: HelpCircle },
      { id: 'community', label: 'Community', icon: MessageSquare },
      { id: 'changelog', label: 'Changelog', icon: Clock, badge: 'v2.1' },
    ],
  },
]

// Navigation with disabled items
const navigationWithDisabled: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', icon: Home, active: true },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'reports', label: 'Reports (Coming Soon)', icon: FileText, disabled: true },
      { id: 'integrations', label: 'Integrations', icon: Database, disabled: true },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

export const Default: Story = {
  args: {
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold">Acme Inc</span>
      </div>
    ),
    navigation: basicNavigation,
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const WithBadges: Story = {
  args: {
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold">MailBox</span>
      </div>
    ),
    navigation: navigationWithBadges,
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const ComplexNavigation: Story = {
  args: {
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Cloud className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold">CloudHub</span>
      </div>
    ),
    navigation: complexNavigation,
    footer: (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@example.com</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    ),
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const WithDisabledItems: Story = {
  args: {
    logo: <h2 className="font-bold text-xl px-2">My App</h2>,
    navigation: navigationWithDisabled,
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const FloatingVariant: Story = {
  args: {
    variant: 'floating',
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold">Pulse</span>
      </div>
    ),
    navigation: basicNavigation,
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const InsetVariant: Story = {
  args: {
    variant: 'inset',
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold">TaskFlow</span>
      </div>
    ),
    navigation: basicNavigation,
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const NonCollapsible: Story = {
  args: {
    collapsible: false,
    logo: (
      <div className="flex items-center gap-2">
        <Lock className="h-6 w-6 text-primary" />
        <span className="font-semibold">SecureVault</span>
      </div>
    ),
    navigation: basicNavigation,
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const CustomIcons: Story = {
  args: {
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
          <span className="text-white font-bold">AI</span>
        </div>
        <span className="font-semibold">AI Studio</span>
      </div>
    ),
    navigation: [
      {
        id: 'ai-tools',
        label: 'AI Tools',
        items: [
          { id: 'chat', label: 'Chat Assistant', icon: MessageSquare },
          { id: 'voice', label: 'Voice Recognition', icon: Mic },
          { id: 'video', label: 'Video Analysis', icon: Video },
          { id: 'audio', label: 'Audio Processing', icon: Headphones },
        ],
      },
      {
        id: 'connectivity',
        label: 'Connectivity',
        items: [
          { id: 'online', label: 'Online Services', icon: Wifi },
          { id: 'offline', label: 'Offline Mode', icon: WifiOff },
          { id: 'sync', label: 'Sync Status', icon: Cloud },
        ],
      },
      {
        id: 'system',
        label: 'System',
        items: [
          { id: 'battery', label: 'Battery Status', icon: Battery },
          {
            id: 'low-battery',
            label: 'Low Battery Alert',
            icon: BatteryLow,
            badge: '!',
            badgeVariant: 'destructive',
          },
          { id: 'security', label: 'Security', icon: Lock },
          { id: 'unlock', label: 'Unlock Features', icon: Unlock },
        ],
      },
    ],
    onNavigate: item => {
      // Navigate to: item
    },
  },
}

export const StatusIndicators: Story = {
  args: {
    logo: (
      <div className="flex items-center gap-2">
        <Info className="h-6 w-6 text-blue-500" />
        <span className="font-semibold">Status Board</span>
      </div>
    ),
    navigation: [
      {
        id: 'status',
        label: 'System Status',
        items: [
          {
            id: 'operational',
            label: 'All Systems Operational',
            icon: <CheckCircle className="h-4 w-4 text-green-500" />,
            active: true,
          },
          {
            id: 'warning',
            label: 'Performance Degradation',
            icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
            badge: 2,
            badgeVariant: 'outline',
          },
          {
            id: 'error',
            label: 'Service Disruption',
            icon: <XCircle className="h-4 w-4 text-red-500" />,
            badge: 1,
            badgeVariant: 'destructive',
          },
          {
            id: 'info',
            label: 'Scheduled Maintenance',
            icon: <Info className="h-4 w-4 text-blue-500" />,
            badge: 'Tomorrow',
          },
        ],
      },
    ],
    onNavigate: item => {
      // Navigate to: item
    },
  },
}
