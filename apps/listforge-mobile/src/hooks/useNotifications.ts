import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '../services/notificationService';
import { useRegisterDeviceTokenMutation } from '../services/api';

/**
 * Hook to manage push notifications
 *
 * Handles:
 * - Requesting permissions
 * - Getting device token
 * - Registering token with backend
 * - Notification listeners
 */
export function useNotifications() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerDeviceToken] = useRegisterDeviceTokenMutation();

  useEffect(() => {
    let mounted = true;

    const initializeNotifications = async () => {
      try {
        // Initialize notification service and get token
        const token = await notificationService.initialize();

        if (!mounted) return;

        if (token) {
          setDeviceToken(token);

          // Register token with backend
          try {
            await registerDeviceToken({
              token,
              platform: Platform.OS as 'ios' | 'android',
            }).unwrap();

            if (mounted) {
              setIsRegistered(true);
            }
          } catch (err) {
            console.error('Failed to register device token with backend:', err);
            if (mounted) {
              setError('Failed to register for push notifications');
            }
          }
        } else {
          if (mounted) {
            setError('Could not get push notification token');
          }
        }
      } catch (err) {
        console.error('Notification initialization error:', err);
        if (mounted) {
          setError('Failed to initialize notifications');
        }
      }
    };

    initializeNotifications();

    // Cleanup
    return () => {
      mounted = false;
      notificationService.cleanup();
    };
  }, [registerDeviceToken]);

  return {
    deviceToken,
    isRegistered,
    error,
  };
}
