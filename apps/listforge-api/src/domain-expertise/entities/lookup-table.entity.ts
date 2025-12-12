import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LookupEntry } from './lookup-entry.entity';

/**
 * Schema definition for a lookup table value field
 */
export interface LookupValueField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

/**
 * LookupTable Entity
 *
 * Stores configurable reference data tables (factory codes, year codes, etc.)
 * Each table has a key field and a schema for value fields.
 *
 * Examples:
 * - LV Factory Codes: key="SD", values={location: "San Dimas", country: "USA"}
 * - Hermes Year Codes: key="X", values={year: 2016, cycle: 3}
 * - Rolex References: key="116610LN", values={modelFamily: "Submariner", material: "Steel"}
 */
@Entity('domain_lookup_tables')
@Index(['moduleId'])
@Index(['name'])
export class LookupTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Optional link to a DomainExpertiseModule
   * Null for standalone/shared lookup tables
   */
  @Column({ type: 'uuid', nullable: true })
  moduleId: string | null;

  /**
   * Human-readable name for the lookup table
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * Description of what this table contains
   */
  @Column({ type: 'text', default: '' })
  description: string;

  /**
   * Name of the key field (e.g., "code", "reference", "letter")
   */
  @Column({ type: 'varchar', length: 50 })
  keyField: string;

  /**
   * Schema definition for value fields
   * Defines what fields each entry should have
   */
  @Column({ type: 'jsonb', default: '[]' })
  valueSchema: LookupValueField[];

  /**
   * Whether this table is active and can be used
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Entries in this lookup table
   */
  @OneToMany(() => LookupEntry, (entry) => entry.table, { cascade: true })
  entries: LookupEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
