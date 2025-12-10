import '../nativewind-env.d.ts';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

import { store, RootState } from './src/store';
import { setCredentials } from './src/store/slices/authSlice';
import { setOnlineStatus, setPendingCount } from './src/store/slices/syncSlice';
import { STORAGE_KEYS } from './src/constants';
import Navigation from './src/navigation';
import { db } from './src/services/database';
import { syncService } from './src/services/syncService';
import { useNotifications } from './src/hooks/useNotifications';
import { initializeSentry, setSentryUser } from './src/config/sentry';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Initialize Sentry as early as possible
initializeSentry();

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);

  // Initialize push notifications (only after authentication)
  useNotifications();

  useEffect(() => {
    // Initialize app
    async function initializeApp() {
      try {
        // Initialize database
        await db.init();
        console.log('Database initialized');

        // Load stored credentials
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        const userId = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ID);

        if (token && userId) {
          dispatch(setCredentials({ token, userId }));
          // Set Sentry user context
          setSentryUser(userId);
        }

        // Get initial pending count
        const stats = await db.getStorageStats();
        dispatch(setPendingCount(stats.captureCount));

        // Start background sync
        await syncService.startBackgroundSync();
        console.log('Background sync started');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
      }
    }

    initializeApp();

    // Cleanup on unmount
    return () => {
      db.close();
      syncService.stopBackgroundSync();
    };
  }, [dispatch]);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? false;

      dispatch(setOnlineStatus(isNowOnline));

      // Trigger sync when coming back online
      if (wasOffline && isNowOnline && isAuthenticated) {
        console.log('Network restored, triggering sync');
        syncService.syncAll();
      }
    });

    return () => unsubscribe();
  }, [dispatch, isOnline, isAuthenticated]);

  if (!isReady) {
    return null; // Or a splash screen
  }

  return (
    <>
      <Navigation isAuthenticated={isAuthenticated} />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppContent />
        </GestureHandlerRootView>
      </Provider>
    </ErrorBoundary>
  );
}
