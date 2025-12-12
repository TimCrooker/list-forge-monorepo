/**
 * CompAttributeService
 *
 * Slice 5: Structured Comp Attribute Matching
 *
 * Provides category-aware attribute weights and extraction for comp scoring.
 * Replaces hardcoded uniform weights with dynamic lookups based on category.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  CategoryId,
  CategoryAttributeWeights,
  CompAttributes,
  AttributeMatchResult,
  ResearchEvidenceRecord,
} from '@listforge/core-types';
import {
  getCategoryAttributeWeights,
  getValidationWeights,
  getVariantImportance,
  getMatchBoosts,
  DEFAULT_ATTRIBUTE_WEIGHTS,
} from '../data/category-attribute-weights';

// =============================================================================
// Constants
// =============================================================================

/** Confidence threshold for partial matches */
const PARTIAL_MATCH_THRESHOLD = 0.6;

/** Score impact for exact matches */
const EXACT_MATCH_SCORE = 1.0;

/** Score impact for partial matches */
const PARTIAL_MATCH_SCORE = 0.6;

/** Score impact for missing data (neutral) */
const MISSING_SCORE = 0.0;

/** Score penalty for mismatches */
const MISMATCH_PENALTY = -0.3;

// =============================================================================
// Extraction Patterns
// =============================================================================

/** Common storage capacity patterns */
const STORAGE_PATTERN = /\b(\d+)\s*(gb|tb|mb)\b/i;

/** Common size patterns */
const SIZE_PATTERNS = {
  clothing: /\b(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl)\b/i,
  shoes: /\b(us\s*)?(\d+\.?\d*)\s*(us|uk|eu)?\b/i,
  general: /\bsize\s*[:=]?\s*(\w+)\b/i,
};

/** Year patterns */
const YEAR_PATTERN = /\b(19|20)\d{2}\b/;

/** Condition patterns */
const CONDITION_PATTERNS = {
  mint: /\b(mint|pristine|perfect|flawless)\b/i,
  excellent: /\b(excellent|great|like new|near mint)\b/i,
  good: /\b(good|nice|clean)\b/i,
  fair: /\b(fair|okay|decent|average)\b/i,
  poor: /\b(poor|bad|damaged|worn)\b/i,
};

/** Edition patterns */
const EDITION_PATTERNS = {
  og: /\b(og|original)\b/i,
  retro: /\b(retro|reissue|re-release)\b/i,
  limited: /\b(limited|ltd|exclusive|special)\b/i,
  anniversary: /\b(\d+th|anniversary)\b/i,
};

/** Grade patterns (for trading cards) */
const GRADE_PATTERNS = {
  psa: /\bpsa\s*(\d+\.?\d*)\b/i,
  bgs: /\bbgs\s*(\d+\.?\d*)\b/i,
  cgc: /\bcgc\s*(\d+\.?\d*)\b/i,
};

@Injectable()
export class CompAttributeService {
  private readonly logger = new Logger(CompAttributeService.name);

  // ===========================================================================
  // Weight Lookup Methods
  // ===========================================================================

  /**
   * Get complete attribute weights for a category
   */
  getWeights(categoryId?: CategoryId): CategoryAttributeWeights {
    return getCategoryAttributeWeights(categoryId);
  }

  /**
   * Get validation weights for comp scoring
   * Used in calculateOverallScore()
   */
  getValidationWeights(categoryId?: CategoryId): CategoryAttributeWeights['validationWeights'] {
    return getValidationWeights(categoryId);
  }

  /**
   * Get variant importance weights
   * Used in validateVariant()
   */
  getVariantImportance(categoryId?: CategoryId): CategoryAttributeWeights['variantImportance'] {
    return getVariantImportance(categoryId);
  }

  /**
   * Get match boosts for relevance scoring
   * Used in scoreCompRelevanceHeuristic()
   */
  getMatchBoosts(categoryId?: CategoryId): CategoryAttributeWeights['matchBoosts'] {
    return getMatchBoosts(categoryId);
  }

  // ===========================================================================
  // Attribute Extraction Methods
  // ===========================================================================

