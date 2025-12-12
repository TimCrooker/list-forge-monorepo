import { Injectable, Logger } from '@nestjs/common';
import {
  ValidationCheckResult,
  ValidationIssue,
  ValidationIssueType,
  ValidationSeverity,
  ReidentificationHint,
  ResearchEvidenceRecord,
} from '@listforge/core-types';
import { ResearchGraphState } from '../graphs/research/research-graph.state';

/**
 * Identification Validator Service (Slice 6)
 *
 * Validates product identification against market evidence (comps, prices, attributes)
 * after market research is complete. If validation fails, triggers re-identification
 * with hints to guide the next attempt.
 *
 * Validation Checks:
 * 1. Price Sanity - Comp prices should make sense for identified product
 * 2. Comp Matching - At least some comps should match the identification well
 * 3. Attribute Consistency - Extracted attributes should be internally consistent
 * 4. Visual Consistency - Item images should match comp images (if available)
 *
 * Re-identification is triggered when:
 * - errorCount >= 2
 * - no_matching_comps with severity error
 * - price_mismatch with severity error
 */
@Injectable()
export class IdentificationValidatorService {
  private readonly logger = new Logger(IdentificationValidatorService.name);

  /**
   * Main validation method - runs all checks
   */
  async validate(state: ResearchGraphState): Promise<ValidationCheckResult> {
    const issues: ValidationIssue[] = [];
    let checksRun = 0;

    // Check 1: Price Sanity
    checksRun++;
    const priceIssue = this.checkPriceSanity(state);
    if (priceIssue) issues.push(priceIssue);

    // Check 2: Comp Matching Quality
    checksRun++;
    const compIssue = this.checkCompMatching(state);
    if (compIssue) issues.push(compIssue);

    // Check 3: Attribute Consistency
    checksRun++;
    const attrIssues = this.checkAttributeConsistency(state);
    issues.push(...attrIssues);

    // Check 4: Visual Comparison (if image validation data available)
    checksRun++;
    const visualIssue = this.checkVisualConsistency(state);
    if (visualIssue) issues.push(visualIssue);

    // Count by severity
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    // Determine if we should reidentify
    const shouldReidentify = this.shouldTriggerReidentification(issues);

    // Calculate overall confidence
    const confidence = this.calculateValidationConfidence(issues, checksRun);

    const result: ValidationCheckResult = {
      isValid: errorCount === 0,
      confidence,
      issues,
      shouldReidentify,
      reidentificationHints: shouldReidentify
        ? this.generateReidentificationHints(state, issues)
        : undefined,
      stats: {
        totalChecks: checksRun,
        passedChecks: checksRun - issues.length,
        warningCount,
        errorCount,
      },
    };

    this.logger.log(
      `Validation complete: ${result.isValid ? 'PASSED' : 'FAILED'} ` +
        `(${errorCount} errors, ${warningCount} warnings, shouldReidentify=${shouldReidentify})`,
    );

    return result;
  }

