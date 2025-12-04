import type { Meta, StoryObj } from '@storybook/react'
import { EventFeed, type EventFeedItem } from './event-feed'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '../../../ui/button'

const meta: Meta<typeof EventFeed> = {
  title: 'Components/EventFeed',
  component: EventFeed,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof EventFeed>

// Sample event data generator
const eventTypes = [
  'USER_CREATED',
  'USER_UPDATED',
  'ORDER_PLACED',
  'PAYMENT_PROCESSED',
  'EMAIL_SENT',
  'LOGIN_ATTEMPT',
  'DATA_SYNC',
  'BACKUP_COMPLETED',
]

const statuses: Array<'success' | 'error' | 'warning' | 'info' | 'pending' | 'processing'> = [
  'success',
  'error',
  'warning',
  'info',
  'pending',
  'processing',
]

const generateEvents = (count: number, startId = 0): EventFeedItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const timestamp = new Date(Date.now() - (count - i) * 30000)

    return {
      id: `event-${startId + i}`,
      timestamp,
      type: eventType,
      status,
      message: `Event processed ${
        status === 'success' ? 'successfully' : status === 'error' ? 'with errors' : 'normally'
      }`,
      metadata: {
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        duration: `${Math.floor(Math.random() * 500)}ms`,
        region: ['us-east-1', 'us-west-2', 'eu-west-1'][Math.floor(Math.random() * 3)],
      },
    }
  })
}

export const Default: Story = {
  render: () => {
    const [events, setEvents] = useState<EventFeedItem[]>(generateEvents(25))
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const handleLoadMore = useCallback(() => {
      setIsLoadingMore(true)
      setTimeout(() => {
        setEvents(prev => [...generateEvents(20, prev.length), ...prev])
        setIsLoadingMore(false)
      }, 1000)
    }, [])

    const handleAddEvent = useCallback(() => {
      const newEvent: EventFeedItem = {
        id: `event-${events.length}`,
        timestamp: new Date(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        message: 'New event just occurred',
        metadata: {
          userId: `user-${Math.floor(Math.random() * 1000)}`,
          duration: `${Math.floor(Math.random() * 500)}ms`,
        },
      }
      setEvents(prev => [...prev, newEvent])
    }, [events.length])

    return (
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex items-center gap-3">
          <Button onClick={handleAddEvent}>Add Event</Button>
          <span className="text-sm text-muted-foreground">{events.length} total events</span>
        </div>
        <div className="h-[700px]">
          <EventFeed
            items={events}
            hasMore={events.length < 100}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            autoScroll={true}
            onEventClick={event => {
              // Event clicked: event
            }}
          />
        </div>
      </div>
    )
  },
}

export const LiveFeedSimulation: Story = {
  render: () => {
    const [events, setEvents] = useState<EventFeedItem[]>(generateEvents(10))
    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
      if (!isRunning) return

      const interval = setInterval(() => {
        const newEvent: EventFeedItem = {
          id: `event-${Date.now()}`,
          timestamp: new Date(),
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          message: 'Real-time event from simulation',
          metadata: {
            simulation: 'active',
            batch: Math.floor(Math.random() * 10),
          },
        }
        setEvents(prev => [...prev, newEvent])
      }, 2000)

      return () => clearInterval(interval)
    }, [isRunning])

    return (
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex items-center gap-3">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            variant={isRunning ? 'destructive' : 'default'}
          >
            {isRunning ? 'Stop Simulation' : 'Start Simulation'}
          </Button>
          <div className="flex items-center gap-2">
            {isRunning && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            <span className="text-sm text-muted-foreground">
              {events.length} events {isRunning && '(live)'}
            </span>
          </div>
        </div>
        <div className="h-[700px]">
          <EventFeed items={events} autoScroll={true} showScrollToBottom={true} />
        </div>
      </div>
    )
  },
}

export const DenseMode: Story = {
  render: () => {
    const [events] = useState<EventFeedItem[]>(generateEvents(50))

    return (
      <div className="w-full max-w-5xl h-[700px]">
        <EventFeed items={events} dense={true} autoScroll={false} />
      </div>
    )
  },
}

export const StatusDotVariant: Story = {
  render: () => {
    const [events] = useState<EventFeedItem[]>(generateEvents(30))

    return (
      <div className="w-full max-w-5xl h-[700px]">
        <EventFeed items={events} statusVariant="dot" autoScroll={false} />
      </div>
    )
  },
}

export const ConsoleStyle: Story = {
  render: () => {
    const [events, setEvents] = useState<EventFeedItem[]>(generateEvents(20))

    const addLog = useCallback(() => {
      setEvents(prev => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          type: 'SYSTEM_LOG',
          status: ['info', 'success', 'error'][Math.floor(Math.random() * 3)] as any,
          message: `System log entry at ${new Date().toLocaleTimeString()}`,
        },
      ])
    }, [])

    return (
      <div className="w-full max-w-5xl">
        <div className="mb-4">
          <Button onClick={addLog} variant="outline">
            Add Log
          </Button>
        </div>
        <div className="h-[700px]">
          <EventFeed items={events} variant="console" autoScroll={true} statusVariant="none" />
        </div>
      </div>
    )
  },
}

export const TimeFormatVariations: Story = {
  render: () => {
    const [events] = useState<EventFeedItem[]>(generateEvents(15))

    return (
      <div className="w-full max-w-5xl space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">Relative Time (default)</h3>
          <div className="h-[300px]">
            <EventFeed items={events} timeFormat="relative" autoScroll={false} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Absolute Time</h3>
          <div className="h-[300px]">
            <EventFeed items={events} timeFormat="absolute" autoScroll={false} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Both (Relative + Absolute)</h3>
          <div className="h-[300px]">
            <EventFeed items={events} timeFormat="both" autoScroll={false} />
          </div>
        </div>
      </div>
    )
  },
}

export const WithoutMetadata: Story = {
  render: () => {
    const eventsWithoutMetadata = generateEvents(20).map(({ metadata, ...event }) => event)

    return (
      <div className="w-full max-w-5xl h-[700px]">
        <EventFeed items={eventsWithoutMetadata} autoScroll={false} />
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
    <div className="w-full max-w-5xl h-[700px]">
      <EventFeed {...args} />
    </div>
  ),
}

export const EmptyState: Story = {
  args: {
    items: [],
    emptyComponent: (
      <div className="text-center">
        <p className="text-lg font-medium text-muted-foreground">No events to display</p>
        <p className="text-sm text-muted-foreground mt-2">Events will appear here in real-time</p>
      </div>
    ),
  },
  render: args => (
    <div className="w-full max-w-5xl h-[700px]">
      <EventFeed {...args} />
    </div>
  ),
}
