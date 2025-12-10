import React from 'react';
import { View, Text } from 'react-native';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function SyncStatusBadge() {
  const { isOnline, isSyncing, pendingCount } = useSelector(
    (state: RootState) => state.sync
  );

  if (!isOnline) {
    return (
      <View className="flex-row items-center bg-gray-500 px-3 py-2 rounded-full">
        <WifiOff color="white" size={16} />
        <Text className="text-white text-sm ml-2 font-medium">
          Offline ({pendingCount} pending)
        </Text>
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View className="flex-row items-center bg-blue-500 px-3 py-2 rounded-full">
        <RefreshCw color="white" size={16} />
        <Text className="text-white text-sm ml-2 font-medium">
          Syncing...
        </Text>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <View className="flex-row items-center bg-orange-500 px-3 py-2 rounded-full">
        <RefreshCw color="white" size={16} />
        <Text className="text-white text-sm ml-2 font-medium">
          {pendingCount} pending
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center bg-green-500 px-3 py-2 rounded-full">
      <Check color="white" size={16} />
      <Text className="text-white text-sm ml-2 font-medium">
        Synced
      </Text>
    </View>
  );
}
