import { ItemStatus, MetaListingAiStatus } from '@listforge/core-types';

export interface ItemPhotoDto {
  id: string;
  itemId: string;
  storagePath: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface MetaListingDto {
  id: string;
  itemId: string;
  aiStatus: MetaListingAiStatus;
  category: string | null;
  brand: string | null;
  model: string | null;
  attributes: Record<string, any> | null;
  generatedTitle: string | null;
  generatedDescription: string | null;
  bulletPoints: string[] | null;
  priceSuggested: number | null;
  priceMin: number | null;
  priceMax: number | null;
  shippingOptions: Record<string, any> | null;
  missingFields: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemDto {
  id: string;
  orgId: string;
  status: ItemStatus;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  photos: ItemPhotoDto[];
  metaListing: MetaListingDto | null;
}

export interface CreateItemRequest {
  photos: File[];
}

export interface CreateItemResponse {
  item: ItemDto;
}

export interface ListItemsResponse {
  items: ItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetItemResponse {
  item: ItemDto;
}

export interface UpdateItemRequest {
  title?: string;
  status?: ItemStatus;
}

export interface UpdateItemResponse {
  item: ItemDto;
}

