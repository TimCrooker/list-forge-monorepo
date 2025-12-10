import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../constants';
import { store } from '../store';
import { SocketEvents, Rooms } from '@listforge/socket-types';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;

    const token = store.getState().auth.token;
    if (!token) {
      console.error('Cannot connect socket: no auth token');
      this.isConnecting = false;
      return null;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Subscribe to rooms
  subscribe(rooms: string[]) {
    if (!this.socket?.connected) {
      this.connect();
    }
    this.socket?.emit('subscribe', rooms);
  }

  // Unsubscribe from rooms
  unsubscribe(rooms: string[]) {
    this.socket?.emit('unsubscribe', rooms);
  }

  // Join a chat room
  joinChatRoom(sessionId: string) {
    this.subscribe([Rooms.chatSession(sessionId)]);
  }

  // Leave a chat room
  leaveChatRoom(sessionId: string) {
    this.unsubscribe([Rooms.chatSession(sessionId)]);
  }

  // Join an item room for research updates
  joinItemRoom(itemId: string) {
    this.subscribe([Rooms.item(itemId)]);
  }

  // Leave an item room
  leaveItemRoom(itemId: string) {
    this.unsubscribe([Rooms.item(itemId)]);
  }

  // Subscribe to a research run room
  joinResearchRunRoom(researchRunId: string) {
    this.subscribe([Rooms.researchRun(researchRunId)]);
  }

  // Leave a research run room
  leaveResearchRunRoom(researchRunId: string) {
    this.unsubscribe([Rooms.researchRun(researchRunId)]);
  }

  // Send chat message
  sendChatMessage(sessionId: string, content: string) {
    this.socket?.emit('chat_message', {
      sessionId,
      content,
    });
  }

  // Event listeners using proper SocketEvents constants
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  // Remove listeners
  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

export const socketService = new SocketService();
