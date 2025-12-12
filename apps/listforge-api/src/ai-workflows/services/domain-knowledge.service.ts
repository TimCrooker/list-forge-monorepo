/**
 * Domain Knowledge Service - Slice 9
 *
 * Central service for accessing domain-specific knowledge:
 * - Decoding identifiers (date codes, style numbers, references)
 * - Detecting value drivers (price-affecting attributes)
 * - Checking authenticity markers
 *
 * This service bridges the gap between raw extracted identifiers
 * and actionable decoded information that expert resellers would know.
 *
 * Slice 9.1 Enhancement: DB-first loading with caching
 * - Loads from published domain expertise modules when available
 * - Falls back to static data if no DB module exists
 * - 5-minute cache TTL for performance
 */

import { Injectable, Logger, Inject, forwardRef, Optional } from '@nestjs/common';
import type {
  CategoryId,
  DecodedValue,
  ExtractedIdentifier,
  ItemFieldStates,
  ValueDriver,
  ValueDriverMatch,
  AuthenticityMarkerDef,
  AuthenticityMarkerCheckResult,
  AuthenticityCheckResult,
} from '@listforge/core-types';

import {
  decodeLouisVuittonDateCode,
  decodeHermesBlindstamp,
  decodeNikeStyleCode,
  decodeRolexReference,
  analyzeVintageDenim,
  decodeIdentifier as decodeIdentifierFn,
} from '../utils/variant-decoders';

import {
  getValueDriversForCategoryAndBrand,
  getAuthenticityMarkersForCategory,
  getAuthenticityMarkersForBrand,
} from '../data/domain-knowledge-db';

import { DomainExpertiseService } from '../../domain-expertise/domain-expertise.service';
import type {
  DecoderDefinition,
  ValueDriverDefinition,
  AuthenticityMarkerDefinition,
} from '../../domain-expertise/entities';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum text length to attempt vintage denim analysis */
const MIN_DENIM_TEXT_LENGTH = 10;

/** Maximum price multiplier cap to prevent unrealistic values */
const MAX_PRICE_MULTIPLIER = 15.0;

/** Diminishing returns factor for additional value drivers */
const DIMINISHING_RETURNS_FACTOR = 0.7;

/** Years threshold for considering an item vintage */
const VINTAGE_AGE_THRESHOLD_YEARS = 20;

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Confidence levels used throughout the service */
const CONFIDENCE = {
  /** High confidence - exact match or strong validation */
  HIGH: 0.95,
  /** Good confidence - strong but not exact match */
  GOOD: 0.9,
  /** Medium-high confidence - clear match with some uncertainty */
  MEDIUM_HIGH: 0.85,
  /** Medium confidence - reasonable match */
  MEDIUM: 0.8,
  /** Default confidence for basic matches */
  DEFAULT: 0.7,
  /** Confidence when pattern found in text (not identifier) */
  TEXT_MATCH: 0.7,
  /** Manual inspection required confidence */
  MANUAL_CHECK: 0.5,
  /** Pattern not found confidence */
  NOT_FOUND: 0.3,
} as const;

/** Thresholds for authenticity assessment */
const AUTHENTICITY_THRESHOLDS = {
  /** Score threshold for "likely authentic" */
  LIKELY_AUTHENTIC: 0.8,
  /** Minimum pass rate for "likely authentic" */
  MIN_PASS_RATE: 0.8,
  /** Score threshold for "uncertain" */
  UNCERTAIN: 0.5,
} as const;

/** Importance weights for authenticity markers */
const IMPORTANCE_WEIGHTS: Record<AuthenticityMarkerDef['importance'], number> = {
  critical: 3,
  important: 2,
  helpful: 1,
};

// =============================================================================
// HELPER TYPES
// =============================================================================

interface ValueDriverCheckResult {
  matched: boolean;
  matchedValue: string;
  confidence: number;
  reasoning: string;
}

interface AuthenticityAssessmentResult {
  assessment: AuthenticityCheckResult['assessment'];
  confidence: number;
  summary: string;
}

/** Cached module data for a category/brand combination */
interface CachedModuleData {
  moduleId: string;
  decoders: DecoderDefinition[];
  valueDrivers: ValueDriverDefinition[];
  authenticityMarkers: AuthenticityMarkerDefinition[];
  expiresAt: number;
}

