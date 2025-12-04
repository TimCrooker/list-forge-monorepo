import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  MetaListingAiStatus,
  MetaListingAttributes,
  ShippingOptions,
} from '@listforge/core-types';
import { Item } from '../../items/entities/item.entity';

@Entity('meta_listings')
export class MetaListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  itemId: string;

  @OneToOne(() => Item, (item) => item.metaListing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'complete', 'failed', 'needs_review'],
    default: 'pending',
  })
  aiStatus: MetaListingAiStatus;

  @Column({ nullable: true })
  category: string | null;

  @Column({ nullable: true })
  brand: string | null;

  @Column({ nullable: true })
  model: string | null;

  @Column({ type: 'jsonb', nullable: true })
  attributes: MetaListingAttributes | null;

  @Column({ nullable: true })
  generatedTitle: string | null;

  @Column({ type: 'text', nullable: true })
  generatedDescription: string | null;

  @Column({ type: 'jsonb', nullable: true })
  bulletPoints: string[] | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceSuggested: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax: number | null;

  @Column({ type: 'jsonb', nullable: true })
  shippingOptions: ShippingOptions | null;

  @Column({ type: 'jsonb', nullable: true })
  missingFields: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

