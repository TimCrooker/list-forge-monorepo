import { formatDistanceToNow } from 'date-fns'
import type { OperationRendererProps } from './index'

/**
 * Default renderer for operation types without a specific renderer
 * Shows a timeline of all events with their data
 */
export default function DefaultRenderer({ operation }: OperationRendererProps) {
  return (
    <div className="space-y-2 text-sm">
      {operation.events.map((event) => (
        <div key={event.id} className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium capitalize">{event.eventType}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(event.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>
          {event.message && (
            <p className="text-muted-foreground">{event.message}</p>
          )}
          {event.data && Object.keys(event.data).length > 0 && (
            <div className="mt-1 p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
