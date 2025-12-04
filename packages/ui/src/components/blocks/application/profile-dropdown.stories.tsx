import type { Meta, StoryObj } from '@storybook/react'
import { ProfileDropdown } from './profile-dropdown'
import { User, Settings, HelpCircle, LogOut, UserCog, Shield } from 'lucide-react'

const meta = {
  title: 'Blocks/Application/ProfileDropdown',
  component: ProfileDropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProfileDropdown>

export default meta
type Story = StoryObj<typeof meta>

const sampleUser = {
  name: 'John Doe',
  email: 'john.doe@company.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  roles: [
    { entityId: 'role-1', entityName: 'Admin' },
    { entityId: 'role-2', entityName: 'Manager' },
  ],
  personas: [
    { entityId: 'persona-1', entityName: 'Loan Officer' },
    { entityId: 'persona-2', entityName: 'Processor' },
  ],
}

const defaultMenuItems = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    onClick: () => {
      // Profile clicked
    },
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    onClick: () => {
      // Settings clicked
    },
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    onClick: () => {
      // Help clicked
    },
    separator: true,
  },
  {
    id: 'logout',
    label: 'Log out',
    icon: LogOut,
    onClick: () => {
      // Logout clicked
    },
    variant: 'destructive' as const,
  },
]

export const Default: Story = {
  args: {
    user: sampleUser,
    menuItems: defaultMenuItems,
  },
}

export const WithRoleBadges: Story = {
  args: {
    user: sampleUser,
    menuItems: defaultMenuItems,
    showRoleBadges: true,
  },
}

export const WithPersonaBadges: Story = {
  args: {
    user: sampleUser,
    menuItems: defaultMenuItems,
    showPersonaBadges: true,
  },
}

export const WithAllBadges: Story = {
  args: {
    user: sampleUser,
    menuItems: defaultMenuItems,
    showRoleBadges: true,
    showPersonaBadges: true,
  },
}

export const CompactMode: Story = {
  args: {
    user: sampleUser,
    menuItems: defaultMenuItems,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact mode is ideal for sidebars with collapsed state support.',
      },
    },
  },
}

export const CompactWithBadges: Story = {
  args: {
    user: sampleUser,
    menuItems: defaultMenuItems,
    compact: true,
    showRoleBadges: true,
    showPersonaBadges: true,
  },
}

export const NoMenuItems: Story = {
  args: {
    user: sampleUser,
    showRoleBadges: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Profile dropdown can be used to just display user info without menu items.',
      },
    },
  },
}

export const NoAvatar: Story = {
  args: {
    user: {
      ...sampleUser,
      avatar: undefined,
    },
    menuItems: defaultMenuItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no avatar is provided, initials are displayed as fallback.',
      },
    },
  },
}

export const SingleRole: Story = {
  args: {
    user: {
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      roles: [{ entityId: 'role-1', entityName: 'Loan Officer' }],
    },
    menuItems: defaultMenuItems,
    showRoleBadges: true,
  },
}

export const AdminUser: Story = {
  args: {
    user: {
      name: 'Admin User',
      email: 'admin@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      roles: [
        { entityId: 'role-1', entityName: 'Super Admin' },
        { entityId: 'role-2', entityName: 'System Administrator' },
      ],
      personas: [{ entityId: 'persona-1', entityName: 'Administrator' }],
    },
    menuItems: [
      {
        id: 'profile',
        label: 'Profile',
        icon: User,
        onClick: () => console.debug('Profile clicked'),
      },
      {
        id: 'admin',
        label: 'Admin Panel',
        icon: UserCog,
        onClick: () => console.debug('Admin clicked'),
      },
      {
        id: 'security',
        label: 'Security Settings',
        icon: Shield,
        onClick: () => console.debug('Security clicked'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        onClick: () => console.debug('Settings clicked'),
        separator: true,
      },
      {
        id: 'logout',
        label: 'Log out',
        icon: LogOut,
        onClick: () => console.debug('Logout clicked'),
        variant: 'destructive' as const,
        separator: true,
      },
    ],
    showRoleBadges: true,
    showPersonaBadges: true,
  },
}

export const SidebarBottom: Story = {
  args: {
    user: sampleUser,
    menuItems: defaultMenuItems,
    compact: true,
    side: 'top',
    align: 'start',
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration for use in sidebar footer, dropdown opens upward.',
      },
    },
  },
}

export const LongContent: Story = {
  args: {
    user: {
      name: 'Christopher Alexander Thompson',
      email: 'christopher.alexander.thompson@verylong-company-name.com',
      roles: [
        { entityId: 'role-1', entityName: 'Senior Loan Officer' },
        { entityId: 'role-2', entityName: 'Branch Manager' },
        { entityId: 'role-3', entityName: 'Compliance Officer' },
      ],
      personas: [
        { entityId: 'persona-1', entityName: 'Underwriter' },
        { entityId: 'persona-2', entityName: 'Processor' },
        { entityId: 'persona-3', entityName: 'Closer' },
      ],
    },
    menuItems: defaultMenuItems,
    showRoleBadges: true,
    showPersonaBadges: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates text truncation and badge wrapping with long content.',
      },
    },
  },
}
