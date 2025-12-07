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

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // Normalize rooms to array
    const roomArray = Array.isArray(rooms) ? rooms : [rooms];

    // Subscribe to rooms (socket.io queues if not yet connected)
    socket.emit('subscribe', roomArray);

    // Cleanup: unsubscribe on unmount
    return () => {
      socket.emit('unsubscribe', roomArray);
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

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('subscribe', [room]);

    return () => {
      socket.emit('unsubscribe', [room]);
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

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('subscribe', [room]);

    return () => {
      socket.emit('unsubscribe', [room]);
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

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('subscribe', [room]);

    return () => {
      socket.emit('unsubscribe', [room]);
    };
  }, [socket, itemId]);
}
