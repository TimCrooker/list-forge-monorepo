import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { AnomalyType, AnomalySeverity } from '@listforge/core-types';

/**
 * ResearchAnomaly Entity - Slice 10 (Learning Loop)
 *
 * Tracks detected anomalies in research patterns.
 * Enables alerting and investigation of systematic issues.
 */
@Entity('research_anomalies')
@Index(['organizationId', 'resolved', 'detectedAt'])
@Index(['anomalyType', 'severity'])
export class ResearchAnomaly {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: 'Organization where anomaly was detected' })
  organizationId: string;

  @Column({
    type: 'timestamp',
    default: () => 'now()',
    comment: 'When anomaly was detected',
  })
  detectedAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Type of anomaly detected',
  })
  anomalyType: AnomalyType;

  @Column({
    type: 'varchar',
    length: 20,
    comment: 'Severity level of the anomaly',
  })
  severity: AnomalySeverity;

  @Column({
    type: 'text',
    comment: 'Human-readable description of the anomaly',
  })
  description: string;

  @Column({
    type: 'jsonb',
    default: '[]',
    comment: 'Array of item IDs affected by this anomaly',
  })
  affectedItems: string[];

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tool type involved in the anomaly (if applicable)',
  })
  toolType: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Pattern details and statistics',
  })
  pattern: Record<string, unknown> | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Suggested action to resolve the anomaly',
  })
  suggestedAction: string | null;

  // ============================================================================
  // Resolution Tracking
  // ============================================================================

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether the anomaly has been resolved',
  })
  resolved: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When the anomaly was resolved',
  })
  resolvedAt: Date | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'User who resolved the anomaly',
  })
  resolvedBy: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notes about how the anomaly was resolved',
  })
  resolutionNotes: string | null;

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
