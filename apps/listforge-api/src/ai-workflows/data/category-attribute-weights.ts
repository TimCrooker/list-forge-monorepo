/**
 * Category Attribute Weights Database
 *
 * Slice 5: Structured Comp Attribute Matching
 *
 * Defines category-specific weights for comp validation and scoring.
 * Different product categories require different attribute priorities:
 * - Sneakers: colorway is critical for pricing
 * - Watches: reference number matters more than color
 * - Trading cards: grade dominates all other factors
 *
 * These weights are derived from expert reseller knowledge and the
 * valueDrivers defined in category-inspection-guides.ts.
 */

import { CategoryId, CategoryAttributeWeights } from '@listforge/core-types';

// =============================================================================
// CATEGORY-SPECIFIC WEIGHTS
// All validationWeights must sum to 1.0 for proper normalization
// =============================================================================

/**
 * Sneakers (Nike, Jordan, Adidas, etc.)
 * Key value drivers: colorway, OG vs Retro, size, DS condition
 */
const sneakersWeights: CategoryAttributeWeights = {
  categoryId: 'sneakers',
  validationWeights: {
    brand: 0.15,       // Brand usually obvious (Nike vs Adidas)
    model: 0.30,       // Model critical - "Air Max 90" vs "Air Max 97"
    variant: 0.30,     // HIGH - colorway defines the release
    condition: 0.10,   // DS/VNDS is binary for sneakers
    recency: 0.10,     // Recent sales important for hype items
    priceOutlier: 0.05,
  },
  variantImportance: {
    colorway: 0.45,    // Colorway is THE defining feature
    size: 0.30,        // Size significantly affects price
    edition: 0.15,     // OG vs Retro
    year: 0.10,        // Release year matters
    color: 0.0,        // Use colorway instead
    material: 0.0,     // Less important for sneakers
  },
  matchBoosts: {
    brand: 0.10,
    model: 0.20,       // High boost for exact model match
    condition: 0.10,
    variant: 0.20,     // High boost for colorway match
  },
};

/**
 * Luxury Handbags (Louis Vuitton, Chanel, Hermès, etc.)
 * Key value drivers: material (exotic leather), color rarity, size, condition
 */
const luxuryHandbagsWeights: CategoryAttributeWeights = {
  categoryId: 'luxury_handbags',
  validationWeights: {
    brand: 0.25,       // Brand is everything in luxury
    model: 0.25,       // Specific style matters (Neverfull vs Speedy)
    variant: 0.20,     // Color/material affects price significantly
    condition: 0.20,   // Condition critical for luxury
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    material: 0.40,    // Exotic leather vs canvas is huge
    color: 0.30,       // Rare colors command premium
    size: 0.20,        // PM vs MM vs GM
    edition: 0.10,     // Limited editions
    year: 0.0,         // Less important unless vintage
    colorway: 0.0,
  },
  matchBoosts: {
    brand: 0.15,
    model: 0.15,
    condition: 0.20,   // High boost for condition match
    variant: 0.15,
  },
};

/**
 * Watches (Rolex, Omega, Seiko, etc.)
 * Key value drivers: reference number, box/papers, dial condition, original parts
 */
const watchesWeights: CategoryAttributeWeights = {
  categoryId: 'watches',
  validationWeights: {
    brand: 0.20,       // Brand important but obvious
    model: 0.40,       // Reference number is CRITICAL
    variant: 0.10,     // Dial color less impactful than ref
    condition: 0.20,   // Condition very important
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    refNumber: 0.60,   // Reference number dominates
    color: 0.15,       // Dial color
    material: 0.15,    // Steel vs gold
    edition: 0.10,     // Limited editions
    size: 0.0,         // Size usually fixed per reference
    year: 0.0,         // Less important unless vintage
    colorway: 0.0,
  },
  matchBoosts: {
    brand: 0.10,
    model: 0.25,       // Very high boost for reference match
    condition: 0.15,
    variant: 0.10,
  },
};

/**
 * Electronics - Phones (iPhone, Samsung, etc.)
 * Key value drivers: storage capacity, carrier lock, battery health, condition
 */
