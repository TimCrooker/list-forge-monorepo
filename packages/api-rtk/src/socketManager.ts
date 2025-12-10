import { io, Socket } from 'socket.io-client';

/**
 * Singleton Socket Manager
 * Manages a single WebSocket connection shared across multiple components
 * Implements reference counting to prevent premature disconnection
 */
class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private refCount = 0;
  private apiBaseUrl: string;
  private connecting = false;
  private connectPromise: Promise<Socket> | null = null;

  private constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  /**
   * Connect to the chat namespace
   * Returns existing socket if already connected, otherwise creates new connection
   * Increments reference count
   */
  async connect(): Promise<Socket> {
    this.refCount++;

    // If socket exists and is connected, return it
    if (this.socket?.connected) {
      return this.socket;
    }

    // If currently connecting, wait for that connection
    if (this.connecting && this.connectPromise) {
      return this.connectPromise;
    }

    // Create new socket connection
    this.connecting = true;
    this.connectPromise = this.createSocket();

    try {
      const socket = await this.connectPromise;
      this.connecting = false;
      return socket;
    } catch (error) {
      this.connecting = false;
      this.connectPromise = null;
      throw error;
    }
  }

  /**
   * Create and configure socket instance
   */
  private async createSocket(): Promise<Socket> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    this.socket = io(`${this.apiBaseUrl}/chat`, {
      auth: {
        token,
      },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    // Connect and wait for connection event
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket creation failed'));
        return;
      }

      const socket = this.socket;

      const onConnect = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        resolve(socket);
      };

      const onConnectError = (error: Error) => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        reject(error);
      };

      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);

      socket.connect();

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!socket.connected) {
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          reject(new Error('Socket connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Decrement reference count and disconnect if no more references
   */
  disconnect(): void {
    this.refCount = Math.max(0, this.refCount - 1);

    // Only actually disconnect if no components are using the socket
    if (this.refCount === 0 && this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectPromise = null;
    }
  }

  /**
   * Force disconnect regardless of reference count
   * Useful for logout or critical errors
   */
  forceDisconnect(): void {
    this.refCount = 0;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectPromise = null;
    }
  }

  /**
   * Get current socket instance (if connected)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Manually reconnect
   */
  async reconnect(): Promise<Socket> {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      return new Promise((resolve, reject) => {
        const socket = this.socket!;

        const onConnect = () => {
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          resolve(socket);
        };

        const onConnectError = (error: Error) => {
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          reject(error);
        };

        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);

        setTimeout(() => {
          if (!socket.connected) {
            socket.off('connect', onConnect);
            socket.off('connect_error', onConnectError);
            reject(new Error('Reconnection timeout'));
          }
        }, 10000);
      });
    }

    // If no socket or already connected, use connect method
    return this.connect();
  }

  /**
   * Get current reference count (for debugging)
   */
  getRefCount(): number {
    return this.refCount;
  }
}

export default SocketManager;