  /**
   * Check if comp prices make sense for the identified product
   * Detects price mismatches that suggest misidentification
   */
  private checkPriceSanity(state: ResearchGraphState): ValidationIssue | null {
    const comps = state.comps || [];
    if (comps.length === 0) return null;

    // Filter to valid comps with prices and decent relevance
    const validComps = comps.filter(
      (c) => c.price > 0 && (c.relevanceScore ?? 0) >= 0.5,
    );
    if (validComps.length === 0) return null;

    // Calculate average and standard deviation
    const prices = validComps.map((c) => c.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const stdDev = this.calculateStdDev(prices);

    // Get expected price from identification (if available)
    const expectedPrice = state.productIdentification?.attributes
      ?.expectedPrice as number | undefined;

    // Check for extreme price variance (>80% std dev from mean)
    // High variance suggests comps are for different products
    if (stdDev > avgPrice * 0.8 && validComps.length >= 3) {
      return {
        type: 'price_mismatch',
        severity: 'warning',
        message: `High price variance in comps (std dev $${stdDev.toFixed(2)} vs avg $${avgPrice.toFixed(2)})`,
        evidence: {
          expected: { stdDevRatio: 0.8 },
          actual: { avgPrice, stdDev, ratio: stdDev / avgPrice },
          details: { priceRange: { min: Math.min(...prices), max: Math.max(...prices) } },
        },
      };
    }

    // Check if expected price is wildly different from comp prices (>200% difference)
    if (expectedPrice && Math.abs(expectedPrice - avgPrice) > avgPrice * 2) {
      return {
        type: 'price_mismatch',
        severity: 'error',
        message: `Expected price ($${expectedPrice}) differs significantly from comp average ($${avgPrice.toFixed(2)})`,
        evidence: {
          expected: expectedPrice,
          actual: avgPrice,
          details: {
            difference: Math.abs(expectedPrice - avgPrice),
            percentDiff: ((Math.abs(expectedPrice - avgPrice) / avgPrice) * 100).toFixed(1),
          },
        },
      };
    }

    return null;
  }

  /**
   * Check if comps actually match our identification
   * No matching comps suggests misidentification
   */
  private checkCompMatching(state: ResearchGraphState): ValidationIssue | null {
    const comps = state.comps || [];
    if (comps.length === 0) {
      return {
        type: 'no_matching_comps',
        severity: 'error',
        message: 'No comparable listings found for identification',
        evidence: { details: { totalComps: 0 } },
      };
    }

    // Count comps by relevance threshold
    const validComps = comps.filter((c) => (c.relevanceScore ?? 0) >= 0.6);
    const highConfidenceComps = comps.filter((c) => (c.relevanceScore ?? 0) >= 0.8);

    if (validComps.length === 0) {
      return {
        type: 'no_matching_comps',
        severity: 'error',
        message: `Found ${comps.length} comps but none match identification well (all < 0.6 relevance)`,
        evidence: {
          expected: { minRelevance: 0.6 },
          actual: {
            totalComps: comps.length,
            validComps: 0,
            topScores: comps.slice(0, 5).map((c) => c.relevanceScore ?? 0),
          },
        },
      };
    }

    // Warn if no high-confidence comps and few valid comps
    if (highConfidenceComps.length === 0 && validComps.length < 3) {
      return {
        type: 'low_comp_quality',
        severity: 'warning',
        message: `Only ${validComps.length} marginal comps found (none > 0.8 relevance)`,
        evidence: {
          details: {
            validComps: validComps.length,
            highConfidenceComps: 0,
            avgRelevance: (validComps.reduce((sum, c) => sum + (c.relevanceScore ?? 0), 0) / validComps.length).toFixed(2),
          },
        },
      };
    }

    return null;
  }

  /**
   * Check if extracted attributes are internally consistent
   * Conflicting attributes suggest identification errors
   */
  private checkAttributeConsistency(state: ResearchGraphState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const productId = state.productIdentification;
    if (!productId) return issues;

    // Check brand consistency across sources
    const brandSources = this.getBrandFromSources(state);
    if (brandSources.length > 1) {
      const uniqueBrands = [...new Set(brandSources.map((b) => b.toLowerCase().trim()))];
      if (uniqueBrands.length > 1 && !this.areBrandsRelated(uniqueBrands)) {
        issues.push({
          type: 'attribute_inconsistency',
          severity: 'warning',
          message: `Conflicting brands detected: ${uniqueBrands.join(', ')}`,
          evidence: { details: { brandSources: uniqueBrands } },
        });
      }
    }

    // Check model consistency
    const modelSources = this.getModelFromSources(state);
    if (modelSources.length > 1) {
      const uniqueModels = [...new Set(modelSources.map((m) => m.toLowerCase().trim()))];
      if (uniqueModels.length > 1 && !this.areModelsRelated(uniqueModels)) {
        issues.push({
          type: 'attribute_inconsistency',
          severity: 'warning',
          message: `Conflicting models detected: ${uniqueModels.join(', ')}`,
          evidence: { details: { modelSources: uniqueModels } },
        });
      }
    }

    return issues;
  }

  /**
   * Check visual consistency between item and matched comps
   * Uses image validation results from analyze_comps if available
   */
  private checkVisualConsistency(state: ResearchGraphState): ValidationIssue | null {
    // Get top comps with images that were evaluated
    const compsWithImages = (state.comps || [])
      .filter((c) => c.imageUrl && (c.relevanceScore ?? 0) >= 0.6)
      .slice(0, 5);

    if (compsWithImages.length === 0) return null;

    // Check if image validation was done in analyze_comps
    // extractedData.imageValidationFailed is set by Slice 4 image comparison
    const failedImageValidation = compsWithImages.filter(
      (c) => c.extractedData?.imageValidationFailed === true,
    );

    // All top comps failed image validation - strong signal of misidentification
    if (failedImageValidation.length === compsWithImages.length && compsWithImages.length >= 2) {
      return {
        type: 'visual_mismatch',
        severity: 'error',
        message: 'All top comps failed image validation - item may be misidentified',
        evidence: {
          details: {
            compsChecked: compsWithImages.length,
            failedCount: failedImageValidation.length,
          },
        },
      };
    }

    // More than half failed - warning
    if (failedImageValidation.length > compsWithImages.length / 2) {
      return {
        type: 'visual_mismatch',
        severity: 'warning',
        message: `${failedImageValidation.length}/${compsWithImages.length} top comps failed image validation`,
        evidence: {
          details: {
            compsChecked: compsWithImages.length,
            failedCount: failedImageValidation.length,
          },
        },
      };
    }

    return null;
  }

  /**
   * Determine if re-identification should be triggered based on issues
   */
  private shouldTriggerReidentification(issues: ValidationIssue[]): boolean {
    const errorCount = issues.filter((i) => i.severity === 'error').length;

    // Trigger if 2+ errors
    if (errorCount >= 2) return true;

    // Trigger if no matching comps (error level)
    if (issues.some((i) => i.type === 'no_matching_comps' && i.severity === 'error')) {
      return true;
    }

    // Trigger if price mismatch (error level)
    if (issues.some((i) => i.type === 'price_mismatch' && i.severity === 'error')) {
      return true;
    }

    return false;
  }

  /**
   * Generate hints for re-identification based on validation issues
   */
  private generateReidentificationHints(
    state: ResearchGraphState,
    issues: ValidationIssue[],
  ): ReidentificationHint[] {
    const hints: ReidentificationHint[] = [];

    // If price mismatch, suggest looking at comp titles for better identification
    const priceMismatch = issues.find(
      (i) => i.type === 'price_mismatch' && i.severity === 'error',
    );
    if (priceMismatch) {
      const topComps = (state.comps || []).slice(0, 5);
      if (topComps.length > 0) {
        // Extract common terms from comp titles that might help
        const commonTerms = this.extractCommonTerms(topComps.map((c) => c.title));
        if (commonTerms.length > 0) {
          hints.push({
            type: 'use_comp_suggestion',
            value: commonTerms.join(' '),
            reason: 'Comp titles suggest different product terms',
            confidence: 0.7,
          });
        }
      }
    }

    // If no matching comps, suggest trying different search
    const noComps = issues.find((i) => i.type === 'no_matching_comps');
    if (noComps) {
      hints.push({
        type: 'search_different',
        value: 'broader_search',
        reason: 'No matching comps found - try broader identification',
        confidence: 0.6,
      });

      // Suggest excluding current brand/model if they seem wrong
      if (state.productIdentification?.brand) {
        hints.push({
          type: 'exclude_brand',
          value: state.productIdentification.brand,
          reason: 'Current brand identification may be incorrect',
          confidence: 0.5,
        });
      }

      if (state.productIdentification?.model) {
        hints.push({
          type: 'exclude_model',
          value: state.productIdentification.model,
          reason: 'Current model identification may be incorrect',
          confidence: 0.5,
        });
      }
    }

    // If category mismatch detected, suggest trying different category
    const categoryIssue = issues.find((i) => i.type === 'category_mismatch');
    if (categoryIssue && categoryIssue.evidence?.actual) {
      hints.push({
        type: 'try_category',
        value: String(categoryIssue.evidence.actual),
        reason: 'Comps suggest different product category',
        confidence: 0.8,
      });
    }

    // If visual mismatch, consider the item may look different than expected
    const visualIssue = issues.find((i) => i.type === 'visual_mismatch');
    if (visualIssue) {
      hints.push({
        type: 'search_different',
        value: 'visual_reanalysis',
        reason: 'Item visuals do not match comps - may need different identification approach',
        confidence: 0.65,
      });
    }

    return hints;
  }

  /**
   * Calculate overall validation confidence based on issues
   */
  private calculateValidationConfidence(issues: ValidationIssue[], totalChecks: number): number {
    if (totalChecks === 0) return 0;

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    // Start with base confidence
    let confidence = 1.0;

    // Errors have high impact (-0.3 each)
    confidence -= errorCount * 0.3;

    // Warnings have moderate impact (-0.1 each)
    confidence -= warningCount * 0.1;

    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate standard deviation of numbers
   */
  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Extract brand values from different sources in state
   */
  private getBrandFromSources(state: ResearchGraphState): string[] {
    const brands: string[] = [];

    // From product identification
    if (state.productIdentification?.brand) {
      brands.push(state.productIdentification.brand);
    }

    // From media analysis
    if (state.mediaAnalysis?.brand) {
      brands.push(state.mediaAnalysis.brand);
    }

    // From OCR result
    if (state.ocrResult?.labels?.brand) {
      brands.push(state.ocrResult.labels.brand);
    }

    // From UPC lookup
    if (state.upcLookupResult?.brand) {
      brands.push(state.upcLookupResult.brand);
    }

    // From Amazon matches
    if (state.amazonMatches?.length > 0) {
      const topMatch = state.amazonMatches[0];
      if (topMatch.brand) {
        brands.push(topMatch.brand);
      }
    }

    return brands.filter((b) => b && b.trim().length > 0);
  }

  /**
   * Extract model values from different sources in state
   */
  private getModelFromSources(state: ResearchGraphState): string[] {
    const models: string[] = [];

    // From product identification
    if (state.productIdentification?.model) {
      models.push(state.productIdentification.model);
    }

    // From media analysis
    if (state.mediaAnalysis?.model) {
      models.push(state.mediaAnalysis.model);
    }

    // From OCR result
    if (state.ocrResult?.modelNumber) {
      models.push(state.ocrResult.modelNumber);
    }

    // From Amazon matches
    if (state.amazonMatches?.length > 0) {
      const topMatch = state.amazonMatches[0];
      if (topMatch.title) {
        // Extract model-like terms from title
        const modelPattern = /\b([A-Z]{1,3}[-]?\d{2,}[A-Z0-9]*)\b/;
        const match = topMatch.title.match(modelPattern);
        if (match) {
          models.push(match[1]);
        }
      }
    }

    return models.filter((m) => m && m.trim().length > 0);
  }

  /**
   * Check if brands are related (e.g., parent/child brands)
   */
  private areBrandsRelated(brands: string[]): boolean {
    if (brands.length < 2) return true;

    // Check if any brand contains another (parent/child relationship)
    for (let i = 0; i < brands.length; i++) {
      for (let j = i + 1; j < brands.length; j++) {
        if (brands[i].includes(brands[j]) || brands[j].includes(brands[i])) {
          return true;
        }
      }
    }

    // Known brand relationships
    const brandFamilies: string[][] = [
      ['nike', 'jordan', 'air jordan'],
      ['adidas', 'yeezy'],
      ['apple', 'iphone', 'ipad', 'macbook'],
      ['samsung', 'galaxy'],
      ['sony', 'playstation', 'ps5', 'ps4'],
      ['microsoft', 'xbox'],
      ['louis vuitton', 'lv'],
      ['gucci', 'gc'],
    ];

    const lowerBrands = brands.map((b) => b.toLowerCase());
    for (const family of brandFamilies) {
      const matches = lowerBrands.filter((b) => family.some((f) => b.includes(f)));
      if (matches.length >= 2) return true;
    }

    return false;
  }

  /**
   * Check if models are related (variations of same product line)
   */
  private areModelsRelated(models: string[]): boolean {
    if (models.length < 2) return true;

    // Check for common prefixes (same product line)
    const prefixes = models.map((m) => {
      // Extract alphanumeric prefix before version numbers
      const match = m.match(/^([a-z]+)/i);
      return match ? match[1].toLowerCase() : m.toLowerCase();
    });

    const uniquePrefixes = [...new Set(prefixes)];
    if (uniquePrefixes.length === 1) return true;

    // Check if models differ only by numbers (e.g., "Air Max 90" vs "Air Max 97")
    const normalized = models.map((m) => m.replace(/\d+/g, 'N').toLowerCase());
    const uniqueNormalized = [...new Set(normalized)];
    if (uniqueNormalized.length === 1) return true;

    return false;
  }

  /**
   * Extract common terms from comp titles
   * Used to suggest search terms for re-identification
   */
  private extractCommonTerms(titles: string[]): string[] {
    if (titles.length === 0) return [];

    // Tokenize all titles
    const allWords = titles.flatMap((title) =>
      title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

    // Count word frequency
    const wordCounts = new Map<string, number>();
    for (const word of allWords) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Filter to words that appear in majority of titles
    const threshold = Math.ceil(titles.length * 0.6);
    const commonWords = Array.from(wordCounts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([word]) => word);

    // Filter out stop words
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'new', 'free', 'ship', 'fast', 'box',
      'size', 'color', 'mens', 'womens', 'kids', 'adult', 'brand', 'authentic',
      'original', 'genuine', 'rare', 'vintage', 'used', 'like', 'good', 'great',
    ]);

    return commonWords
      .filter((w) => !stopWords.has(w))
      .slice(0, 5); // Return top 5 common terms
  }
}
