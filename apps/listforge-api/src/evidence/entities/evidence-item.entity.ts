import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EvidenceItemType, EvidenceItemData } from '@listforge/core-types';
import { EvidenceBundle } from './evidence-bundle.entity';

@Entity('evidence_items')
@Index(['bundleId'])
@Index(['type'])
export class EvidenceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bundleId: string;

  @ManyToOne(() => EvidenceBundle, (bundle) => bundle.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bundleId' })
  bundle: EvidenceBundle;

  @Column({ type: 'varchar', length: 30 })
  type: EvidenceItemType;

  @Column({ type: 'jsonb' })
  data: EvidenceItemData;

  @CreateDateColumn()
  createdAt: Date;
}
