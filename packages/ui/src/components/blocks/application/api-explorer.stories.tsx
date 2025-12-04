import type { Meta, StoryObj } from '@storybook/react'
import { ApiExplorer } from './api-explorer'

const meta = {
  title: 'Blocks/Application/ApiExplorer',
  component: ApiExplorer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ApiExplorer>

export default meta
type Story = StoryObj<typeof meta>

// Sample endpoints
const sampleEndpoints = [
  {
    id: '1',
    name: 'Get Users',
    method: 'GET' as const,
    path: '/api/users',
    description: 'Retrieve a list of users',
    queryParams: {
      page: '1',
      limit: '10',
    },
  },
  {
    id: '2',
    name: 'Create User',
    method: 'POST' as const,
    path: '/api/users',
    description: 'Create a new user',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      {
        name: 'John Doe',
        email: 'john@example.com',
      },
      null,
      2,
    ),
  },
  {
    id: '3',
    name: 'Update User',
    method: 'PUT' as const,
    path: '/api/users/{id}',
    description: 'Update an existing user',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      {
        name: 'John Doe',
        email: 'john@example.com',
      },
      null,
      2,
    ),
  },
  {
    id: '4',
    name: 'Delete User',
    method: 'DELETE' as const,
    path: '/api/users/{id}',
    description: 'Delete a user',
  },
]

// Sample history
const sampleHistory = [
  {
    endpoint: sampleEndpoints[0],
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    response: {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'abc123',
      },
      body: {
        users: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' },
        ],
      },
      time: 150,
    },
  },
  {
    endpoint: sampleEndpoints[1],
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    response: {
      status: 201,
      statusText: 'Created',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'def456',
      },
      body: {
        id: 3,
        name: 'John Doe',
        email: 'john@example.com',
      },
      time: 200,
    },
  },
]

export const Default: Story = {
  args: {
    endpoints: sampleEndpoints,
    baseUrl: 'https://api.example.com',
    defaultHeaders: {
      Accept: 'application/json',
    },
    history: sampleHistory,
    onSave: endpoint => console.debug('Save endpoint:', endpoint),
    onDelete: id => console.debug('Delete endpoint:', id),
    onRequest: request => console.debug('New request:', request),
  },
}

export const WithoutEndpoints: Story = {
  args: {
    baseUrl: 'https://api.example.com',
    defaultHeaders: {
      Accept: 'application/json',
    },
  },
}

export const WithoutHistory: Story = {
  args: {
    endpoints: sampleEndpoints,
    baseUrl: 'https://api.example.com',
    defaultHeaders: {
      Accept: 'application/json',
    },
  },
}

export const WithoutDefaultHeaders: Story = {
  args: {
    endpoints: sampleEndpoints,
    baseUrl: 'https://api.example.com',
  },
}

export const WithBearerAuth: Story = {
  args: {
    endpoints: [
      {
        ...sampleEndpoints[0],
        auth: {
          type: 'bearer',
          value: 'your-token-here',
        },
      },
    ],
    baseUrl: 'https://api.example.com',
  },
}

export const WithBasicAuth: Story = {
  args: {
    endpoints: [
      {
        ...sampleEndpoints[0],
        auth: {
          type: 'basic',
          value: 'dXNlcjpwYXNz',
        },
      },
    ],
    baseUrl: 'https://api.example.com',
  },
}

export const WithApiKey: Story = {
  args: {
    endpoints: [
      {
        ...sampleEndpoints[0],
        auth: {
          type: 'apikey',
          value: 'your-api-key-here',
        },
      },
    ],
    baseUrl: 'https://api.example.com',
  },
}

export const WithComplexBody: Story = {
  args: {
    endpoints: [
      {
        id: '1',
        name: 'Create Complex Object',
        method: 'POST' as const,
        path: '/api/complex',
        description: 'Create a complex object with nested data',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            name: 'Complex Object',
            metadata: {
              version: '1.0',
              tags: ['test', 'example'],
            },
            items: [
              {
                id: 1,
                value: 'First item',
                properties: {
                  color: 'red',
                  size: 'large',
                },
              },
              {
                id: 2,
                value: 'Second item',
                properties: {
                  color: 'blue',
                  size: 'medium',
                },
              },
            ],
            settings: {
              enabled: true,
              options: {
                timeout: 5000,
                retries: 3,
              },
            },
          },
          null,
          2,
        ),
      },
    ],
    baseUrl: 'https://api.example.com',
  },
}

export const WithQueryParameters: Story = {
  args: {
    endpoints: [
      {
        id: '1',
        name: 'Search Users',
        method: 'GET' as const,
        path: '/api/users/search',
        description: 'Search users with various parameters',
        queryParams: {
          q: 'john',
          role: 'admin',
          status: 'active',
          sort: 'name',
          order: 'asc',
          page: '1',
          limit: '20',
        },
      },
    ],
    baseUrl: 'https://api.example.com',
  },
}

export const WithCustomHeaders: Story = {
  args: {
    endpoints: [
      {
        id: '1',
        name: 'Custom Headers',
        method: 'GET' as const,
        path: '/api/custom',
        description: 'Request with custom headers',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-API-Version': '2.0',
          'X-Client-ID': 'client-123',
          'X-Request-ID': 'request-456',
        },
      },
    ],
    baseUrl: 'https://api.example.com',
  },
}

export const WithErrorResponse: Story = {
  args: {
    endpoints: sampleEndpoints,
    baseUrl: 'https://api.example.com',
    history: [
      {
        endpoint: sampleEndpoints[0],
        timestamp: new Date(),
        response: {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'content-type': 'application/json',
          },
          body: {
            error: 'Invalid request parameters',
            details: {
              field: 'email',
              message: 'Invalid email format',
            },
          },
          time: 100,
        },
      },
    ],
  },
}

export const WithLongResponse: Story = {
  args: {
    endpoints: sampleEndpoints,
    baseUrl: 'https://api.example.com',
    history: [
      {
        endpoint: sampleEndpoints[0],
        timestamp: new Date(),
        response: {
          status: 200,
          statusText: 'OK',
          headers: {
            'content-type': 'application/json',
          },
          body: {
            users: Array.from({ length: 50 }, (_, i) => ({
              id: i + 1,
              name: `User ${i + 1}`,
              email: `user${i + 1}@example.com`,
              role: i % 2 === 0 ? 'admin' : 'user',
              status: i % 3 === 0 ? 'active' : 'inactive',
              metadata: {
                lastLogin: new Date().toISOString(),
                preferences: {
                  theme: i % 2 === 0 ? 'dark' : 'light',
                  notifications: i % 2 === 0,
                },
              },
            })),
            pagination: {
              total: 100,
              page: 1,
              limit: 50,
              pages: 2,
            },
          },
          time: 250,
        },
      },
    ],
  },
}
