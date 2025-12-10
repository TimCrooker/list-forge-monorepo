import { useState, useEffect, useRef, useMemo } from 'react';
import { getSocket } from './socket';
import { Rooms, SocketEvents } from '@listforge/socket-types';
import type { ResearchActivityPayload } from '@listforge/socket-types';
import type { ResearchActivityLogEntry, AgentOperationEvent } from '@listforge/core-types';
import { useGetResearchActivityLogQuery } from './api';

export interface ChecklistStepStatus {
  id: string;
  label: string;
  completed: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

const CHECKLIST_STEPS = [
  { id: 'load_context', label: 'Loading item data' },
  { id: 'analyze_media', label: 'Analyzing photos' },
  { id: 'deep_identify', label: 'Deep product identification' },
  { id: 'update_item', label: 'Updating item details' },
  { id: 'search_comps', label: 'Finding comparables' },
  { id: 'analyze_comps', label: 'Analyzing prices' },
  { id: 'calculate_price', label: 'Calculating recommendations' },
  { id: 'assess_missing', label: 'Checking for gaps' },
  { id: 'persist_results', label: 'Saving results' },
];

/**
 * Check if an entry is in the new AgentOperationEvent format
 */
function isAgentOperationEvent(entry: any): entry is AgentOperationEvent {
  return entry && typeof entry.operationId === 'string' && typeof entry.operationType === 'string';
}

/**
 * React hook to track research activity feed with WebSocket updates
 *
 * Fetches historical activity logs and subscribes to real-time updates.
 * Automatically computes checklist status from activity entries.
 * Supports both legacy ResearchActivityLogEntry and new AgentOperationEvent formats.
 *
 * @param researchRunId - Research run ID to track, or null to disable
 *
 * @example
 * ```tsx
 * function ResearchActivityView({ runId }) {
 *   const { entries, operationEvents, checklistStatus, isLoading } = useResearchActivityFeed(runId);
 *   return (
 *     <div>
 *       <AgentActivityFeed events={operationEvents} />
 *       <Checklist steps={checklistStatus} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useResearchActivityFeed(researchRunId: string | null) {
  const [liveEntries, setLiveEntries] = useState<ResearchActivityLogEntry[]>([]);
  const [operationEvents, setOperationEvents] = useState<AgentOperationEvent[]>([]);
  const entriesMapRef = useRef<Map<string, ResearchActivityLogEntry>>(new Map());
  const operationEventsMapRef = useRef<Map<string, AgentOperationEvent>>(new Map());

  // CRITICAL FIX: Use ref for socket to avoid stale closures
  const socketRef = useRef(getSocket());

  // Fetch historical activity log
  const { data: activityData, isLoading } = useGetResearchActivityLogQuery(
    researchRunId || '',
    {
      skip: !researchRunId,
    },
  );

  // Keep socket ref up to date
  useEffect(() => {
    socketRef.current = getSocket();
  }, []);

  // Initialize entries from API data
  useEffect(() => {
    if (activityData?.entries) {
      const newEntriesMap = new Map<string, ResearchActivityLogEntry>();
      const newOperationEventsMap = new Map<string, AgentOperationEvent>();

      activityData.entries.forEach((entry: any) => {
        // Store in legacy format
        newEntriesMap.set(entry.id, entry);

        // If it's a new-format event, also store as AgentOperationEvent
        if (isAgentOperationEvent(entry)) {
          // Transform metadata -> data for consistency with WebSocket format
          // HTTP API returns 'metadata', but AgentOperationEvent expects 'data'
          const httpEntry = entry as AgentOperationEvent & { metadata?: Record<string, unknown> };
          const operationEvent: AgentOperationEvent = {
            id: httpEntry.id,
            runId: httpEntry.runId,
            contextId: httpEntry.contextId,
            operationId: httpEntry.operationId,
            operationType: httpEntry.operationType,
            eventType: httpEntry.eventType,
            stepId: httpEntry.stepId,
            title: httpEntry.title,
            message: httpEntry.message,
            timestamp: httpEntry.timestamp,
            // Use metadata from HTTP response, falling back to data for WebSocket format
            data: httpEntry.metadata || httpEntry.data,
          };
          newOperationEventsMap.set(entry.id, operationEvent);
        }
      });

      entriesMapRef.current = newEntriesMap;
      operationEventsMapRef.current = newOperationEventsMap;
      setLiveEntries(activityData.entries);
      setOperationEvents(
        Array.from(newOperationEventsMap.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      );
    }
  }, [activityData]);

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    // CRITICAL FIX: Guard against missing researchRunId to prevent race conditions
    if (!researchRunId) {
      setLiveEntries([]);
      setOperationEvents([]);
      entriesMapRef.current = new Map();
      operationEventsMapRef.current = new Map();
      return;
    }

    const socket = socketRef.current;

    // Subscribe to research run room
    const room = Rooms.researchRun(researchRunId);

    // CRITICAL FIX: Store handler references for proper cleanup
    let isSubscribed = false;

    // Helper function to subscribe to the room
    const subscribeToRoom = () => {
      if (socket.connected && researchRunId && !isSubscribed) {
        socket.emit('subscribe', [room]);
        isSubscribed = true;
      }
    };

    // Ensure token is set before connecting
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      socket.auth = { token };
    }

    // If socket is already connected, subscribe immediately
    if (socket.connected) {
      subscribeToRoom();
    } else if (token) {
      // Only connect if we have a token
      socket.connect();
    }

    // Track socket connection status - subscribe when connected
    const handleConnect = () => {
      subscribeToRoom();
    };

    // Handle connection errors
    const handleConnectError = (error: Error) => {
      console.warn('[useResearchActivityFeed] Socket connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    // CRITICAL FIX: Handle new activity events with functional setState to avoid stale closures
    const handleActivity = (payload: ResearchActivityPayload) => {
      // Verify payload is for current research run (guards against race conditions)
      if (payload.researchRunId !== researchRunId) return;

      const entry = payload.entry;

      // Check if this is a new-format AgentOperationEvent
      if (isAgentOperationEvent(entry)) {
        // Store as AgentOperationEvent
        operationEventsMapRef.current.set(entry.id, entry);
        // CRITICAL FIX: Use functional update to avoid stale state
        setOperationEvents(() =>
          Array.from(operationEventsMapRef.current.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        );
      }

      // Also store in legacy format for backward compatibility
      const legacyEntry: ResearchActivityLogEntry = {
        id: entry.id,
        researchRunId: payload.researchRunId,
        itemId: payload.itemId,
        type: (entry as any).type || 'info',
        message: (entry as any).message || (entry as any).title || '',
        metadata: (entry as any).metadata || (entry as any).data,
        status: (entry as any).status || 'info',
        stepId: entry.stepId,
        timestamp: entry.timestamp,
      };

      entriesMapRef.current.set(legacyEntry.id, legacyEntry);
      // CRITICAL FIX: Use functional update to avoid stale state
      setLiveEntries(() =>
        Array.from(entriesMapRef.current.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      );
    };

    // Register event listener
    socket.on(SocketEvents.RESEARCH_ACTIVITY, handleActivity);

    // CRITICAL FIX: Proper cleanup - remove exact handler references
    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SocketEvents.RESEARCH_ACTIVITY, handleActivity);
      if (socket.connected && isSubscribed) {
        socket.emit('unsubscribe', [room]);
        isSubscribed = false;
      }
    };
  }, [researchRunId]); // Removed socket from dependencies since we use socketRef

  // Compute checklist status from entries (works with both formats)
  const checklistStatus: ChecklistStepStatus[] = useMemo(() => {
    return CHECKLIST_STEPS.map((step) => {
      // Check operation events first (new format)
      const stepOperations = operationEvents.filter((e) => e.stepId === step.id);

      if (stepOperations.length > 0) {
        const hasCompleted = stepOperations.some((e) => e.eventType === 'completed');
        const hasFailed = stepOperations.some((e) => e.eventType === 'failed');
        const hasStarted = stepOperations.some((e) => e.eventType === 'started');

        if (hasFailed) {
          return { id: step.id, label: step.label, completed: false, status: 'error' as const };
        }
        if (hasCompleted) {
          return { id: step.id, label: step.label, completed: true, status: 'completed' as const };
        }
        if (hasStarted) {
          return { id: step.id, label: step.label, completed: false, status: 'processing' as const };
        }
      }

      // Fall back to legacy entries
      const stepEntries = liveEntries.filter((e) => e.stepId === step.id);

      if (stepEntries.length === 0) {
        return { id: step.id, label: step.label, completed: false, status: 'pending' as const };
      }

      const completedEntry = stepEntries.find((e) => e.type === 'step_completed');
      const failedEntry = stepEntries.find((e) => e.type === 'step_failed');
      const startedEntry = stepEntries.find((e) => e.type === 'step_started');

      if (failedEntry) {
        return { id: step.id, label: step.label, completed: false, status: 'error' as const };
      }
      if (completedEntry) {
        return { id: step.id, label: step.label, completed: true, status: 'completed' as const };
      }
      if (startedEntry) {
        return { id: step.id, label: step.label, completed: false, status: 'processing' as const };
      }

      return { id: step.id, label: step.label, completed: false, status: 'pending' as const };
    });
  }, [liveEntries, operationEvents]);

  return {
    /** Legacy entries (for backward compatibility) */
    entries: liveEntries,
    /** New operation events (for AgentActivityFeed) */
    operationEvents,
    /** Checklist status computed from entries */
    checklistStatus,
    /** Loading state */
    isLoading,
  };
}
