import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Rooms } from '@listforge/socket-types';

interface SocketAuthPayload {
  userId: string;
  globalRole: string;
  currentOrgId: string | null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Handle client connection
   * Validates JWT token and auto-joins user to their org room
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Socket connection rejected: no token provided');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const secret = this.configService.get<string>('JWT_SECRET') || 'dev-secret';
      const payload = this.jwtService.verify<SocketAuthPayload>(token, { secret });

      // Load user to verify they exist and aren't disabled
      const user = await this.userRepo.findOne({
        where: { id: payload.userId },
      });

      if (!user || user.disabled) {
        this.logger.warn(`Socket connection rejected: invalid user ${payload.userId}`);
        client.disconnect();
        return;
      }

      // Store user info on socket
      client.data.userId = payload.userId;
      client.data.currentOrgId = payload.currentOrgId;
      client.data.globalRole = payload.globalRole;

      // Auto-join user to their organization room
      if (payload.currentOrgId) {
        client.join(Rooms.org(payload.currentOrgId));
        this.logger.log(`User ${payload.userId} connected and joined org room ${Rooms.org(payload.currentOrgId)}`);
      }

      // Also join user-specific room
      client.join(Rooms.user(payload.userId));
    } catch (error) {
      this.logger.error('Socket connection error:', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data.userId || 'unknown'}`);
  }

  /**
   * Handle room subscription requests from client
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, rooms: string | string[]) {
    const roomArray = Array.isArray(rooms) ? rooms : [rooms];
    roomArray.forEach((room) => {
      client.join(room);
      this.logger.debug(`Client ${client.data.userId} subscribed to room: ${room}`);
    });
    return { success: true, rooms: roomArray };
  }

  /**
   * Handle room unsubscription requests from client
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, rooms: string | string[]) {
    const roomArray = Array.isArray(rooms) ? rooms : [rooms];
    roomArray.forEach((room) => {
      client.leave(room);
      this.logger.debug(`Client ${client.data.userId} unsubscribed from room: ${room}`);
    });
    return { success: true, rooms: roomArray };
  }
}
