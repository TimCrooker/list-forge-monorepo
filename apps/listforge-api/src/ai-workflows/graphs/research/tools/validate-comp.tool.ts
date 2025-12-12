/**
 * Comp Validation Tool - Slice 3
 *
 * Validates comparable listings against the item being researched.
 * Uses structured criteria to determine if a comp is truly comparable.
 */

import {
  CompValidation,
  CompValidationCriteria,
  ResearchEvidenceRecord,
  ProductIdentification,
  CategoryId,
} from '@listforge/core-types';
import {
  getValidationWeights,
  getVariantImportance,
} from '../../../data/category-attribute-weights';

/**
 * Item context for validation
 */
export interface ItemValidationContext {
  brand?: string;
  model?: string;
  condition?: string;
  variant?: {
    color?: string;
    size?: string;
    edition?: string;
  };
}

/**
 * Configuration for validation thresholds
 */
export interface ValidationConfig {
  recencyThresholdDays: number; // Max days since sold (default: 90)
  minValidationScore: number; // Minimum score to be considered valid (default: 0.7)
  outlierZScoreThreshold: number; // Z-score threshold for outlier detection (default: 2.5)
}

const DEFAULT_CONFIG: ValidationConfig = {
  recencyThresholdDays: 90,
  minValidationScore: 0.7,
  outlierZScoreThreshold: 2.5,
};

/**
 * Condition grades ordered from best to worst
 * Used to calculate how many grades apart two conditions are
 */
const CONDITION_GRADES = [
  'new',
  'new with tags',
  'new with box',
  'new without tags',
  'new without box',
  'open box',
  'like new',
  'excellent',
  'very good',
  'good',
  'acceptable',
  'fair',
  'used',
  'for parts',
  'for parts or not working',
];

/**
 * Normalize a string for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeString(str: string | undefined | null): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 (no match) and 1 (exact match)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length >= s2.length ? s1 : s2;
    return shorter.length / longer.length;
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

/**
 * Extract brand from comp title using common patterns
 */
function extractBrandFromTitle(title: string): string | undefined {
  const normalized = normalizeString(title);
  // Brand is typically the first word(s) before the model
  const words = normalized.split(' ');
  if (words.length > 0) {
    return words[0];
  }
  return undefined;
}

/**
 * Validate brand match between item and comp
 */
function validateBrand(
  item: ItemValidationContext,
  comp: ResearchEvidenceRecord,
): CompValidationCriteria['brandMatch'] {
  const itemBrand = normalizeString(item.brand);
  const compBrand = normalizeString(
    (comp.extractedData?.brand as string) || extractBrandFromTitle(comp.title),
  );

  if (!itemBrand) {
    // If we don't know the item brand, can't validate
    return {
      matches: true, // Give benefit of doubt
      confidence: 0.3,
      itemBrand: item.brand,
      compBrand: compBrand || undefined,
    };
  }

  if (!compBrand) {
    return {
      matches: false,
      confidence: 0.5,
      itemBrand: item.brand,
      compBrand: undefined,
    };
  }

  const similarity = stringSimilarity(itemBrand, compBrand);
  const matches = similarity >= 0.8;

  return {
    matches,
    confidence: similarity,
    itemBrand: item.brand,
    compBrand: compBrand,
  };
}

/**
 * Validate model match between item and comp
 */
function validateModel(
  item: ItemValidationContext,
  comp: ResearchEvidenceRecord,
): CompValidationCriteria['modelMatch'] {
  const itemModel = normalizeString(item.model);
  const compModel = normalizeString(comp.extractedData?.model as string);
  const compTitle = normalizeString(comp.title);

  if (!itemModel) {
    return {
      matches: true,
      confidence: 0.3,
      itemModel: item.model,
      compModel: compModel || undefined,
    };
  }

  // Check if model appears in comp's model field or title
  let similarity = 0;
  if (compModel) {
    similarity = stringSimilarity(itemModel, compModel);
  }

  // Also check title for model number
  if (similarity < 0.8 && compTitle.includes(itemModel)) {
    similarity = Math.max(similarity, 0.85);
  }

  const matches = similarity >= 0.7;

  return {
    matches,
    confidence: similarity,
    itemModel: item.model,
    compModel: compModel || undefined,
  };
}

