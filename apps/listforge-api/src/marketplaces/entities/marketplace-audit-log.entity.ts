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
import { MarketplaceAccount } from './marketplace-account.entity';

/**
 * Marketplace Audit Event Types
 *
 * Tracks all significant lifecycle events for marketplace accounts
 */
export type MarketplaceAuditEventType =
  | 'account:connected'        // New marketplace account connected via OAuth
  | 'account:disconnected'     // Account manually disconnected by user
  | 'account:revoked'          // Account revoked (same as disconnected, kept for clarity)
  | 'token:refreshed'          // OAuth tokens successfully refreshed
  | 'token:refresh_failed'     // Token refresh attempt failed
  | 'token:expired'            // Token marked as expired by monitoring service
  | 'token:expiring_soon'      // Warning emitted for token expiring within 24h
  | 'webhook:received'         // Webhook event received from marketplace
  | 'webhook:verified'         // Webhook signature verification succeeded
  | 'webhook:rejected'         // Webhook signature verification failed
  | 'listing:published'        // Listing successfully published to marketplace
  | 'listing:updated'          // Listing updated on marketplace
  | 'listing:sync_failed';     // Listing sync/publish failed

/**
 * MarketplaceAuditLog Entity
 *
 * Immutable audit log for all marketplace account lifecycle events.
 * Provides forensic trail for debugging, compliance, and security monitoring.
 *
 * Design principles:
 * - Immutable: No updates after creation, only inserts
 * - Comprehensive: Captures all significant events with context
 * - Queryable: Indexed for efficient retrieval by org, user, account, and time
 * - Secure: Redacts sensitive data (tokens, credentials) before storage
 *
 * @see Phase 4.1: Audit Logging for Account Lifecycle
 */
@Entity('marketplace_audit_logs')
@Index(['orgId', 'timestamp'])
@Index(['accountId', 'timestamp'])
@Index(['userId', 'timestamp'])
@Index(['eventType', 'timestamp'])
export class MarketplaceAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Organization that owns this account
   */
  @Column()
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  /**
   * User who triggered this event (if applicable)
   * Null for system-initiated events (e.g., auto-refresh, expiration monitoring)
   */
  @Column({ nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /**
   * Marketplace account this event relates to (if applicable)
   * Null for events not tied to a specific account
   */
  @Column({ nullable: true })
  accountId: string | null;

  @ManyToOne(() => MarketplaceAccount, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'accountId' })
  account: MarketplaceAccount | null;

  /**
   * Marketplace type (EBAY, AMAZON, etc.)
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  marketplace: string | null;

  /**
   * Event type - determines what action occurred
   */
  @Column({ type: 'varchar', length: 50 })
  eventType: MarketplaceAuditEventType;

  /**
   * Human-readable event message
   * Examples:
   * - "eBay account connected successfully"
   * - "Token refresh failed: refresh token expired"
   * - "Webhook received: ITEM_SOLD"
   */
  @Column({ type: 'text' })
  message: string;

  /**
   * Additional structured metadata about the event
   * Examples:
   * - { remoteAccountId: "ebay_user_123", scopes: ["..."] }
   * - { error: "invalid_grant", errorDescription: "..." }
   * - { webhookType: "ITEM_SOLD", listingId: "..." }
   *
   * IMPORTANT: Never store sensitive data (tokens, passwords, etc.) in metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

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
   * Timestamp when this event occurred
   * Automatically set on creation
   */
  @CreateDateColumn()
  timestamp: Date;
}
