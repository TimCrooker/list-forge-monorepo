import type { Meta, StoryObj } from '@storybook/react'
import { LiveFeed, type LiveFeedItem } from './live-feed'
import { useState, useCallback } from 'react'
import { Badge } from '../../../ui/badge'
import { Button } from '../../../ui/button'

const meta: Meta<typeof LiveFeed> = {
  title: 'Components/LiveFeed',
  component: LiveFeed,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof LiveFeed>

// Sample data generator
const generateItems = (count: number, startId = 0): LiveFeedItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${startId + i}`,
    title: `Event ${startId + i + 1}`,
    timestamp: new Date(Date.now() - (count - i) * 60000),
    description: `This is event number ${startId + i + 1}`,
  }))
}

export const Default: Story = {
  render: () => {
    const [items, setItems] = useState(generateItems(20))
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const handleLoadMore = useCallback(() => {
      setIsLoadingMore(true)
      setTimeout(() => {
        setItems(prev => [...generateItems(20, prev.length), ...prev])
        setIsLoadingMore(false)
      }, 1000)
    }, [])

    const handleAddNew = useCallback(() => {
      const newItem: LiveFeedItem = {
        id: `item-${items.length}`,
        title: `New Event ${items.length + 1}`,
        timestamp: new Date(),
        description: `This is a newly added event`,
      }
      setItems(prev => [...prev, newItem])
    }, [items.length])

    return (
      <div className="w-full max-w-4xl h-[600px]">
        <div className="mb-4 flex gap-2">
          <Button onClick={handleAddNew}>Add New Event</Button>
        </div>
        <LiveFeed
          items={items}
          renderItem={item => (
            <div className="p-4 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
          hasMore={items.length < 100}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          autoScroll={true}
        />
      </div>
    )
  },
}

export const ConsoleVariant: Story = {
  render: () => {
    const [logs, setLogs] = useState<LiveFeedItem[]>(
      generateItems(15).map((item, i) => ({
        ...item,
        level: ['info', 'warn', 'error'][i % 3],
        message: `[${['INFO', 'WARN', 'ERROR'][i % 3]}] System message ${i + 1}`,
      })),
    )

    const addLog = useCallback(() => {
      const levels = ['info', 'warn', 'error']
      const level = levels[Math.floor(Math.random() * levels.length)]
      setLogs(prev => [
        ...prev,
        {
          id: `log-${prev.length}`,
          level,
          message: `[${level.toUpperCase()}] ${new Date().toLocaleTimeString()} - New log entry`,
          timestamp: new Date(),
        },
      ])
    }, [])

    return (
      <div className="w-full max-w-4xl h-[600px]">
        <div className="mb-4">
          <Button onClick={addLog} variant="outline">
            Add Log Entry
          </Button>
        </div>
        <LiveFeed
          items={logs}
          variant="console"
          renderItem={item => (
            <div className="px-3 py-1.5 font-mono text-xs">
              <span className="text-green-500/70 mr-2">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={
                  item.level === 'error'
                    ? 'text-red-400'
                    : item.level === 'warn'
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }
              >
                {item.message}
              </span>
            </div>
          )}
          autoScroll={true}
          showScrollToBottom={true}
        />
      </div>
    )
  },
}

export const CompactVariant: Story = {
  render: () => {
    const [items, setItems] = useState(generateItems(30))

    return (
      <div className="w-full max-w-4xl h-[600px]">
        <LiveFeed
          items={items}
          variant="compact"
          renderItem={item => (
            <div className="px-3 py-2 border-b border-border/30 hover:bg-muted/30 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
          autoScroll={false}
        />
      </div>
    )
  },
}

export const WithStatusBadges: Story = {
  render: () => {
    const [events, setEvents] = useState<(LiveFeedItem & { status: string })[]>(
      generateItems(20).map((item, i) => ({
        ...item,
        status: ['success', 'warning', 'error'][i % 3],
      })),
    )

    const statusColors = {
      success: 'bg-green-500/10 text-green-700 border-green-500/20',
      warning: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      error: 'bg-red-500/10 text-red-700 border-red-500/20',
    }

    return (
      <div className="w-full max-w-4xl h-[600px]">
        <LiveFeed
          items={events}
          renderItem={item => (
            <div className="p-4 border-b border-border hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className={statusColors[item.status as keyof typeof statusColors]}
                >
                  {item.status}
                </Badge>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
          autoScroll={true}
        />
      </div>
    )
  },
}

export const LoadingState: Story = {
  args: {
    items: [],
    isLoadingInitial: true,
  },
  render: args => (
    <div className="w-full max-w-4xl h-[600px]">
      <LiveFeed {...args} renderItem={() => null} />
    </div>
  ),
}

export const EmptyState: Story = {
  args: {
    items: [],
    emptyComponent: (
      <div className="text-center">
        <p className="text-lg font-medium text-muted-foreground">No events yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Events will appear here as they are received
        </p>
      </div>
    ),
  },
  render: args => (
    <div className="w-full max-w-4xl h-[600px]">
      <LiveFeed {...args} renderItem={() => null} />
    </div>
  ),
}