/**
 * Validate variant match (color, size, edition)
 *
 * Slice 5: Uses category-specific variant importance weights.
 * Different categories care about different variant attributes:
 * - Sneakers: colorway is critical (0.45 weight)
 * - Phones: storage capacity is critical (0.55 weight)
 * - Trading cards: grade is critical (0.70 weight)
 *
 * @param item - Item context with variant info
 * @param comp - Comparable listing
 * @param categoryId - Optional category for weight lookup
 */
function validateVariant(
  item: ItemValidationContext,
  comp: ResearchEvidenceRecord,
  categoryId?: CategoryId,
): CompValidationCriteria['variantMatch'] {
  const details: string[] = [];

  // Slice 5: Get category-specific variant importance weights
  const variantWeights = getVariantImportance(categoryId);

  // Track weighted scores
  let totalWeight = 0;
  let matchedWeight = 0;

  // Helper to check and score a variant attribute
  const checkAttribute = (
    attrName: string,
    itemValue: string | undefined,
    compValue: string | undefined,
    weight: number,
  ): void => {
    if (!itemValue || weight <= 0) return;

    totalWeight += weight;
    const compTitle = normalizeString(comp.title);
    const itemNorm = normalizeString(itemValue);
    const compNorm = normalizeString(compValue);

    if (compNorm && stringSimilarity(itemNorm, compNorm) >= 0.8) {
      matchedWeight += weight;
      details.push(`${attrName}: ${itemValue} matches ${compValue}`);
    } else if (compTitle.includes(itemNorm)) {
      matchedWeight += weight * 0.8; // Slightly lower confidence for title match
      details.push(`${attrName}: ${itemValue} found in title`);
    } else {
      details.push(`${attrName}: ${itemValue} not found`);
    }
  };

  // Check color/colorway (use colorway weight for sneakers if available)
  const colorWeight = variantWeights.colorway && variantWeights.colorway > 0
    ? variantWeights.colorway
    : variantWeights.color;
  checkAttribute(
    variantWeights.colorway && variantWeights.colorway > 0 ? 'Colorway' : 'Color',
    item.variant?.color,
    (comp.extractedData?.colorway as string) || (comp.extractedData?.color as string),
    colorWeight,
  );

  // Check size
  checkAttribute(
    'Size',
    item.variant?.size,
    comp.extractedData?.size as string,
    variantWeights.size,
  );

  // Check edition
  checkAttribute(
    'Edition',
    item.variant?.edition,
    comp.extractedData?.edition as string,
    variantWeights.edition,
  );

  // Check material (for luxury goods)
  if (variantWeights.material > 0 && comp.extractedData?.material) {
    // Material check if item has it (TODO: add to ItemValidationContext)
  }

  // Check storage (for electronics)
  if (variantWeights.storage && variantWeights.storage > 0) {
    checkAttribute(
      'Storage',
      comp.extractedData?.itemStorage as string, // From item context if available
      comp.extractedData?.storage as string,
      variantWeights.storage,
    );
  }

  // Check grade (for trading cards)
  if (variantWeights.grade && variantWeights.grade > 0) {
    checkAttribute(
      'Grade',
      comp.extractedData?.itemGrade as string, // From item context if available
      comp.extractedData?.grade as string,
      variantWeights.grade,
    );
  }

  // If no variant info to check, pass by default
  if (totalWeight === 0) {
    return {
      matches: true,
      confidence: 1.0,
      details: 'No variant attributes to validate',
    };
  }

  // Weighted confidence
  const confidence = matchedWeight / totalWeight;
  return {
    matches: confidence >= 0.5, // At least half (weighted) should match
    confidence,
    details: details.join('; '),
  };
}

/**
 * Normalize condition string to a standard grade
 */
