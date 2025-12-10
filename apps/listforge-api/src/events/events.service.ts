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

  // ============================================================================
  // Research Events (Phase 7 Slice 3)
  // ============================================================================

  /**
   * Emit research node started event
   */
  emitResearchNodeStarted(
    researchRunId: string,
    itemId: string,
    organizationId: string,
    node: string,
  ): void {
    const rooms = [
      Rooms.researchRun(researchRunId),
      Rooms.item(itemId),
      Rooms.org(organizationId),
    ];
    const payload: SocketEventPayloads[typeof SocketEvents.RESEARCH_NODE_STARTED] = {
      researchRunId,
      itemId,
      node,
      timestamp: new Date().toISOString(),
    };
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.RESEARCH_NODE_STARTED, payload);
    });
    this.logger.debug(`Emitted research node started: ${node} for run ${researchRunId}`);
  }

  /**
   * Emit research node completed event
   */
  emitResearchNodeCompleted(
    researchRunId: string,
    itemId: string,
    organizationId: string,
    node: string,
    status: 'success' | 'error',
    error?: string,
  ): void {
    const rooms = [
      Rooms.researchRun(researchRunId),
      Rooms.item(itemId),
      Rooms.org(organizationId),
    ];
    const payload: SocketEventPayloads[typeof SocketEvents.RESEARCH_NODE_COMPLETED] = {
      researchRunId,
      itemId,
      node,
      status,
      timestamp: new Date().toISOString(),
      error,
    };
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.RESEARCH_NODE_COMPLETED, payload);
    });
    this.logger.debug(`Emitted research node completed: ${node} (${status}) for run ${researchRunId}`);
  }

  /**
   * Emit research job completed event
   */
  emitResearchJobCompleted(
    researchRunId: string,
    itemId: string,
    organizationId: string,
    status: 'success' | 'error' | 'paused',
    summary?: string,
    error?: string,
  ): void {
    const rooms = [
      Rooms.researchRun(researchRunId),
      Rooms.item(itemId),
      Rooms.org(organizationId),
    ];
    const payload: SocketEventPayloads[typeof SocketEvents.RESEARCH_JOB_COMPLETED] = {
      researchRunId,
      itemId,
      status,
      summary,
      error,
      timestamp: new Date().toISOString(),
    };
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.RESEARCH_JOB_COMPLETED, payload);
    });

    // Note: ChatGateway listens for RESEARCH_JOB_COMPLETED events and notifies chat sessions
    // The connection is made via ChatGateway tracking item sessions and research jobs
    // See ChatGateway.notifyResearchCompleted for the implementation

    this.logger.debug(`Emitted research job completed: ${status} for run ${researchRunId}`);
  }

  /**
   * Emit research paused event
   */
  emitResearchPaused(researchRunId: string, itemId: string, organizationId: string): void {
    const rooms = [
      Rooms.researchRun(researchRunId),
      Rooms.item(itemId),
      Rooms.org(organizationId),
    ];
    const payload: SocketEventPayloads[typeof SocketEvents.RESEARCH_PAUSED] = {
      researchRunId,
      itemId,
      timestamp: new Date().toISOString(),
    };
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.RESEARCH_PAUSED, payload);
    });
    this.logger.debug(`Emitted research paused for run ${researchRunId}`);
  }

  /**
   * Emit research resumed event
   */
  emitResearchResumed(researchRunId: string, itemId: string, organizationId: string): void {
    const rooms = [
      Rooms.researchRun(researchRunId),
      Rooms.item(itemId),
      Rooms.org(organizationId),
    ];
    const payload: SocketEventPayloads[typeof SocketEvents.RESEARCH_RESUMED] = {
      researchRunId,
      itemId,
      timestamp: new Date().toISOString(),
    };
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.RESEARCH_RESUMED, payload);
    });
    this.logger.debug(`Emitted research resumed for run ${researchRunId}`);
  }

  /**
   * Emit research cancelled event
   */
  emitResearchCancelled(researchRunId: string, itemId: string, organizationId: string): void {
    const rooms = [
      Rooms.researchRun(researchRunId),
      Rooms.item(itemId),
      Rooms.org(organizationId),
    ];
    const payload: SocketEventPayloads[typeof SocketEvents.RESEARCH_CANCELLED] = {
      researchRunId,
      itemId,
      timestamp: new Date().toISOString(),
    };
    rooms.forEach((room) => {
      this.gateway.server.to(room).emit(SocketEvents.RESEARCH_CANCELLED, payload);
    });
    this.logger.debug(`Emitted research cancelled for run ${researchRunId}`);
  }
}