const electronicsPhonesWeights: CategoryAttributeWeights = {
  categoryId: 'electronics_phones',
  validationWeights: {
    brand: 0.15,
    model: 0.30,       // Model important (iPhone 15 vs 14)
    variant: 0.30,     // Storage capacity is major price driver
    condition: 0.15,
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    storage: 0.55,     // Storage capacity dominates
    color: 0.20,       // Color affects price slightly
    edition: 0.15,     // Pro vs regular
    size: 0.10,        // Pro Max vs regular
    material: 0.0,
    year: 0.0,
    colorway: 0.0,
  },
  matchBoosts: {
    brand: 0.10,
    model: 0.20,
    condition: 0.15,
    variant: 0.20,     // High boost for storage match
  },
};

/**
 * Electronics - Gaming (PS5, Xbox, Switch, etc.)
 * Key value drivers: digital vs disc, storage, special editions
 */
const electronicsGamingWeights: CategoryAttributeWeights = {
  categoryId: 'electronics_gaming',
  validationWeights: {
    brand: 0.15,
    model: 0.35,       // Model critical (PS5 Digital vs Disc)
    variant: 0.25,     // Edition matters a lot
    condition: 0.15,
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    edition: 0.45,     // Digital vs Disc, special editions
    storage: 0.30,     // Storage for applicable consoles
    color: 0.15,       // Color variants
    size: 0.10,        // Slim vs regular
    material: 0.0,
    year: 0.0,
    colorway: 0.0,
  },
  matchBoosts: {
    brand: 0.10,
    model: 0.25,
    condition: 0.10,
    variant: 0.20,
  },
};

/**
 * Trading Cards (Pokemon, Sports, MTG, etc.)
 * Key value drivers: GRADE dominates, then player/character, 1st edition, rarity
 */
const tradingCardsWeights: CategoryAttributeWeights = {
  categoryId: 'trading_cards',
  validationWeights: {
    brand: 0.10,       // Pokemon vs Topps less important than card specifics
    model: 0.20,       // Specific card (Charizard, Michael Jordan)
    variant: 0.15,     // Rarity, parallel type
    condition: 0.45,   // GRADE IS EVERYTHING (PSA 10 vs 9 is huge)
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    grade: 0.70,       // Grade dominates all other factors
    edition: 0.20,     // 1st edition vs unlimited
    color: 0.05,       // Refractor/holo type
    size: 0.05,        // Print run size
    material: 0.0,
    year: 0.0,
    colorway: 0.0,
  },
  matchBoosts: {
    brand: 0.05,
    model: 0.15,
    condition: 0.30,   // Very high boost for grade match
    variant: 0.15,
  },
};

/**
 * Vintage Denim (Levi's, Lee, Wrangler)
 * Key value drivers: era/label type (Big E), selvedge, Made in USA
 */
const vintageDenimWeights: CategoryAttributeWeights = {
  categoryId: 'vintage_denim',
  validationWeights: {
    brand: 0.25,       // Brand important (Levi's commands premium)
    model: 0.25,       // Style number (501, 505)
    variant: 0.30,     // Era, selvedge status critical
    condition: 0.10,   // Fades can actually add value
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    edition: 0.40,     // Big E vs small e, era
    material: 0.25,    // Selvedge vs not
    size: 0.20,        // Size affects liquidity
    color: 0.10,       // Wash/fade type
    year: 0.05,        // Production year
    colorway: 0.0,
    storage: 0.0,
  },
  matchBoosts: {
    brand: 0.15,
    model: 0.15,
    condition: 0.10,
    variant: 0.25,     // High boost for era match
  },
};

/**
 * Designer Clothing (Gucci, Supreme, etc.)
 * Key value drivers: limited/collab, runway vs diffusion, season
 */