function normalizeCondition(condition: string | undefined | null): string {
  if (!condition) return 'used';

  const normalized = normalizeString(condition);

  // Map common variations to standard grades
  const mappings: Record<string, string> = {
    'brand new': 'new',
    'mint': 'like new',
    'mint condition': 'like new',
    'near mint': 'like new',
    'nm': 'like new',
    'exc': 'excellent',
    'exc+': 'excellent',
    'vg': 'very good',
    'vg+': 'very good',
    'g': 'good',
    'g+': 'good',
    'acc': 'acceptable',
    'poor': 'for parts',
    'broken': 'for parts or not working',
    'not working': 'for parts or not working',
    'parts only': 'for parts',
    'pre-owned': 'used',
    'pre owned': 'used',
    'preowned': 'used',
    'refurbished': 'very good',
    'seller refurbished': 'very good',
    'manufacturer refurbished': 'like new',
    'certified refurbished': 'like new',
  };

  // Check for exact mapping
  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // Check if normalized condition contains any of our standard grades
  for (const grade of CONDITION_GRADES) {
    if (normalized.includes(grade)) {
      return grade;
    }
  }

  return 'used'; // Default to used if unknown
}

/**
 * Get condition grade index (lower = better condition)
 */
function getConditionGradeIndex(condition: string): number {
  const normalized = normalizeCondition(condition);
  const index = CONDITION_GRADES.indexOf(normalized);
  return index >= 0 ? index : CONDITION_GRADES.indexOf('used');
}

/**
 * Validate condition match between item and comp
 */
function validateCondition(
  item: ItemValidationContext,
  comp: ResearchEvidenceRecord,
): CompValidationCriteria['conditionMatch'] {
  const itemCondition = item.condition;
  const compCondition = comp.condition;

  if (!itemCondition) {
    return {
      matches: true,
      withinGrade: 0,
      itemCondition: undefined,
      compCondition: compCondition || undefined,
    };
  }

  const itemGrade = getConditionGradeIndex(itemCondition);
  const compGrade = getConditionGradeIndex(compCondition || 'used');
  const gradeDistance = Math.abs(itemGrade - compGrade);

  // Items within 2 grades are considered comparable
  const matches = gradeDistance <= 2;

  return {
    matches,
    withinGrade: gradeDistance,
    itemCondition,
    compCondition: compCondition || undefined,
  };
}

/**
 * Validate recency of the comp
 */
