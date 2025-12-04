import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { MarketplaceListing } from './marketplace-listing.entity';
import { MarketplaceAccountSettings } from '@listforge/core-types';

export type MarketplaceType = 'EBAY' | 'AMAZON';

export type MarketplaceAccountStatus = 'active' | 'expired' | 'revoked' | 'error';

@Entity('marketplace_accounts')
export class MarketplaceAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['EBAY', 'AMAZON'],
  })
  marketplace: MarketplaceType;

  @Column({
    type: 'text',
    comment: 'Encrypted OAuth access token',
  })
  accessToken: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Encrypted OAuth refresh token',
  })
  refreshToken: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  tokenExpiresAt: Date | null;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Remote account/user ID from marketplace',
  })
  remoteAccountId: string | null;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'revoked', 'error'],
    default: 'active',
  })
  status: MarketplaceAccountStatus;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Marketplace-specific settings and config',
  })
  settings: MarketplaceAccountSettings | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MarketplaceListing, (listing) => listing.marketplaceAccount)
  listings: MarketplaceListing[];
}

