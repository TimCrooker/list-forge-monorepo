import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  ResearchActivityType,
  ResearchActivityStatus,
  AgentOperationType,
  OperationEventType,
} from '@listforge/core-types';
import { ItemResearchRun } from './item-research-run.entity';
import { Item } from '../../items/entities/item.entity';

/**
 * ResearchActivityLog Entity
 *
 * Stores granular activity events emitted during research execution.
 * These logs provide a detailed, immutable history of all research activities
 * and are streamed to the frontend via WebSocket for real-time monitoring.
 *
 * Supports both legacy flat events and new operation-based events via operationId.
 */
@Entity('research_activity_logs')
@Index(['researchRunId', 'timestamp'])
@Index(['itemId', 'timestamp'])
@Index(['researchRunId', 'operationId'])
export class ResearchActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  researchRunId: string;

  @ManyToOne(() => ItemResearchRun, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'researchRunId' })
  researchRun: ItemResearchRun;

  @Column()
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  /**
   * Operation ID - groups related events for the same logical operation
   * All events with the same operationId belong to one collapsible widget in the UI
   */
  @Column({ type: 'uuid', nullable: true })
  operationId: string | null;

  /**
   * Operation type - determines which renderer to use in the UI
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  operationType: AgentOperationType | null;

  /**
   * Event type within the operation lifecycle
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  eventType: OperationEventType | null;

  /**
   * Short title for display in the operation header
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  /**
   * Legacy type field - kept for backward compatibility
   * @deprecated Use operationType and eventType instead
   */
  @Column({ type: 'varchar', length: 50 })
  type: ResearchActivityType;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20 })
  status: ResearchActivityStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stepId: string | null;

  @CreateDateColumn()
  timestamp: Date;
}
