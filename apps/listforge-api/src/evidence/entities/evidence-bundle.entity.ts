import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ListingDraft } from '../../listing-drafts/entities/listing-draft.entity';
import { EvidenceItem } from './evidence-item.entity';

@Entity('evidence_bundles')
@Index(['listingDraftId'])
export class EvidenceBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  listingDraftId: string;

  @ManyToOne(() => ListingDraft, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingDraftId' })
  listingDraft: ListingDraft;

  @OneToMany(() => EvidenceItem, (item) => item.bundle, { cascade: true })
  items: EvidenceItem[];

  @CreateDateColumn()
  generatedAt: Date;
}
