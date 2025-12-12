import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Tool Debugger Audit Event Types
 */
export type ToolDebuggerAuditEventType =
  | 'tool:executed'     // Tool executed successfully
  | 'tool:failed'       // Tool execution failed
  | 'tool:validation_error'; // Tool input validation failed

/**
 * ToolDebuggerAuditLog Entity
 *
 * Immutable audit log for all tool debugger executions.
 * Tracks who tested what tool, when, and with what results.
 *
 * Design principles:
 * - Immutable: No updates after creation, only inserts
 * - Comprehensive: Captures full execution context
 * - Queryable: Indexed for efficient retrieval
 */
@Entity('tool_debugger_audit_logs')
@Index(['orgId', 'timestamp'])
@Index(['userId', 'timestamp'])
@Index(['toolName', 'timestamp'])
@Index(['eventType', 'timestamp'])
export class ToolDebuggerAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Organization context for this execution
   */
  @Column()
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  /**
   * User who executed the tool
   */
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Name of the tool that was executed
   */
  @Column({ type: 'varchar', length: 100 })
  toolName: string;

  /**
   * Category of the tool
   */
  @Column({ type: 'varchar', length: 30 })
  toolCategory: string;

  /**
   * Event type - determines what happened
   */
  @Column({ type: 'varchar', length: 30 })
  eventType: ToolDebuggerAuditEventType;

  /**
   * Item ID that was used for the execution (if applicable)
   */
  @Column({ nullable: true })
  itemId: string | null;

  /**
   * Inputs provided to the tool (sanitized)
   */
  @Column({ type: 'jsonb' })
  inputs: Record<string, unknown>;

  /**
   * Whether the execution was successful
   */
  @Column()
  success: boolean;

  /**
   * Execution time in milliseconds
   */
  @Column()
  executionTimeMs: number;

  /**
   * Error message if execution failed
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /**
   * Validation errors if input validation failed
   */
  @Column({ type: 'jsonb', nullable: true })
  validationErrors: Array<{ path: string[]; message: string }> | null;

  /**
   * IP address of the user
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  /**
   * User-Agent header
   */
  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  /**
   * Timestamp when this event occurred
   */
  @CreateDateColumn()
  timestamp: Date;
}
