import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceBundle } from './entities/evidence-bundle.entity';
import { EvidenceItem } from './entities/evidence-item.entity';
import { EvidenceItemType, EvidenceItemData } from '@listforge/core-types';
import { EvidenceBundleDto } from '@listforge/api-types';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(EvidenceBundle)
    private bundleRepo: Repository<EvidenceBundle>,
    @InjectRepository(EvidenceItem)
    private itemRepo: Repository<EvidenceItem>,
  ) {}

  /**
   * Create a new evidence bundle for an item
   */
  async createBundleForItem(itemId: string): Promise<EvidenceBundle> {
    // Delete any existing bundle for this item (one bundle per item)
    await this.bundleRepo.delete({ itemId });

    const bundle = this.bundleRepo.create({
      itemId,
      items: [],
    });

    return this.bundleRepo.save(bundle);
  }

  /**
   * Create a new evidence bundle for a research run
   * Phase 6 Sub-Phase 8
   */
  async createBundleForResearchRun(
    itemId: string,
    researchRunId: string,
  ): Promise<EvidenceBundle> {
    const bundle = this.bundleRepo.create({
      itemId,
      researchRunId,
      items: [],
    });

    return this.bundleRepo.save(bundle);
  }

  /**
   * Add an evidence item to a bundle
   */
  async addItem(
    bundleId: string,
    type: EvidenceItemType,
    data: EvidenceItemData,
  ): Promise<EvidenceItem> {
    const item = this.itemRepo.create({
      bundleId,
      type,
      data,
    });

    return this.itemRepo.save(item);
  }

  /**
   * Add multiple evidence items to a bundle
   */
  async addItems(
    bundleId: string,
    items: Array<{ type: EvidenceItemType; data: EvidenceItemData }>,
  ): Promise<EvidenceItem[]> {
    const entities = items.map((item) =>
      this.itemRepo.create({
        bundleId,
        type: item.type,
        data: item.data,
      }),
    );

    return this.itemRepo.save(entities);
  }

  /**
   * Get the evidence bundle for an item
   */
  async getBundleForItem(itemId: string): Promise<EvidenceBundle | null> {
    return this.bundleRepo.findOne({
      where: { itemId },
      relations: ['items'],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
    });
  }

  /**
   * Get the evidence bundle for a research run
   * Phase 6 Sub-Phase 8
   */
  async getBundleForResearchRun(researchRunId: string): Promise<EvidenceBundle | null> {
    return this.bundleRepo.findOne({
      where: { researchRunId },
      relations: ['items'],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
    });
  }

  /**
   * List all evidence bundles for an item
   * Phase 6 Sub-Phase 8
   */
  async listBundlesForItem(itemId: string): Promise<EvidenceBundle[]> {
    return this.bundleRepo.find({
      where: { itemId },
      relations: ['items'],
      order: {
        generatedAt: 'DESC',
        items: {
          createdAt: 'ASC',
        },
      },
    });
  }

  /**
   * Convert entity to DTO
   */
  toDto(bundle: EvidenceBundle): EvidenceBundleDto {
    return {
      id: bundle.id,
      itemId: bundle.itemId,
      researchRunId: bundle.researchRunId,
      generatedAt: bundle.generatedAt.toISOString(),
      items: bundle.items.map((item) => ({
        id: item.id,
        type: item.type,
        data: item.data,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
