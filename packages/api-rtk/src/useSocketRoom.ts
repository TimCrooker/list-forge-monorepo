import { useEffect } from 'react';
import { getSocket } from './socket';
import { Rooms } from '@listforge/socket-types';

/**
 * React hook to subscribe to Socket.IO rooms
 *
 * Automatically subscribes when component mounts and unsubscribes on unmount.
 * Re-subscribes if rooms change.
 *
 * @param rooms - Single room string or array of room strings
 *
 * @example
 * ```tsx
 * function ReviewPage() {
 *   const { orgId } = useAuth();
 *   useSocketRoom([Rooms.reviewQueue(orgId), Rooms.org(orgId)]);
 *   // Component will receive events for these rooms
 * }
 * ```
 */
export function useSocketRoom(rooms: string | string[]): void {
  const socket = getSocket();

  useEffect(() => {
    // Only proceed if we have a token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      return;
    }

    // Normalize rooms to array
    const roomArray = Array.isArray(rooms) ? rooms : [rooms];

    // Helper function to subscribe to the rooms
    const subscribeToRooms = () => {
      if (socket.connected) {
        socket.emit('subscribe', roomArray);
      }
    };

    // Ensure token is set before connecting
    if (token) {
      socket.auth = { token };
    }

    // If socket is already connected, subscribe immediately
    if (socket.connected) {
      subscribeToRooms();
    } else if (token) {
      // Only connect if we have a token
      socket.connect();
    }

    // Track socket connection status - subscribe when connected
    const handleConnect = () => {
      subscribeToRooms();
    };

    // Handle connection errors
    const handleConnectError = (error: Error) => {
      console.warn('[useSocketRoom] Socket connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    // Cleanup: unsubscribe on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      if (socket.connected) {
        socket.emit('unsubscribe', roomArray);
      }
    };
  }, [socket, rooms]);
}

/**
 * Convenience hook for subscribing to organization room
 */
export function useOrgRoom(orgId: string | null | undefined): void {
  const socket = getSocket();

  useEffect(() => {
    if (!orgId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;

    const room = Rooms.org(orgId);

    // Helper function to subscribe to the room
    const subscribeToRoom = () => {
      if (socket.connected) {
        socket.emit('subscribe', [room]);
      }
    };

    // Ensure token is set before connecting
    if (token) {
      socket.auth = { token };
    }

    // If socket is already connected, subscribe immediately
    if (socket.connected) {
      subscribeToRoom();
    } else if (token) {
      // Only connect if we have a token
      socket.connect();
    }

    // Track socket connection status - subscribe when connected
    const handleConnect = () => {
      subscribeToRoom();
    };

    // Handle connection errors
    const handleConnectError = (error: Error) => {
      console.warn('[useOrgRoom] Socket connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      if (socket.connected) {
        socket.emit('unsubscribe', [room]);
      }
    };
  }, [socket, orgId]);
}

/**
 * Convenience hook for subscribing to review queue room
 */
export function useReviewQueueRoom(orgId: string | null | undefined): void {
  const socket = getSocket();

  useEffect(() => {
    if (!orgId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;

    const room = Rooms.reviewQueue(orgId);

    // Helper function to subscribe to the room
    const subscribeToRoom = () => {
      if (socket.connected) {
        socket.emit('subscribe', [room]);
      }
    };

    // Ensure token is set before connecting
    if (token) {
      socket.auth = { token };
    }

    // If socket is already connected, subscribe immediately
    if (socket.connected) {
      subscribeToRoom();
    } else if (token) {
      // Only connect if we have a token
      socket.connect();
    }

    // Track socket connection status - subscribe when connected
    const handleConnect = () => {
      subscribeToRoom();
    };

    // Handle connection errors
    const handleConnectError = (error: Error) => {
      console.warn('[useReviewQueueRoom] Socket connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      if (socket.connected) {
        socket.emit('unsubscribe', [room]);
      }
    };
  }, [socket, orgId]);
}

/**
 * Convenience hook for subscribing to an item room
 */
export function useItemRoom(itemId: string | null | undefined): void {
  const socket = getSocket();

  useEffect(() => {
    if (!itemId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;

    const room = Rooms.item(itemId);

    // Helper function to subscribe to the room
    const subscribeToRoom = () => {
      if (socket.connected) {
        socket.emit('subscribe', [room]);
      }
    };

    // Ensure token is set before connecting
    if (token) {
      socket.auth = { token };
    }

    // If socket is already connected, subscribe immediately
    if (socket.connected) {
      subscribeToRoom();
    } else if (token) {
      // Only connect if we have a token
      socket.connect();
    }

    // Track socket connection status - subscribe when connected
    const handleConnect = () => {
      subscribeToRoom();
    };

    // Handle connection errors
    const handleConnectError = (error: Error) => {
      console.warn('[useItemRoom] Socket connection error:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      if (socket.connected) {
        socket.emit('unsubscribe', [room]);
      }
    };
  }, [socket, itemId]);
}
