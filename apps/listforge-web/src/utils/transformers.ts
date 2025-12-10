/**
 * Data transformation utilities for converting between API types and UI types
 */

import type { Product } from '@listforge/ui';
import type { Item } from '@listforge/core-types';

/**
 * Transform a single Item to Product format for ProductGrid
 */
export function itemToProduct(item: Item): Product {
  return {
    id: item.id,
    name: item.title || 'Untitled Item',
    description: item.description || undefined,
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
export function itemsToProducts(items: Item[]): Product[] {
  return items.map(itemToProduct);
}

/**
 * Extract primary image URL from item
 */
export function getItemPrimaryImage(item: Item): string | undefined {
  return item.primaryImageUrl || item.photos?.[0]?.url;
}

/**
 * Get item display title (with fallback)
 */
export function getItemTitle(item: Item): string {
  return item.title || item.subtitle || 'Untitled Item';
}

/**
 * Check if item is in stock
 */
export function isItemInStock(item: Item): boolean {
  return item.lifecycleStatus === 'ready' || item.lifecycleStatus === 'listed';
}

/**
 * Check if item is sellable (has required data for listing)
 */
export function isItemSellable(item: Item): boolean {
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
export function getItemStatusText(item: Item): string {
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
 * Calculate item profit margin (if cost basis is available)
 */
export function calculateItemProfit(item: Item): number | null {
  if (!item.defaultPrice || !item.costBasis) {
    return null;
  }
  return item.defaultPrice - item.costBasis;
}

/**
 * Calculate item profit margin percentage
 */
export function calculateItemProfitMargin(item: Item): number | null {
  if (!item.defaultPrice || !item.costBasis || item.defaultPrice === 0) {
    return null;
  }
  return ((item.defaultPrice - item.costBasis) / item.defaultPrice) * 100;
}
