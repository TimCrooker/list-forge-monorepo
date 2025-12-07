import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ResearchRunType, ResearchRunStatus } from '@listforge/core-types';
import { Item } from '../../items/entities/item.entity';

/**
 * ItemResearchRun Entity - Phase 6 Sub-Phase 8
 *
 * Represents a single research session executed against an Item.
 * Allows storing multiple research passes over time as a research cache and timeline.
 */
@Entity('item_research_runs')
@Index(['itemId', 'startedAt'])
export class ItemResearchRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({ type: 'varchar', length: 30 })
  runType: ResearchRunType;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: ResearchRunStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pipelineVersion: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currentNode: string | null;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  // ============================================================================
  // Phase 7 Slice 4: Checkpointing Support
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true, name: 'checkpoint' })
  checkpoint: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0, name: 'step_count' })
  stepCount: number;

  @Column({ type: 'jsonb', nullable: true, name: 'step_history' })
  stepHistory: Array<{
    node: string;
    startedAt: string;
    completedAt?: string;
    status: 'running' | 'success' | 'error';
    error?: string;
  }> | null;
}
