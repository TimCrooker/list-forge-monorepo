# Live Feed Blocks

## Overview

This directory contains production-ready block components for building real-time event feeds, log viewers, and live data streams. These are part of the `data-display` block category in the sexy-ui library. Based on research of shadcn/ui ecosystem and best practices for autoscroll implementations.

## Components

### `LiveFeed<T>`
A generic, highly customizable live feed component with infinite scroll, autoscroll, and real-time update support.

**Key Features:**
- **Bidirectional Infinite Scroll**: Load older items at the top while new items stream in at the bottom
- **Smart Autoscroll**: Only autoscrolls when user is at bottom; pauses when scrolling up
- **Scroll-to-Bottom Button**: Floating button with new items counter appears when user scrolls away
- **Performance Optimized**: Uses Intersection Observer API for efficient scroll detection
- **Visual Variants**: `default`, `console` (terminal-style), `compact`
- **Flexible Rendering**: Fully customizable item rendering via render props

**Best Use Cases:**
- Custom event streams
- Log viewers
- Activity feeds
- Real-time notifications
- Chat-like interfaces

### `EventFeed`
A specialized component built on top of `LiveFeed` specifically designed for event/audit logging.

**Key Features:**
- **Status Indicators**: Visual status badges or dots (success, error, warning, info, pending, processing)
- **Timestamp Formatting**: Relative, absolute, or both formats
- **Metadata Display**: Automatic metadata chip rendering
- **Event Actions**: Built-in click handlers and action buttons
- **Dense Mode**: Compact layout for high-density feeds
- **Recent Event Highlighting**: Visual indicator for events within last 60 seconds

**Best Use Cases:**
- Event audit logs
- System event monitors
- API request logs
- Deployment logs
- Error tracking feeds

## Research Findings

### Shadcn/UI Ecosystem
- **No Pre-built Components**: Shadcn doesn't provide specific "infinite scroll" or "live feed" components out of the box
- **Component Philosophy**: Shadcn focuses on primitive UI elements that can be composed
- **Best Approach**: Build custom implementations using shadcn primitives (as we did)
- **Third-party Collections**: Platforms like shadcnblocks.com and buildblocks.dev offer additional blocks but lack live feed components

### Autoscroll Best Practices

#### 1. **Sticky Bottom Pattern**
```typescript
const isAtBottom = scrollHeight - scrollTop - clientHeight <= threshold;
```
- Only autoscroll when user is already at bottom
- Prevents disrupting user's reading flow
- Our implementation uses 100px threshold (configurable)

#### 2. **Double RAF Technique**
```typescript
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
});
```
- Ensures DOM has fully rendered before scrolling
- Critical for smooth autoscroll after DOM updates
- More reliable than single RAF or immediate scroll

#### 3. **User Intent Detection**
- Track if user has manually scrolled
- Show "New Items" button instead of forcing scroll
- Counter badge shows number of new items missed

#### 4. **Smooth Scroll for Manual Actions**
```typescript
container.scrollTo({
  top: container.scrollHeight,
  behavior: 'smooth'
});
```
- Use smooth scroll for user-initiated actions (button clicks)
- Use instant scroll for autoscroll (less jarring)

### Performance Optimization

#### Virtualization (Future Enhancement)
For extremely high-volume feeds (>10,000 items), consider:
- **@tanstack/react-virtual**: Modern virtualization library
- **react-window**: Lightweight alternative
- Our current implementation is optimized for 1000-5000 items

#### Current Optimizations
- Intersection Observer for efficient scroll detection
- `passive: true` on scroll listeners
- Debounced scroll state updates (150ms)
- Minimal re-renders using refs for non-visual state

### Implementation Patterns

#### Console/Terminal Style
```typescript
<LiveFeed
  variant="console"
  items={logs}
  renderItem={(log) => (
    <div className="font-mono text-xs">
      <span className="text-green-400">{log.message}</span>
    </div>
  )}
/>
```

#### Event Feed with Status
```typescript
<EventFeed
  items={events}
  statusVariant="badge"
  timeFormat="both"
  onEventClick={handleEventClick}
/>
```

#### Custom High-Density Feed
```typescript
<LiveFeed
  variant="compact"
  items={items}
  autoScroll={true}
  newItemsThreshold={50}
/>
```

## API Reference

