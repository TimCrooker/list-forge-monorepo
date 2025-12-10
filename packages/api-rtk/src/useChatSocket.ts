import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { SocketEvents } from '@listforge/socket-types';
import type {
  ChatMessagePayload,
  ChatTokenPayload,
  ChatErrorPayload,
  ChatActionAppliedPayload,
  ChatActionSuggestedPayload,
  ChatResearchStartedPayload,
  ChatResearchCompletedPayload,
  ChatToolProgressPayload,
} from '@listforge/socket-types';
import { ChatMessageDto } from '@listforge/api-types';
import SocketManager from './socketManager';

/**
 * Tool progress state for displaying what the agent is doing
 */
export interface ToolProgress {
  toolName: string;
  displayName?: string;
  status: 'starting' | 'completed' | 'error';
  message?: string;
  timestamp: string;
}

/**
 * React hook to manage chat WebSocket connection and streaming
 *
 * Handles:
 * - Session joining via singleton socket manager
 * - Message sending with acknowledgments
 * - Token streaming
 * - Message receiving via callbacks
 * - Action application (Phase 7 Slice 6)
 *
 * @param sessionId - Chat session ID, or null to disable
 * @param onMessage - Callback when a message is received
 *
 * @example
 * ```tsx
 * function ChatPanel({ sessionId }) {
 *   const { streamingContent, sendMessage, isConnected } = useChatSocket(
 *     sessionId,
 *     (message) => setMessages(prev => [...prev, message])
 *   );
 *   return <div>{streamingContent}</div>;
 * }
 * ```
 */
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SuggestedAction {
  id: string;
  type: string;
  label: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  autoExecute?: boolean;
  payload: Record<string, unknown>;
}

