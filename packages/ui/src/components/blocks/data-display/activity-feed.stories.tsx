import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ActivityFeed } from './activity-feed'
import { TooltipProvider } from '../../ui/tooltip'
import { Tabs } from '../../ui/tabs'

// Sample data
const activities = [
  {
    id: '1',
    user: {
      name: 'John Doe',
      avatar: 'https://github.com/shadcn.png',
      role: 'Admin',
    },
    action: 'created a new project',
    target: 'Dashboard Redesign',
    timestamp: '2024-03-15T10:30:00Z',
    content: 'Starting work on the new dashboard design. Looking forward to your feedback!',
    attachments: [
      {
        type: 'image' as const,
        url: 'https://picsum.photos/seed/1/400/300',
        name: 'dashboard-mockup.png',
        size: '2.4 MB',
      },
    ],
    reactions: {
      likes: 12,
      comments: 5,
      shares: 2,
    },
    liked: true,
  },
  {
    id: '2',
    user: {
      name: 'Jane Smith',
      avatar: 'https://github.com/shadcn.png',
      role: 'Developer',
    },
    action: 'pushed a commit to',
    target: 'feature/user-auth',
    timestamp: '2024-03-15T09:15:00Z',
    content: 'Implemented OAuth2 authentication with Google provider',
    attachments: [
      {
        type: 'file' as const,
        url: '#',
        name: 'auth-implementation.md',
        size: '156 KB',
      },
    ],
    reactions: {
      likes: 8,
      comments: 3,
      shares: 1,
    },
  },
  {
    id: '3',
    user: {
      name: 'Bob Johnson',
      avatar: 'https://github.com/shadcn.png',
      role: 'Designer',
    },
    action: 'shared a link',
    target: 'Design System Guidelines',
    timestamp: '2024-03-14T16:45:00Z',
    content: 'Check out our new design system documentation!',
    attachments: [
      {
        type: 'link' as const,
        url: 'https://example.com/design-system',
        name: 'Design System Documentation',
      },
    ],
    reactions: {
      likes: 15,
      comments: 7,
      shares: 4,
    },
  },
  {
    id: '4',
    user: {
      name: 'Alice Brown',
      avatar: 'https://github.com/shadcn.png',
      role: 'Product Manager',
    },
    action: 'completed a task',
    target: 'User Research',
    timestamp: '2024-03-14T14:20:00Z',
    content: 'Finished analyzing user feedback from the beta testing phase',
    attachments: [
      {
        type: 'file' as const,
        url: '#',
        name: 'user-feedback-report.pdf',
        size: '3.2 MB',
      },
      {
        type: 'file' as const,
        url: '#',
        name: 'research-summary.xlsx',
        size: '1.8 MB',
      },
    ],
    reactions: {
      likes: 6,
      comments: 2,
      shares: 1,
    },
  },
]

const meta: Meta<typeof ActivityFeed> = {
  title: 'Blocks/DataDisplay/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Tabs defaultValue="feed">
        <TooltipProvider>
          <div className="w-[600px]">
            <Story />
          </div>
        </TooltipProvider>
      </Tabs>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    activities,
  },
}

export const WithActions: Story = {
  args: {
    activities,
    onLike: id => {
      // Like activity: id
    },
    onComment: id => {
      // Comment on activity: id
    },
    onShare: id => {
      // Share activity: id
    },
  },
}

export const WithoutActions: Story = {
  args: {
    activities,
    showActions: false,
  },
}

export const CustomClassName: Story = {
  args: {
    activities,
    className: 'bg-gray-50 p-4 rounded-lg',
  },
}

export const SingleActivity: Story = {
  args: {
    activities: [activities[0]],
  },
}

export const WithoutAttachments: Story = {
  args: {
    activities: activities.map(({ attachments, ...activity }) => activity),
  },
}

export const WithoutContent: Story = {
  args: {
    activities: activities.map(({ content, ...activity }) => activity),
  },
}

export const WithoutRoles: Story = {
  args: {
    activities: activities.map(activity => ({
      ...activity,
      user: { name: activity.user.name, avatar: activity.user.avatar },
    })),
  },
}

export const WithoutAvatars: Story = {
  args: {
    activities: activities.map(activity => ({
      ...activity,
      user: { name: activity.user.name, role: activity.user.role },
    })),
  },
}

export const WithoutTarget: Story = {
  args: {
    activities: activities.map(({ target, ...activity }) => activity),
  },
}

export const ManyActivities: Story = {
  args: {
    activities: Array(10)
      .fill(null)
      .map((_, index) => ({
        ...activities[index % activities.length],
        id: `${activities[index % activities.length].id}-${index}`,
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
      })),
  },
}
