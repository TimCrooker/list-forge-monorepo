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
 * Condition type for value driver matching
 */
export type ValueDriverConditionType = 'contains' | 'equals' | 'regex' | 'range' | 'custom';

/**
 * Complex condition configuration
 */
export interface ConditionConfig {
  min?: number;
  max?: number;
  pattern?: string;
  flags?: string;
  expression?: string;
}

/**
 * ValueDriverDefinition Entity
 *
 * Defines price-affecting attributes for items in a category.
 * When an item matches a value driver's condition, its price
 * is multiplied by the driver's multiplier.
 *
 * Examples:
 * - Big E Label (Levi's): label_type contains "LEVI'S" → 5.0x
 * - Selvedge Denim: material equals "selvedge" → 2.5x
 * - Exotic Leather (LV): material regex /crocodile|ostrich|python/i → 3.0x
 */
@Entity('domain_value_driver_definitions')
@Index(['moduleId', 'priority'])
@Index(['moduleId', 'isActive'])
export class ValueDriverDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Module this driver belongs to
   */
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => DomainExpertiseModuleEntity, (module) => module.valueDrivers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: DomainExpertiseModuleEntity;

  /**
   * Human-readable name for this driver
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * Description of what makes this valuable
   */
  @Column({ type: 'text', default: '' })
  description: string;

  /**
   * Field/attribute to check (e.g., "label_type", "material", "edition")
   */
  @Column({ type: 'varchar', length: 100 })
  attribute: string;

  /**
   * Type of condition to evaluate
   */
  @Column({ type: 'varchar', length: 20 })
  conditionType: ValueDriverConditionType;

  /**
   * Condition value (string for simple, JSON for complex)
   * For 'contains'/'equals': simple string value
   * For 'regex': pattern string
   * For 'range'/'custom': JSON config
   */
  @Column({ type: 'jsonb' })
  conditionValue: string | ConditionConfig;

  /**
   * Whether the condition is case-sensitive
   */
  @Column({ type: 'boolean', default: false })
  caseSensitive: boolean;

  /**
   * Price multiplier when condition matches
   */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  priceMultiplier: number;

  /**
   * Priority for evaluation order (higher = evaluated first)
   */
  @Column({ type: 'integer', default: 0 })
  priority: number;

  /**
   * Specific brands this driver applies to
   * Empty array means all brands in the module
   */
  @Column({ type: 'jsonb', default: '[]' })
  applicableBrands: string[];

  /**
   * Whether this driver is active
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
