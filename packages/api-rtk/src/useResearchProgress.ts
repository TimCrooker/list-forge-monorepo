import { useState, useEffect, useRef } from 'react';
import { getSocket } from './socket';
import { Rooms, SocketEvents } from '@listforge/socket-types';
import type {
  ResearchNodeStartedPayload,
  ResearchNodeCompletedPayload,
  ResearchJobCompletedPayload,
  ResearchPausedPayload,
  ResearchResumedPayload,
  ResearchCancelledPayload,
} from '@listforge/socket-types';

export interface ResearchProgressState {
  completedNodes: Set<string>;
  currentNode: string | null;
  status: 'pending' | 'running' | 'paused' | 'cancelled' | 'success' | 'error';
  error: string | null;
}

/**
 * React hook to track research progress via WebSocket
 *
 * Subscribes to research run room and listens for progress events.
 * Falls back to polling if WebSocket disconnects (handled by parent component).
 *
 * @param researchRunId - Research run ID to track, or null to disable
 *
 * @example
 * ```tsx
 * function ResearchProgress({ runId }) {
 *   const progress = useResearchProgress(runId);
 *   return <div>Current: {progress.currentNode}</div>;
 * }
 * ```
 */
export function useResearchProgress(
  researchRunId: string | null,
): ResearchProgressState {
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'running' | 'paused' | 'cancelled' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const socket = getSocket();

  useEffect(() => {
    if (!researchRunId) {
      // Reset state when no run ID
      setCompletedNodes(new Set());
      setCurrentNode(null);
      setStatus('pending');
      setError(null);
      return;
    }

    // Subscribe to research run room
    const room = Rooms.researchRun(researchRunId);

    // Helper function to subscribe to the room
    const subscribeToRoom = () => {
      if (socket.connected) {
        socket.emit('subscribe', [room]);
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

    const handleDisconnect = () => {
      // Socket disconnected - fallback polling will be handled by parent component
    };

    // Handle connection errors
    const handleConnectError = (error: Error) => {
      console.warn('[useResearchProgress] Socket connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Handle node started event
    const handleNodeStarted = (payload: ResearchNodeStartedPayload) => {
      if (payload.researchRunId !== researchRunId) return;

      lastUpdateTimeRef.current = Date.now();
      setCurrentNode(payload.node);
      setStatus('running');
      setError(null);
    };

    // Handle node completed event
    const handleNodeCompleted = (payload: ResearchNodeCompletedPayload) => {
      if (payload.researchRunId !== researchRunId) return;

      lastUpdateTimeRef.current = Date.now();

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

      lastUpdateTimeRef.current = Date.now();

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

    // Handle pause event
    const handlePaused = (payload: ResearchPausedPayload) => {
      if (payload.researchRunId !== researchRunId) return;
      lastUpdateTimeRef.current = Date.now();
      setStatus('paused');
    };

    // Handle resume event
    const handleResumed = (payload: ResearchResumedPayload) => {
      if (payload.researchRunId !== researchRunId) return;
      lastUpdateTimeRef.current = Date.now();
      setStatus('running');
    };

    // Handle cancel event
    const handleCancelled = (payload: ResearchCancelledPayload) => {
      if (payload.researchRunId !== researchRunId) return;
      lastUpdateTimeRef.current = Date.now();
      setStatus('cancelled');
      setCurrentNode(null);
    };

    // Register event listeners
    socket.on(SocketEvents.RESEARCH_NODE_STARTED, handleNodeStarted);
    socket.on(SocketEvents.RESEARCH_NODE_COMPLETED, handleNodeCompleted);
    socket.on(SocketEvents.RESEARCH_JOB_COMPLETED, handleJobCompleted);
    socket.on(SocketEvents.RESEARCH_PAUSED, handlePaused);
    socket.on(SocketEvents.RESEARCH_RESUMED, handleResumed);
    socket.on(SocketEvents.RESEARCH_CANCELLED, handleCancelled);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SocketEvents.RESEARCH_NODE_STARTED, handleNodeStarted);
      socket.off(SocketEvents.RESEARCH_NODE_COMPLETED, handleNodeCompleted);
      socket.off(SocketEvents.RESEARCH_JOB_COMPLETED, handleJobCompleted);
      socket.off(SocketEvents.RESEARCH_PAUSED, handlePaused);
      socket.off(SocketEvents.RESEARCH_RESUMED, handleResumed);
      socket.off(SocketEvents.RESEARCH_CANCELLED, handleCancelled);
      if (socket.connected) {
        socket.emit('unsubscribe', [room]);
      }
    };
  }, [socket, researchRunId]);

  return {
    completedNodes,
    currentNode,
    status,
    error,
  };
}