function validateRecency(
  comp: ResearchEvidenceRecord,
  config: ValidationConfig,
): CompValidationCriteria['recency'] {
  // Active listings are always "recent"
  if (comp.type === 'active_listing') {
    return {
      valid: true,
      daysSinceSold: null,
      threshold: config.recencyThresholdDays,
    };
  }

  if (!comp.soldDate) {
    // No sold date, assume it's reasonably recent
    return {
      valid: true,
      daysSinceSold: null,
      threshold: config.recencyThresholdDays,
    };
  }

  const soldDate = new Date(comp.soldDate);
  const now = new Date();
  const daysSinceSold = Math.floor(
    (now.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    valid: daysSinceSold <= config.recencyThresholdDays,
    daysSinceSold,
    threshold: config.recencyThresholdDays,
  };
}

/**
 * Calculate mean and standard deviation of prices
 */
function calculatePriceStats(prices: number[]): { mean: number; stdDev: number } {
  if (prices.length === 0) {
    return { mean: 0, stdDev: 0 };
  }

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Validate that comp price is not an outlier
 */
function validatePriceOutlier(
  comp: ResearchEvidenceRecord,
  allComps: ResearchEvidenceRecord[],
  config: ValidationConfig,
): CompValidationCriteria['priceOutlier'] {
  if (!comp.price || comp.price <= 0) {
    return {
      isOutlier: false,
      zScore: undefined,
    };
  }

  // Get all valid prices
  const prices = allComps
    .filter((c) => c.price && c.price > 0)
    .map((c) => c.price!);

  if (prices.length < 3) {
    // Not enough data to detect outliers
    return {
      isOutlier: false,
      zScore: undefined,
    };
  }

  const { mean, stdDev } = calculatePriceStats(prices);

  if (stdDev === 0) {
    // All prices are the same
    return {
      isOutlier: false,
      zScore: 0,
    };
  }

  const zScore = Math.abs((comp.price - mean) / stdDev);
  const isOutlier = zScore > config.outlierZScoreThreshold;

  return {
    isOutlier,
    zScore,
  };
}

/**
 * Calculate overall validation score from criteria
 *
 * Slice 5: Uses category-specific weights from category-attribute-weights.ts
 * Different categories prioritize different attributes:
 * - Sneakers: higher weight on variant (colorway)
 * - Watches: higher weight on model (reference number)
 * - Trading cards: higher weight on condition (grade)
 *
 * @param criteria - Validation criteria results
 * @param categoryId - Optional category for weight lookup
 */
function calculateOverallScore(
  criteria: CompValidationCriteria,
  categoryId?: CategoryId,
): number {
  // Slice 5: Get category-specific weights instead of hardcoded values
  const weights = getValidationWeights(categoryId);

  let score = 0;

  // Brand score
  score += criteria.brandMatch.matches
    ? criteria.brandMatch.confidence * weights.brand
    : 0;

  // Model score
  score += criteria.modelMatch.matches
    ? criteria.modelMatch.confidence * weights.model
    : 0;

  // Variant score
  score += criteria.variantMatch.matches
    ? criteria.variantMatch.confidence * weights.variant
    : 0;

  // Condition score (penalize based on grade distance)
  if (criteria.conditionMatch.matches) {
    const conditionPenalty = criteria.conditionMatch.withinGrade * 0.2; // 20% penalty per grade
    score += Math.max(0, weights.condition * (1 - conditionPenalty));
  }

  // Recency score
  score += criteria.recency.valid ? weights.recency : 0;

  // Price outlier penalty (only deduct, never add)
  if (criteria.priceOutlier.isOutlier) {
    score -= weights.priceOutlier;
  } else {
    score += weights.priceOutlier;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Generate human-readable reasoning for validation result
 */
function generateReasoning(
  criteria: CompValidationCriteria,
  score: number,
): string {
  const reasons: string[] = [];

  // Brand
  if (criteria.brandMatch.matches) {
    reasons.push(`Brand match: ${criteria.brandMatch.itemBrand || 'Unknown'}`);
  } else if (criteria.brandMatch.itemBrand) {
    reasons.push(
      `Brand mismatch: expected "${criteria.brandMatch.itemBrand}", found "${criteria.brandMatch.compBrand || 'unknown'}"`,
    );
  }

  // Model
  if (criteria.modelMatch.matches) {
    reasons.push(`Model match: ${criteria.modelMatch.itemModel || 'Unknown'}`);
  } else if (criteria.modelMatch.itemModel) {
    reasons.push(
      `Model mismatch: expected "${criteria.modelMatch.itemModel}", found "${criteria.modelMatch.compModel || 'unknown'}"`,
    );
  }

  // Variant
  if (criteria.variantMatch.details) {
    reasons.push(criteria.variantMatch.details);
  }

  // Condition
  if (criteria.conditionMatch.withinGrade === 0) {
    reasons.push(`Condition: exact match (${criteria.conditionMatch.itemCondition})`);
  } else if (criteria.conditionMatch.matches) {
    reasons.push(
      `Condition: within ${criteria.conditionMatch.withinGrade} grade(s) (${criteria.conditionMatch.itemCondition} vs ${criteria.conditionMatch.compCondition})`,
    );
  } else {
    reasons.push(
      `Condition: too different (${criteria.conditionMatch.withinGrade} grades apart)`,
    );
  }

  // Recency
  if (!criteria.recency.valid) {
    reasons.push(
      `Too old: ${criteria.recency.daysSinceSold} days since sold (threshold: ${criteria.recency.threshold})`,
    );
  }

  // Price outlier
  if (criteria.priceOutlier.isOutlier) {
    reasons.push(
      `Price outlier: z-score ${criteria.priceOutlier.zScore?.toFixed(2)} (unusual price)`,
    );
  }

  return reasons.join('. ');
}

/**
 * Validate a single comparable listing against the item context
 *
 * Slice 5: Added categoryId parameter for category-aware weights.
 *
 * @param comp - The comparable listing to validate
 * @param item - The item context (brand, model, condition, etc.)
 * @param allComps - All comps for outlier detection
 * @param productId - Optional product identification for additional context
 * @param config - Validation configuration
 * @param categoryId - Optional category for category-specific weights
 * @returns CompValidation result
 */
export function validateComp(
  comp: ResearchEvidenceRecord,
  item: ItemValidationContext,
  allComps: ResearchEvidenceRecord[],
  productId?: ProductIdentification | null,
  config: Partial<ValidationConfig> = {},
  categoryId?: CategoryId,
): CompValidation {
  const fullConfig: ValidationConfig = { ...DEFAULT_CONFIG, ...config };

  // Merge product identification into item context if available
  const enrichedItem: ItemValidationContext = {
    brand: item.brand || productId?.brand,
    model: item.model || productId?.model,
    condition: item.condition,
    variant: item.variant,
  };

  // Run all validation criteria
  // Slice 5: Pass categoryId to variant validation for category-specific weights
  const criteria: CompValidationCriteria = {
    brandMatch: validateBrand(enrichedItem, comp),
    modelMatch: validateModel(enrichedItem, comp),
    variantMatch: validateVariant(enrichedItem, comp, categoryId),
    conditionMatch: validateCondition(enrichedItem, comp),
    recency: validateRecency(comp, fullConfig),
    priceOutlier: validatePriceOutlier(comp, allComps, fullConfig),
  };

  // Calculate overall score
  // Slice 5: Pass categoryId for category-specific validation weights
  const overallScore = calculateOverallScore(criteria, categoryId);

  // Determine validity
  const isValid = overallScore >= fullConfig.minValidationScore;

  // Generate reasoning
  const reasoning = generateReasoning(criteria, overallScore);

  return {
    isValid,
    overallScore,
    criteria,
    reasoning,
  };
}

/**
 * Validate all comps and return them with validation results attached
 *
 * Slice 5: Added categoryId parameter for category-aware weights.
 *
 * @param comps - List of comparable listings to validate
 * @param item - Item context for comparison
 * @param productId - Optional product identification
 * @param config - Validation configuration
 * @param categoryId - Optional category for category-specific weights
 */
export function validateAllComps(
  comps: ResearchEvidenceRecord[],
  item: ItemValidationContext,
  productId?: ProductIdentification | null,
  config: Partial<ValidationConfig> = {},
  categoryId?: CategoryId,
): ResearchEvidenceRecord[] {
  return comps.map((comp) => ({
    ...comp,
    validation: validateComp(comp, item, comps, productId, config, categoryId),
  }));
}

/**
 * Get validation summary statistics
 */
export function getValidationSummary(validatedComps: ResearchEvidenceRecord[]): {
  total: number;
  passed: number;
  failed: number;
  criteriaBreakdown: {
    brand: number;
    model: number;
    condition: number;
    recency: number;
    variant: number;
  };
} {
  const compsWithValidation = validatedComps.filter((c) => c.validation);

  const passed = compsWithValidation.filter((c) => c.validation?.isValid).length;
  const failed = compsWithValidation.length - passed;

  const criteriaBreakdown = {
    brand: compsWithValidation.filter((c) => c.validation?.criteria.brandMatch.matches).length,
    model: compsWithValidation.filter((c) => c.validation?.criteria.modelMatch.matches).length,
    condition: compsWithValidation.filter((c) => c.validation?.criteria.conditionMatch.matches).length,
    recency: compsWithValidation.filter((c) => c.validation?.criteria.recency.valid).length,
    variant: compsWithValidation.filter((c) => c.validation?.criteria.variantMatch.matches).length,
  };

  return {
    total: compsWithValidation.length,
    passed,
    failed,
    criteriaBreakdown,
  };
}
