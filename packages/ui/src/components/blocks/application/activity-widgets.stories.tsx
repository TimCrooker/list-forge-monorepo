import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  ActivityWidget,
  ActivityTimeline,
  RecentActivity,
  ActivitySummary,
  type ActivityWidgetItem,
} from './activity-widgets'

const meta = {
  title: 'Blocks/Application/ActivityWidgets',
  component: ActivityWidget,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActivityWidget>

export default meta
type Story = StoryObj<typeof meta>

// Sample activity data
const sampleActivities: ActivityWidgetItem[] = [
  {
    id: '1',
    type: 'action',
    title: 'created a new project',
    description: 'Project "E-commerce Platform" has been created',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    user: {
      name: 'John Doe',
      avatar: 'https://github.com/shadcn.png',
    },
  },
  {
    id: '2',
    type: 'comment',
    title: 'commented on a task',
    description: 'Added feedback on the design implementation',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    user: {
      name: 'Jane Smith',
      avatar: 'https://github.com/shadcn.png',
    },
  },
  {
    id: '3',
    type: 'status',
    title: 'completed a task',
    description: 'Task "Implement user authentication" marked as complete',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    user: {
      name: 'Mike Johnson',
      avatar: 'https://github.com/shadcn.png',
    },
    status: 'success',
  },
  {
    id: '4',
    type: 'commit',
    title: 'pushed new code',
    description: 'Added new features to the dashboard',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    user: {
      name: 'Sarah Wilson',
      avatar: 'https://github.com/shadcn.png',
    },
  },
  {
    id: '5',
    type: 'deployment',
    title: 'deployed to production',
    description: 'Version 1.2.0 has been deployed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    user: {
      name: 'Alex Brown',
      avatar: 'https://github.com/shadcn.png',
    },
    status: 'success',
  },
  {
    id: '6',
    type: 'alert',
    title: 'system alert',
    description: 'High CPU usage detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    status: 'warning',
  },
]

const deploymentActivities: ActivityWidgetItem[] = [
  {
    id: '1',
    type: 'deployment',
    title: 'deployed to staging',
    description: 'Version 1.2.0-rc1 has been deployed to staging',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: {
      name: 'John Doe',
      avatar: 'https://github.com/shadcn.png',
    },
    status: 'success',
  },
  {
    id: '2',
    type: 'deployment',
    title: 'deployment failed',
    description: 'Version 1.2.0-rc1 deployment to production failed',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user: {
      name: 'Jane Smith',
      avatar: 'https://github.com/shadcn.png',
    },
    status: 'error',
  },
  {
    id: '3',
    type: 'deployment',
    title: 'deployed to production',
    description: 'Version 1.2.0 has been deployed to production',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    user: {
      name: 'Mike Johnson',
      avatar: 'https://github.com/shadcn.png',
    },
    status: 'success',
  },
]

const systemActivities: ActivityWidgetItem[] = [
  {
    id: '1',
    type: 'alert',
    title: 'high CPU usage',
    description: 'CPU usage exceeded 90% for 5 minutes',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'warning',
  },
  {
    id: '2',
    type: 'alert',
    title: 'disk space low',
    description: 'Disk space usage at 95%',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'error',
  },
  {
    id: '3',
    type: 'status',
    title: 'backup completed',
    description: 'Daily backup completed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'success',
  },
]

export const Default: Story = {
  args: {
    activities: sampleActivities,
    title: 'Recent Activity',
    description: 'Latest updates from your team',
    showTimestamps: true,
    showAvatars: true,
    maxItems: 5,
    onViewAll: () => {
      // View all clicked
    },
  },
}

export const WithoutAvatars: Story = {
  args: {
    activities: sampleActivities,
    title: 'System Activity',
    description: 'Recent system events',
    showTimestamps: true,
    showAvatars: false,
  },
}

export const WithoutTimestamps: Story = {
  args: {
    activities: sampleActivities,
    title: 'Team Activity',
    description: 'What your team has been up to',
    showTimestamps: false,
    showAvatars: true,
  },
}

export const LimitedItems: Story = {
  args: {
    activities: sampleActivities,
    title: 'Recent Updates',
    description: 'Latest 3 activities',
    showTimestamps: true,
    showAvatars: true,
    maxItems: 3,
  },
}

export const DeploymentActivity: Story = {
  args: {
    activities: deploymentActivities,
    title: 'Deployment History',
    description: 'Recent deployments and their status',
    showTimestamps: true,
    showAvatars: true,
  },
}

export const SystemActivity: Story = {
  args: {
    activities: systemActivities,
    title: 'System Alerts',
    description: 'Recent system events and alerts',
    showTimestamps: true,
    showAvatars: false,
  },
}

export const ActivityTimelineExample: Story = {
  args: {
    activities: sampleActivities,
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <ActivityTimeline items={sampleActivities} orientation="vertical" showConnectors={true} />
      <ActivityTimeline items={deploymentActivities} orientation="vertical" showConnectors={true} />
    </div>
  ),
}

export const RecentActivityExample: Story = {
  args: {
    activities: sampleActivities,
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <RecentActivity activities={sampleActivities} groupByDate={true} />
      <RecentActivity activities={deploymentActivities} groupByDate={true} />
    </div>
  ),
}

export const ActivitySummaryExample: Story = {
  args: {
    activities: sampleActivities,
  },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <ActivitySummary
        data={{
          total: 156,
          trend: 'up',
          trendValue: 12.5,
          byType: {
            action: 45,
            comment: 32,
            status: 28,
            commit: 25,
            deployment: 18,
            alert: 8,
          },
        }}
      />
    </div>
  ),
}

export const EmptyState: Story = {
  args: {
    activities: [],
    title: 'Recent Activity',
    description: 'No recent activity to display',
    showTimestamps: true,
    showAvatars: true,
  },
}

export const WithLongContent: Story = {
  args: {
    activities: [
      {
        id: '1',
        type: 'action',
        title: 'created a new project',
        description:
          'This is a very long description that might wrap to multiple lines. It contains detailed information about the action that was taken and provides additional context for the activity.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        user: {
          name: 'John Doe',
          avatar: 'https://github.com/shadcn.png',
        },
      },
      {
        id: '2',
        type: 'comment',
        title: 'commented on a task',
        description:
          'Another long description that demonstrates how the component handles multi-line content and ensures proper spacing and alignment of all elements.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: {
          name: 'Jane Smith',
          avatar: 'https://github.com/shadcn.png',
        },
      },
    ],
    title: 'Recent Activity',
    description: 'Activities with long descriptions',
    showTimestamps: true,
    showAvatars: true,
  },
}

export const WithStatusVariants: Story = {
  args: {
    activities: [
      {
        id: '1',
        type: 'status',
        title: 'task completed',
        description: 'Successfully completed the task',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: 'success',
      },
      {
        id: '2',
        type: 'status',
        title: 'deployment failed',
        description: 'Deployment encountered an error',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'error',
      },
      {
        id: '3',
        type: 'status',
        title: 'system warning',
        description: 'High memory usage detected',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        status: 'warning',
      },
      {
        id: '4',
        type: 'status',
        title: 'update available',
        description: 'New version available',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        status: 'info',
      },
    ],
    title: 'Status Updates',
    description: 'Various status types',
    showTimestamps: true,
    showAvatars: false,
  },
}