  /**
   * Extract structured attributes from a comp's title and data
   */
  extractAttributes(
    comp: ResearchEvidenceRecord,
    categoryId?: CategoryId,
  ): CompAttributes {
    const attrs: CompAttributes = {};
    const title = comp.title?.toLowerCase() || '';
    const extractedData = comp.extractedData || {};

    // Extract from extractedData first (higher confidence)
    if (extractedData.brand) {
      attrs.brand = String(extractedData.brand);
    }
    if (extractedData.model) {
      attrs.model = String(extractedData.model);
    }
    if (extractedData.color) {
      attrs.color = String(extractedData.color);
    }
    if (extractedData.size) {
      attrs.size = String(extractedData.size);
    }
    if (extractedData.colorway) {
      attrs.colorway = String(extractedData.colorway);
    }
    if (extractedData.storage) {
      attrs.storage = String(extractedData.storage);
    }
    if (extractedData.material) {
      attrs.material = String(extractedData.material);
    }
    if (extractedData.grade) {
      attrs.grade = String(extractedData.grade);
    }
    if (extractedData.refNumber) {
      attrs.refNumber = String(extractedData.refNumber);
    }

    // Extract condition from comp
    attrs.condition = comp.condition || this.extractCondition(title);

    // Extract year if not already present
    if (!attrs.year) {
      const yearMatch = title.match(YEAR_PATTERN);
      if (yearMatch) {
        attrs.year = parseInt(yearMatch[0], 10);
      }
    }

    // Category-specific extraction
    attrs.edition = this.extractEdition(title);

    // Extract storage for electronics
    if (categoryId === 'electronics_phones' || categoryId === 'electronics_gaming') {
      if (!attrs.storage) {
        const storageMatch = title.match(STORAGE_PATTERN);
        if (storageMatch) {
          attrs.storage = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
        }
      }
    }

    // Extract grade for trading cards
    if (categoryId === 'trading_cards') {
      if (!attrs.grade) {
        attrs.grade = this.extractGrade(title);
      }
    }

    // Extract size
    if (!attrs.size) {
      attrs.size = this.extractSize(title, categoryId);
    }

    return attrs;
  }

  /**
   * Extract condition from title text
   */
  private extractCondition(title: string): string | undefined {
    for (const [condition, pattern] of Object.entries(CONDITION_PATTERNS)) {
      if (pattern.test(title)) {
        return condition;
      }
    }
    return undefined;
  }

  /**
   * Extract edition type from title
   */
  private extractEdition(title: string): string | undefined {
    for (const [edition, pattern] of Object.entries(EDITION_PATTERNS)) {
      if (pattern.test(title)) {
        return edition;
      }
    }
    return undefined;
  }

  /**
   * Extract grade from title (trading cards)
   */
  private extractGrade(title: string): string | undefined {
    for (const [grader, pattern] of Object.entries(GRADE_PATTERNS)) {
      const match = title.match(pattern);
      if (match) {
        return `${grader.toUpperCase()} ${match[1]}`;
      }
    }
    return undefined;
  }

  /**
   * Extract size from title
   */
  private extractSize(title: string, categoryId?: CategoryId): string | undefined {
    // Try category-specific patterns first
    if (categoryId === 'sneakers') {
      const match = title.match(SIZE_PATTERNS.shoes);
      if (match) {
        return match[0].trim();
      }
    }

    if (categoryId === 'designer_clothing' || categoryId === 'vintage_denim') {
      const match = title.match(SIZE_PATTERNS.clothing);
      if (match) {
        return match[0].toUpperCase();
      }
    }

    // Try general pattern
    const generalMatch = title.match(SIZE_PATTERNS.general);
    if (generalMatch) {
      return generalMatch[1];
    }

    return undefined;
  }

  // ===========================================================================
  // Attribute Scoring Methods
  // ===========================================================================

