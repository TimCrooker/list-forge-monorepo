import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { LogViewer } from './log-viewer'

const meta = {
  title: 'Blocks/Application/LogViewer',
  component: LogViewer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LogViewer>

export default meta
type Story = StoryObj<typeof meta>

// Sample log entries
const sampleLogs = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    level: 'info' as const,
    source: 'api',
    message: 'User login successful',
    metadata: {
      userId: '123',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
    level: 'warning' as const,
    source: 'database',
    message: 'Slow query detected',
    metadata: {
      query: 'SELECT * FROM users WHERE...',
      duration: 2500,
      table: 'users',
    },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
    level: 'error' as const,
    source: 'api',
    message: 'Failed to process payment',
    metadata: {
      orderId: 'ORD-123',
      amount: 99.99,
      currency: 'USD',
    },
    stackTrace: `Error: Payment processing failed
    at processPayment (/app/services/payment.js:45:12)
    at handlePayment (/app/controllers/order.js:78:23)
    at async processOrder (/app/controllers/order.js:120:5)`,
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    level: 'debug' as const,
    source: 'worker',
    message: 'Processing background job',
    metadata: {
      jobId: 'JOB-456',
      type: 'email',
      priority: 'high',
    },
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    level: 'critical' as const,
    source: 'system',
    message: 'Database connection lost',
    metadata: {
      host: 'db.example.com',
      port: 5432,
      error: 'Connection timeout',
    },
    stackTrace: `Error: Connection timeout
    at connect (/app/db/index.js:23:45)
    at initialize (/app/db/index.js:67:89)
    at async startServer (/app/server.js:12:34)`,
  },
]

// Sample sources
const sampleSources = ['api', 'database', 'worker', 'system', 'auth', 'payment']

export const Default: Story = {
  args: {
    logs: sampleLogs,
    sources: sampleSources,
    onLoadMore: () => console.debug('Load more logs'),
    onRefresh: () => console.debug('Refresh logs'),
    onExport: logs => console.debug('Export logs:', logs),
  },
}

export const Loading: Story = {
  args: {
    logs: sampleLogs,
    sources: sampleSources,
    loading: true,
  },
}

export const WithAutoScroll: Story = {
  args: {
    logs: sampleLogs,
    sources: sampleSources,
    autoScroll: true,
  },
}

export const WithMoreLogs: Story = {
  args: {
    logs: sampleLogs,
    sources: sampleSources,
    hasMore: true,
  },
}

export const WithoutSources: Story = {
  args: {
    logs: sampleLogs,
  },
}

export const WithLongMessages: Story = {
  args: {
    logs: [
      {
        id: '1',
        timestamp: new Date(),
        level: 'info' as const,
        source: 'api',
        message:
          'This is a very long message that should wrap to multiple lines. It contains a lot of information about what happened in the system and might include details about the request, response, and any relevant context that would be helpful for debugging or monitoring purposes.',
        metadata: {
          requestId: 'req-123',
          path: '/api/v1/users',
          method: 'POST',
          duration: 150,
        },
      },
    ],
    sources: sampleSources,
  },
}

export const WithComplexMetadata: Story = {
  args: {
    logs: [
      {
        id: '1',
        timestamp: new Date(),
        level: 'info' as const,
        source: 'api',
        message: 'Complex object processed',
        metadata: {
          object: {
            id: 'obj-123',
            type: 'user',
            properties: {
              name: 'John Doe',
              email: 'john@example.com',
              roles: ['admin', 'user'],
              settings: {
                theme: 'dark',
                notifications: true,
                preferences: {
                  language: 'en',
                  timezone: 'UTC',
                },
              },
            },
            metadata: {
              created: new Date().toISOString(),
              version: '1.0.0',
              tags: ['important', 'processed'],
            },
          },
          processing: {
            startTime: new Date().toISOString(),
            duration: 250,
            steps: ['validation', 'transformation', 'storage'],
            status: 'success',
          },
        },
      },
    ],
    sources: sampleSources,
  },
}

export const WithManyLogs: Story = {
  args: {
    logs: Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      timestamp: new Date(Date.now() - 1000 * 60 * i),
      level: ['debug', 'info', 'warning', 'error', 'critical'][i % 5] as const,
      source: sampleSources[i % sampleSources.length],
      message: `Log entry ${i + 1}`,
      metadata: {
        index: i,
        timestamp: new Date().toISOString(),
      },
    })),
    sources: sampleSources,
  },
}

export const WithFilteredLogs: Story = {
  args: {
    logs: sampleLogs.filter(log => log.level === 'error' || log.level === 'critical'),
    sources: sampleSources,
  },
}

export const WithCustomClassName: Story = {
  args: {
    logs: sampleLogs,
    sources: sampleSources,
    className: 'border-2 border-blue-500 rounded-lg',
  },
}
