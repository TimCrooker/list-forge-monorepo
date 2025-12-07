import { useState, useRef, useEffect } from 'react';
import {
  useCreateChatSessionMutation,
  useGetChatMessagesQuery,
  useChatSocket,
  useGetItemQuery,
} from '@listforge/api-rtk';
import { ChatMessageDto } from '@listforge/api-types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@listforge/ui';
import { Send, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { ChatAction } from './ChatAction';
import { ResearchStatus } from './ResearchStatus';
import { ChatPanelSkeleton } from './ChatPanelSkeleton';
import { ComponentErrorBoundary } from '../common/ComponentErrorBoundary';
import { ConnectionStatus } from '../common/ConnectionStatus';

interface ChatPanelProps {
  itemId: string;
  itemTitle?: string | null;
}

export function ChatPanel({ itemId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create or get session
  const [createSession, { isLoading: isCreatingSession }] = useCreateChatSessionMutation();

  // Get messages for session
  const { data: messagesData, refetch: refetchMessages } = useGetChatMessagesQuery(
    { itemId, sessionId: sessionId! },
    { skip: !sessionId },
  );

  // WebSocket hook for streaming and actions
  const {
    streamingContent,
    sendMessage,
    isConnected,
    connectionState,
    error: socketError,
    applyAction,
    activeResearchJobId,
    reconnect,
  } = useChatSocket(sessionId);

  // Get item query for refreshing on action apply
  const { refetch: refetchItem } = useGetItemQuery(itemId, { skip: !itemId });

  // Initialize session on mount
  useEffect(() => {
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

  // Load messages when session is ready or when new messages arrive
  useEffect(() => {
    if (sessionId && messagesData) {
      setMessages(messagesData.messages);
    }
  }, [sessionId, messagesData]);

  // Refetch messages after streaming completes (to get the saved assistant message)
  useEffect(() => {
    if (sessionId && !streamingContent && messages.length > 0) {
      // Small delay to ensure message is saved before refetching
      const timeout = setTimeout(() => {
        refetchMessages();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [sessionId, streamingContent, messages.length, refetchMessages]);

  // Scroll to bottom when messages or streaming content changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const content = inputValue.trim();
    setInputValue('');

    try {
      // Send via WebSocket if connected, otherwise fall back to REST
      if (isConnected) {
        sendMessage(content);
      } else {
        // Fallback to REST API (handled by existing endpoint)
        // For now, we'll just show an error
        console.warn('WebSocket not connected, falling back to REST');
        // TODO: Implement REST fallback if needed
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyAction = async (messageId: string, actionIndex: number) => {
    if (!applyAction) {
      console.error('applyAction not available');
      return;
    }

    try {
      await applyAction(messageId, actionIndex);
      // Refresh item data after successful action
      refetchItem();
      // Refetch messages to get updated action state
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
      <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-base">Item Assistant</CardTitle>
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
            {sessionId && (
              <ConnectionStatus
                isConnected={isConnected}
                isConnecting={isConnecting}
                onReconnect={reconnect}
                className="ml-2"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col space-y-4 pt-0 flex-1 overflow-hidden">
          {isLoading ? (
            <ChatPanelSkeleton />
          ) : messages.length === 0 && !streamingContent ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Ask me anything about this item!
            </p>
            <p className="text-xs text-muted-foreground">
              I can help with pricing, descriptions, categories, and more.
            </p>
          </div>
        ) : (
          <div
            className="space-y-3 flex-1 overflow-y-auto pr-2"
            role="log"
            aria-live="polite"
            aria-busy={isSending}
            aria-label="Chat messages"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.actions.map((action, index) => (
                        <ChatAction
                          key={index}
                          action={action}
                          messageId={message.id}
                          actionIndex={index}
                          onApply={handleApplyAction}
                        />
                      ))}
                    </div>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-muted">
                  <p className="text-sm whitespace-pre-wrap">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {socketError && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-destructive/10 text-destructive">
                  <p className="text-sm">{socketError}</p>
                </div>
              </div>
            )}

            {/* Research status (Phase 7 Slice 7) */}
            {activeResearchJobId && (
              <div className="mt-2">
                <ResearchStatus researchRunId={activeResearchJobId} itemId={itemId} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about pricing, condition, or get suggestions... (Press Enter to send)"
            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading || isSending || !isConnected}
            aria-label="Chat message input"
            aria-describedby="chat-input-hint"
          />
          <span id="chat-input-hint" className="sr-only">
            Press Enter to send message
          </span>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || isSending || !isConnected}
            size="sm"
            className="px-3"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
    </ComponentErrorBoundary>
  );
}
