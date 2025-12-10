import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export function useChatSocket(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const streamingMessageRef = useRef<string>('');
  const streamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Connect socket and join chat room
    const socket = socketService.connect();
    if (!socket) return;

    setIsConnected(socketService.isConnected());

    socketService.joinChatRoom(sessionId);

    // Handle connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Handle chat messages
    const handleChatMessage = (data: any) => {
      const newMessage: ChatMessage = {
        id: data.id || `msg-${Date.now()}`,
        role: data.role || 'assistant',
        content: data.content,
        timestamp: data.timestamp || Date.now(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);
    };

    // Handle streaming chunks
    const handleChatMessageChunk = (data: any) => {
      if (data.type === 'start') {
        // Start new streaming message
        streamingIdRef.current = data.messageId || `msg-${Date.now()}`;
        streamingMessageRef.current = '';
        setIsTyping(true);

        setMessages((prev) => [
          ...prev,
          {
            id: streamingIdRef.current!,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isStreaming: true,
          },
        ]);
      } else if (data.type === 'chunk') {
        // Append chunk to streaming message
        streamingMessageRef.current += data.content;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingIdRef.current
              ? { ...msg, content: streamingMessageRef.current }
              : msg
          )
        );
      } else if (data.type === 'end') {
        // Finalize streaming message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingIdRef.current
              ? { ...msg, isStreaming: false }
              : msg
          )
        );

        streamingIdRef.current = null;
        streamingMessageRef.current = '';
        setIsTyping(false);
      }
    };

    socketService.on('chat_message', handleChatMessage);
    socketService.on('chat_message_chunk', handleChatMessageChunk);

    // Cleanup
    return () => {
      socketService.leaveChatRoom(sessionId);
      socketService.off('chat_message', handleChatMessage);
      socketService.off('chat_message_chunk', handleChatMessageChunk);
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      }
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Send to server
      socketService.sendChatMessage(sessionId, content.trim());
      setIsTyping(true);
    },
    [sessionId]
  );

  return {
    messages,
    isConnected,
    isTyping,
    sendMessage,
  };
}
