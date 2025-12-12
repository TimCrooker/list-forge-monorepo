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
import { LookupTable } from './lookup-table.entity';

/**
 * Rule for extracting fields from regex capture groups
 */
export interface ExtractionRule {
  captureGroup: number;
  outputField: string;
  transform?: 'none' | 'parseInt' | 'parseYear' | 'lookup';
  transformConfig?: Record<string, unknown>;
}

/**
 * Rule for validating extracted values
 */
export interface ValidationRule {
  field: string;
  type: 'range' | 'regex' | 'lookup_exists' | 'custom';
  config: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage: string;
    failureConfidence?: number;
  };
}

/**
 * Mapping for output field structure
 */
export interface OutputFieldMapping {
  sourceField: string;
  outputField: string;
  type: 'string' | 'number' | 'boolean';
}

/**
 * Test case for decoder validation
 */
export interface DecoderTestCase {
  input: string;
  expectedSuccess: boolean;
  expectedOutput?: Record<string, unknown>;
  description: string;
}

/**
 * DecoderDefinition Entity
 *
 * Pattern-based decoder for extracting structured data from identifiers.
 * Replaces hardcoded decoder functions with configurable definitions.
 *
 * Examples:
 * - LV Date Code: pattern "^([A-Z]{2})(\d{4})$" → factory code + week/year
 * - Hermes Blindstamp: pattern "^([A-Z])$" → year from cycle lookup
 * - Nike Style Code: pattern "^([A-Z0-9]{6})-?(\d{3})$" → style + colorway
 * - Rolex Reference: pattern "^(\d{5,6})([A-Z]{0,4})$" → model lookup
 *
 * Decoders support:
 * - Regex capture group extraction
 * - Value transformation (parseInt, parseYear, etc.)
 * - Lookup table enrichment
 * - Validation rules with confidence adjustment
 * - Test cases for verification
 */
@Entity('domain_decoder_definitions')
@Index(['moduleId', 'priority'])
@Index(['moduleId', 'isActive'])
@Index(['moduleId', 'identifierType'])
export class DecoderDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Module this decoder belongs to
   */
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => DomainExpertiseModuleEntity, (module) => module.decoders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: DomainExpertiseModuleEntity;

  /**
   * Human-readable name for this decoder
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * Type of identifier this decoder handles
   * e.g., "lv_date_code", "hermes_blindstamp", "nike_style_code"
   */
  @Column({ type: 'varchar', length: 50 })
  identifierType: string;

  /**
   * Description of what this decoder does
   */
  @Column({ type: 'text', default: '' })
  description: string;

  /**
   * Regex pattern for matching input
   * Use capturing groups for extraction
   */
  @Column({ type: 'varchar', length: 500 })
  inputPattern: string;

  /**
   * Maximum input length for pattern matching (ReDoS prevention)
   */
  @Column({ type: 'integer', default: 50 })
  inputMaxLength: number;

  /**
   * Rules for extracting fields from capture groups
   */
  @Column({ type: 'jsonb', default: '[]' })
  extractionRules: ExtractionRule[];

  /**
   * Optional lookup table for enrichment
   */
  @Column({ type: 'uuid', nullable: true })
  lookupTableId: string | null;

  @ManyToOne(() => LookupTable, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lookupTableId' })
  lookupTable: LookupTable | null;

  /**
   * Which capture group to use as lookup key
   */
  @Column({ type: 'integer', nullable: true })
  lookupKeyGroup: number | null;

  /**
   * Rules for validating extracted values
   */
  @Column({ type: 'jsonb', default: '[]' })
  validationRules: ValidationRule[];

  /**
   * Mapping of extracted fields to output fields
   */
  @Column({ type: 'jsonb', default: '[]' })
  outputFields: OutputFieldMapping[];

  /**
   * Base confidence when decoder matches successfully
   */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.9 })
  baseConfidence: number;

  /**
   * Priority for evaluation order (higher = evaluated first)
   */
  @Column({ type: 'integer', default: 0 })
  priority: number;

  /**
   * Whether this decoder is active
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Test cases for verifying decoder behavior
   */
  @Column({ type: 'jsonb', default: '[]' })
  testCases: DecoderTestCase[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
