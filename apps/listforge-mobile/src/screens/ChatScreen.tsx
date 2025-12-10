import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, WifiOff } from 'lucide-react-native';
import ChatMessage from '../components/chat/ChatMessage';
import TypingIndicator from '../components/chat/TypingIndicator';
import ChatInput from '../components/chat/ChatInput';
import { useChatSocket } from '../hooks/useChatSocket';
import { useGetItemsQuery } from '../services/api';

export default function ChatScreen() {
  const { data: items } = useGetItemsQuery(undefined);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // For demo, use a default session ID or create one from selected item
  const sessionId = selectedItemId || 'general-chat';

  const { messages, isConnected, isTyping, sendMessage } = useChatSocket(sessionId);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Select first item if available and no item selected
  useEffect(() => {
    if (!selectedItemId && items && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  const renderMessage = ({ item }: any) => (
    <ChatMessage
      role={item.role}
      content={item.content}
      timestamp={item.timestamp}
      isStreaming={item.isStreaming}
    />
  );

  const renderHeader = () => {
    if (!isConnected) {
      return (
        <View className="bg-red-50 px-4 py-3 flex-row items-center">
          <WifiOff color="#dc2626" size={20} />
          <Text className="text-red-700 ml-2">Disconnected. Retrying...</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <MessageCircle color="#9ca3af" size={64} />
      <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
        Start a Conversation
      </Text>
      <Text className="text-gray-600 text-center mt-2">
        Ask questions about your items, get pricing advice, or chat about anything!
      </Text>

      {/* Suggested prompts */}
      <View className="mt-6 gap-2 w-full">
        <TouchableOpacity
          className="bg-gray-100 px-4 py-3 rounded-lg"
          onPress={() => sendMessage("What's the best price for this item?")}
        >
          <Text className="text-gray-700 text-center">
            What's the best price for this item?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 px-4 py-3 rounded-lg"
          onPress={() => sendMessage('Help me write a better description')}
        >
          <Text className="text-gray-700 text-center">
            Help me write a better description
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 px-4 py-3 rounded-lg"
          onPress={() => sendMessage('How should I list this item?')}
        >
          <Text className="text-gray-700 text-center">
            How should I list this item?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Chat</Text>
        <Text className="text-gray-600">
          {selectedItemId ? 'Item-specific chat' : 'General chat'}
        </Text>
      </View>

      {renderHeader()}

      {/* Messages */}
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={!isConnected} />
    </SafeAreaView>
  );
}

