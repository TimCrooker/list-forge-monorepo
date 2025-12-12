import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DomainExpertiseModuleEntity } from './domain-expertise-module.entity';

/**
 * Importance level for authenticity markers
 */
export type AuthenticityMarkerImportance = 'critical' | 'important' | 'helpful';

/**
 * AuthenticityMarkerDefinition Entity
 *
 * Defines patterns and checks used to assess item authenticity.
 * Each marker represents a specific authentication criterion.
 *
 * Examples:
 * - LV Date Code Format: pattern "^[A-Z]{2}\d{4}$" → critical
 * - Hermes Blindstamp: pattern "^[A-Z]$" with bracket context → critical
 * - Nike Style Code: pattern "^[A-Z0-9]{6}-[0-9]{3}$" → important
 *
 * Markers are evaluated during authenticity checks:
 * - Critical markers failing = likely_fake assessment
 * - Important markers contribute to confidence scoring
 * - Helpful markers provide additional context
 */
@Entity('domain_authenticity_marker_definitions')
@Index(['moduleId', 'importance'])
@Index(['moduleId', 'isActive'])
export class AuthenticityMarkerDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Module this marker belongs to
   */
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => DomainExpertiseModuleEntity, (module) => module.authenticityMarkers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: DomainExpertiseModuleEntity;

  /**
   * Human-readable name for this marker
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * Description of what to check (human-readable)
   * e.g., "Date code should be 2 letters followed by 4 digits"
   */
  @Column({ type: 'text' })
  checkDescription: string;

  /**
   * Regex pattern for validation (optional)
   * If null, this marker requires manual inspection
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  pattern: string | null;

  /**
   * Maximum input length for pattern matching (ReDoS prevention)
   */
  @Column({ type: 'integer', default: 50 })
  patternMaxLength: number;

  /**
   * How important this marker is for authenticity determination
   */
  @Column({ type: 'varchar', length: 20 })
  importance: AuthenticityMarkerImportance;

  /**
   * Whether pattern match indicates authentic (true) or suspicious (false)
   * true = match means authentic
   * false = match means suspicious/fake
   */
  @Column({ type: 'boolean', default: true })
  indicatesAuthentic: boolean;

  /**
   * Specific brands this marker applies to
   * Empty array means all brands in the module
   */
  @Column({ type: 'jsonb', default: '[]' })
  applicableBrands: string[];

  /**
   * Whether this marker is active
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
