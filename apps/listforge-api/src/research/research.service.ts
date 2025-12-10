import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemResearchRun } from './entities/item-research-run.entity';
import { ItemResearch } from './entities/item-research.entity';
import { ResearchActivityLog } from './entities/research-activity-log.entity';
import { Item } from '../items/entities/item.entity';
import {
  ItemResearchRunDto,
  ItemResearchRunSummaryDto,
  ItemResearchDto,
} from '@listforge/api-types';
import {
  ResearchRunType,
  ResearchRunStatus,
  ItemResearchData,
} from '@listforge/core-types';

/**
 * Research Service - Phase 6 Sub-Phase 8 + Phase 7 Slice 1
 *
 * Service for managing ItemResearchRun and ItemResearch entities.
 */
@Injectable()
export class ResearchService {
  constructor(
    @InjectRepository(ItemResearchRun)
    private readonly researchRunRepo: Repository<ItemResearchRun>,
    @InjectRepository(ItemResearch)
    private readonly itemResearchRepo: Repository<ItemResearch>,
    @InjectRepository(ResearchActivityLog)
    private readonly activityLogRepo: Repository<ResearchActivityLog>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
  ) {}

  /**
   * Create a new research run for an item
   */
  async createResearchRun(
    itemId: string,
    orgId: string,
    runType: ResearchRunType,
  ): Promise<ItemResearchRun> {
    // Verify item exists and belongs to org
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const researchRun = this.researchRunRepo.create({
      itemId,
      runType,
      status: 'pending',
      startedAt: new Date(),
    });

    return this.researchRunRepo.save(researchRun);
  }

  /**
   * Get a single research run by ID
   */
  async getResearchRun(id: string, orgId: string): Promise<ItemResearchRun> {
    const researchRun = await this.researchRunRepo
      .createQueryBuilder('run')
      .leftJoin('run.item', 'item')
      .where('run.id = :id', { id })
      .andWhere('item.organizationId = :orgId', { orgId })
      .getOne();

    if (!researchRun) {
      throw new NotFoundException(`Research run ${id} not found`);
    }

    return researchRun;
  }

  /**
   * List all research runs for an item
   */
  async listResearchRuns(
    itemId: string,
    orgId: string,
  ): Promise<{ researchRuns: ItemResearchRun[]; total: number }> {
    // Verify item exists and belongs to org
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const [researchRuns, total] = await this.researchRunRepo.findAndCount({
      where: { itemId },
      order: { startedAt: 'DESC' },
    });

    return { researchRuns, total };
  }

  /**
   * Update research run status
   */
  async updateResearchRunStatus(
    id: string,
    status: ResearchRunStatus,
    errorMessage?: string,
    summary?: string,
  ): Promise<ItemResearchRun> {
    const researchRun = await this.researchRunRepo.findOne({
      where: { id },
    });

    if (!researchRun) {
      throw new NotFoundException(`Research run ${id} not found`);
    }

    researchRun.status = status;
    if (status === 'success' || status === 'error') {
      researchRun.completedAt = new Date();
    }
    if (errorMessage !== undefined) {
      researchRun.errorMessage = errorMessage;
    }
    if (summary !== undefined) {
      researchRun.summary = summary;
    }

    return this.researchRunRepo.save(researchRun);
  }

  /**
   * Set pipeline version for a research run
   */
  async setPipelineVersion(id: string, version: string): Promise<void> {
    await this.researchRunRepo.update(id, { pipelineVersion: version });
  }

