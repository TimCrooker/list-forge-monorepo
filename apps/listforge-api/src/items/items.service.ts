import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { Item } from './entities/item.entity';
import {
  ItemDto,
  ItemSummaryDto,
  CreateAiCaptureItemRequest,
  CreateManualItemRequest,
  UpdateItemRequest,
  ListItemsQuery,
} from '@listforge/api-types';
import { ItemMedia } from '@listforge/core-types';
import { QUEUE_AI_WORKFLOW, StartItemWorkflowJob } from '@listforge/queue-types';
import { EventsService } from '../events/events.service';

/**
 * Items Service - Phase 6 Unified Item Model
 *
 * Service for managing the unified Item entity.
 */
@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private readonly aiWorkflowQueue: Queue,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Create an AI-capture item
   * Implemented in Sub-Phase 2
   */
  async createAiCaptureItem(
    orgId: string,
    userId: string,
    request: CreateAiCaptureItemRequest,
    media: ItemMedia[],
  ): Promise<ItemSummaryDto> {
    if (!media || media.length === 0) {
      throw new BadRequestException('At least one photo is required for AI capture');
    }

    // Validate media items have required fields
    for (const mediaItem of media) {
      if (!mediaItem.url || !mediaItem.storagePath) {
        throw new BadRequestException('Invalid media item: url and storagePath are required');
      }
    }

    // Create Item with AI capture defaults
    const item = this.itemRepository.create({
      organizationId: orgId,
      createdByUserId: userId,
      source: 'ai_capture',
      lifecycleStatus: 'draft',
      aiReviewState: 'pending',
      userTitleHint: request.userTitleHint || null,
      userDescriptionHint: request.userDescriptionHint || null,
      userNotes: request.userNotes || null,
      media,
      attributes: [],
      tags: [],
      quantity: 1,
      currency: 'USD',
      domesticOnly: true,
    });

    const savedItem = await this.itemRepository.save(item);

    // Enqueue AI workflow
    const job: StartItemWorkflowJob = {
      workflowType: 'item-intake-v1',
      itemId: savedItem.id,
      orgId,
      userId,
    };
    await this.aiWorkflowQueue.add('start-item-workflow', job);

    // Emit item created event
    this.eventsService.emitItemCreated(
      orgId,
      userId,
      this.mapToSummaryDto(savedItem),
    );

    return this.mapToSummaryDto(savedItem);
  }

  /**
   * Create a manual item
   * Full implementation in Sub-Phase 5
   */
  async createManualItem(
    orgId: string,
    userId: string,
    request: CreateManualItemRequest,
  ): Promise<ItemSummaryDto> {
    // Validate required fields
    if (!request.title || request.title.trim().length === 0) {
      throw new BadRequestException('Title is required for manual items');
    }
    if (!request.description || request.description.trim().length === 0) {
      throw new BadRequestException('Description is required for manual items');
    }
    if (!request.condition) {
      throw new BadRequestException('Condition is required for manual items');
    }

    // Validate price if provided
    if (request.defaultPrice !== undefined && request.defaultPrice !== null && request.defaultPrice < 0) {
      throw new BadRequestException('Default price must be non-negative');
    }

    // Validate quantity
    const quantity = request.quantity ?? 1;
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    // Create Item with manual defaults
    const item = this.itemRepository.create({
      organizationId: orgId,
      createdByUserId: userId,
      source: 'manual',
      lifecycleStatus: 'ready', // Manual items are immediately inventory-ready
      aiReviewState: 'none', // No AI review involved

      // Core listing fields
      title: request.title.trim(),
      subtitle: request.subtitle?.trim() || null,
      description: request.description.trim(),
      condition: request.condition,

      // Category
      categoryPath: request.categoryPath || null,
      categoryId: request.categoryId || null,

      // Attributes
      attributes: request.attributes || [],

      // Media
      media: request.media || [],

      // Pricing
      quantity,
      defaultPrice: request.defaultPrice ?? null,
      currency: request.currency || 'USD',
      priceMin: request.priceMin ?? null,
      priceMax: request.priceMax ?? null,
      pricingStrategy: request.pricingStrategy || null,

      // Shipping
      shippingType: request.shippingType || null,
      flatRateAmount: request.flatRateAmount ?? null,
      domesticOnly: request.domesticOnly ?? true,
      weight: request.weight ?? null,
      dimensions: request.dimensions || null,

      // Inventory fields
      location: request.location || null,
      costBasis: request.costBasis ?? null,
      tags: request.tags || [],

      // User notes
      userNotes: request.userNotes || null,
    });

    const savedItem = await this.itemRepository.save(item);

    // Emit item created event
    this.eventsService.emitItemCreated(
      orgId,
      userId,
      this.mapToSummaryDto(savedItem),
    );

    return this.mapToSummaryDto(savedItem);
  }

  /**
   * Get a single item by ID
   */
  async getItem(orgId: string, itemId: string): Promise<ItemDto> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    return this.mapToDto(item);
  }

  /**
   * List items with filters
   * Full filtering implementation in Sub-Phase 6
   */
  async listItems(
    orgId: string,
    query: ListItemsQuery,
  ): Promise<{ items: ItemSummaryDto[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Build query with filters
    const qb = this.itemRepository
      .createQueryBuilder('item')
      .where('item.organizationId = :orgId', { orgId });

    // Filter by lifecycle status (array)
    if (query.lifecycleStatus && query.lifecycleStatus.length > 0) {
      qb.andWhere('item.lifecycleStatus IN (:...statuses)', {
        statuses: query.lifecycleStatus,
      });
    }

    // Filter by AI review state (array)
    if (query.aiReviewState && query.aiReviewState.length > 0) {
      qb.andWhere('item.aiReviewState IN (:...states)', {
        states: query.aiReviewState,
      });
    }

    // Filter by source (array)
    if (query.source && query.source.length > 0) {
      qb.andWhere('item.source IN (:...sources)', {
        sources: query.source,
      });
    }

    // Search in title and description
    if (query.search && query.search.trim().length > 0) {
      const searchTerm = `%${query.search.trim()}%`;
      qb.andWhere(
        '(item.title ILIKE :search OR item.description ILIKE :search)',
        { search: searchTerm },
      );
    }

    // Apply sorting
    const sortColumn = `item.${sortBy}`;
    const order = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(sortColumn, order);

    // Apply pagination
    qb.skip((page - 1) * pageSize).take(pageSize);

    // Execute query
    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map(this.mapToSummaryDto),
      total,
    };
  }

  /**
   * Update an item
   */
  async updateItem(
    orgId: string,
    itemId: string,
    request: UpdateItemRequest,
  ): Promise<ItemDto> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    // Apply updates (only fields provided in request)
    Object.assign(item, request);

    await this.itemRepository.save(item);

    return this.mapToDto(item);
  }

  /**
   * Delete an item
   */
  async deleteItem(orgId: string, itemId: string): Promise<void> {
    const result = await this.itemRepository.delete({
      id: itemId,
      organizationId: orgId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    // Emit item deleted event
    this.eventsService.emitItemDeleted(itemId, orgId);
  }

  // ============================================================================
  // Review Methods (Sub-Phase 3)
  // ============================================================================

  /**
   * Get AI review queue
   * Returns items with source='ai_capture', lifecycleStatus='draft', aiReviewState='pending'
   */
  async getAiReviewQueue(
    orgId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: ItemSummaryDto[]; total: number }> {
    const [items, total] = await this.itemRepository.findAndCount({
      where: {
        organizationId: orgId,
        source: 'ai_capture',
        lifecycleStatus: 'draft',
        aiReviewState: 'pending',
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(this.mapToSummaryDto),
      total,
    };
  }

  /**
   * Approve item (AI output accepted)
   * Sets lifecycleStatus='ready', aiReviewState='approved'
   */
  async approveItem(
    orgId: string,
    userId: string,
    itemId: string,
  ): Promise<ItemDto> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    // Validate state transition
    if (item.aiReviewState !== 'pending') {
      throw new BadRequestException(
        `Cannot approve item: aiReviewState is ${item.aiReviewState}, must be pending`,
      );
    }

    // Update status
    item.aiReviewState = 'approved';
    item.lifecycleStatus = 'ready';
    item.reviewedByUserId = userId;
    item.reviewedAt = new Date();

    await this.itemRepository.save(item);

    // Emit socket events
    this.eventsService.emitItemReviewStatus(
      item.id,
      item.organizationId,
      item.aiReviewState,
      item.reviewedByUserId,
      item.reviewedAt?.toISOString(),
    );
    this.eventsService.emitItemReviewQueueChanged(
      item.organizationId,
      'removed',
      item.id,
    );
    this.eventsService.emitItemUpdated(this.mapToDto(item));

    return this.mapToDto(item);
  }

  /**
   * Reject item (AI needs human intervention)
   * Keeps lifecycleStatus='draft', sets aiReviewState='rejected'
   */
  async rejectItem(
    orgId: string,
    userId: string,
    itemId: string,
    comment?: string,
  ): Promise<ItemDto> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    // Validate state transition
    if (item.aiReviewState !== 'pending') {
      throw new BadRequestException(
        `Cannot reject item: aiReviewState is ${item.aiReviewState}, must be pending`,
      );
    }

    // Update status
    item.aiReviewState = 'rejected';
    item.lifecycleStatus = 'draft'; // Stays in draft
    item.reviewedByUserId = userId;
    item.reviewedAt = new Date();
    if (comment) {
      item.reviewComment = comment;
    }

    await this.itemRepository.save(item);

    // Emit socket events
    this.eventsService.emitItemReviewStatus(
      item.id,
      item.organizationId,
      item.aiReviewState,
      item.reviewedByUserId,
      item.reviewedAt?.toISOString(),
    );
    this.eventsService.emitItemReviewQueueChanged(
      item.organizationId,
      'removed',
      item.id,
    );
    this.eventsService.emitItemUpdated(this.mapToDto(item));

    return this.mapToDto(item);
  }

  // ============================================================================
  // Needs Work Methods (Sub-Phase 4)
  // ============================================================================

  /**
   * Get Needs Work queue
   * Returns items with lifecycleStatus='draft', aiReviewState='rejected'
   */
  async getNeedsWorkQueue(
    orgId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: ItemSummaryDto[]; total: number }> {
    const [items, total] = await this.itemRepository.findAndCount({
      where: {
        organizationId: orgId,
        lifecycleStatus: 'draft',
        aiReviewState: 'rejected',
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(this.mapToSummaryDto),
      total,
    };
  }

  /**
   * Mark item as ready (from Needs Work queue)
   * Sets lifecycleStatus='ready', aiReviewState stays 'rejected'
   */
  async markItemReady(
    orgId: string,
    userId: string,
    itemId: string,
  ): Promise<ItemDto> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    // Validate state - should be in needs work state
    if (item.lifecycleStatus !== 'draft' || item.aiReviewState !== 'rejected') {
      throw new BadRequestException(
        `Cannot mark item ready: item must be in draft/rejected state, currently ${item.lifecycleStatus}/${item.aiReviewState}`,
      );
    }

    // Update status
    item.lifecycleStatus = 'ready';
    // aiReviewState stays 'rejected' - historical truth that AI needed help

    await this.itemRepository.save(item);

    // Emit socket events
    this.eventsService.emitItemUpdated(this.mapToDto(item));

    return this.mapToDto(item);
  }

  // ============================================================================
  // Mapping Helpers
  // ============================================================================

  private mapToDto(item: Item): ItemDto {
    const primaryImage = item.media.find(m => m.isPrimary) || item.media[0];

    return {
      id: item.id,
      organizationId: item.organizationId,
      createdByUserId: item.createdByUserId,
      source: item.source,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),

      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,

      userTitleHint: item.userTitleHint,
      userDescriptionHint: item.userDescriptionHint,
      userNotes: item.userNotes,

      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      condition: item.condition,

      categoryPath: item.categoryPath,
      categoryId: item.categoryId,

      attributes: item.attributes,
      media: item.media,
      photos: item.media, // Alias for backwards compatibility
      primaryImageUrl: primaryImage?.url || null,

      quantity: item.quantity,
      defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
      currency: item.currency,
      priceMin: item.priceMin ? Number(item.priceMin) : null,
      priceMax: item.priceMax ? Number(item.priceMax) : null,
      pricingStrategy: item.pricingStrategy,

      shippingType: item.shippingType,
      flatRateAmount: item.flatRateAmount ? Number(item.flatRateAmount) : null,
      domesticOnly: item.domesticOnly,
      weight: item.weight ? Number(item.weight) : null,
      dimensions: item.dimensions,

      location: item.location,
      costBasis: item.costBasis ? Number(item.costBasis) : null,
      tags: item.tags,

      aiPipelineVersion: item.aiPipelineVersion,
      aiLastRunAt: item.aiLastRunAt ? item.aiLastRunAt.toISOString() : null,
      aiLastRunError: item.aiLastRunError,
      aiConfidenceScore: item.aiConfidenceScore ? Number(item.aiConfidenceScore) : null,

      assignedReviewerUserId: item.assignedReviewerUserId,
      reviewedByUserId: item.reviewedByUserId,
      reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
      reviewComment: item.reviewComment,
      reviewRecommendation: item.reviewRecommendation,
    };
  }

  private mapToSummaryDto(item: Item): ItemSummaryDto {
    const primaryImage = item.media.find(m => m.isPrimary) || item.media[0];

    return {
      id: item.id,
      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,
      source: item.source,
      title: item.title,
      defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
      currency: item.currency,
      quantity: item.quantity,
      primaryImageUrl: primaryImage?.url || null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

