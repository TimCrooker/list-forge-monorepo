import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Undo, RefreshCw } from 'lucide-react-native';
import SwipeCard from '../components/review/SwipeCard';
import { useGetItemsQuery } from '../services/api';

interface ReviewAction {
  itemId: string;
  action: 'approve' | 'reject';
}

export default function ReviewScreen() {
  const { data: items, isLoading, refetch } = useGetItemsQuery(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<ReviewAction[]>([]);

  // Filter items that need review (AI reviewed but not user reviewed)
  const itemsToReview =
    items?.filter(
      (item: any) =>
        item.aiReviewState === 'ai_reviewed' &&
        item.lifecycleStatus === 'draft'
    ) || [];

  const handleSwipeLeft = (itemId: string) => {
    console.log('Rejected:', itemId);
    setHistory((prev) => [...prev, { itemId, action: 'reject' }]);
    setCurrentIndex((prev) => prev + 1);

    // TODO: Call API to mark item as rejected
    // api.rejectItem(itemId);
  };

  const handleSwipeRight = (itemId: string) => {
    console.log('Approved:', itemId);
    setHistory((prev) => [...prev, { itemId, action: 'approve' }]);
    setCurrentIndex((prev) => prev + 1);

    // TODO: Call API to approve item
    // api.approveItem(itemId);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleRefresh = () => {
    setCurrentIndex(0);
    setHistory([]);
    refetch();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-600 mt-4">Loading items...</Text>
      </SafeAreaView>
    );
  }

  if (itemsToReview.length === 0 || currentIndex >= itemsToReview.length) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
        {/* Header */}
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Review</Text>
          <Text className="text-gray-600">
            {itemsToReview.length === 0
              ? 'No items to review'
              : 'All caught up!'}
          </Text>
        </View>

        {/* Empty State */}
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-6xl mb-4">🎉</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {itemsToReview.length === 0
              ? 'No Items Yet'
              : 'All Done!'}
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            {itemsToReview.length === 0
              ? 'Capture some items to get started'
              : 'You\'ve reviewed all items. Check back later for more.'}
          </Text>

          <TouchableOpacity
            className="bg-primary-600 px-6 py-3 rounded-lg flex-row items-center"
            onPress={handleRefresh}
          >
            <RefreshCw color="white" size={20} />
            <Text className="text-white font-semibold ml-2">Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = itemsToReview[currentIndex];
  const nextItem = itemsToReview[currentIndex + 1];

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 z-10">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Review</Text>
            <Text className="text-gray-600">
              {currentIndex + 1} of {itemsToReview.length}
            </Text>
          </View>

          <View className="flex-row gap-2">
            {history.length > 0 && (
              <TouchableOpacity
                className="bg-gray-200 px-4 py-2 rounded-lg flex-row items-center"
                onPress={handleUndo}
              >
                <Undo color="#374151" size={20} />
                <Text className="text-gray-700 font-semibold ml-2">Undo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="bg-gray-200 p-2 rounded-lg"
              onPress={handleRefresh}
            >
              <RefreshCw color="#374151" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Card Stack */}
      <View className="flex-1 p-4">
        {/* Next card (background) */}
        {nextItem && (
          <View className="absolute inset-4 top-8">
            <SwipeCard
              item={nextItem}
              onSwipeLeft={() => {}}
              onSwipeRight={() => {}}
              isTopCard={false}
            />
          </View>
        )}

        {/* Current card (foreground) */}
        <SwipeCard
          key={currentItem.id}
          item={currentItem}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isTopCard={true}
        />
      </View>
    </SafeAreaView>
  );
}

