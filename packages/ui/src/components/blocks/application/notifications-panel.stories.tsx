import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { NotificationsPanel, NotificationItem, NotificationBell } from './notifications-panel'

const meta: Meta<typeof NotificationsPanel> = {
  title: 'Blocks/Application/NotificationsPanel',
  component: NotificationsPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Sample notifications
const sampleNotifications = [
  {
    id: '1',
    type: 'info' as const,
    title: 'System Update',
    description: 'A new system update is available',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    read: false,
  },
  {
    id: '2',
    type: 'success' as const,
    title: 'Task Completed',
    description: 'Your task "Implement user authentication" has been completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    avatar: 'https://github.com/shadcn.png',
    avatarFallback: 'JD',
  },
  {
    id: '3',
    type: 'warning' as const,
    title: 'Storage Warning',
    description: 'Your storage is almost full',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    read: true,
  },
  {
    id: '4',
    type: 'error' as const,
    title: 'Deployment Failed',
    description: 'The deployment to production has failed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: true,
  },
  {
    id: '5',
    type: 'mention' as const,
    title: 'New Mention',
    description: '@john mentioned you in a comment',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    read: false,
    avatar: 'https://github.com/shadcn.png',
    avatarFallback: 'JS',
  },
  {
    id: '6',
    type: 'comment' as const,
    title: 'New Comment',
    description: 'Sarah commented on your post',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    read: true,
    avatar: 'https://github.com/shadcn.png',
    avatarFallback: 'SW',
  },
  {
    id: '7',
    type: 'like' as const,
    title: 'New Like',
    description: 'Mike liked your post',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: true,
    avatar: 'https://github.com/shadcn.png',
    avatarFallback: 'MJ',
  },
  {
    id: '8',
    type: 'follow' as const,
    title: 'New Follower',
    description: 'Alex started following you',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    read: false,
    avatar: 'https://github.com/shadcn.png',
    avatarFallback: 'AB',
  },
]

export const Default: Story = {
  args: {
    notifications: sampleNotifications,
    onMarkAsRead: id => {
      // Mark as read: id
    },
    onMarkAllAsRead: () => {
      // Mark all as read
    },
    onDelete: id => {
      // Delete: id
    },
    onArchive: id => {
      // Archive: id
    },
    onAction: notification => {
      // Action: notification
    },
    showTabs: true,
    showFilters: true,
  },
}

export const WithoutTabs: Story = {
  args: {
    notifications: sampleNotifications,
    showTabs: false,
    showFilters: true,
  },
}

export const WithoutFilters: Story = {
  args: {
    notifications: sampleNotifications,
    showTabs: true,
    showFilters: false,
  },
}

export const EmptyState: Story = {
  args: {
    notifications: [],
    showTabs: true,
    showFilters: true,
    emptyMessage: 'No notifications to display',
  },
}

export const AllRead: Story = {
  args: {
    notifications: sampleNotifications.map(n => ({ ...n, read: true })),
    showTabs: true,
    showFilters: true,
  },
}

export const WithActions: Story = {
  args: {
    notifications: sampleNotifications.map(n => ({
      ...n,
      actionUrl: '#',
      actionLabel: 'View Details',
    })),
    showTabs: true,
    showFilters: true,
  },
}

export const NotificationItemExample: Story = {
  args: {
    notifications: [],
  },
  render: () => (
    <div className="space-y-4">
      <NotificationItem
        notification={sampleNotifications[0]}
        onMarkAsRead={() => {
          // Mark as read
        }}
        onDelete={() => {
          // Delete
        }}
        onArchive={() => {
          // Archive
        }}
        onAction={() => {
          // Action
        }}
      />
      <NotificationItem
        notification={sampleNotifications[1]}
        onMarkAsRead={() => {
          // Mark as read
        }}
        onDelete={() => {
          // Delete
        }}
        onArchive={() => {
          // Archive
        }}
        onAction={() => {
          // Action
        }}
        selected
        showCheckbox
      />
    </div>
  ),
}

export const NotificationBellExample: Story = {
  args: {
    notifications: [],
  },
  render: () => (
    <div className="flex items-center gap-4">
      <NotificationBell
        count={5}
        onClick={() => {
          // Bell clicked
        }}
      />
      <NotificationBell
        count={0}
        onClick={() => {
          // Bell clicked
        }}
      />
      <NotificationBell
        onClick={() => {
          // Bell clicked
        }}
      />
    </div>
  ),
}

export const WithLongContent: Story = {
  args: {
    notifications: [
      {
        id: '1',
        type: 'info' as const,
        title: 'System Update with a Very Long Title that Might Wrap to Multiple Lines',
        description:
          'This is a very long description that might wrap to multiple lines. It contains detailed information about the system update and what changes are included in this release. The description should be properly formatted and aligned within the notification item.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
      },
      {
        id: '2',
        type: 'warning' as const,
        title: 'Storage Warning',
        description:
          'Another long description that demonstrates how the component handles multiple lines of text. This helps ensure that the layout remains consistent and readable even with varying amounts of content.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: true,
      },
    ],
    showTabs: true,
    showFilters: true,
  },
}

export const WithManyNotifications: Story = {
  args: {
    notifications: [
      ...sampleNotifications,
      ...sampleNotifications.map(n => ({
        ...n,
        id: `${n.id}-copy`,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
      })),
    ],
    showTabs: true,
    showFilters: true,
  },
}

export const WithCustomEmptyMessage: Story = {
  args: {
    notifications: [],
    showTabs: true,
    showFilters: true,
    emptyMessage: 'You are all caught up! No new notifications.',
  },
}

export const WithDifferentTypes: Story = {
  args: {
    notifications: [
      {
        id: '1',
        type: 'info' as const,
        title: 'Information',
        description: 'General information message',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
      },
      {
        id: '2',
        type: 'success' as const,
        title: 'Success',
        description: 'Operation completed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        read: false,
      },
      {
        id: '3',
        type: 'warning' as const,
        title: 'Warning',
        description: 'Please review this warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false,
      },
      {
        id: '4',
        type: 'error' as const,
        title: 'Error',
        description: 'An error has occurred',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        read: false,
      },
      {
        id: '5',
        type: 'mention' as const,
        title: 'Mention',
        description: 'Someone mentioned you',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        read: false,
      },
      {
        id: '6',
        type: 'comment' as const,
        title: 'Comment',
        description: 'New comment on your post',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
      },
      {
        id: '7',
        type: 'like' as const,
        title: 'Like',
        description: 'Someone liked your post',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        read: false,
      },
      {
        id: '8',
        type: 'follow' as const,
        title: 'Follow',
        description: 'New follower',
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        read: false,
      },
    ],
    showTabs: true,
    showFilters: true,
  },
}
