import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemResearchRun } from './entities/item-research-run.entity';
import { Item } from '../items/entities/item.entity';
import {
  ItemResearchRunDto,
  ItemResearchRunSummaryDto,
} from '@listforge/api-types';
import { ResearchRunType, ResearchRunStatus } from '@listforge/core-types';

/**
 * Research Service - Phase 6 Sub-Phase 8
 *
 * Service for managing ItemResearchRun entities.
 */
@Injectable()
export class ResearchService {
  constructor(
    @InjectRepository(ItemResearchRun)
    private readonly researchRunRepo: Repository<ItemResearchRun>,
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
   * Map entity to full DTO
   */
  toDto(researchRun: ItemResearchRun): ItemResearchRunDto {
    return {
      id: researchRun.id,
      itemId: researchRun.itemId,
      runType: researchRun.runType,
      status: researchRun.status,
      pipelineVersion: researchRun.pipelineVersion,
      startedAt: researchRun.startedAt.toISOString(),
      completedAt: researchRun.completedAt
        ? researchRun.completedAt.toISOString()
        : null,
      errorMessage: researchRun.errorMessage,
      summary: researchRun.summary,
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
}
