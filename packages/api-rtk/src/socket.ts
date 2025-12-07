import { io, Socket } from 'socket.io-client';

/**
 * API Base URL for Socket.IO connection
 * Uses the same base URL as the REST API
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Get or create the Socket.IO client instance
 *
 * The socket is a singleton - only one connection is maintained.
 * It will automatically reconnect if disconnected.
 */
export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    socket = io(API_BASE_URL, {
      auth: {
        token,
      },
      autoConnect: false, // We'll connect manually when needed
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // Update auth on reconnect to ensure we have the latest token
      reconnectionDelayMax: 5000,
    });

    // Update auth token on reconnect attempt
    socket.on('reconnect_attempt', () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (currentToken && socket) {
        socket.auth = { token: currentToken };
      }
    });

    // Update auth token when it changes (cross-tab)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'auth_token' && socket) {
          const newToken = e.newValue;
          socket.auth = { token: newToken };
          if (newToken && socket.disconnected) {
            socket.connect();
          } else if (!newToken && socket.connected) {
            socket.disconnect();
          }
        }
      });
    }
  }
  return socket;
}

/**
 * Update the socket's authentication token
 * Call this when the user logs in or the token is refreshed
 */
export function updateSocketAuth(token: string | null): void {
  const socket = getSocket();
  socket.auth = { token };

  if (token && socket.disconnected) {
    socket.connect();
  } else if (!token && socket.connected) {
    socket.disconnect();
  }
}

/**
 * Disconnect and cleanup the socket instance
 * Useful for testing or when logging out
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
