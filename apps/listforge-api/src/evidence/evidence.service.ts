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
   * Create a new evidence bundle for a listing draft
   */
  async createBundle(listingDraftId: string): Promise<EvidenceBundle> {
    // Delete any existing bundle for this draft (one bundle per draft)
    await this.bundleRepo.delete({ listingDraftId });

    const bundle = this.bundleRepo.create({
      listingDraftId,
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
   * Get the evidence bundle for a listing draft
   */
  async getBundleForDraft(listingDraftId: string): Promise<EvidenceBundle | null> {
    return this.bundleRepo.findOne({
      where: { listingDraftId },
      relations: ['items'],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
    });
  }

  /**
   * Delete evidence bundle for a listing draft
   */
  async deleteBundleForDraft(listingDraftId: string): Promise<void> {
    await this.bundleRepo.delete({ listingDraftId });
  }

  /**
   * Convert entity to DTO
   */
  toDto(bundle: EvidenceBundle): EvidenceBundleDto {
    return {
      id: bundle.id,
      listingDraftId: bundle.listingDraftId,
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
