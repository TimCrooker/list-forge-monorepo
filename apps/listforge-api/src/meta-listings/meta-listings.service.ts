import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaListing } from './entities/meta-listing.entity';
import { Item } from '../items/entities/item.entity';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { MetaListingDto } from '@listforge/api-types';

@Injectable()
export class MetaListingsService {
  constructor(
    @InjectRepository(MetaListing)
    private metaListingRepo: Repository<MetaListing>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
  ) {}

  async findOne(id: string, ctx: RequestContext): Promise<MetaListingDto> {
    const metaListing = await this.metaListingRepo.findOne({
      where: { id },
      relations: ['item'],
    });

    if (!metaListing) {
      throw new NotFoundException('Meta listing not found');
    }

    // Verify org access
    if (metaListing.item.orgId !== ctx.currentOrgId) {
      throw new NotFoundException('Meta listing not found');
    }

    return this.toDto(metaListing);
  }

  async findByItemId(
    itemId: string,
    ctx: RequestContext,
  ): Promise<MetaListingDto | null> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, orgId: ctx.currentOrgId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const metaListing = await this.metaListingRepo.findOne({
      where: { itemId },
    });

    return metaListing ? this.toDto(metaListing) : null;
  }

  private toDto(metaListing: MetaListing): MetaListingDto {
    return {
      id: metaListing.id,
      itemId: metaListing.itemId,
      aiStatus: metaListing.aiStatus,
      category: metaListing.category,
      brand: metaListing.brand,
      model: metaListing.model,
      attributes: metaListing.attributes,
      generatedTitle: metaListing.generatedTitle,
      generatedDescription: metaListing.generatedDescription,
      bulletPoints: metaListing.bulletPoints,
      priceSuggested: metaListing.priceSuggested
        ? Number(metaListing.priceSuggested)
        : null,
      priceMin: metaListing.priceMin ? Number(metaListing.priceMin) : null,
      priceMax: metaListing.priceMax ? Number(metaListing.priceMax) : null,
      shippingOptions: metaListing.shippingOptions,
      missingFields: metaListing.missingFields,
      createdAt: metaListing.createdAt.toISOString(),
      updatedAt: metaListing.updatedAt.toISOString(),
    };
  }
}