### LiveFeed Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | required | Array of items to display |
| `renderItem` | `(item: T, index: number) => ReactNode` | required | Render function for each item |
| `isLoadingInitial` | `boolean` | `false` | Show initial loading state |
| `isLoadingMore` | `boolean` | `false` | Show loading indicator at top |
| `hasMore` | `boolean` | `false` | Enable infinite scroll at top |
| `autoScroll` | `boolean` | `true` | Enable automatic scrolling |
| `onLoadMore` | `() => void` | - | Callback for loading older items |
| `onScrollToBottom` | `() => void` | - | Callback when scrolled to bottom |
| `variant` | `'default' \| 'console' \| 'compact'` | `'default'` | Visual variant |
| `showScrollToBottom` | `boolean` | `true` | Show floating scroll button |
| `newItemsThreshold` | `number` | `100` | Pixels from bottom to consider "at bottom" |

### EventFeed Props

Extends `LiveFeed` props with:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onEventClick` | `(event: EventFeedItem) => void` | - | Click handler for events |
| `showTimestamp` | `boolean` | `true` | Display timestamps |
| `showStatus` | `boolean` | `true` | Display status indicators |
| `showActions` | `boolean` | `true` | Display action buttons |
| `timeFormat` | `'relative' \| 'absolute' \| 'both'` | `'relative'` | Timestamp format |
| `statusVariant` | `'badge' \| 'dot' \| 'none'` | `'badge'` | Status display style |
| `dense` | `boolean` | `false` | Compact layout mode |

## Usage Examples

### Basic Live Feed

```typescript
import { LiveFeed } from '@listforge/ui';
// LiveFeed is exported from blocks/data-display

function MyFeed() {
  const [items, setItems] = useState([]);

  // Add new items
  const addItem = (newItem) => {
    setItems(prev => [...prev, newItem]);
  };

  return (
    <LiveFeed
      items={items}
      renderItem={(item) => (
        <div className="p-4 border-b">
          {item.title}
        </div>
      )}
      autoScroll={true}
    />
  );
}
```

### Event Feed with Real-time Updates

```typescript
import { EventFeed } from '@listforge/ui';
// EventFeed is exported from blocks/data-display

function EventMonitor() {
  const [events, setEvents] = useState([]);

  // WebSocket or SSE integration
  useEffect(() => {
    const socket = connectToEventStream();

    socket.on('event', (newEvent) => {
      setEvents(prev => [...prev, {
        id: newEvent.id,
        timestamp: new Date(newEvent.timestamp),
        type: newEvent.type,
        status: newEvent.status,
        message: newEvent.message,
        metadata: newEvent.metadata
      }]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <EventFeed
      items={events}
      autoScroll={true}
      showScrollToBottom={true}
      onEventClick={(event) => {
        console.log('Event clicked:', event);
      }}
    />
  );
}
```

### Bidirectional Infinite Scroll

```typescript
import { LiveFeed } from '@listforge/ui';

function InfiniteFeed() {
  const [items, setItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadOlder = async () => {
    setIsLoading(true);
    const older = await fetchOlderItems();
    setItems(prev => [...older, ...prev]);
    setHasMore(older.length > 0);
    setIsLoading(false);
  };

  return (
    <LiveFeed
      items={items}
      renderItem={renderItem}
      hasMore={hasMore}
      isLoadingMore={isLoading}
      onLoadMore={loadOlder}
      autoScroll={true}
    />
  );
}
```

## Storybook

Comprehensive Storybook stories are provided:
- `live-feed.stories.tsx` - All LiveFeed variations
- `event-feed.stories.tsx` - EventFeed with live simulations

Run Storybook to see interactive examples:
```bash
pnpm run storybook
```

## Future Enhancements

1. **Virtualization**: Add optional virtualization for 10k+ items
2. **Grouping**: Auto-group events by time periods
3. **Filtering**: Built-in filter UI
4. **Search**: Integrated search functionality
5. **Export**: Export logs to file
6. **Pause/Resume**: Pause live updates without disabling component

## Migration Guide

If you're using the old `InfiniteEventList` component:

### Before
```typescript
<InfiniteEventList
  events={events}
  autoScroll={autoScroll}
  isLoadingOlder={isLoadingOlder}
  onLoadOlder={loadOlderEvents}
/>
```

### After
```typescript
<EventFeed
  items={events}
  autoScroll={autoScroll}
  isLoadingMore={isLoadingOlder}
  onLoadMore={loadOlderEvents}
  onEventClick={handleEventClick}
/>
```

## Credits

Built with insights from:
- Shadcn UI ecosystem research
- TanStack Virtual documentation
- Modern React patterns for real-time data
- Industry best practices for log viewers and monitoring tools

