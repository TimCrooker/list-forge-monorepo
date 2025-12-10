import { useMemo } from 'react'
import type {
  AgentOperationEvent,
  GroupedOperation,
  OperationStatus,
} from '@listforge/core-types'

/**
 * Groups AgentOperationEvents by operationId into GroupedOperations
 * for rendering collapsible operation widgets
 */
export function useGroupedOperations(
  events: AgentOperationEvent[]
): GroupedOperation[] {
  return useMemo(() => {
    // Group events by operationId
    const operationMap = new Map<string, AgentOperationEvent[]>()

    for (const event of events) {
      const existing = operationMap.get(event.operationId) || []
      existing.push(event)
      operationMap.set(event.operationId, existing)
    }

    // Convert to GroupedOperation array
    const operations: GroupedOperation[] = []

    for (const [operationId, operationEvents] of operationMap) {
      // Sort events by timestamp
      const sortedEvents = [...operationEvents].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Get first event for operation metadata
      const firstEvent = sortedEvents[0]
      const lastEvent = sortedEvents[sortedEvents.length - 1]

      // Determine status from events
      const status = deriveOperationStatus(sortedEvents)

      // Get summary from completed/failed event
      const completedEvent = sortedEvents.find(
        (e) => e.eventType === 'completed' || e.eventType === 'failed'
      )
      const summary = completedEvent?.message

      // Get error message if failed
      const failedEvent = sortedEvents.find((e) => e.eventType === 'failed')
      const error = failedEvent?.message || (failedEvent?.data?.error as string)

      operations.push({
        operationId,
        operationType: firstEvent.operationType,
        status,
        stepId: firstEvent.stepId,
        title: firstEvent.title,
        summary,
        events: sortedEvents,
        startedAt: firstEvent.timestamp,
        completedAt:
          status === 'completed' || status === 'failed'
            ? lastEvent.timestamp
            : undefined,
        error,
      })
    }

    // Sort operations by start time
    return operations.sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    )
  }, [events])
}

/**
 * Derives the operation status from its events
 */
function deriveOperationStatus(events: AgentOperationEvent[]): OperationStatus {
  // Check for terminal states first
  const hasFailed = events.some((e) => e.eventType === 'failed')
  if (hasFailed) return 'failed'

  const hasCompleted = events.some((e) => e.eventType === 'completed')
  if (hasCompleted) return 'completed'

  // Check for started or progress
  const hasStarted = events.some((e) => e.eventType === 'started')
  const hasProgress = events.some((e) => e.eventType === 'progress')

  if (hasStarted || hasProgress) return 'in_progress'

  return 'pending'
}

/**
 * Extracts data from progress events for streaming display
 */
export function getProgressData(
  events: AgentOperationEvent[]
): Record<string, unknown>[] {
  return events
    .filter((e) => e.eventType === 'progress' && e.data)
    .map((e) => e.data!)
}

/**
 * Gets the latest progress message
 */
export function getLatestProgressMessage(
  events: AgentOperationEvent[]
): string | undefined {
  const progressEvents = events.filter((e) => e.eventType === 'progress')
  if (progressEvents.length === 0) return undefined
  return progressEvents[progressEvents.length - 1].message
}
