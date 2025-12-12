import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { OutcomeQuality, ToolUsageRecord } from '@listforge/core-types';

/**
 * ResearchOutcome Entity - Slice 10 (Learning Loop)
 *
 * Links AI research predictions to actual sales outcomes.
 * Enables tracking accuracy metrics and learning from real-world results.
 */
@Entity('research_outcomes')
@Index(['organizationId', 'createdAt'])
@Index(['outcomeQuality', 'createdAt'])
@Index(['itemId'])
export class ResearchOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: 'Organization that owns this item' })
  organizationId: string;

  @Column({ comment: 'Item this outcome relates to' })
  itemId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Research run that produced the predictions',
  })
  researchRunId: string | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Marketplace listing that sold',
  })
  marketplaceListingId: string | null;

  // ============================================================================
  // Research Predictions (Snapshot at time of research)
  // ============================================================================

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Predicted floor price from research',
  })
  predictedPriceFloor: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Predicted target price from research',
  })
  predictedPriceTarget: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Predicted ceiling price from research',
  })
  predictedPriceCeiling: number | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Category identified by research',
  })
  predictedCategory: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Brand identified by research',
  })
  identifiedBrand: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Model identified by research',
  })
  identifiedModel: string | null;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    comment: 'Overall research confidence (0-1)',
  })
  researchConfidence: number | null;

  @Column({
    type: 'jsonb',
    default: '[]',
    comment: 'Tools used during research with their confidence scores',
  })
  toolsUsed: ToolUsageRecord[];

  // ============================================================================
  // Actual Outcomes
  // ============================================================================

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Price item was listed at',
  })
  listedPrice: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Actual price item sold for',
  })
  soldPrice: number | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When item sold',
  })
  soldAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When item was listed',
  })
  listedAt: Date | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Number of days from listing to sale',
  })
  daysToSell: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Which marketplace the item sold on',
  })
  marketplace: string | null;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether item was returned',
  })
  wasReturned: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Reason for return if applicable',
  })
  returnReason: string | null;

  // ============================================================================
  // Calculated Accuracy Metrics
  // ============================================================================

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    comment: 'Price accuracy ratio: |predicted - actual| / actual (lower is better)',
  })
  priceAccuracyRatio: number | null;

  @Column({
    type: 'boolean',
    nullable: true,
    comment: 'Whether identification (brand/model) was correct',
  })
  identificationCorrect: boolean | null;

  @Column({
    type: 'boolean',
    nullable: true,
    comment: 'Whether sold price was within predicted floor-ceiling range',
  })
  priceWithinBands: boolean | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Overall outcome quality assessment',
  })
  outcomeQuality: OutcomeQuality | null;

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
