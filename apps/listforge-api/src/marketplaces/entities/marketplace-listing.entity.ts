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
import { MetaListing } from '../../meta-listings/entities/meta-listing.entity';
import { MarketplaceAccount } from './marketplace-account.entity';

@Entity('marketplace_listings')
export class MarketplaceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  metaListingId: string;

  @ManyToOne(() => MetaListing)
  @JoinColumn({ name: 'metaListingId' })
  metaListing: MetaListing;

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
    enum: ['draft', 'pending', 'live', 'ended', 'sold', 'error'],
    default: 'pending',
  })
  status: MarketplaceListingStatus;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'URL to the listing on the marketplace',
  })
  url: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Current price on marketplace',
  })
  price: number | null;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

