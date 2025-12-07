import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ItemResearchData } from '@listforge/core-types';
import { Item } from '../../items/entities/item.entity';
import { ItemResearchRun } from './item-research-run.entity';

/**
 * ItemResearch Entity - Phase 7 Slice 1
 *
 * Stores structured research conclusions separately from evidence.
 * Each research record contains pricing recommendations, demand signals,
 * product identification, and missing information hints.
 */
@Entity('item_research')
@Index(['itemId', 'createdAt'])
export class ItemResearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column('uuid', { nullable: true })
  researchRunId?: string;

  @ManyToOne(() => ItemResearchRun, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'researchRunId' })
  researchRun?: ItemResearchRun;

  @Column('jsonb')
  data: ItemResearchData;

  @Column('varchar', { length: 20, default: '1.0.0' })
  schemaVersion: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('boolean', { default: true })
  isCurrent: boolean; // Only one research per item should be current
}
