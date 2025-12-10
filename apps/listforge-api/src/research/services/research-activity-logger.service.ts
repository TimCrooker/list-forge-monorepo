import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ResearchActivityLog } from '../entities/research-activity-log.entity';
import { EventsGateway } from '../../events/events.gateway';
import { SocketEvents, Rooms } from '@listforge/socket-types';
import {
  ResearchActivityType,
  ResearchActivityStatus,
  AgentOperationType,
  OperationEventType,
  AgentOperationEvent,
} from '@listforge/core-types';

/**
 * Input for logging a legacy research activity
 * @deprecated Use operation-based logging instead
 */
export interface LogActivityInput {
  researchRunId: string;
  itemId: string;
  type: ResearchActivityType;
  message: string;
  metadata?: Record<string, unknown>;
  status: ResearchActivityStatus;
  stepId?: string;
}

/**
 * Input for starting a new operation
 */
export interface StartOperationInput {
  researchRunId: string;
  itemId: string;
  operationType: AgentOperationType;
  title: string;
  message?: string;
  stepId?: string;
  data?: Record<string, unknown>;
}

/**
 * Input for emitting operation progress
 */
export interface OperationProgressInput {
  researchRunId: string;
  itemId: string;
  operationId: string;
  operationType: AgentOperationType;
  message?: string;
  data?: Record<string, unknown>;
  stepId?: string;
}

/**
 * Input for completing an operation
 */
export interface CompleteOperationInput {
  researchRunId: string;
  itemId: string;
  operationId: string;
  operationType: AgentOperationType;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  stepId?: string;
}

/**
 * Input for failing an operation
 */
export interface FailOperationInput {
  researchRunId: string;
  itemId: string;
  operationId: string;
  operationType: AgentOperationType;
  title: string;
  error: string;
  data?: Record<string, unknown>;
  stepId?: string;
}

/**
 * ResearchActivityLoggerService
 *
 * Handles persistence and real-time streaming of research activity events.
 * This service is injected into research graph nodes to log granular activities
 * during research execution.
 *
 * Supports both legacy flat events and new operation-based events.
 * Operation-based events group related activities by operationId for
 * better UI rendering as collapsible widgets.
 */
@Injectable()
export class ResearchActivityLoggerService {
  private readonly logger = new Logger(ResearchActivityLoggerService.name);

