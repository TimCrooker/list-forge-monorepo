import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@listforge/socket-types';
import type {
  ChatMessagePayload,
  ChatTokenPayload,
  ChatErrorPayload,
  ChatActionAppliedPayload,
  ChatResearchStartedPayload,
  ChatResearchCompletedPayload,
} from '@listforge/socket-types';

/**
 * API Base URL for Socket.IO connection
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get or create a Socket.IO client instance for the /chat namespace
 */
function getChatSocket(): Socket {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  return io(`${API_BASE_URL}/chat`, {
    auth: {
      token,
    },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    reconnectionDelayMax: 5000,
  });
}

/**
 * React hook to manage chat WebSocket connection and streaming
 *
 * Handles:
 * - Session joining
 * - Message sending
 * - Token streaming
 * - Message receiving
 * - Action application (Phase 7 Slice 6)
 *
 * @param sessionId - Chat session ID, or null to disable
 *
 * @example
 * ```tsx
 * function ChatPanel({ sessionId }) {
 *   const { streamingContent, sendMessage, isConnected, applyAction } = useChatSocket(sessionId);
 *   return <div>{streamingContent}</div>;
 * }
 * ```
 */
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export function useChatSocket(sessionId: string | null) {
  const [streamingContent, setStreamingContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [activeResearchJobId, setActiveResearchJobId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  // Initialize socket
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const socket = getChatSocket();
    socketRef.current = socket;

    // Set initial state
    setConnectionState('connecting');

    // Connect socket
    socket.connect();

    // Handle connection
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setError(null);

      // Join session room
      socket.emit('join_session', { sessionId });
    };

    // Handle disconnection
    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    // Handle connection error
    const handleConnectError = (err: Error) => {
      setError(err.message);
      setIsConnected(false);
      setConnectionState('error');
    };

    // Handle reconnection attempt
    const handleReconnectAttempt = () => {
      setConnectionState('connecting');
    };

    // Handle chat:token event (streaming tokens)
    const handleToken = (payload: ChatTokenPayload) => {
      if (payload.sessionId === sessionId) {
        setStreamingContent((prev) => prev + payload.token);
      }
    };

    // Handle chat:message event (complete message)
    const handleMessage = (payload: ChatMessagePayload) => {
      if (payload.sessionId === sessionId) {
        // Clear streaming content when we receive a complete message
        if (payload.message.role === 'assistant') {
          setStreamingContent('');
          streamingMessageIdRef.current = null;
        }
      }
    };

    // Handle chat:error event
    const handleError = (payload: ChatErrorPayload) => {
      if (payload.sessionId === sessionId) {
        setError(payload.error);
        setStreamingContent('');
        streamingMessageIdRef.current = null;
      }
    };

    // Handle chat:action_applied event (Phase 7 Slice 6)
    const handleActionApplied = (payload: ChatActionAppliedPayload) => {
      if (payload.sessionId === sessionId) {
        // Action applied - the message will be updated via chat:message event
        // This handler can be used for additional UI feedback if needed
        if (!payload.success && payload.error) {
          setError(payload.error);
        }
      }
    };

    // Handle chat:research_started event (Phase 7 Slice 7)
    const handleResearchStarted = (payload: ChatResearchStartedPayload) => {
      if (payload.sessionId === sessionId) {
        setActiveResearchJobId(payload.researchRunId);
        setError(null);
      }
    };

    // Handle chat:research_completed event (Phase 7 Slice 7)
    const handleResearchCompleted = (payload: ChatResearchCompletedPayload) => {
      if (payload.sessionId === sessionId) {
        setActiveResearchJobId(null);
        if (payload.status === 'error' && payload.error) {
          setError(`Research failed: ${payload.error}`);
        } else {
          setError(null);
        }
      }
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on(SocketEvents.CHAT_TOKEN, handleToken);
    socket.on(SocketEvents.CHAT_MESSAGE, handleMessage);
    socket.on(SocketEvents.CHAT_ERROR, handleError);
    socket.on(SocketEvents.CHAT_ACTION_APPLIED, handleActionApplied);
    socket.on(SocketEvents.CHAT_RESEARCH_STARTED, handleResearchStarted);
    socket.on(SocketEvents.CHAT_RESEARCH_COMPLETED, handleResearchCompleted);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off(SocketEvents.CHAT_TOKEN, handleToken);
      socket.off(SocketEvents.CHAT_MESSAGE, handleMessage);
      socket.off(SocketEvents.CHAT_ERROR, handleError);
      socket.off(SocketEvents.CHAT_ACTION_APPLIED, handleActionApplied);
      socket.off(SocketEvents.CHAT_RESEARCH_STARTED, handleResearchStarted);
      socket.off(SocketEvents.CHAT_RESEARCH_COMPLETED, handleResearchCompleted);
      socket.disconnect();
      socketRef.current = null;
      setActiveResearchJobId(null);
    };
  }, [sessionId]);

  // Send message function
  const sendMessage = useCallback(
    (content: string) => {
      if (!sessionId || !socketRef.current || !isConnected) {
        throw new Error('Socket not connected or session not available');
      }

      // Clear previous streaming content
      setStreamingContent('');
      setError(null);

      // Send message via socket
      socketRef.current.emit('send_message', {
        sessionId,
        content,
      });
    },
    [sessionId, isConnected],
  );

  // Apply action function (Phase 7 Slice 6)
  const applyAction = useCallback(
    (messageId: string, actionIndex: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!sessionId || !socketRef.current || !isConnected) {
          reject(new Error('Socket not connected or session not available'));
          return;
        }

        // Set up one-time listener for the response
        const handleResponse = (payload: ChatActionAppliedPayload) => {
          if (payload.messageId === messageId && payload.actionIndex === actionIndex) {
            socketRef.current?.off(SocketEvents.CHAT_ACTION_APPLIED, handleResponse);
            if (payload.success) {
              resolve();
            } else {
              reject(new Error(payload.error || 'Failed to apply action'));
            }
          }
        };

        socketRef.current.on(SocketEvents.CHAT_ACTION_APPLIED, handleResponse);

        // Emit apply_action event
        socketRef.current.emit('apply_action', {
          messageId,
          actionIndex,
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          socketRef.current?.off(SocketEvents.CHAT_ACTION_APPLIED, handleResponse);
          reject(new Error('Action application timed out'));
        }, 10000);
      });
    },
    [sessionId, isConnected],
  );

  // Reconnect function (Phase 7 Slice 8)
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      setConnectionState('connecting');
      setError(null);
      socketRef.current.connect();
    }
  }, []);

  return {
    streamingContent,
    sendMessage,
    isConnected,
    connectionState,
    error,
    applyAction,
    activeResearchJobId,
    reconnect,
    clearStreaming: () => setStreamingContent(''),
  };
}
