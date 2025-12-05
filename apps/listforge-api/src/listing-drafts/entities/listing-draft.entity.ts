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
import {
  IngestionStatus,
  ReviewStatus,
  ComponentStatus,
  ListingDraftMedia,
  ListingDraftAttribute,
  ShippingType,
  PricingStrategy,
  ResearchSnapshot,
} from '@listforge/core-types';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

@Entity('listing_drafts')
@Index(['organizationId', 'createdAt'])
@Index(['organizationId', 'reviewStatus'])
@Index(['organizationId', 'ingestionStatus'])
export class ListingDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  createdByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser: User;

  // Dual status tracking
  @Column({ type: 'varchar', length: 20, default: 'uploaded' })
  ingestionStatus: IngestionStatus;

  @Column({ type: 'varchar', length: 20, default: 'unreviewed' })
  reviewStatus: ReviewStatus;

  // User hints
  @Column({ type: 'text', nullable: true })
  userTitleHint: string | null;

  @Column({ type: 'text', nullable: true })
  userDescriptionHint: string | null;

  @Column({ type: 'text', nullable: true })
  userNotes: string | null;

  // Media (JSONB array - replaces separate ItemPhoto table)
  @Column({ type: 'jsonb', default: '[]' })
  media: ListingDraftMedia[];

  // AI-generated content
  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ type: 'jsonb', nullable: true })
  categoryPath: string[] | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  primaryCategoryId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ebayCategoryId: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  attributes: ListingDraftAttribute[];

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  suggestedPrice: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax: number | null;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pricingStrategy: PricingStrategy | null;

  // Shipping
  @Column({ type: 'varchar', length: 20, nullable: true })
  shippingType: ShippingType | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  flatRateAmount: number | null;

  @Column({ type: 'boolean', default: true })
  domesticOnly: boolean;

  @Column({ type: 'text', nullable: true })
  shippingNotes: string | null;

  // Component-level QA flags
  @Column({ type: 'varchar', length: 20, default: 'ok' })
  titleStatus: ComponentStatus;

  @Column({ type: 'varchar', length: 20, default: 'ok' })
  descriptionStatus: ComponentStatus;

  @Column({ type: 'varchar', length: 20, default: 'ok' })
  categoryStatus: ComponentStatus;

  @Column({ type: 'varchar', length: 20, default: 'ok' })
  pricingStatus: ComponentStatus;

  @Column({ type: 'varchar', length: 20, default: 'ok' })
  attributesStatus: ComponentStatus;

  // Research data
  @Column({ type: 'jsonb', nullable: true })
  researchSnapshot: ResearchSnapshot | null;

  // AI metadata
  @Column({ type: 'varchar', length: 50, nullable: true })
  aiPipelineVersion: string | null;

  @Column({ type: 'timestamp', nullable: true })
  aiLastRunAt: Date | null;

  @Column({ type: 'text', nullable: true })
  aiErrorMessage: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  aiConfidenceScore: number | null;

  // Reviewer assignment
  @Column({ nullable: true })
  assignedReviewerUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedReviewerUserId' })
  assignedReviewer: User;

  // Review metadata
  @Column({ nullable: true })
  reviewedByUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewedByUserId' })
  reviewedByUser: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewComment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
