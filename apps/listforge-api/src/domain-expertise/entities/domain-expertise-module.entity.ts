import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { CategoryId } from '@listforge/core-types';
import { LookupTable } from './lookup-table.entity';
import { ValueDriverDefinition } from './value-driver-definition.entity';
import { DecoderDefinition } from './decoder-definition.entity';
import { AuthenticityMarkerDefinition } from './authenticity-marker-definition.entity';

/**
 * Module status for domain expertise
 */
export type DomainExpertiseModuleStatus = 'draft' | 'published' | 'archived';

/**
 * DomainExpertiseModule Entity
 *
 * Top-level container for domain expertise configuration.
 * Each module represents expertise for a specific category/brand combination.
 *
 * Examples:
 * - "Louis Vuitton Authentication" for luxury_handbags + Louis Vuitton
 * - "Vintage Levi's" for vintage_denim + Levi's
 * - "Rolex Reference Guide" for watches + Rolex
 *
 * Modules contain:
 * - Decoders (pattern-based identifier parsing)
 * - Lookup tables (reference data)
 * - Value drivers (price multipliers)
 * - Authenticity markers (validation patterns)
 */
@Entity('domain_expertise_modules')
@Index(['categoryId', 'status'])
@Index(['status', 'updatedAt'])
export class DomainExpertiseModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Human-readable name for this module
   */
  @Column({ type: 'varchar', length: 150 })
  name: string;

  /**
   * Description of what this module covers
   */
  @Column({ type: 'text', default: '' })
  description: string;

  /**
   * Category this module applies to
   */
  @Column({ type: 'varchar', length: 50 })
  categoryId: CategoryId;

  /**
   * Brands this module applies to
   * Empty array means all brands in the category
   */
  @Column({ type: 'jsonb', default: '[]' })
  applicableBrands: string[];

  /**
   * Current version number (incremented on each publish)
   */
  @Column({ type: 'integer', default: 0 })
  currentVersion: number;

  /**
   * Module status
   */
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: DomainExpertiseModuleStatus;

  /**
   * User who created this module
   */
  @Column({ type: 'uuid' })
  createdBy: string;

  /**
   * User who last modified this module
   */
  @Column({ type: 'uuid' })
  lastModifiedBy: string;

  /**
   * When this module was last published
   */
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  /**
   * Lookup tables in this module
   */
  @OneToMany(() => LookupTable, (table) => table.moduleId)
  lookupTables: LookupTable[];

  /**
   * Value drivers in this module
   */
  @OneToMany(() => ValueDriverDefinition, (driver) => driver.module)
  valueDrivers: ValueDriverDefinition[];

  /**
   * Decoders in this module
   */
  @OneToMany(() => DecoderDefinition, (decoder) => decoder.module)
  decoders: DecoderDefinition[];

  /**
   * Authenticity markers in this module
   */
  @OneToMany(() => AuthenticityMarkerDefinition, (marker) => marker.module)
  authenticityMarkers: AuthenticityMarkerDefinition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
