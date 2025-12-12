import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * ToolEffectiveness Entity - Slice 10 (Learning Loop)
 *
 * Aggregates tool performance metrics over time periods.
 * Used for calibrating tool confidence weights based on actual outcomes.
 */
@Entity('tool_effectiveness')
@Index(['toolType', 'periodStart'])
@Index(['organizationId', 'periodStart'])
@Unique(['organizationId', 'toolType', 'periodStart', 'periodEnd'])
export class ToolEffectiveness {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Organization ID (null for global stats across all orgs)',
  })
  organizationId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Tool type identifier (e.g., upc_lookup, web_search, vision_analysis)',
  })
  toolType: string;

  @Column({
    type: 'date',
    comment: 'Start of the measurement period',
  })
  periodStart: Date;

  @Column({
    type: 'date',
    comment: 'End of the measurement period',
  })
  periodEnd: Date;

  // ============================================================================
  // Usage Metrics
  // ============================================================================

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total number of times this tool was used',
  })
  totalUses: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Number of times tool contributed to successful sale',
  })
  contributedToSale: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Number of times tool contributed to returned item',
  })
  contributedToReturn: number;

  // ============================================================================
  // Accuracy Metrics
  // ============================================================================

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    default: 0,
    comment: 'Sum of price deviation ratios for averaging',
  })
  totalPriceDeviationSum: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Count of price accuracy measurements',
  })
  priceAccuracyCount: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Count of correct identifications',
  })
  identificationCorrectCount: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total identification attempts',
  })
  identificationTotalCount: number;

  // ============================================================================
  // Confidence Calibration
  // ============================================================================

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
    comment: 'Sum of confidence scores when tool was used',
  })
  confidenceWhenUsedSum: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Count of confidence measurements',
  })
  confidenceWhenUsedCount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
    comment: 'Sum of actual accuracy scores',
  })
  actualAccuracySum: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    comment: 'Calibration score: how well confidence predicts actual accuracy',
  })
  calibrationScore: number | null;

  // ============================================================================
  // Weight Adjustment
  // ============================================================================

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 1.0,
    comment: 'Current weight multiplier for this tool',
  })
  currentWeight: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    comment: 'Suggested weight based on calibration analysis',
  })
  suggestedWeight: number | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When weights were last calibrated',
  })
  lastCalibrated: Date | null;

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
