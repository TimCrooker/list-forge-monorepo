import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DomainExpertiseModuleEntity } from './domain-expertise-module.entity';

/**
 * Snapshot of module state at publish time
 */
export interface DomainExpertiseSnapshot {
  module: {
    name: string;
    description: string;
    categoryId: string;
    applicableBrands: string[];
  };
  decoders: Array<{
    id: string;
    name: string;
    identifierType: string;
    description: string;
    inputPattern: string;
    inputMaxLength: number;
    extractionRules: unknown[];
    lookupTableId: string | null;
    lookupKeyGroup: number | null;
    validationRules: unknown[];
    outputFields: unknown[];
    baseConfidence: number;
    priority: number;
    testCases: unknown[];
  }>;
  lookupTables: Array<{
    id: string;
    name: string;
    description: string;
    keyField: string;
    valueSchema: unknown[];
    entryCount: number;
  }>;
  lookupEntries: Array<{
    id: string;
    tableId: string;
    key: string;
    values: Record<string, unknown>;
  }>;
  valueDrivers: Array<{
    id: string;
    name: string;
    description: string;
    attribute: string;
    conditionType: string;
    conditionValue: unknown;
    caseSensitive: boolean;
    priceMultiplier: number;
    priority: number;
    applicableBrands: string[];
  }>;
  authenticityMarkers: Array<{
    id: string;
    name: string;
    checkDescription: string;
    pattern: string | null;
    patternMaxLength: number;
    importance: string;
    indicatesAuthentic: boolean;
    applicableBrands: string[];
  }>;
}

/**
 * DomainExpertiseVersion Entity
 *
 * Stores published snapshots of domain expertise modules for:
 * - Version history tracking
 * - Rollback capability
 * - Audit trail
 *
 * When a module is published:
 * 1. All current decoders, lookup tables, entries, value drivers, and markers are captured
 * 2. A version snapshot is created with incrementing version number
 * 3. The module's currentVersion and publishedAt are updated
 *
 * To rollback:
 * 1. Load the target version's snapshot
 * 2. Replace all module's children with snapshot data
 * 3. Create a new version noting the rollback
 */
@Entity('domain_expertise_versions')
@Index(['moduleId', 'version'])
@Index(['moduleId', 'publishedAt'])
@Index(['moduleId', 'isActive'])
export class DomainExpertiseVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Module this version belongs to
   */
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => DomainExpertiseModuleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: DomainExpertiseModuleEntity;

  /**
   * Sequential version number within the module
   */
  @Column({ type: 'integer' })
  version: number;

  /**
   * Complete snapshot of module state at publish time
   */
  @Column({ type: 'jsonb' })
  snapshot: DomainExpertiseSnapshot;

  /**
   * Description of changes in this version
   */
  @Column({ type: 'text' })
  changelog: string;

  /**
   * User who published this version
   */
  @Column({ type: 'uuid' })
  publishedBy: string;

  /**
   * When this version was published
   */
  @CreateDateColumn()
  publishedAt: Date;

  /**
   * Whether this version is the currently active one
   * Only one version per module should be active
   */
  @Column({ type: 'boolean', default: false })
  isActive: boolean;
}
