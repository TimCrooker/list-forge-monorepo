import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MarketplaceListingStatus } from '@listforge/core-types';
import { Item } from '../../items/entities/item.entity';
import { MarketplaceAccount } from './marketplace-account.entity';

/**
 * MarketplaceListing Entity - Phase 6
 *
 * Represents how a given Item is configured/listed on a specific marketplace.
 * Links to unified Item model.
 * Supports divergence: marketplace-specific overrides are allowed.
 */
@Entity('marketplace_listings')
export class MarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemId: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  marketplaceAccountId: string;

  @ManyToOne(() => MarketplaceAccount, (account) => account.listings)
  @JoinColumn({ name: 'marketplaceAccountId' })
  marketplaceAccount: MarketplaceAccount;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Remote listing ID from marketplace (e.g., eBay item ID)',
  })
  remoteListingId: string | null;

  @Column({
    type: 'enum',
    enum: ['not_listed', 'listing_pending', 'listed', 'ended', 'sold', 'error'],
    default: 'not_listed',
  })
  status: MarketplaceListingStatus;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'URL to the listing on the marketplace',
  })
  url: string | null;

  // ============================================================================
  // Divergence Fields (Marketplace-specific overrides)
  // ============================================================================

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Marketplace-specific title override',
  })
  title: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Marketplace-specific description override',
  })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Marketplace-specific price (can diverge from Item.defaultPrice)',
  })
  price: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Marketplace-specific category ID',
  })
  marketplaceCategoryId: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Marketplace-specific attributes mapping',
  })
  marketplaceAttributes: Record<string, string | number | boolean> | null;

  // ============================================================================
  // Auto-Publish Tracking (Slice 7)
  // ============================================================================

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this listing was auto-published by the system',
  })
  autoPublished: boolean;

  // ============================================================================
  // Sync & Error Tracking
  // ============================================================================

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Last time status was synced from marketplace',
  })
  lastSyncedAt: Date | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Error message if status is error',
  })
  errorMessage: string | null;

  // ============================================================================
  // Sales Outcome Tracking (Slice 10 - Learning Loop)
  // ============================================================================

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Actual price item sold for (may differ from listing price due to offers)',
  })
  soldPrice: number | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When item was sold',
  })
  soldAt: Date | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Original listing price when first published (for price change tracking)',
  })
  originalListPrice: number | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When item was returned (if applicable)',
  })
  returnedAt: Date | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Reason for return if applicable',
  })
  returnReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

