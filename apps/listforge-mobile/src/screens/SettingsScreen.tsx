import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import {
  LogOut,
  User,
  Bell,
  Database,
  Wifi,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { clearCredentials } from '../store/slices/authSlice';
import { RootState } from '../store';
import { STORAGE_KEYS } from '../constants';
import { db } from '../services/database';
import { socketService } from '../services/socketService';

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const { userId } = useSelector((state: RootState) => state.auth);
  const { pendingCount, isOnline, lastSyncAt } = useSelector(
    (state: RootState) => state.sync
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear secure storage
            await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ID);

            // Disconnect socket
            socketService.disconnect();

            // Clear Redux state
            dispatch(clearCredentials());
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all synced items from local storage. Pending items will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
              await db.cleanupOldSyncedCaptures(oneDayAgo);
              Alert.alert('Success', 'Cache cleared');
            } catch (error) {
              console.error('Clear cache error:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View className="px-4 py-3 bg-white">
          <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        </View>

        {/* Account Section */}
        <View className="mt-4 bg-white">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Account
            </Text>
          </View>

          <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <User color="#6b7280" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">Profile</Text>
              <Text className="text-sm text-gray-500">{userId || 'User'}</Text>
            </View>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        </View>

        {/* Sync Status Section */}
        <View className="mt-4 bg-white">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Sync Status
            </Text>
          </View>

          <View className="px-4 py-4 border-b border-gray-100">
            <View className="flex-row items-center mb-2">
              <Wifi
                color={isOnline ? '#10b981' : '#ef4444'}
                size={20}
              />
              <Text className="text-base font-medium text-gray-900 ml-3">
                Connection Status
              </Text>
            </View>
            <Text className="text-sm text-gray-500 ml-8">
              {isOnline ? 'Connected' : 'Offline'}
            </Text>
          </View>

          <View className="px-4 py-4 border-b border-gray-100">
            <View className="flex-row items-center mb-2">
              <Database color="#6b7280" size={20} />
              <Text className="text-base font-medium text-gray-900 ml-3">
                Pending Items
              </Text>
            </View>
            <Text className="text-sm text-gray-500 ml-8">
              {pendingCount} item{pendingCount !== 1 ? 's' : ''} waiting to sync
            </Text>
          </View>

          {lastSyncAt && (
            <View className="px-4 py-4">
              <View className="flex-row items-center mb-2">
                <Info color="#6b7280" size={20} />
                <Text className="text-base font-medium text-gray-900 ml-3">
                  Last Sync
                </Text>
              </View>
              <Text className="text-sm text-gray-500 ml-8">
                {new Date(lastSyncAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View className="mt-4 bg-white">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Notifications
            </Text>
          </View>

          <TouchableOpacity className="flex-row items-center px-4 py-4">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <Bell color="#6b7280" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">
                Push Notifications
              </Text>
              <Text className="text-sm text-gray-500">
                Get notified when research completes
              </Text>
            </View>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        </View>

        {/* Storage Section */}
        <View className="mt-4 bg-white">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Storage
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center px-4 py-4"
            onPress={handleClearCache}
          >
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <Database color="#6b7280" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">
                Clear Cache
              </Text>
              <Text className="text-sm text-gray-500">
                Remove synced items from local storage
              </Text>
            </View>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View className="mt-4 bg-white mb-4">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              About
            </Text>
          </View>

          <View className="px-4 py-4">
            <Text className="text-base font-medium text-gray-900 mb-1">
              ListForge Mobile
            </Text>
            <Text className="text-sm text-gray-500">Version 1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-4 mb-8">
          <TouchableOpacity
            className="bg-red-500 py-4 rounded-lg flex-row items-center justify-center"
            onPress={handleLogout}
          >
            <LogOut color="white" size={20} />
            <Text className="text-white font-semibold text-base ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

