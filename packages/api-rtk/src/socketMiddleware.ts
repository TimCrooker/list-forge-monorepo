import { Middleware } from '@reduxjs/toolkit';
import { getSocket, updateSocketAuth, disconnectSocket } from './socket';
import { api } from './api';
import {
  SocketEvents,
  ItemUpdatedPayload,
  ItemReviewStatusPayload,
  ItemDeletedPayload,
} from '@listforge/socket-types';

/**
 * RTK Query middleware that listens to Socket.IO events
 * and updates the cache accordingly
 *
 * Phase 6: Updated to handle Item events instead of ListingDraft events.
 *
 * This middleware:
 * - Listens for socket events
 * - Invalidates or updates RTK Query cache entries
 * - Ensures UI stays in sync with backend changes
 */
export const socketMiddleware: Middleware = (store) => {
  const socket = getSocket();

  // Connect socket when middleware is initialized, but only if we have a token
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token && !socket.connected) {
    socket.connect();
  }

  // Handle item updated events
  socket.on(
    SocketEvents.ITEM_UPDATED,
    (payload: ItemUpdatedPayload) => {
      const { item } = payload;

      // Invalidate the specific item query and list queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.dispatch(api.util.invalidateTags([{ type: 'Item', id: item.id }]) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.dispatch(api.util.invalidateTags(['Item']) as any);
    },
  );

  // Handle item review status changes
  socket.on(
    SocketEvents.ITEM_REVIEW_STATUS,
    (payload: ItemReviewStatusPayload) => {
      const { id } = payload;

      // Invalidate the specific item query and list queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.dispatch(api.util.invalidateTags([{ type: 'Item', id }, 'Item']) as any);
    },
  );

  // Handle item review queue changes
  socket.on(
    SocketEvents.ITEM_REVIEW_QUEUE_CHANGED,
    () => {
      // Invalidate review queue and item list queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.dispatch(api.util.invalidateTags(['Item']) as any);
    },
  );

  // Handle item created - invalidate lists
  socket.on(
    SocketEvents.ITEM_CREATED,
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.dispatch(api.util.invalidateTags(['Item']) as any);
    },
  );

  // Handle item deleted
  socket.on(
    SocketEvents.ITEM_DELETED,
    (payload: ItemDeletedPayload) => {
      // Invalidate the specific item and all list queries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.dispatch(api.util.invalidateTags([{ type: 'Item', id: payload.id }, 'Item']) as any);
    },
  );

  return (next) => (action) => {
    // Handle auth state changes to update socket connection
    // Check if action type matches auth actions (setCredentials, logout, etc.)
    // We check the action type string to avoid importing auth slice (circular dependency)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionType = (action as any)?.type as string | undefined;
    if (actionType?.includes('/setCredentials') || actionType?.includes('/setCurrentOrg')) {
      // User logged in or switched org - update socket auth
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (currentToken) {
        updateSocketAuth(currentToken);
      }
    } else if (actionType?.includes('/logout')) {
      // User logged out - disconnect socket
      disconnectSocket();
    }

    return next(action);
  };
};
