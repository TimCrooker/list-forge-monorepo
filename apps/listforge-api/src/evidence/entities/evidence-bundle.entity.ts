import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { ItemResearchRun } from '../../research/entities/item-research-run.entity';
import { EvidenceItem } from './evidence-item.entity';

/**
 * EvidenceBundle Entity
 *
 * Phase 6: Links to Item and ItemResearchRun for proper research history tracking.
 */
@Entity('evidence_bundles')
@Index(['itemId'])
@Index(['researchRunId'])
export class EvidenceBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  itemId: string | null;

  @ManyToOne(() => Item, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'itemId' })
  item: Item | null;

  @Column({ nullable: true })
  researchRunId: string | null;

  @ManyToOne(() => ItemResearchRun, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'researchRunId' })
  researchRun: ItemResearchRun;

  @OneToMany(() => EvidenceItem, (item) => item.bundle, { cascade: true })
  items: EvidenceItem[];

  @CreateDateColumn()
  generatedAt: Date;
}
