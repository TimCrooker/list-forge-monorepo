import React from 'react';
import { View, Text } from 'react-native';
import { User, Bot } from 'lucide-react-native';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <View className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-2">
          <Bot color="#0ea5e9" size={18} />
        </View>
      )}

      {/* Message Bubble */}
      <View
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-600 rounded-tr-sm'
            : 'bg-gray-100 rounded-tl-sm'
        }`}
      >
        <Text
          className={`text-base ${
            isUser ? 'text-white' : 'text-gray-900'
          } leading-6`}
        >
          {content}
          {isStreaming && <Text className="animate-pulse">▊</Text>}
        </Text>

        {/* Timestamp */}
        <Text
          className={`text-xs mt-1 ${
            isUser ? 'text-primary-100' : 'text-gray-500'
          }`}
        >
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View className="w-8 h-8 rounded-full bg-primary-600 items-center justify-center ml-2">
          <User color="white" size={18} />
        </View>
      )}
    </View>
  );
}