  constructor(
    @InjectRepository(ResearchActivityLog)
    private readonly activityLogRepo: Repository<ResearchActivityLog>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ============================================================================
  // Operation-based logging (NEW)
  // ============================================================================

  /**
   * Start a new operation and return its ID
   * Emits a 'started' event for the operation
   */
  async startOperation(input: StartOperationInput): Promise<string> {
    const operationId = uuid();

    await this.logOperationEvent({
      researchRunId: input.researchRunId,
      itemId: input.itemId,
      operationId,
      operationType: input.operationType,
      eventType: 'started',
      title: input.title,
      message: input.message,
      data: input.data,
      stepId: input.stepId,
    });

    return operationId;
  }

  /**
   * Emit a progress event for an operation
   * Use for streaming updates during operation execution
   */
  async emitProgress(input: OperationProgressInput): Promise<void> {
    await this.logOperationEvent({
      researchRunId: input.researchRunId,
      itemId: input.itemId,
      operationId: input.operationId,
      operationType: input.operationType,
      eventType: 'progress',
      title: '', // Progress events don't need title
      message: input.message,
      data: input.data,
      stepId: input.stepId,
    });
  }

  /**
   * Complete an operation successfully
   */
  async completeOperation(input: CompleteOperationInput): Promise<void> {
    await this.logOperationEvent({
      researchRunId: input.researchRunId,
      itemId: input.itemId,
      operationId: input.operationId,
      operationType: input.operationType,
      eventType: 'completed',
      title: input.title,
      message: input.message,
      data: input.data,
      stepId: input.stepId,
    });
  }

  /**
   * Fail an operation with an error
   */
  async failOperation(input: FailOperationInput): Promise<void> {
    await this.logOperationEvent({
      researchRunId: input.researchRunId,
      itemId: input.itemId,
      operationId: input.operationId,
      operationType: input.operationType,
      eventType: 'failed',
      title: input.title,
      message: input.error,
      data: { ...input.data, error: input.error },
      stepId: input.stepId,
    });
  }

  /**
   * Internal method to log an operation event
   */
  private async logOperationEvent(input: {
    researchRunId: string;
    itemId: string;
    operationId: string;
    operationType: AgentOperationType;
    eventType: OperationEventType;
    title: string;
    message?: string;
    data?: Record<string, unknown>;
    stepId?: string;
  }): Promise<ResearchActivityLog> {
    try {
      // Map to legacy type for backward compatibility
      const legacyType = this.mapToLegacyType(input.operationType, input.eventType);
      const legacyStatus = this.mapToLegacyStatus(input.eventType);

      const activityLog = this.activityLogRepo.create({
        researchRunId: input.researchRunId,
        itemId: input.itemId,
        operationId: input.operationId,
        operationType: input.operationType,
        eventType: input.eventType,
        title: input.title || null,
        type: legacyType,
        message: input.message || input.title,
        metadata: input.data || null,
        status: legacyStatus,
        stepId: input.stepId || null,
      });

      const saved = await this.activityLogRepo.save(activityLog);

      // Emit via WebSocket
      const operationEvent: AgentOperationEvent = {
        id: saved.id,
        runId: saved.researchRunId,
        contextId: saved.itemId,
        operationId: saved.operationId!,
        operationType: saved.operationType!,
        eventType: saved.eventType!,
        stepId: saved.stepId || undefined,
        title: saved.title || '',
        message: saved.message,
        data: saved.metadata || undefined,
        timestamp: saved.timestamp.toISOString(),
      };

      this.eventsGateway.server
        .to(Rooms.researchRun(input.researchRunId))
        .emit(SocketEvents.RESEARCH_ACTIVITY, {
          researchRunId: input.researchRunId,
          itemId: input.itemId,
          entry: operationEvent,
        });

      this.logger.debug(
        `Operation event: [${input.operationType}:${input.eventType}] ${input.title} (run: ${input.researchRunId.substring(0, 8)})`,
      );

      return saved;
    } catch (error) {
      this.logger.error('Failed to log operation event:', error);
      throw error;
    }
  }

  /**
   * Map operation type to legacy type for backward compatibility
   */
  private mapToLegacyType(
    operationType: AgentOperationType,
    eventType: OperationEventType,
  ): ResearchActivityType {
    // Map event types
    if (eventType === 'started') return 'step_started';
    if (eventType === 'completed') return 'step_completed';
    if (eventType === 'failed') return 'step_failed';

    // Map operation types for progress events
    switch (operationType) {
      case 'web_search':
        return 'web_search';
      case 'comp_search':
        return 'search_query';
      case 'media_analysis':
        return 'info';
      case 'product_identification':
        return 'product_identified';
      case 'price_calculation':
        return 'price_calculated';
      case 'reasoning':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Map event type to legacy status
   */
  private mapToLegacyStatus(eventType: OperationEventType): ResearchActivityStatus {
    switch (eventType) {
      case 'started':
        return 'processing';
      case 'progress':
        return 'processing';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  }

  // ============================================================================
  // Legacy logging (backward compatibility)
  // ============================================================================

  /**
   * Log a research activity event (legacy format)
   * Persists to database and emits via WebSocket
   * @deprecated Use startOperation, emitProgress, completeOperation instead
   */
  async log(input: LogActivityInput): Promise<ResearchActivityLog> {
    try {
      // Create and persist activity log entry
      const activityLog = this.activityLogRepo.create({
        researchRunId: input.researchRunId,
        itemId: input.itemId,
        type: input.type,
        message: input.message,
        metadata: input.metadata || null,
        status: input.status,
        stepId: input.stepId || null,
      });

      const saved = await this.activityLogRepo.save(activityLog);

      // Emit via WebSocket to research run room
      this.eventsGateway.server
        .to(Rooms.researchRun(input.researchRunId))
        .emit(SocketEvents.RESEARCH_ACTIVITY, {
          researchRunId: input.researchRunId,
          itemId: input.itemId,
          entry: {
            id: saved.id,
            type: saved.type,
            message: saved.message,
            metadata: saved.metadata,
            status: saved.status,
            stepId: saved.stepId,
            timestamp: saved.timestamp.toISOString(),
          },
        });

      this.logger.debug(
        `Activity logged: [${input.type}] ${input.message} (run: ${input.researchRunId.substring(0, 8)})`,
      );

      return saved;
    } catch (error) {
      // Log error but don't fail research execution if logging fails
      this.logger.error('Failed to log activity:', error);
      throw error;
    }
  }

  // ============================================================================
  // Query methods
  // ============================================================================

  /**
   * Get all activity logs for a research run
   * Returns entries sorted by timestamp ascending (oldest first)
   */
  async getActivityLog(researchRunId: string): Promise<ResearchActivityLog[]> {
    return this.activityLogRepo.find({
      where: { researchRunId },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Get all operation events for a research run
   * Returns only events that have an operationId (new format)
   */
  async getOperationEvents(researchRunId: string): Promise<AgentOperationEvent[]> {
    const logs = await this.activityLogRepo.find({
      where: { researchRunId },
      order: { timestamp: 'ASC' },
    });

    // Filter and transform to AgentOperationEvent
    return logs
      .filter((log) => log.operationId && log.operationType && log.eventType)
      .map((log) => ({
        id: log.id,
        runId: log.researchRunId,
        contextId: log.itemId,
        operationId: log.operationId!,
        operationType: log.operationType!,
        eventType: log.eventType!,
        stepId: log.stepId || undefined,
        title: log.title || '',
        message: log.message,
        data: log.metadata || undefined,
        timestamp: log.timestamp.toISOString(),
      }));
  }

  /**
   * Get all activity logs for an item across all research runs
   */
  async getItemActivityLog(itemId: string): Promise<ResearchActivityLog[]> {
    return this.activityLogRepo.find({
      where: { itemId },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Delete all activity logs for a research run
   * Called when research run is deleted (cascade delete handles this automatically)
   */
  async deleteActivityLog(researchRunId: string): Promise<void> {
    await this.activityLogRepo.delete({ researchRunId });
  }
}
