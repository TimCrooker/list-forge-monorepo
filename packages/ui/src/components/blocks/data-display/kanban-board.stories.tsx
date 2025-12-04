import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { KanbanBoard } from './kanban-board'
import { TooltipProvider } from '../../ui/tooltip'
import { Tabs } from '../../ui/tabs'

// Sample data
const columns = [
  {
    id: 'todo',
    title: 'To Do',
    color: '#e2e8f0',
    cards: [
      {
        id: '1',
        title: 'Design new dashboard layout',
        description: 'Create a modern and intuitive dashboard layout for the admin panel',
        priority: 'high' as const,
        tags: ['design', 'ui'],
        assignees: [{ name: 'John Doe', avatar: 'https://github.com/shadcn.png' }],
        dueDate: '2024-03-20',
        attachments: 2,
        comments: 3,
      },
      {
        id: '2',
        title: 'Implement user authentication',
        description: 'Add OAuth2 authentication with Google and GitHub providers',
        priority: 'urgent' as const,
        tags: ['auth', 'security'],
        assignees: [{ name: 'Jane Smith', avatar: 'https://github.com/shadcn.png' }],
        dueDate: '2024-03-18',
        attachments: 1,
        comments: 5,
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: '#dbeafe',
    cards: [
      {
        id: '3',
        title: 'API integration',
        description: 'Integrate with external API for data synchronization',
        priority: 'medium' as const,
        tags: ['api', 'backend'],
        assignees: [{ name: 'Bob Johnson', avatar: 'https://github.com/shadcn.png' }],
        dueDate: '2024-03-25',
        attachments: 3,
        comments: 2,
      },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    color: '#fef3c7',
    cards: [
      {
        id: '4',
        title: 'Code review',
        description: 'Review pull requests and provide feedback',
        priority: 'low' as const,
        tags: ['review', 'quality'],
        assignees: [{ name: 'Alice Brown', avatar: 'https://github.com/shadcn.png' }],
        dueDate: '2024-03-22',
        attachments: 0,
        comments: 4,
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    color: '#dcfce7',
    cards: [
      {
        id: '5',
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        priority: 'high' as const,
        tags: ['devops', 'ci-cd'],
        assignees: [{ name: 'John Doe', avatar: 'https://github.com/shadcn.png' }],
        dueDate: '2024-03-15',
        attachments: 4,
        comments: 1,
      },
    ],
  },
]

const meta: Meta<typeof KanbanBoard> = {
  title: 'Blocks/DataDisplay/KanbanBoard',
  component: KanbanBoard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Tabs defaultValue="board">
        <TooltipProvider>
          <div className="w-[1200px]">
            <Story />
          </div>
        </TooltipProvider>
      </Tabs>
    ),
  ],
} satisfies Meta<typeof KanbanBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns,
  },
}

export const WithCardClick: Story = {
  args: {
    columns,
    onCardClick: (card, columnId) => {
      // Card clicked: card, in column: columnId
    },
  },
}

export const WithAddCard: Story = {
  args: {
    columns,
    onAddCard: columnId => {
      // Add card to column: columnId
    },
  },
}

export const WithMoveCard: Story = {
  args: {
    columns,
    onMoveCard: (cardId, fromColumn, toColumn) => {
      // Move card: cardId, from: fromColumn, to: toColumn
    },
  },
}

export const WithoutColumnActions: Story = {
  args: {
    columns,
    showColumnActions: false,
  },
}

export const WithoutDragging: Story = {
  args: {
    columns,
    draggable: false,
  },
}

export const WithColumnLimits: Story = {
  args: {
    columns: columns.map(column => ({
      ...column,
      limit: 5,
    })),
  },
}

export const WithCoverImages: Story = {
  args: {
    columns: columns.map(column => ({
      ...column,
      cards: column.cards.map(card => ({
        ...card,
        coverImage: `https://picsum.photos/seed/${card.id}/400/200`,
      })),
    })),
  },
}

export const CustomClassName: Story = {
  args: {
    columns,
    className: 'bg-gray-50 p-4 rounded-lg',
  },
}

export const EmptyColumns: Story = {
  args: {
    columns: columns.map(column => ({
      ...column,
      cards: [],
    })),
  },
}

export const SingleColumn: Story = {
  args: {
    columns: [columns[0]],
  },
}

export const ManyCards: Story = {
  args: {
    columns: columns.map(column => ({
      ...column,
      cards: Array(10)
        .fill(null)
        .map((_, index) => ({
          ...column.cards[0],
          id: `${column.id}-${index}`,
          title: `${column.cards[0].title} ${index + 1}`,
        })),
    })),
  },
}