export function useChatSocket(
  sessionId: string | null,
  onMessage?: (message: ChatMessageDto) => void
) {
  const [streamingContent, setStreamingContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [activeResearchJobId, setActiveResearchJobId] = useState<string | null>(null);
  const [activeTools, setActiveTools] = useState<ToolProgress[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const socketManager = useRef(SocketManager.getInstance());
  const sessionJoinedRef = useRef(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 1000; // 1 second

  // Rate limiting - token bucket algorithm
  const messageTokens = useRef(5); // Start with 5 tokens
  const lastRefillTime = useRef(Date.now());
  const MAX_MESSAGE_TOKENS = 5; // Maximum 5 messages in burst
  const REFILL_RATE_MS = 2000; // Refill 1 token every 2 seconds

  // Initialize socket connection
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let mounted = true;
    setConnectionState('connecting');

    const connectSocket = async () => {
      try {
        const socket = await socketManager.current.connect();

        if (!mounted) {
          socketManager.current.disconnect();
          return;
        }

        socketRef.current = socket;

        setIsConnected(socket.connected);
        setConnectionState(socket.connected ? 'connected' : 'connecting');

        // Join session room
        if (socket.connected && !sessionJoinedRef.current) {
          socket.emit('join_session', { sessionId });
          sessionJoinedRef.current = true;
        }

        // Handle connection
        const handleConnect = () => {
          if (!mounted) return;
          setIsConnected(true);
          setConnectionState('connected');
          setError(null);

          // Reset reconnection attempts on successful connection
          reconnectAttempts.current = 0;
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          // Join session room on connect/reconnect
          if (!sessionJoinedRef.current) {
            socket.emit('join_session', { sessionId });
            sessionJoinedRef.current = true;
          }
        };

        // Handle disconnection with automatic reconnection
        const handleDisconnect = () => {
          if (!mounted) return;
          setIsConnected(false);
          setConnectionState('disconnected');
          sessionJoinedRef.current = false;

          // Attempt automatic reconnection with exponential backoff
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current);
            reconnectAttempts.current += 1;

            setConnectionState('connecting');
            setError(`Connection lost. Reconnecting... (Attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              if (mounted && socketRef.current) {
                socketRef.current.connect();
              }
            }, delay);
          } else {
            setConnectionState('error');
            setError('Connection lost. Please refresh the page or click reconnect.');
          }
        };

        // Handle connection error
        const handleConnectError = (err: Error) => {
          if (!mounted) return;
          setError(err.message);
          setIsConnected(false);
          setConnectionState('error');
        };

        // Handle reconnection attempt
        const handleReconnectAttempt = () => {
          if (!mounted) return;
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
          if (!mounted || payload.sessionId !== sessionId) return;

          // Call onMessage callback if provided
          if (onMessage) {
            onMessage(payload.message);
          }

          // Clear streaming content when we receive assistant message
          if (payload.message.role === 'assistant') {
            setStreamingContent('');
          }
        };

        // Handle chat:error event
        const handleError = (payload: ChatErrorPayload) => {
          if (!mounted || payload.sessionId !== sessionId) return;
          setError(payload.error);
          setStreamingContent('');
        };

        // Handle chat:action_applied event (Phase 7 Slice 6)
        const handleActionApplied = (payload: ChatActionAppliedPayload) => {
          if (!mounted || payload.sessionId !== sessionId) return;
          // Action applied - the message will be updated via chat:message event
          if (!payload.success && payload.error) {
            setError(payload.error);
          }
        };

        // Handle chat:research_started event (Phase 7 Slice 7)
        const handleResearchStarted = (payload: ChatResearchStartedPayload) => {
          if (!mounted || payload.sessionId !== sessionId) return;
          setActiveResearchJobId(payload.researchRunId);
          setError(null);
        };

        // Handle chat:research_completed event (Phase 7 Slice 7)
        const handleResearchCompleted = (payload: ChatResearchCompletedPayload) => {
          if (!mounted || payload.sessionId !== sessionId) return;
          setActiveResearchJobId(null);
          if (payload.status === 'error' && payload.error) {
            setError(`Research failed: ${payload.error}`);
          } else {
            setError(null);
          }
        };

        // Handle chat:tool_progress event - streams tool execution updates
        const handleToolProgress = (payload: ChatToolProgressPayload) => {
          if (!mounted || payload.sessionId !== sessionId) return;

          const toolProgress: ToolProgress = {
            toolName: payload.toolName,
            displayName: payload.displayName,
            status: payload.status,
            message: payload.message,
            timestamp: payload.timestamp,
          };

          if (payload.status === 'starting') {
            // Add tool to active list
            setActiveTools((prev) => [...prev.filter(t => t.toolName !== payload.toolName), toolProgress]);
          } else if (payload.status === 'completed' || payload.status === 'error') {
            // Remove tool from active list after a brief delay
            setTimeout(() => {
              setActiveTools((prev) => prev.filter(t => t.toolName !== payload.toolName));
            }, 500);
          }
        };

        // Handle chat:action_suggested event - real-time action streaming
        const handleActionSuggested = (payload: ChatActionSuggestedPayload) => {
          if (!mounted || payload.sessionId !== sessionId) return;

          const action: SuggestedAction = {
            id: payload.action.id,
            type: payload.action.type,
            label: payload.action.label,
            description: payload.action.description,
            priority: payload.action.priority,
            autoExecute: payload.action.autoExecute,
            payload: payload.action.payload,
          };

          // Add action to suggested actions list
          setSuggestedActions((prev) => [...prev, action]);
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
        socket.on(SocketEvents.CHAT_ACTION_SUGGESTED, handleActionSuggested);
        socket.on(SocketEvents.CHAT_RESEARCH_STARTED, handleResearchStarted);
        socket.on(SocketEvents.CHAT_RESEARCH_COMPLETED, handleResearchCompleted);
        socket.on(SocketEvents.CHAT_TOOL_PROGRESS, handleToolProgress);

        // If already connected, trigger handleConnect
        if (socket.connected) {
          handleConnect();
        }

        // Cleanup
        return () => {
          mounted = false;

          // Clear any pending reconnection timeouts
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('connect_error', handleConnectError);
          socket.off('reconnect_attempt', handleReconnectAttempt);
          socket.off(SocketEvents.CHAT_TOKEN, handleToken);
          socket.off(SocketEvents.CHAT_MESSAGE, handleMessage);
          socket.off(SocketEvents.CHAT_ERROR, handleError);
          socket.off(SocketEvents.CHAT_ACTION_APPLIED, handleActionApplied);
          socket.off(SocketEvents.CHAT_ACTION_SUGGESTED, handleActionSuggested);
          socket.off(SocketEvents.CHAT_RESEARCH_STARTED, handleResearchStarted);
          socket.off(SocketEvents.CHAT_RESEARCH_COMPLETED, handleResearchCompleted);
          socket.off(SocketEvents.CHAT_TOOL_PROGRESS, handleToolProgress);

          // Disconnect from socket manager (decrements ref count)
          socketManager.current.disconnect();
          socketRef.current = null;
          sessionJoinedRef.current = false;
          reconnectAttempts.current = 0;
        };
      } catch (error) {
        if (!mounted) return;
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        setError(errorMessage);
        setConnectionState('error');
        setIsConnected(false);
      }
    };

    connectSocket();

    return () => {
      mounted = false;
    };
  }, [sessionId, onMessage]);

  // Send message function with acknowledgment support
  const sendMessage = useCallback(
    (
      content: string,
      context?: {
        pageType?: string;
        currentRoute?: string;
        itemId?: string;
        activeTab?: string;
        activeModal?: string;
      }
    ): Promise<SendMessageResult> => {
      return new Promise((resolve, reject) => {
        if (!sessionId || !socketRef.current || !isConnected) {
          reject(new Error('Socket not connected or session not available'));
          return;
        }

        // Rate limiting check - refill tokens based on time elapsed
        const now = Date.now();
        const timeSinceLastRefill = now - lastRefillTime.current;
        const tokensToAdd = Math.floor(timeSinceLastRefill / REFILL_RATE_MS);

        if (tokensToAdd > 0) {
          messageTokens.current = Math.min(
            MAX_MESSAGE_TOKENS,
            messageTokens.current + tokensToAdd
          );
          lastRefillTime.current = now;
        }

        // Check if we have tokens available
        if (messageTokens.current <= 0) {
          const waitTime = REFILL_RATE_MS - (timeSinceLastRefill % REFILL_RATE_MS);
          reject(new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before sending another message.`));
          return;
        }

        // Consume a token
        messageTokens.current -= 1;

        // Clear previous streaming content, error, and suggested actions
        setStreamingContent('');
        setError(null);
        setSuggestedActions([]);

        let timeoutId: NodeJS.Timeout | null = null;
        let resolved = false;

        // Timeout after 30 seconds
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Message send timeout'));
          }
        }, 30000);

        // Build payload with optional context
        const payload: {
          sessionId: string;
          content: string;
          context?: {
            pageType?: string;
            currentRoute?: string;
            itemId?: string;
            activeTab?: string;
            activeModal?: string;
          };
        } = {
          sessionId,
          content,
        };

        if (context) {
          payload.context = context;
        }

        // Send message via socket with acknowledgment
        socketRef.current.emit(
          'send_message',
          payload,
          (response: any) => {
            // Clear timeout on response
            if (timeoutId) clearTimeout(timeoutId);

            if (resolved) return; // Already timed out
            resolved = true;

            // Handle acknowledgment from server
            if (response?.success) {
              resolve({
                success: true,
                messageId: response.messageId,
              });
            } else {
              const errorMsg = response?.error || 'Failed to send message';
              setError(errorMsg);
              reject(new Error(errorMsg));
            }
          }
        );
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

        let timeoutId: NodeJS.Timeout | null = null;
        let resolved = false;

        // Set up one-time listener for the response
        const handleResponse = (payload: ChatActionAppliedPayload) => {
          if (payload.messageId === messageId && payload.actionIndex === actionIndex) {
            // Cleanup
            if (timeoutId) clearTimeout(timeoutId);
            socketRef.current?.off(SocketEvents.CHAT_ACTION_APPLIED, handleResponse);

            if (resolved) return; // Already timed out
            resolved = true;

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
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            socketRef.current?.off(SocketEvents.CHAT_ACTION_APPLIED, handleResponse);
            reject(new Error('Action application timed out'));
          }
        }, 10000);
      });
    },
    [sessionId, isConnected],
  );

  // Reconnect function
  const reconnect = useCallback(async () => {
    setConnectionState('connecting');
    setError(null);
    sessionJoinedRef.current = false;
    reconnectAttempts.current = 0; // Reset attempts on manual reconnect

    // Clear any pending auto-reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const socket = await socketManager.current.reconnect();
      socketRef.current = socket;

      if (socket.connected && sessionId) {
        socket.emit('join_session', { sessionId });
        sessionJoinedRef.current = true;
        setIsConnected(true);
        setConnectionState('connected');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reconnection failed';
      setError(errorMessage);
      setConnectionState('error');
    }
  }, [sessionId]);

  return {
    streamingContent,
    sendMessage,
    isConnected,
    connectionState,
    error,
    applyAction,
    activeResearchJobId,
    activeTools,
    suggestedActions,
    reconnect,
    clearStreaming: () => setStreamingContent(''),
    clearTools: () => setActiveTools([]),
    clearSuggestedActions: () => setSuggestedActions([]),
  };
}