const designerClothingWeights: CategoryAttributeWeights = {
  categoryId: 'designer_clothing',
  validationWeights: {
    brand: 0.30,       // Brand is primary driver
    model: 0.25,       // Specific piece/collection
    variant: 0.20,     // Size, colorway
    condition: 0.15,   // Tags still attached, etc.
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    size: 0.35,        // Size heavily affects resale
    color: 0.25,       // Color variants
    edition: 0.25,     // Limited/collab status
    material: 0.10,    // Material composition
    year: 0.05,        // Season
    colorway: 0.0,
    storage: 0.0,
  },
  matchBoosts: {
    brand: 0.20,
    model: 0.15,
    condition: 0.15,
    variant: 0.15,
  },
};

/**
 * Audio Equipment (Sony, Bose, JBL, etc.)
 * Key value drivers: working condition, accessories, vintage status
 */
const audioEquipmentWeights: CategoryAttributeWeights = {
  categoryId: 'audio_equipment',
  validationWeights: {
    brand: 0.20,
    model: 0.35,       // Specific model important
    variant: 0.15,     // Color/edition
    condition: 0.20,   // Working condition critical
    recency: 0.05,
    priceOutlier: 0.05,
  },
  variantImportance: {
    color: 0.30,       // Color variants
    edition: 0.30,     // Special editions
    material: 0.20,    // Build quality
    size: 0.15,        // Size variants
    year: 0.05,        // Vintage status
    colorway: 0.0,
    storage: 0.0,
  },
  matchBoosts: {
    brand: 0.15,
    model: 0.20,
    condition: 0.20,
    variant: 0.10,
  },
};

/**
 * General/Fallback weights
 * Balanced weights for unknown categories
 */
const generalWeights: CategoryAttributeWeights = {
  categoryId: 'general',
  validationWeights: {
    brand: 0.25,
    model: 0.30,
    variant: 0.15,
    condition: 0.15,
    recency: 0.10,
    priceOutlier: 0.05,
  },
  variantImportance: {
    color: 0.25,
    size: 0.25,
    edition: 0.20,
    material: 0.15,
    year: 0.15,
    colorway: 0.0,
    storage: 0.0,
  },
  matchBoosts: {
    brand: 0.15,
    model: 0.15,
    condition: 0.10,
    variant: 0.10,
  },
};

// =============================================================================
// WEIGHTS REGISTRY
// =============================================================================

/**
 * All category attribute weights indexed by category ID
 */
export const CATEGORY_ATTRIBUTE_WEIGHTS: Partial<Record<CategoryId, CategoryAttributeWeights>> = {
  sneakers: sneakersWeights,
  luxury_handbags: luxuryHandbagsWeights,
  watches: watchesWeights,
  electronics_phones: electronicsPhonesWeights,
  electronics_gaming: electronicsGamingWeights,
  trading_cards: tradingCardsWeights,
  vintage_denim: vintageDenimWeights,
  designer_clothing: designerClothingWeights,
  audio_equipment: audioEquipmentWeights,
  general: generalWeights,
};

/**
 * Default weights for categories without specific configuration
 */
export const DEFAULT_ATTRIBUTE_WEIGHTS = generalWeights;

/**
 * Get attribute weights for a category
 * Falls back to general weights if category not found
 */
export function getCategoryAttributeWeights(categoryId?: CategoryId): CategoryAttributeWeights {
  if (!categoryId) {
    return DEFAULT_ATTRIBUTE_WEIGHTS;
  }
  return CATEGORY_ATTRIBUTE_WEIGHTS[categoryId] || DEFAULT_ATTRIBUTE_WEIGHTS;
}

/**
 * Get validation weights for a category
 */
export function getValidationWeights(categoryId?: CategoryId): CategoryAttributeWeights['validationWeights'] {
  return getCategoryAttributeWeights(categoryId).validationWeights;
}

/**
 * Get variant importance weights for a category
 */
export function getVariantImportance(categoryId?: CategoryId): CategoryAttributeWeights['variantImportance'] {
  return getCategoryAttributeWeights(categoryId).variantImportance;
}

/**
 * Get match boosts for a category
 */
export function getMatchBoosts(categoryId?: CategoryId): CategoryAttributeWeights['matchBoosts'] {
  return getCategoryAttributeWeights(categoryId).matchBoosts;
}
