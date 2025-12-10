import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../../users/entities/user.entity';
import { SettingsType } from './settings-version.entity';

/**
 * Settings Audit Event Types
 *
 * Tracks all significant settings change events
 */
export type SettingsAuditEventType =
  | 'settings:created'      // Initial settings created (first version)
  | 'settings:updated'      // Settings updated by user
  | 'settings:reverted'     // Settings reverted to previous version
  | 'settings:admin_update'; // Settings updated by ListForge admin

/**
 * Field Diff
 *
 * Represents a single field change with before/after values
 */
export interface FieldDiff {
  /** Field name (leaf property name) */
  field: string;
  /** Full path to field (e.g., "ebay.listingDurationDays") */
  path: string;
  /** Previous value (null if field was added) */
  previousValue: unknown;
  /** New value (null if field was removed) */
  newValue: unknown;
}

/**
 * SettingsAuditLog Entity
 *
 * Immutable audit log for all organization settings changes.
 * Provides forensic trail with field-level diffs for debugging, compliance, and rollback.
 *
 * Design principles:
 * - Immutable: No updates after creation, only inserts
 * - Field-level diffs: Computed at write time for fast reads
 * - Comprehensive: Captures all significant events with full context
 * - Queryable: Indexed for efficient retrieval by org, user, type, and time
 */
@Entity('settings_audit_logs')
@Index(['orgId', 'timestamp'])
@Index(['orgId', 'settingsType', 'timestamp'])
@Index(['userId', 'timestamp'])
@Index(['eventType', 'timestamp'])
export class SettingsAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Organization that owns these settings
   */
  @Column()
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  /**
   * User who triggered this event (if applicable)
   * Null for system-initiated events
   */
  @Column({ nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /**
   * Type of settings that changed
   */
  @Column({ type: 'varchar', length: 30 })
  settingsType: SettingsType;

  /**
   * Event type - determines what action occurred
   */
  @Column({ type: 'varchar', length: 30 })
  eventType: SettingsAuditEventType;

  /**
   * Human-readable event message
   * Examples:
   * - "Workflow settings updated"
   * - "Security settings reverted to version 3"
   * - "Notification settings created"
   */
  @Column({ type: 'text' })
  message: string;

  /**
   * Field-level diffs showing exactly what changed
   * Pre-computed at write time for fast reads
   */
  @Column({ type: 'jsonb' })
  fieldDiffs: FieldDiff[];

  /**
   * Reference to the version created by this change (if applicable)
   */
  @Column({ nullable: true })
  versionId: string | null;

  /**
   * IP address of the user who initiated this action
   * Null for system-initiated events
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  /**
   * User-Agent header from the request
   * Helps identify client type (web browser, mobile app, API client)
   */
  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  /**
   * Additional structured metadata about the event
   * Examples:
   * - { revertedFromVersion: 3, revertReason: "..." }
   * - { adminEmail: "admin@listforge.com" }
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /**
   * Timestamp when this event occurred
   */
  @CreateDateColumn()
  timestamp: Date;
}
