import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Timeline } from './timeline'
import { TooltipProvider } from '../../ui/tooltip'
import { Tabs } from '../../ui/tabs'
import { Button } from '../../ui/button'
import { FileText, MessageSquare, User } from 'lucide-react'

// Sample data
const items = [
  {
    id: '1',
    type: 'success' as const,
    title: 'Project completed',
    description:
      'The dashboard redesign project has been successfully completed and deployed to production.',
    timestamp: '2024-03-15T10:30:00Z',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
    metadata: {
      Project: 'Dashboard Redesign',
      Version: '2.0.0',
    },
    actions: (
      <Button variant="outline" size="sm">
        View Project
      </Button>
    ),
  },
  {
    id: '2',
    type: 'error' as const,
    title: 'Deployment failed',
    description: 'The deployment to staging environment failed due to build errors.',
    timestamp: '2024-03-15T09:15:00Z',
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
    metadata: {
      Environment: 'Staging',
      Error: 'Build failed',
    },
    actions: (
      <Button variant="outline" size="sm">
        View Logs
      </Button>
    ),
  },
  {
    id: '3',
    type: 'warning' as const,
    title: 'High memory usage',
    description: 'Server memory usage is above 80% threshold.',
    timestamp: '2024-03-14T16:45:00Z',
    user: {
      name: 'System',
    },
    metadata: {
      Server: 'prod-1',
      Memory: '85%',
    },
    actions: (
      <Button variant="outline" size="sm">
        Monitor
      </Button>
    ),
  },
  {
    id: '4',
    type: 'info' as const,
    title: 'New feature released',
    description: 'User authentication system has been released to beta users.',
    timestamp: '2024-03-14T14:20:00Z',
    user: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
    metadata: {
      Feature: 'OAuth2',
      Status: 'Beta',
    },
    actions: (
      <Button variant="outline" size="sm">
        Learn More
      </Button>
    ),
  },
  {
    id: '5',
    type: 'default' as const,
    title: 'Documentation updated',
    description: 'API documentation has been updated with new endpoints.',
    timestamp: '2024-03-14T11:10:00Z',
    user: {
      name: 'Alice Brown',
      email: 'alice@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
    icon: FileText,
    metadata: {
      Section: 'API',
      Pages: '12',
    },
  },
]

const meta: Meta<typeof Timeline> = {
  title: 'Blocks/DataDisplay/Timeline',
  component: Timeline,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Tabs defaultValue="timeline">
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
    items,
  },
}

export const Compact: Story = {
  args: {
    items,
    variant: 'compact',
  },
}

export const Detailed: Story = {
  args: {
    items,
    variant: 'detailed',
  },
}

export const WithoutConnector: Story = {
  args: {
    items,
    showConnector: false,
  },
}

export const ReverseOrder: Story = {
  args: {
    items,
    reverseOrder: true,
  },
}

export const CustomClassName: Story = {
  args: {
    items,
    className: 'bg-gray-50 p-4 rounded-lg',
  },
}

export const SingleItem: Story = {
  args: {
    items: [items[0]],
  },
}

export const WithoutUser: Story = {
  args: {
    items: items.map(({ user, ...item }) => item),
  },
}

export const WithoutDescription: Story = {
  args: {
    items: items.map(({ description, ...item }) => item),
  },
}

export const WithoutMetadata: Story = {
  args: {
    items: items.map(({ metadata, ...item }) => item),
  },
}

export const WithoutActions: Story = {
  args: {
    items: items.map(({ actions, ...item }) => item),
  },
}

export const CustomIcons: Story = {
  args: {
    items: items.map(item => ({
      ...item,
      icon: item.type === 'info' ? MessageSquare : item.type === 'default' ? User : undefined,
    })),
  },
}

export const ManyItems: Story = {
  args: {
    items: Array(10)
      .fill(null)
      .map((_, index) => ({
        ...items[index % items.length],
        id: `${items[index % items.length].id}-${index}`,
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
      })),
  },
}
