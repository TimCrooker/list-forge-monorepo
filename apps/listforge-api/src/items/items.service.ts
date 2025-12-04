import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateItemRequest,
  CreateItemResponse,
  GetItemResponse,
  ListItemsResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  ItemDto,
  ItemPhotoDto,
  MetaListingDto,
} from '@listforge/api-types';

// Type for uploaded files
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};
import { Item } from './entities/item.entity';
import { ItemPhoto } from './entities/item-photo.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { StorageService } from '../storage/storage.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import { StartWorkflowJob } from '@listforge/queue-types';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ItemPhoto)
    private photoRepo: Repository<ItemPhoto>,
    @InjectRepository(MetaListing)
    private metaListingRepo: Repository<MetaListing>,
    private storageService: StorageService,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private aiWorkflowQueue: Queue,
  ) {}

  async create(
    ctx: RequestContext,
    photos: MulterFile[],
  ): Promise<CreateItemResponse> {
    if (!photos || photos.length === 0) {
      throw new ForbiddenException('At least one photo is required');
    }

    // Create item
    const item = this.itemRepo.create({
      orgId: ctx.currentOrgId,
      status: 'draft',
      title: null,
    });
    const savedItem = await this.itemRepo.save(item);

    // Upload photos and create photo records
    const photoPromises = photos.map(async (file, index) => {
      const filename = `${ctx.currentOrgId}/${savedItem.id}/${Date.now()}-${file.originalname}`;
      const storagePath = await this.storageService.uploadPhoto(
        file.buffer,
        filename,
      );

      return this.photoRepo.save({
        itemId: savedItem.id,
        storagePath,
        isPrimary: index === 0,
      });
    });

    const savedPhotos = await Promise.all(photoPromises);

    // Create meta listing
    const metaListing = this.metaListingRepo.create({
      itemId: savedItem.id,
      aiStatus: 'pending',
    });
    const savedMetaListing = await this.metaListingRepo.save(metaListing);

    // Enqueue AI workflow
    const job: StartWorkflowJob = {
      workflowType: 'photo-intake-v1',
      itemId: savedItem.id,
      orgId: ctx.currentOrgId,
      userId: ctx.userId,
    };
    await this.aiWorkflowQueue.add('start-workflow', job);

    return {
      item: this.toDto(savedItem, savedPhotos, savedMetaListing),
    };
  }

  async findAll(
    ctx: RequestContext,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ListItemsResponse> {
    const [items, total] = await this.itemRepo.findAndCount({
      where: { orgId: ctx.currentOrgId },
      relations: ['photos', 'metaListing'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map((item) => this.toDto(item, item.photos, item.metaListing)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string, ctx: RequestContext): Promise<GetItemResponse> {
    const item = await this.itemRepo.findOne({
      where: { id, orgId: ctx.currentOrgId },
      relations: ['photos', 'metaListing'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return {
      item: this.toDto(item, item.photos, item.metaListing),
    };
  }

  async update(
    id: string,
    ctx: RequestContext,
    data: UpdateItemRequest,
  ): Promise<UpdateItemResponse> {
    const item = await this.itemRepo.findOne({
      where: { id, orgId: ctx.currentOrgId },
      relations: ['photos', 'metaListing'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (data.title !== undefined) {
      item.title = data.title;
    }
    if (data.status !== undefined) {
      item.status = data.status;
    }

    const savedItem = await this.itemRepo.save(item);

    return {
      item: this.toDto(savedItem, item.photos, item.metaListing),
    };
  }

  async remove(id: string, ctx: RequestContext): Promise<void> {
    const item = await this.itemRepo.findOne({
      where: { id, orgId: ctx.currentOrgId },
      relations: ['photos'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Delete photos from storage
    const deletePromises = item.photos.map((photo) =>
      this.storageService.deletePhoto(photo.storagePath),
    );
    await Promise.all(deletePromises);

    // Delete item (cascade will handle photos and meta listing)
    await this.itemRepo.remove(item);
  }

  private toDto(
    item: Item,
    photos: ItemPhoto[],
    metaListing: MetaListing | null,
  ): ItemDto {
    return {
      id: item.id,
      orgId: item.orgId,
      status: item.status,
      title: item.title,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      photos: photos.map((photo) => ({
        id: photo.id,
        itemId: photo.itemId,
        storagePath: photo.storagePath,
        isPrimary: photo.isPrimary,
        createdAt: photo.createdAt.toISOString(),
      })),
      metaListing: metaListing
        ? {
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
          }
        : null,
    };
  }
}

