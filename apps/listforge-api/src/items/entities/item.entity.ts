import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ItemStatus } from '@listforge/core-types';
import { Organization } from '../../organizations/entities/organization.entity';
import { ItemPhoto } from './item-photo.entity';
import { MetaListing } from '../../meta-listings/entities/meta-listing.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: ['draft', 'ready', 'listed', 'sold', 'archived'],
    default: 'draft',
  })
  status: ItemStatus;

  @Column({ nullable: true })
  title: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ItemPhoto, (photo) => photo.item, { cascade: true })
  photos: ItemPhoto[];

  @OneToOne(() => MetaListing, (metaListing) => metaListing.item, {
    cascade: true,
    nullable: true,
  })
  metaListing: MetaListing;
}

