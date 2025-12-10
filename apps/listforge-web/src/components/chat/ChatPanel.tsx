import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  useCreateChatSessionMutation,
  useGetChatMessagesQuery,
  useChatSocket,
  useGetItemQuery,
} from '@listforge/api-rtk';
import { ChatMessageDto } from '@listforge/api-types';
import { Button } from '@listforge/ui';
import { Send, Loader2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ResearchStatus } from './ResearchStatus';
import { ChatPanelSkeleton } from './ChatPanelSkeleton';
import { ComponentErrorBoundary } from '../common/ComponentErrorBoundary';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { FoundryAvatar } from '../foundry';
import { useChatContext } from '../../hooks/useChatContext';

interface ChatPanelProps {
  itemId?: string;
  itemTitle?: string | null;
}

type AvatarState = 'idle' | 'listening' | 'thinking' | 'typing' | 'error';

export function ChatPanel({ itemId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Collect current page context for context-aware responses
  const context = useChatContext();

  // Create or get session
  const [createSession, { isLoading: isCreatingSession }] = useCreateChatSessionMutation();

  // Get messages for session
  const { data: messagesData, refetch: refetchMessages } = useGetChatMessagesQuery(
    { itemId: itemId!, sessionId: sessionId! },
    {
      skip: !sessionId || !itemId,
    },
  );

  // Handle incoming messages from WebSocket
  const handleSocketMessage = useCallback((message: ChatMessageDto) => {
    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        // Update existing message
        const updated = [...prev];
        updated[existingIndex] = message;
        return updated;
      }

      // Replace optimistic message if this is the real user message
      if (message.role === 'user') {
        const tempIndex = prev.findIndex((m) => m.id.startsWith('temp-') && m.content === message.content);
        if (tempIndex >= 0) {
          const updated = [...prev];
          updated[tempIndex] = message;
          return updated;
        }
      }

      // Clear waiting state when we get assistant response
      if (message.role === 'assistant') {
        setIsWaitingForResponse(false);
      }

      // Append new message
      return [...prev, message];
    });
  }, []);

  // WebSocket hook for streaming and actions
  const {
    streamingContent,
    sendMessage,
    isConnected,
    connectionState,
    error: socketError,
    applyAction,
    activeResearchJobId,
    activeTools,
    reconnect,
  } = useChatSocket(sessionId, handleSocketMessage);

  // Get item query for refreshing on action apply
  const { refetch: refetchItem } = useGetItemQuery(itemId!, { skip: !itemId });

  // Initialize session on mount
  useEffect(() => {
    if (!itemId) return;

    const initSession = async () => {
      try {
        const result = await createSession({
          itemId,
          data: { itemId },
        }).unwrap();
        setSessionId(result.session.id);
      } catch (error) {
        console.error('Failed to create chat session:', error);
      }
    };

    initSession();
  }, [itemId, createSession]);

  // Load messages once when data arrives
  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Clear messages when session changes
  useEffect(() => {
    if (sessionId) {
      setMessages([]);
    }
  }, [sessionId]);

  // Clear waiting state when streaming starts or tools appear
  useEffect(() => {
    if (streamingContent || activeTools.length > 0) {
      setIsWaitingForResponse(false);
    }
  }, [streamingContent, activeTools.length]);

  // Event-driven avatar state logic - responds to backend events
  useEffect(() => {
    // Priority 1: Error state (highest priority)
    if (socketError) {
      setAvatarState('error');
      return;
    }

    // Priority 2: Typing state (streaming response)
    if (streamingContent) {
      setAvatarState('typing');
      return;
    }

    // Priority 3: Thinking state (tools executing)
    if (activeTools.length > 0) {
      setAvatarState('thinking');
      return;
    }

    // Priority 4: Listening state (waiting for response)
    if (isWaitingForResponse) {
      setAvatarState('listening');
      return;
    }

    // Default: Idle state
    setAvatarState('idle');
  }, [socketError, streamingContent, activeTools.length, isWaitingForResponse]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isWaitingForResponse, activeTools.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;
    if (!isConnected) {
      console.error('Cannot send message: not connected');
      return;
    }

    const content = inputValue.trim();
    setInputValue('');
    setIsWaitingForResponse(true);

    // Add optimistic user message immediately for instant feedback
    const optimisticMessage: ChatMessageDto = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Send message with rich context for context-aware responses
      const result = await sendMessage(content, {
        pageType: context.pageType,
        currentRoute: context.currentRoute,
        itemId: context.itemId,
        activeTab: context.activeTab,
        activeModal: context.activeModal,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      // On error, remove optimistic message and restore input
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Failed to send message:', errorMessage);
      setInputValue(content);
      setIsWaitingForResponse(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyAction = async (messageId: string, actionIndex: number) => {
    if (!applyAction) return;
    try {
      await applyAction(messageId, actionIndex);
      refetchItem();
      refetchMessages();
    } catch (error) {
      console.error('Failed to apply action:', error);
    }
  };

  const isLoading = isCreatingSession || !sessionId;
  const isSending = streamingContent.length > 0;
  const isConnecting = connectionState === 'connecting';

  return (
    <ComponentErrorBoundary context="chat">
      <div className="flex flex-col h-full">
        {/* Connection status bar */}
        {sessionId && !isConnected && (
          <div className="px-4 py-2 bg-muted/50 border-b">
            <ConnectionStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
              onReconnect={reconnect}
            />
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!itemId ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mx-auto mb-4">
                  <FoundryAvatar state={avatarState} size="lg" mode="dark" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Foundry Assistant
                </p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Navigate to an item page to chat about specific items
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 p-4">
              <ChatPanelSkeleton />
            </div>
          ) : messages.length === 0 && !streamingContent ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mx-auto mb-4">
                  <FoundryAvatar state={avatarState} size="lg" mode="dark" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Ask me anything about this item!
                </p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  I can help with pricing, descriptions, categories, and more.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              role="log"
              aria-live="polite"
              aria-busy={isSending}
              aria-label="Chat messages"
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onApplyAction={handleApplyAction}
                />
              ))}

              {/* Waiting for response indicator */}
              {isWaitingForResponse && !streamingContent && activeTools.length === 0 && (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 mt-1">
                    <FoundryAvatar state={avatarState} size="sm" mode="dark" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-muted/70">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                      <span className="text-muted-foreground">Processing your message...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tool progress indicators */}
              {activeTools.length > 0 && (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 mt-1">
                    <FoundryAvatar state={avatarState} size="sm" mode="dark" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-muted/70">
                    <div className="flex flex-col gap-1">
                      {activeTools.map((tool) => (
                        <div key={tool.toolName} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                          <span className="text-muted-foreground">
                            {tool.displayName || tool.toolName}
                            {tool.message && `: ${tool.message}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming content with typing indicator */}
              {streamingContent && (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 mt-1">
                    <FoundryAvatar state={avatarState} size="sm" mode="dark" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-muted">
                    <div className="text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none">
                      <ReactMarkdown>{streamingContent}</ReactMarkdown>
                      <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {socketError && (
                <div className="flex gap-2 justify-start">
                  <div className="shrink-0 mt-1">
                    <FoundryAvatar state={avatarState} size="sm" mode="dark" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-destructive/10 text-destructive border border-destructive/20">
                    <p className="text-sm font-medium mb-1">Error</p>
                    <p className="text-sm">{socketError}</p>
                    {!isConnected && (
                      <button
                        onClick={reconnect}
                        className="mt-2 text-xs underline hover:no-underline"
                      >
                        Try reconnecting
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Research status */}
              {activeResearchJobId && (
                <div className="mt-2">
                  <ResearchStatus researchRunId={activeResearchJobId} itemId={itemId} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !isConnected
                  ? 'Connecting...'
                  : 'Ask about pricing, condition...'
              }
              className="flex-1 px-4 py-2.5 text-sm border rounded-full bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || isSending || !isConnected}
              aria-label="Chat message input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || isSending || !isConnected}
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}
