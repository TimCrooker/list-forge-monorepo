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
  LifecycleStatus,
  AiReviewState,
  ItemSource,
  ItemMedia,
  ItemAttribute,
  ShippingType,
  PricingStrategy,
  ItemCondition,
} from '@listforge/core-types';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Item Entity - Phase 6 Unified Item Model
 *
 * Single central entity representing both draft and inventory states.
 * Replaces the separate ListingDraft vs InventoryItem concept.
 */
@Entity('items')
@Index(['organizationId', 'createdAt'])
@Index(['organizationId', 'lifecycleStatus'])
@Index(['organizationId', 'aiReviewState'])
export class Item {
  // ============================================================================
  // Identity & Provenance
  // ============================================================================

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

  @Column({ type: 'varchar', length: 20 })
  source: ItemSource;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ============================================================================
  // Status Fields (Two orthogonal axes)
  // ============================================================================

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  lifecycleStatus: LifecycleStatus;

  @Column({ type: 'varchar', length: 20, default: 'none' })
  aiReviewState: AiReviewState;

  // ============================================================================
  // User Hints (optional context from capture)
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  userTitleHint: string | null;

  @Column({ type: 'text', nullable: true })
  userDescriptionHint: string | null;

  @Column({ type: 'text', nullable: true })
  userNotes: string | null;

  // ============================================================================
  // Core Listing Fields
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition: ItemCondition | null;

  // ============================================================================
  // Category
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  categoryPath: string[] | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoryId: string | null;

  // ============================================================================
  // Attributes (Item Specifics)
  // ============================================================================

  @Column({ type: 'jsonb', default: '[]' })
  attributes: ItemAttribute[];

  // ============================================================================
  // Media
  // ============================================================================

  @Column({ type: 'jsonb', default: '[]' })
  media: ItemMedia[];

  // ============================================================================
  // Quantity & Pricing
  // ============================================================================

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  defaultPrice: number | null;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMin: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceMax: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pricingStrategy: PricingStrategy | null;

  // ============================================================================
  // Shipping (Generic)
  // ============================================================================

  @Column({ type: 'varchar', length: 20, nullable: true })
  shippingType: ShippingType | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  flatRateAmount: number | null;

  @Column({ type: 'boolean', default: true })
  domesticOnly: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dimensions: string | null;

  // ============================================================================
  // Operational/Inventory Fields
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costBasis: number | null;

  @Column({ type: 'jsonb', default: '[]' })
  tags: string[];

  // ============================================================================
  // AI Metadata
  // ============================================================================

  @Column({ type: 'varchar', length: 50, nullable: true })
  aiPipelineVersion: string | null;

  @Column({ type: 'timestamp', nullable: true })
  aiLastRunAt: Date | null;

  @Column({ type: 'text', nullable: true })
  aiLastRunError: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  aiConfidenceScore: number | null;

  // ============================================================================
  // Field-Driven Research State
  // ============================================================================

  /**
   * Overall field completion score (0-1)
   * Computed from field states during research
   */
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  fieldCompletionScore: number | null;

  /**
   * Whether all required fields meet confidence threshold
   * Set by research validation node
   */
  @Column({ type: 'boolean', default: false })
  readyToPublish: boolean;

  /**
   * Canonical field values (brand, model, color, etc.)
   * Stored in canonical format, mapped to marketplace-specific during publish
   */
  @Column({ type: 'jsonb', nullable: true })
  canonicalFields: Record<string, unknown> | null;

  // ============================================================================
  // Review Tracking & Confidence-Based Routing
  // ============================================================================

  /**
   * Review recommendation from confidence-based routing.
   * - 'approve': Spot-check - high confidence, recommend quick approval
   * - 'review': Full review needed - lower confidence, needs attention
   * - null: No recommendation yet (research not complete)
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  reviewRecommendation: 'approve' | 'review' | null;

  @Column({ nullable: true })
  assignedReviewerUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedReviewerUserId' })
  assignedReviewer: User;

  @Column({ nullable: true })
  reviewedByUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewedByUserId' })
  reviewedByUser: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewComment: string | null;
}