  /**
   * Get activity log for a research run
   */
  async getActivityLog(researchRunId: string): Promise<ResearchActivityLog[]> {
    return this.activityLogRepo.find({
      where: { researchRunId },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Get operation events for a research run (new format for AgentActivityFeed)
   * Returns only entries that have operationId set (new format)
   */
  async getOperationEvents(researchRunId: string) {
    const logs = await this.activityLogRepo.find({
      where: { researchRunId },
      order: { timestamp: 'ASC' },
    });

    // Filter and transform to AgentOperationEvent format
    return logs
      .filter((log) => log.operationId && log.operationType && log.eventType)
      .map((log) => ({
        id: log.id,
        runId: log.researchRunId,
        contextId: log.itemId,
        operationId: log.operationId!,
        operationType: log.operationType!,
        eventType: log.eventType!,
        stepId: log.stepId || undefined,
        title: log.title || '',
        message: log.message,
        data: log.metadata || undefined,
        timestamp: log.timestamp.toISOString(),
      }));
  }

  /**
   * Map entity to full DTO
   * Phase 7 Slice 4: Includes stepCount and stepHistory
   */
  toDto(researchRun: ItemResearchRun): ItemResearchRunDto {
    return {
      id: researchRun.id,
      itemId: researchRun.itemId,
      runType: researchRun.runType,
      status: researchRun.status,
      pipelineVersion: researchRun.pipelineVersion,
      currentNode: researchRun.currentNode,
      startedAt: researchRun.startedAt.toISOString(),
      completedAt: researchRun.completedAt
        ? researchRun.completedAt.toISOString()
        : null,
      errorMessage: researchRun.errorMessage,
      summary: researchRun.summary,
      // Phase 7 Slice 4: Add step tracking fields
      stepCount: researchRun.stepCount ?? 0,
      stepHistory: researchRun.stepHistory ?? undefined,
    };
  }

  /**
   * Map entity to summary DTO
   */
  toSummaryDto(researchRun: ItemResearchRun): ItemResearchRunSummaryDto {
    return {
      id: researchRun.id,
      runType: researchRun.runType,
      status: researchRun.status,
      startedAt: researchRun.startedAt.toISOString(),
      completedAt: researchRun.completedAt
        ? researchRun.completedAt.toISOString()
        : null,
      summary: researchRun.summary,
    };
  }

  // ============================================================================
  // Phase 7 Slice 1: ItemResearch Methods
  // ============================================================================

  /**
   * Find the latest (current) research for an item
   */
  async findLatestResearch(
    itemId: string,
    orgId: string,
  ): Promise<ItemResearch | null> {
    // Verify item exists and belongs to org
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    // Find current research for this item
    const research = await this.itemResearchRepo.findOne({
      where: { itemId, isCurrent: true },
      order: { createdAt: 'DESC' },
    });

    return research ?? null;
  }

  /**
   * Find research history for an item with pagination
   */
  async findResearchHistory(
    itemId: string,
    orgId: string,
    pagination: { page?: number; pageSize?: number } = {},
  ): Promise<{ researches: ItemResearch[]; total: number }> {
    const { page = 1, pageSize = 10 } = pagination;

    // Verify item exists and belongs to org
    const item = await this.itemRepo.findOne({
      where: { id: itemId, organizationId: orgId },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const [researches, total] = await this.itemResearchRepo.findAndCount({
      where: { itemId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { researches, total };
  }

  /**
   * Create a new research record for an item
   * Marks previous research as non-current
   */
  async createResearch(input: {
    itemId: string;
    researchRunId?: string;
    data: ItemResearchData;
    schemaVersion?: string;
  }): Promise<ItemResearch> {
    const { itemId, researchRunId, data, schemaVersion = '1.0.0' } = input;

    // Mark all previous research for this item as non-current
    await this.markPreviousAsHistorical(itemId);

    // Create new current research
    const research = this.itemResearchRepo.create({
      itemId,
      researchRunId,
      data,
      schemaVersion,
      isCurrent: true,
    });

    return this.itemResearchRepo.save(research);
  }

  /**
   * Mark all existing research for an item as historical (non-current)
   */
  async markPreviousAsHistorical(itemId: string): Promise<void> {
    await this.itemResearchRepo.update(
      { itemId, isCurrent: true },
      { isCurrent: false },
    );
  }

  /**
   * Map ItemResearch entity to DTO
   */
  toResearchDto(research: ItemResearch): ItemResearchDto {
    return {
      id: research.id,
      itemId: research.itemId,
      data: research.data,
      schemaVersion: research.schemaVersion,
      createdAt: research.createdAt.toISOString(),
      researchRunId: research.researchRunId,
      isCurrent: research.isCurrent,
    };
  }

  // ============================================================================
  // Phase 7 Slice 4: Checkpointing & Resume Support
  // ============================================================================

  /**
   * Find research runs that are stalled (running but no update in >5 minutes)
   * or failed but can be resumed
   */
  async findStalledRuns(orgId: string): Promise<ItemResearchRun[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find runs that are:
    // 1. Status = 'running' but started more than 5 minutes ago and no recent step updates
    // 2. Status = 'error' with stepCount < maxSteps (can be resumed)
    const stalledRuns = await this.researchRunRepo
      .createQueryBuilder('run')
      .leftJoin('run.item', 'item')
      .where('item.organizationId = :orgId', { orgId })
      .andWhere(
        `(
          (run.status = 'running' AND run.startedAt < :fiveMinutesAgo)
          OR
          (run.status = 'error' AND run.stepCount < 30)
        )`,
        { fiveMinutesAgo },
      )
      .andWhere('run.completedAt IS NULL')
      .orderBy('run.startedAt', 'DESC')
      .getMany();

    return stalledRuns;
  }

  /**
   * Check if a research run can be resumed
   */
  async canResume(id: string, orgId: string): Promise<boolean> {
    const researchRun = await this.getResearchRun(id, orgId);

    // Can resume if:
    // 1. Status is 'error', 'running' (stalled), or 'paused'
    // 2. Not completed
    // 3. Has checkpoint or stepCount > 0 (has made progress)
    // 4. stepCount < max retries (30 steps = ~3 retries of 10 steps each)
    const maxSteps = 30;

    return (
      (researchRun.status === 'error' ||
       researchRun.status === 'running' ||
       researchRun.status === 'paused') &&
      researchRun.completedAt === null &&
      (researchRun.checkpoint !== null || researchRun.stepCount > 0) &&
      researchRun.stepCount < maxSteps
    );
  }

  // ============================================================================
  // Research Flow Control Methods
  // ============================================================================

  /**
   * Pause a running research run
   */
  async pauseResearchRun(id: string, orgId: string): Promise<ItemResearchRun> {
    const researchRun = await this.getResearchRun(id, orgId);

    if (researchRun.status !== 'running') {
      throw new BadRequestException(
        `Research run ${id} cannot be paused. Current status: ${researchRun.status}`,
      );
    }

    researchRun.pauseRequested = true;
    researchRun.pausedAt = new Date();
    researchRun.status = 'paused';

    return this.researchRunRepo.save(researchRun);
  }

  /**
   * Stop/cancel a research run
   */
  async stopResearchRun(id: string, orgId: string): Promise<ItemResearchRun> {
    const researchRun = await this.getResearchRun(id, orgId);

    if (researchRun.status === 'success' || researchRun.status === 'cancelled') {
      throw new BadRequestException(
        `Research run ${id} cannot be stopped. Current status: ${researchRun.status}`,
      );
    }

    researchRun.status = 'cancelled';
    researchRun.completedAt = new Date();
    researchRun.pauseRequested = false; // Clear pause flag if set

    return this.researchRunRepo.save(researchRun);
  }

  /**
   * Check if a research run is paused
   */
  async isPaused(id: string): Promise<boolean> {
    const researchRun = await this.researchRunRepo.findOne({
      where: { id },
    });

    if (!researchRun) {
      return false;
    }

    return researchRun.pauseRequested || researchRun.status === 'paused';
  }

  /**
   * Clear pause flags for a research run
   */
  async clearPauseFlags(id: string): Promise<void> {
    await this.researchRunRepo.update(id, {
      pauseRequested: false,
      pausedAt: null,
    });
  }
}
