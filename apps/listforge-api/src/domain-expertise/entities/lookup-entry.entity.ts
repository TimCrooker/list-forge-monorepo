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
import { LookupTable } from './lookup-table.entity';

/**
 * LookupEntry Entity
 *
 * Individual entries in a lookup table.
 * Each entry has a unique key within its table and associated values.
 *
 * Examples:
 * - LV Factory: key="SD", values={location: "San Dimas, California", country: "USA", active: true}
 * - Hermes Year: key="X", values={year: 2016, hasSquare: true}
 * - Rolex: key="116610LN", values={modelFamily: "Submariner", modelName: "Submariner Date", material: "Stainless Steel"}
 */
@Entity('domain_lookup_entries')
@Index(['tableId', 'key'], { unique: true })
@Index(['tableId', 'isActive'])
export class LookupEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The lookup table this entry belongs to
   */
  @Column({ type: 'uuid' })
  tableId: string;

  @ManyToOne(() => LookupTable, (table) => table.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableId' })
  table: LookupTable;

  /**
   * The lookup key (e.g., "SD", "X", "116610LN")
   * Unique within each table
   */
  @Column({ type: 'varchar', length: 100 })
  key: string;

  /**
   * The values associated with this key
   * Structure should match the table's valueSchema
   */
  @Column({ type: 'jsonb', default: '{}' })
  values: Record<string, unknown>;

  /**
   * Whether this entry is active
   * Inactive entries are skipped during lookups
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
