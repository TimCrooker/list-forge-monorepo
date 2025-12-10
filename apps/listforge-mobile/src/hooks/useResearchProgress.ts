import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import { SocketEvents } from '@listforge/socket-types';
import type {
  ResearchNodeStartedPayload,
  ResearchNodeCompletedPayload,
  ResearchJobCompletedPayload,
  ResearchActivityPayload,
  ResearchPausedPayload,
  ResearchResumedPayload,
  ResearchCancelledPayload,
} from '@listforge/socket-types';

export interface ResearchProgressState {
  completedNodes: Set<string>;
  currentNode: string | null;
  status: 'pending' | 'running' | 'paused' | 'cancelled' | 'success' | 'error';
  error: string | null;
  activityLog: any[];
}

/**
 * React hook to track research progress via WebSocket
 *
 * Subscribes to research run room and listens for progress events.
 *
 * @param researchRunId - Research run ID to track, or null to disable
 *
 * @example
 * ```tsx
 * function ResearchProgress({ runId }) {
 *   const progress = useResearchProgress(runId);
 *   return <Text>Current: {progress.currentNode}</Text>;
 * }
 * ```
 */
export function useResearchProgress(
  researchRunId: string | null | undefined,
): ResearchProgressState {
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'running' | 'paused' | 'cancelled' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  useEffect(() => {
    if (!researchRunId) {
      // Reset state when no run ID
      setCompletedNodes(new Set());
      setCurrentNode(null);
      setStatus('pending');
      setError(null);
      setActivityLog([]);
      return;
    }

    // Connect socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Subscribe to research run room
    socketService.joinResearchRunRoom(researchRunId);

    // Handle node started event
    const handleNodeStarted = (payload: ResearchNodeStartedPayload) => {
      if (payload.researchRunId !== researchRunId) return;

      setCurrentNode(payload.node);
      setStatus('running');
      setError(null);
    };

    // Handle node completed event
    const handleNodeCompleted = (payload: ResearchNodeCompletedPayload) => {
      if (payload.researchRunId !== researchRunId) return;

      if (payload.status === 'success') {
        setCompletedNodes((prev) => new Set([...prev, payload.node]));
        // Clear current node if this was the current one
        setCurrentNode((prev) => (prev === payload.node ? null : prev));
      } else {
        // Node failed
        setError(payload.error || 'Node execution failed');
        setStatus('error');
      }
    };

    // Handle job completed event
    const handleJobCompleted = (payload: ResearchJobCompletedPayload) => {
      if (payload.researchRunId !== researchRunId) return;

      if (payload.status === 'success') {
        setStatus('success');
        setCurrentNode(null);
        setError(null);
      } else if (payload.status === 'paused') {
        setStatus('paused');
      } else {
        setStatus('error');
        setError(payload.error || 'Research job failed');
      }
    };

    // Handle activity log event
    const handleActivity = (payload: ResearchActivityPayload) => {
      if (payload.researchRunId !== researchRunId) return;

      setActivityLog((prev) => [...prev, payload.entry]);
    };

    // Handle pause event
    const handlePaused = (payload: ResearchPausedPayload) => {
      if (payload.researchRunId !== researchRunId) return;
      setStatus('paused');
    };

    // Handle resume event
    const handleResumed = (payload: ResearchResumedPayload) => {
      if (payload.researchRunId !== researchRunId) return;
      setStatus('running');
    };

    // Handle cancel event
    const handleCancelled = (payload: ResearchCancelledPayload) => {
      if (payload.researchRunId !== researchRunId) return;
      setStatus('cancelled');
      setCurrentNode(null);
    };

    // Register event listeners
    socketService.on(SocketEvents.RESEARCH_NODE_STARTED, handleNodeStarted);
    socketService.on(SocketEvents.RESEARCH_NODE_COMPLETED, handleNodeCompleted);
    socketService.on(SocketEvents.RESEARCH_JOB_COMPLETED, handleJobCompleted);
    socketService.on(SocketEvents.RESEARCH_ACTIVITY, handleActivity);
    socketService.on(SocketEvents.RESEARCH_PAUSED, handlePaused);
    socketService.on(SocketEvents.RESEARCH_RESUMED, handleResumed);
    socketService.on(SocketEvents.RESEARCH_CANCELLED, handleCancelled);

    // Cleanup
    return () => {
      socketService.off(SocketEvents.RESEARCH_NODE_STARTED, handleNodeStarted);
      socketService.off(SocketEvents.RESEARCH_NODE_COMPLETED, handleNodeCompleted);
      socketService.off(SocketEvents.RESEARCH_JOB_COMPLETED, handleJobCompleted);
      socketService.off(SocketEvents.RESEARCH_ACTIVITY, handleActivity);
      socketService.off(SocketEvents.RESEARCH_PAUSED, handlePaused);
      socketService.off(SocketEvents.RESEARCH_RESUMED, handleResumed);
      socketService.off(SocketEvents.RESEARCH_CANCELLED, handleCancelled);
      socketService.leaveResearchRunRoom(researchRunId);
    };
  }, [researchRunId]);

  return {
    completedNodes,
    currentNode,
    status,
    error,
    activityLog,
  };
}