  /**
   * Score a comp by detailed attribute-level matching
   * Returns overall score and breakdown of each attribute's contribution
   */
  scoreByAttributes(
    itemAttrs: CompAttributes,
    compAttrs: CompAttributes,
    categoryId?: CategoryId,
  ): { score: number; matchResults: AttributeMatchResult[] } {
    const variantWeights = this.getVariantImportance(categoryId);
    const matchResults: AttributeMatchResult[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Score each variant attribute
    const attributesToScore: Array<{
      attr: keyof CompAttributes;
      weight: number;
    }> = [
      { attr: 'color', weight: variantWeights.color },
      { attr: 'size', weight: variantWeights.size },
      { attr: 'edition', weight: variantWeights.edition },
      { attr: 'material', weight: variantWeights.material },
      { attr: 'year', weight: variantWeights.year },
    ];

    // Add category-specific attributes
    if (variantWeights.colorway) {
      attributesToScore.push({ attr: 'colorway', weight: variantWeights.colorway });
    }
    if (variantWeights.storage) {
      attributesToScore.push({ attr: 'storage', weight: variantWeights.storage });
    }
    if (variantWeights.refNumber) {
      attributesToScore.push({ attr: 'refNumber', weight: variantWeights.refNumber });
    }
    if (variantWeights.grade) {
      attributesToScore.push({ attr: 'grade', weight: variantWeights.grade });
    }

    for (const { attr, weight } of attributesToScore) {
      if (weight <= 0) continue;

      const itemValue = itemAttrs[attr];
      const compValue = compAttrs[attr];

      const result = this.matchAttribute(
        attr,
        itemValue !== undefined ? String(itemValue) : null,
        compValue !== undefined ? String(compValue) : null,
        weight,
      );

      matchResults.push(result);
      totalScore += result.scoreImpact;
      totalWeight += weight;
    }

    // Normalize score to 0-1 range
    const normalizedScore = totalWeight > 0
      ? Math.max(0, Math.min(1, (totalScore / totalWeight + 1) / 2))
      : 0.5;

    return { score: normalizedScore, matchResults };
  }

  /**
   * Match a single attribute and calculate its score contribution
   */
  private matchAttribute(
    attribute: string,
    itemValue: string | null,
    compValue: string | null,
    importance: number,
  ): AttributeMatchResult {
    // Both missing - neutral
    if (!itemValue && !compValue) {
      return {
        attribute,
        itemValue,
        compValue,
        matchType: 'missing',
        importance,
        scoreImpact: MISSING_SCORE,
      };
    }

    // Item has value, comp missing - neutral (can't penalize)
    if (itemValue && !compValue) {
      return {
        attribute,
        itemValue,
        compValue,
        matchType: 'missing',
        importance,
        scoreImpact: MISSING_SCORE,
      };
    }

    // Comp has value, item missing - slight boost (comp has info)
    if (!itemValue && compValue) {
      return {
        attribute,
        itemValue,
        compValue,
        matchType: 'missing',
        importance,
        scoreImpact: MISSING_SCORE,
      };
    }

    // Both have values - compare
    const itemLower = itemValue!.toLowerCase().trim();
    const compLower = compValue!.toLowerCase().trim();

    // Exact match
    if (itemLower === compLower) {
      return {
        attribute,
        itemValue,
        compValue,
        matchType: 'exact',
        importance,
        scoreImpact: EXACT_MATCH_SCORE * importance,
      };
    }

    // Partial match (one contains the other)
    if (itemLower.includes(compLower) || compLower.includes(itemLower)) {
      return {
        attribute,
        itemValue,
        compValue,
        matchType: 'partial',
        importance,
        scoreImpact: PARTIAL_MATCH_SCORE * importance,
      };
    }

    // Fuzzy match for similar values
    const similarity = this.calculateSimilarity(itemLower, compLower);
    if (similarity >= PARTIAL_MATCH_THRESHOLD) {
      return {
        attribute,
        itemValue,
        compValue,
        matchType: 'partial',
        importance,
        scoreImpact: similarity * importance,
      };
    }

    // Mismatch
    return {
      attribute,
      itemValue,
      compValue,
      matchType: 'mismatch',
      importance,
      scoreImpact: MISMATCH_PENALTY * importance,
    };
  }

  /**
   * Calculate simple string similarity (Jaccard-like)
   */
  private calculateSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;

    const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 1));
    const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 1));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) {
        intersection++;
      }
    }

    const union = wordsA.size + wordsB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Get all available categories with weights
   */
  getAvailableCategories(): CategoryId[] {
    return [
      'sneakers',
      'luxury_handbags',
      'watches',
      'electronics_phones',
      'electronics_gaming',
      'trading_cards',
      'vintage_denim',
      'designer_clothing',
      'audio_equipment',
      'general',
    ];
  }

  /**
   * Check if a category has specific weights defined
   */
  hasSpecificWeights(categoryId: CategoryId): boolean {
    const weights = getCategoryAttributeWeights(categoryId);
    return weights !== DEFAULT_ATTRIBUTE_WEIGHTS;
  }
}