/** Cache key generator */
function getCacheKey(categoryId: CategoryId, brand?: string): string {
  return brand ? `${categoryId}:${brand.toLowerCase()}` : categoryId;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate and clamp confidence score to valid range [0, 1]
 */
function validateConfidence(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Safely convert a value to string for storage
 * Handles arrays, objects, and primitives
 */
function safeStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map((v) => safeStringify(v)).join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

@Injectable()
export class DomainKnowledgeService {
  private readonly logger = new Logger(DomainKnowledgeService.name);

  /** Cache for module data by category/brand */
  private readonly moduleCache = new Map<string, CachedModuleData>();

  constructor(
    @Optional()
    @Inject(forwardRef(() => DomainExpertiseService))
    private readonly domainExpertiseService?: DomainExpertiseService,
  ) {}

  // ===========================================================================
  // MODULE LOADING & CACHING (Slice 9.1)
  // ===========================================================================

  /**
   * Get cached module data or load from DB
   */
  private async getModuleData(
    categoryId: CategoryId,
    brand?: string,
  ): Promise<CachedModuleData | null> {
    const cacheKey = getCacheKey(categoryId, brand);
    const cached = this.moduleCache.get(cacheKey);

    // Return cached if still valid
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    // Try to load from DB
    if (!this.domainExpertiseService) {
      return null;
    }

    try {
      // Find published module for this category
      const { modules } = await this.domainExpertiseService.listModules({
        categoryId,
        status: 'published',
      });

      // Find best matching module
      let module = modules.find(
        (m) =>
          m.applicableBrands.length === 0 ||
          (brand && m.applicableBrands.map((b) => b.toLowerCase()).includes(brand.toLowerCase())),
      );

      // Fall back to any published module for category
      if (!module) {
        module = modules[0];
      }

      if (!module) {
        return null;
      }

      // Load full module with relations
      const fullModule = await this.domainExpertiseService.getModuleForTesting(module.id);

      const data: CachedModuleData = {
        moduleId: module.id,
        decoders: fullModule.decoders?.filter((d) => d.isActive) || [],
        valueDrivers: fullModule.valueDrivers?.filter((v) => v.isActive) || [],
        authenticityMarkers: fullModule.authenticityMarkers?.filter((m) => m.isActive) || [],
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      this.moduleCache.set(cacheKey, data);
      this.logger.debug(`Loaded module ${module.name} for ${cacheKey}`);

      return data;
    } catch (error) {
      this.logger.warn(`Failed to load module for ${cacheKey}: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate cache for a category/brand
   */
  invalidateCache(categoryId?: CategoryId, brand?: string): void {
    if (categoryId) {
      const cacheKey = getCacheKey(categoryId, brand);
      this.moduleCache.delete(cacheKey);
    } else {
      this.moduleCache.clear();
    }
  }

  // ===========================================================================
  // IDENTIFIER DECODING
  // ===========================================================================

  /**
   * Decode a single identifier using category context
   *
   * @param identifier - Extracted identifier from OCR/vision
   * @param categoryId - Detected category for context
   * @returns Decoded result or null if no decoder matches
   *
   * @example
   * ```typescript
   * const identifier = { type: 'date_code', value: 'SD1234', confidence: 0.9 };
   * const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');
   * // Returns DecodedLVDateCode with factory and date info
   * ```
   */
  decodeIdentifier(
    identifier: ExtractedIdentifier,
    categoryId: CategoryId,
  ): DecodedValue | null {
    const value = identifier.value?.trim();
    if (!value) return null;

    // Try category-specific decoding first
    const decoded = decodeIdentifierFn(value, categoryId);
    if (decoded) {
      this.logger.debug(
        `Decoded ${identifier.type} "${value}" -> ${decoded.identifierType}`,
        { decoded: decoded.decoded },
      );
      return decoded;
    }

    // Try specific decoders based on identifier type
    return this.tryDecoderByIdentifierType(identifier.type, value);
  }

  /**
   * Try appropriate decoder based on identifier type
   */
  private tryDecoderByIdentifierType(
    type: ExtractedIdentifier['type'],
    value: string,
  ): DecodedValue | null {
    switch (type) {
      case 'date_code':
        return this.tryDateCodeDecoders(value);

      case 'style_number': {
        const nikeResult = decodeNikeStyleCode(value);
        return nikeResult.success ? nikeResult : null;
      }

      case 'model_number': {
        const rolexResult = decodeRolexReference(value);
        return rolexResult.success ? rolexResult : null;
      }

      case 'other':
        return this.tryOtherDecoders(value);

      default:
        return null;
    }
  }

  /**
   * Try date code decoders (LV, Hermes)
   */
  private tryDateCodeDecoders(value: string): DecodedValue | null {
    // Try LV date code
    const lvResult = decodeLouisVuittonDateCode(value);
    if (lvResult.success) return lvResult;

    // Try Hermes blindstamp (single character)
    if (value.length === 1) {
      const hermesResult = decodeHermesBlindstamp(value);
      if (hermesResult.success) return hermesResult;
    }

    return null;
  }

  /**
   * Try decoders for 'other' type identifiers
   */
  private tryOtherDecoders(value: string): DecodedValue | null {
    // Try vintage denim analysis for longer text
    if (value.length > MIN_DENIM_TEXT_LENGTH) {
      const denimResult = analyzeVintageDenim(value);
      if (denimResult.success) return denimResult;
    }
    return null;
  }

  /**
   * Decode multiple identifiers, enhancing them with decoded data
   *
   * @param identifiers - Array of extracted identifiers
   * @param categoryId - Detected category for context
   * @returns Enhanced identifiers with decoded field populated
   */
  decodeIdentifiers(
    identifiers: ExtractedIdentifier[],
    categoryId: CategoryId,
  ): ExtractedIdentifier[] {
    return identifiers.map((identifier) => {
      const decoded = this.decodeIdentifier(identifier, categoryId);
      if (decoded && decoded.success) {
        return {
          ...identifier,
          decoded: this.flattenDecodedForStorage(decoded),
          confidence: validateConfidence(
            Math.max(identifier.confidence, decoded.confidence),
          ),
        };
      }
      return identifier;
    });
  }

  /**
   * Flatten decoded result for storage in ExtractedIdentifier.decoded
   * Uses safe string conversion to prevent type coercion issues
   */
  private flattenDecodedForStorage(decoded: DecodedValue): Record<string, string> {
    const result: Record<string, string> = {
      _type: safeStringify(decoded.identifierType),
      _confidence: safeStringify(validateConfidence(decoded.confidence)),
    };

    // Convert all decoded values to strings safely
    for (const [key, value] of Object.entries(decoded.decoded)) {
      if (value !== null && value !== undefined) {
        result[key] = safeStringify(value);
      }
    }

    return result;
  }

  // ===========================================================================
  // VALUE DRIVER DETECTION
  // ===========================================================================

  /**
   * Detect value drivers from item field states
   *
   * @param fieldStates - Current field states for the item
   * @param categoryId - Detected category
   * @param brand - Optional brand for brand-specific drivers
   * @returns Array of matched value drivers, sorted by priority and confidence
   */
  detectValueDrivers(
    fieldStates: ItemFieldStates,
    categoryId: CategoryId,
    brand?: string,
  ): ValueDriverMatch[] {
    const matches: ValueDriverMatch[] = [];
    const drivers = getValueDriversForCategoryAndBrand(categoryId, brand);

    for (const driver of drivers) {
      const match = this.checkValueDriver(driver, fieldStates);
      if (match) {
        matches.push(match);
      }
    }

    return this.sortValueDriverMatches(matches);
  }

  /**
   * Sort value driver matches by priority (highest first) then by confidence
   */
  private sortValueDriverMatches(matches: ValueDriverMatch[]): ValueDriverMatch[] {
    return matches.sort((a, b) => {
      if (a.driver.priority !== b.driver.priority) {
        return b.driver.priority - a.driver.priority;
      }
      return b.confidence - a.confidence;
    });
  }

  /**
   * Check if a single value driver matches the field states
   */
  private checkValueDriver(
    driver: ValueDriver,
    fieldStates: ItemFieldStates,
  ): ValueDriverMatch | null {
    const field = fieldStates.fields[driver.attribute];
    if (!field || field.value === null || field.value === undefined) {
      return null;
    }

    const fieldValue = String(field.value).toLowerCase();
    const checkCondition = driver.checkCondition.toLowerCase();

    const result = this.evaluateDriverCondition(driver, field, fieldValue, checkCondition);

    if (!result.matched) {
      return null;
    }

    return {
      driver,
      matchedValue: result.matchedValue,
      confidence: validateConfidence(result.confidence),
      reasoning: result.reasoning,
    };
  }

  /**
   * Evaluate a driver's condition against field value
   */
  private evaluateDriverCondition(
    driver: ValueDriver,
    field: { value: unknown },
    fieldValue: string,
    checkCondition: string,
  ): ValueDriverCheckResult {
    // Try each condition type in order
    if (checkCondition.includes('text contains')) {
      return this.evaluateTextContainsCondition(driver.attribute, fieldValue, checkCondition);
    }

    if (checkCondition.includes('is') || checkCondition.includes('includes')) {
      return this.evaluateIsOrIncludesCondition(fieldValue, checkCondition);
    }

    if (checkCondition.includes('label') && driver.id === 'levis_big_e') {
      return this.evaluateBigECondition(field, fieldValue);
    }

    return { matched: false, matchedValue: '', confidence: 0, reasoning: '' };
  }

  /**
   * Evaluate "text contains" condition type
   */
  private evaluateTextContainsCondition(
    attribute: string,
    fieldValue: string,
    checkCondition: string,
  ): ValueDriverCheckResult {
    const searchTerms = checkCondition
      .replace(/text contains/i, '')
      .split(/[\s,]+/)
      .filter((t) => t.length > 1)
      .map((t) => t.replace(/['"]/g, ''));

    for (const term of searchTerms) {
      if (fieldValue.includes(term.toLowerCase())) {
        return {
          matched: true,
          matchedValue: fieldValue,
          confidence: CONFIDENCE.DEFAULT,
          reasoning: `Found "${term}" in ${attribute}`,
        };
      }
    }

    return { matched: false, matchedValue: '', confidence: 0, reasoning: '' };
  }

  /**
   * Evaluate "is" or "includes" condition type
   */
  private evaluateIsOrIncludesCondition(
    fieldValue: string,
    checkCondition: string,
  ): ValueDriverCheckResult {
    const allowedValues = checkCondition
      .replace(/.*(?:is|includes)\s*/i, '')
      .split(/[,\s]+or\s+|,\s*/i)
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 1);

    for (const allowed of allowedValues) {
      const isExactMatch = fieldValue === allowed;
      const isPartialMatch =
        fieldValue.includes(allowed) || allowed.includes(fieldValue);

      if (isExactMatch || isPartialMatch) {
        return {
          matched: true,
          matchedValue: fieldValue,
          confidence: isExactMatch ? CONFIDENCE.HIGH : CONFIDENCE.MEDIUM,
          reasoning: `Value "${fieldValue}" matches condition "${allowed}"`,
        };
      }
    }

    return { matched: false, matchedValue: '', confidence: 0, reasoning: '' };
  }

  /**
   * Evaluate Big E condition for Levi's vintage denim
   */
  private evaluateBigECondition(
    field: { value: unknown },
    fieldValue: string,
  ): ValueDriverCheckResult {
    const hasLevisReference =
      fieldValue.includes("levi's") ||
      fieldValue.includes('levis') ||
      fieldValue.includes('big e');

    if (!hasLevisReference) {
      return { matched: false, matchedValue: '', confidence: 0, reasoning: '' };
    }

    // Check if the original value (pre-lowercase) has Big E capitalization
    const originalValue = String(field.value);
    if (originalValue.includes("LEVI'S") && !originalValue.includes("Levi's")) {
      return {
        matched: true,
        matchedValue: originalValue,
        confidence: CONFIDENCE.GOOD,
        reasoning: 'Found Big E capitalization in label text',
      };
    }

    if (fieldValue.includes('big e')) {
      return {
        matched: true,
        matchedValue: fieldValue,
        confidence: CONFIDENCE.MEDIUM_HIGH,
        reasoning: 'Big E explicitly mentioned',
      };
    }

    return { matched: false, matchedValue: '', confidence: 0, reasoning: '' };
  }

  /**
   * Calculate combined price multiplier from matched value drivers
   *
   * Multipliers are combined multiplicatively but with diminishing returns:
   * - First driver: full multiplier weighted by confidence
   * - Subsequent drivers: sqrt of multiplier with reduced weight
   *
   * @param matches - Array of matched value drivers
   * @returns Combined price multiplier, capped at MAX_PRICE_MULTIPLIER
   */
  calculateValueMultiplier(matches: ValueDriverMatch[]): number {
    if (matches.length === 0) return 1.0;

    // Sort by impact (highest multiplier first)
    const sorted = [...matches].sort(
      (a, b) => b.driver.priceMultiplier - a.driver.priceMultiplier,
    );

    let multiplier = 1.0;

    for (let i = 0; i < sorted.length; i++) {
      const match = sorted[i];
      const driverMultiplier = match.driver.priceMultiplier;
      const validConfidence = validateConfidence(match.confidence);

      if (i === 0) {
        // First driver: apply weighted by confidence
        multiplier *= 1 + (driverMultiplier - 1) * validConfidence;
      } else {
        // Subsequent drivers: diminishing returns (sqrt)
        const diminishedMultiplier = Math.sqrt(driverMultiplier);
        multiplier *=
          1 + (diminishedMultiplier - 1) * validConfidence * DIMINISHING_RETURNS_FACTOR;
      }
    }

    return Math.min(multiplier, MAX_PRICE_MULTIPLIER);
  }

  // ===========================================================================
  // AUTHENTICITY CHECKING
  // ===========================================================================

  /**
   * Check authenticity markers for an item
   *
   * @param identifiers - Extracted identifiers to validate
   * @param extractedText - Raw text extracted from item
   * @param categoryId - Detected category
   * @param brand - Optional brand for brand-specific markers
   * @returns Complete authenticity check result
   */
  checkAuthenticity(
    identifiers: ExtractedIdentifier[],
    extractedText: string[],
    categoryId: CategoryId,
    brand?: string,
  ): AuthenticityCheckResult {
    const allMarkers = this.collectAuthenticityMarkers(categoryId, brand);

    if (allMarkers.length === 0) {
      return this.createInsufficientDataResult(
        'No authenticity markers available for this category/brand',
      );
    }

    const { markersChecked, warnings } = this.checkAllMarkers(
      allMarkers,
      identifiers,
      extractedText,
    );

    const assessment = this.calculateAuthenticityAssessment(markersChecked);

    return {
      assessment: assessment.assessment,
      confidence: validateConfidence(assessment.confidence),
      markersChecked,
      summary: assessment.summary,
      warnings,
    };
  }

  /**
   * Collect and dedupe authenticity markers from category and brand
   */
  private collectAuthenticityMarkers(
    categoryId: CategoryId,
    brand?: string,
  ): AuthenticityMarkerDef[] {
    const categoryMarkers = getAuthenticityMarkersForCategory(categoryId);
    const brandMarkers = brand ? getAuthenticityMarkersForBrand(brand) : [];

    const allMarkers = [...categoryMarkers];
    for (const marker of brandMarkers) {
      if (!allMarkers.find((m) => m.id === marker.id)) {
        allMarkers.push(marker);
      }
    }

    return allMarkers;
  }

  /**
   * Check all markers against identifiers and extracted text
   */
  private checkAllMarkers(
    markers: AuthenticityMarkerDef[],
    identifiers: ExtractedIdentifier[],
    extractedText: string[],
  ): { markersChecked: AuthenticityMarkerCheckResult[]; warnings: string[] } {
    const markersChecked: AuthenticityMarkerCheckResult[] = [];
    const warnings: string[] = [];

    for (const marker of markers) {
      const result = this.checkSingleMarker(marker, identifiers, extractedText);
      markersChecked.push(result);

      if (!result.passed && marker.importance === 'critical') {
        warnings.push(`Critical marker failed: ${marker.name}`);
      }
    }

    return { markersChecked, warnings };
  }

  /**
   * Create an insufficient data result
   */
  private createInsufficientDataResult(summary: string): AuthenticityCheckResult {
    return {
      assessment: 'insufficient_data',
      confidence: 0,
      markersChecked: [],
      summary,
      warnings: [],
    };
  }

  /**
   * Check a single authenticity marker against identifiers and text
   */
  private checkSingleMarker(
    marker: AuthenticityMarkerDef,
    identifiers: ExtractedIdentifier[],
    extractedText: string[],
  ): AuthenticityMarkerCheckResult {
    if (marker.pattern) {
      return this.checkMarkerWithPattern(marker, identifiers, extractedText);
    }

    // No pattern - marker requires manual inspection
    return {
      marker,
      passed: true, // Give benefit of doubt for non-pattern markers
      confidence: CONFIDENCE.MANUAL_CHECK,
      details: `Manual check required: ${marker.checkDescription}`,
      checkedValue: undefined,
    };
  }

  /**
   * Check a marker that has a regex pattern
   */
  private checkMarkerWithPattern(
    marker: AuthenticityMarkerDef,
    identifiers: ExtractedIdentifier[],
    extractedText: string[],
  ): AuthenticityMarkerCheckResult {
    const pattern = new RegExp(marker.pattern!, 'i');

    // Check against identifiers first
    const identifierResult = this.checkPatternAgainstIdentifiers(
      pattern,
      marker,
      identifiers,
    );
    if (identifierResult.checkedValue) {
      return identifierResult;
    }

    // Check against extracted text
    const textResult = this.checkPatternAgainstText(pattern, marker, extractedText);
    if (textResult.checkedValue) {
      return textResult;
    }

    // Pattern not found
    return {
      marker,
      passed: false,
      confidence: CONFIDENCE.NOT_FOUND,
      details: 'Pattern not found in extracted data',
      checkedValue: undefined,
    };
  }

  /**
   * Check pattern against identifiers
   */
  private checkPatternAgainstIdentifiers(
    pattern: RegExp,
    marker: AuthenticityMarkerDef,
    identifiers: ExtractedIdentifier[],
  ): AuthenticityMarkerCheckResult {
    for (const identifier of identifiers) {
      if (pattern.test(identifier.value)) {
        const passed = marker.indicatesAuthentic;
        return {
          marker,
          passed,
          confidence: validateConfidence(identifier.confidence),
          details: passed
            ? `Format matches: ${identifier.value}`
            : `Format indicates concern: ${identifier.value}`,
          checkedValue: identifier.value,
        };
      }
    }

    return {
      marker,
      passed: false,
      confidence: 0,
      details: '',
      checkedValue: undefined,
    };
  }

  /**
   * Check pattern against extracted text
   */
  private checkPatternAgainstText(
    pattern: RegExp,
    marker: AuthenticityMarkerDef,
    extractedText: string[],
  ): AuthenticityMarkerCheckResult {
    for (const text of extractedText) {
      const match = text.match(pattern);
      if (match) {
        const passed = marker.indicatesAuthentic;
        return {
          marker,
          passed,
          confidence: CONFIDENCE.TEXT_MATCH,
          details: passed
            ? `Found matching pattern: ${match[0]}`
            : `Pattern concern: ${match[0]}`,
          checkedValue: match[0],
        };
      }
    }

    return {
      marker,
      passed: false,
      confidence: 0,
      details: '',
      checkedValue: undefined,
    };
  }

  /**
   * Calculate overall authenticity assessment from individual marker results
   */
  private calculateAuthenticityAssessment(
    results: AuthenticityMarkerCheckResult[],
  ): AuthenticityAssessmentResult {
    if (results.length === 0) {
      return {
        assessment: 'insufficient_data',
        confidence: 0,
        summary: 'No markers were checked',
      };
    }

    const stats = this.calculateMarkerStats(results);
    return this.determineAssessment(stats, results.length);
  }

  /**
   * Calculate statistics from marker results
   */
  private calculateMarkerStats(results: AuthenticityMarkerCheckResult[]): {
    totalWeight: number;
    weightedScore: number;
    criticalFailed: boolean;
    passedCount: number;
    failedCount: number;
  } {
    let totalWeight = 0;
    let weightedScore = 0;
    let criticalFailed = false;
    let passedCount = 0;
    let failedCount = 0;

    for (const result of results) {
      const weight = IMPORTANCE_WEIGHTS[result.marker.importance];
      totalWeight += weight;

      if (result.passed) {
        weightedScore += weight * validateConfidence(result.confidence);
        passedCount++;
      } else {
        failedCount++;
        if (result.marker.importance === 'critical') {
          criticalFailed = true;
        }
      }
    }

    return { totalWeight, weightedScore, criticalFailed, passedCount, failedCount };
  }

  /**
   * Determine final assessment from calculated statistics
   */
  private determineAssessment(
    stats: {
      totalWeight: number;
      weightedScore: number;
      criticalFailed: boolean;
      passedCount: number;
      failedCount: number;
    },
    totalCount: number,
  ): AuthenticityAssessmentResult {
    const normalizedScore =
      stats.totalWeight > 0 ? stats.weightedScore / stats.totalWeight : 0;

    if (stats.criticalFailed) {
      return {
        assessment: 'likely_fake',
        confidence: normalizedScore,
        summary: `Critical authenticity marker failed. ${stats.failedCount} of ${totalCount} checks did not pass.`,
      };
    }

    const passRate = stats.passedCount / totalCount;
    if (
      normalizedScore >= AUTHENTICITY_THRESHOLDS.LIKELY_AUTHENTIC &&
      passRate >= AUTHENTICITY_THRESHOLDS.MIN_PASS_RATE
    ) {
      return {
        assessment: 'likely_authentic',
        confidence: normalizedScore,
        summary: `${stats.passedCount} of ${totalCount} authenticity markers passed with high confidence.`,
      };
    }

    if (normalizedScore >= AUTHENTICITY_THRESHOLDS.UNCERTAIN) {
      return {
        assessment: 'uncertain',
        confidence: normalizedScore,
        summary: `Mixed results: ${stats.passedCount} passed, ${stats.failedCount} failed. Manual review recommended.`,
      };
    }

    if (stats.passedCount === 0 && stats.failedCount === 0) {
      return {
        assessment: 'insufficient_data',
        confidence: normalizedScore,
        summary: 'Unable to verify any authenticity markers with available data.',
      };
    }

    return {
      assessment: 'likely_fake',
      confidence: normalizedScore,
      summary: `Multiple authenticity concerns: ${stats.failedCount} of ${totalCount} checks failed.`,
    };
  }

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================

  /**
   * Get year from decoded identifier if available
   */
  getYearFromDecodedIdentifier(decoded: DecodedValue): number | null {
    if (!decoded.success) return null;

    const decodedData = decoded.decoded;
    if ('year' in decodedData && typeof decodedData.year === 'number') {
      return decodedData.year;
    }

    return null;
  }

  /**
   * Get factory/origin info from decoded identifier
   */
  getOriginFromDecodedIdentifier(
    decoded: DecodedValue,
  ): { location: string; country: string } | null {
    if (!decoded.success) return null;

    const decodedData = decoded.decoded;
    if ('factoryLocation' in decodedData && 'factoryCountry' in decodedData) {
      return {
        location: safeStringify(decodedData.factoryLocation),
        country: safeStringify(decodedData.factoryCountry),
      };
    }

    return null;
  }

  /**
   * Check if decoded identifier indicates discontinued/vintage status
   */
  isDiscontinuedOrVintage(decoded: DecodedValue): boolean {
    if (!decoded.success) return false;

    const decodedData = decoded.decoded;

    // Check for explicit vintage indicators
    if ('estimatedEra' in decodedData && decodedData.estimatedEra) {
      return true;
    }

    // Check for Big E (pre-1971)
    if ('isBigE' in decodedData && decodedData.isBigE) {
      return true;
    }

    // Check year if available
    if ('year' in decodedData && typeof decodedData.year === 'number') {
      const year = decodedData.year;
      const currentYear = new Date().getFullYear();
      return year < currentYear - VINTAGE_AGE_THRESHOLD_YEARS;
    }

    return false;
  }
}
