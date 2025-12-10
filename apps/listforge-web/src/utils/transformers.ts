/**
 * Data transformation utilities for converting between API types and UI types
 */

import type { Product } from '@listforge/ui';
import type { ItemDto, ItemSummaryDto } from '@listforge/api-types';

/**
 * Transform a single Item to Product format for ProductGrid
 */
export function itemToProduct(item: ItemDto | ItemSummaryDto): Product {
  return {
    id: item.id,
    name: item.title || 'Untitled Item',
    description: 'description' in item ? item.description || undefined : undefined,
    price: item.defaultPrice || 0,
    images: item.primaryImageUrl ? [item.primaryImageUrl] : [],
    category: undefined, // Could be enhanced to use categoryPath if needed
    tags: [],
    inStock: item.lifecycleStatus === 'ready' || item.lifecycleStatus === 'listed',
    isNew: item.source === 'ai_capture',
    featured: item.aiReviewState === 'approved',
  };
}

/**
 * Transform multiple Items to Product format
 */
export function itemsToProducts(items: (ItemDto | ItemSummaryDto)[]): Product[] {
  return items.map(itemToProduct);
}

/**
 * Extract primary image URL from item
 */
export function getItemPrimaryImage(item: ItemDto | ItemSummaryDto): string | undefined {
  if (item.primaryImageUrl) return item.primaryImageUrl;
  if ('photos' in item && item.photos?.[0]?.url) return item.photos[0].url;
  return undefined;
}

/**
 * Get item display title (with fallback)
 */
export function getItemTitle(item: ItemDto | ItemSummaryDto): string {
  if (item.title) return item.title;
  if ('subtitle' in item && item.subtitle) return item.subtitle;
  return 'Untitled Item';
}

/**
 * Check if item is in stock
 */
export function isItemInStock(item: ItemDto | ItemSummaryDto): boolean {
  return item.lifecycleStatus === 'ready' || item.lifecycleStatus === 'listed';
}

/**
 * Check if item is sellable (has required data for listing) - only works with full ItemDto
 */
export function isItemSellable(item: ItemDto): boolean {
  return Boolean(
    item.title &&
    item.description &&
    item.defaultPrice &&
    item.defaultPrice > 0 &&
    item.photos &&
    item.photos.length > 0
  );
}

/**
 * Get item status display text
 */
export function getItemStatusText(item: ItemDto | ItemSummaryDto): string {
  switch (item.lifecycleStatus) {
    case 'draft':
      return 'Draft';
    case 'ready':
      return 'Ready';
    case 'listed':
      return 'Listed';
    case 'sold':
      return 'Sold';
    case 'archived':
      return 'Archived';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate item profit margin (if cost basis is available) - only works with full ItemDto
 */
export function calculateItemProfit(item: ItemDto): number | null {
  if (!item.defaultPrice || !item.costBasis) {
    return null;
  }
  return item.defaultPrice - item.costBasis;
}

/**
 * Calculate item profit margin percentage - only works with full ItemDto
 */
export function calculateItemProfitMargin(item: ItemDto): number | null {
  if (!item.defaultPrice || !item.costBasis || item.defaultPrice === 0) {
    return null;
  }
  return ((item.defaultPrice - item.costBasis) / item.defaultPrice) * 100;
}
