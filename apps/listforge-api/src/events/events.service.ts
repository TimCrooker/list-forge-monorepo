import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import {
  Rooms,
  SocketEvents,
  SocketEventPayloads,
} from '@listforge/socket-types';

/**
 * Injectable service for emitting Socket.IO events
 *
 * Any service can inject this to emit real-time events to connected clients.
 * Events are automatically scoped to appropriate rooms (org, entity-specific, etc.)
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private gateway: EventsGateway) {}

  /**
   * Generic emit method - emits an event to a specific room
   */
  emit<T extends keyof SocketEventPayloads>(
    room: string,
    event: T,
    payload: SocketEventPayloads[T],
  ): void {
    this.gateway.server.to(room).emit(event, payload);
    this.logger.debug(`Emitted ${event} to room ${room}`);
  }

  /**
   * Emit to multiple rooms
   */
  emitToRooms<T extends keyof SocketEventPayloads>(
    rooms: string[],
    event: T,
    payload: SocketEventPayloads[T],
  ): void {
    rooms.forEach((room) => {
      this.emit(room, event, payload);
    });
  }

  // ============================================================================
  // Item Events (Phase 6)
  // ============================================================================

  /**
   * Emit item created event (reuses draft payload structure for now)
   */
  emitItemCreated(
    organizationId: string,
    createdByUserId: string,
    item: any,
  ): void {
    this.gateway.server.to(Rooms.org(organizationId)).emit(SocketEvents.ITEM_CREATED, {
      id: item.id,
      organizationId,
      createdByUserId,
      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,
      source: item.source,
      title: item.title,
      defaultPrice: item.defaultPrice,
      currency: item.currency,
      primaryImageUrl: item.primaryImageUrl,
      createdAt: item.createdAt,
    });
  }

  /**
   * Emit item updated event
   */
  emitItemUpdated(item: any): void {
    const rooms = [Rooms.org(item.organizationId), Rooms.item(item.id)];
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.ITEM_UPDATED, { item });
    });
  }

  /**
   * Emit item deleted event
   */
  emitItemDeleted(id: string, organizationId: string): void {
    const rooms = [Rooms.org(organizationId), Rooms.item(id)];
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.ITEM_DELETED, { id, organizationId });
    });
  }

  /**
   * Emit item review status change
   */
  emitItemReviewStatus(
    id: string,
    organizationId: string,
    aiReviewState: string,
    reviewedByUserId?: string | null,
    reviewedAt?: string | null,
  ): void {
    const rooms = [
      Rooms.org(organizationId),
      Rooms.item(id),
      Rooms.reviewQueue(organizationId),
    ];
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.ITEM_REVIEW_STATUS, {
        id,
        organizationId,
        aiReviewState,
        reviewedByUserId,
        reviewedAt,
      });
    });
  }

  /**
   * Emit item review queue changed
   */
  emitItemReviewQueueChanged(
    organizationId: string,
    action: 'added' | 'removed' | 'updated',
    itemId: string,
    item?: any,
  ): void {
    this.gateway.server.to(Rooms.reviewQueue(organizationId)).emit(
      SocketEvents.ITEM_REVIEW_QUEUE_CHANGED,
      {
        organizationId,
        action,
        itemId,
        item,
      },
    );
  }
}
