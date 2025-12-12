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

/**
 * Settings Types
 *
 * All organization settings types that can be versioned
 */
export type SettingsType =
  | 'workflow'
  | 'notification'
  | 'team'
  | 'inventory'
  | 'marketplaceDefaults'
  | 'billing'
  | 'security'
  | 'autoPublish'
  | 'autoApproval'
  | 'research';

/**
 * SettingsVersion Entity
 *
 * Stores snapshots of organization settings for version history and revert capability.
 * Each settings type maintains up to 5 versions (pruned on each new write).
 *
 * Design principles:
 * - Full snapshots (not diffs) for easy revert without reconstruction
 * - Rolling 5-version limit per settings type per organization
 * - Reverts create new versions to maintain audit trail
 * - Immutable after creation
 */
@Entity('settings_versions')
@Index(['orgId', 'settingsType', 'versionNumber'])
@Index(['orgId', 'settingsType', 'createdAt'])
export class SettingsVersion {
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
   * Type of settings this version represents
   */
  @Column({ type: 'varchar', length: 30 })
  settingsType: SettingsType;

  /**
   * Sequential version number for this settings type
   * Incremented on each save, including reverts
   */
  @Column({ type: 'integer' })
  versionNumber: number;

  /**
   * Full snapshot of settings at this version
   * Stored as JSONB for efficient querying and indexing
   */
  @Column({ type: 'jsonb' })
  settingsSnapshot: Record<string, unknown>;

  /**
   * User who created this version (if applicable)
   * Null for system-initiated changes
   */
  @Column({ nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /**
   * Whether this version was created by reverting to a previous version
   */
  @Column({ type: 'boolean', default: false })
  isRevert: boolean;

  /**
   * If this is a revert, the version ID that was reverted to
   */
  @Column({ nullable: true })
  revertedFromVersionId: string | null;

  /**
   * If this is a revert, the reason provided by the user
   * Required for all reverts (min 10 characters)
   */
  @Column({ type: 'text', nullable: true })
  revertReason: string | null;

  /**
   * Timestamp when this version was created
   */
  @CreateDateColumn()
  createdAt: Date;
}
