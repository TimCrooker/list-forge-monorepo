/**
 * Cross-Source Validation Service - Slice 7
 *
 * Tracks source independence and applies corroboration multipliers to confidence scores.
 *
 * Key concepts:
 * - Sources in the same "independence group" are NOT independent (e.g., keepa + amazon_catalog)
 * - Single-source values get 0.80x penalty
 * - Multi-source agreement from independent groups gets up to 1.10x boost
 * - Conflicts between independent sources reduce confidence
 */

import { Injectable } from '@nestjs/common';
import {
  FieldDataSource,
  FieldDataSourceType,
  SourceIndependenceGroup,
  SOURCE_TO_GROUP,
  FieldConflict,
  CrossValidatedField,
  CrossValidationResult,
  FieldConfidenceScore,
} from '@listforge/core-types';

/**
 * Corroboration multiplier constants
 * Exported for use by FieldStateManagerService and other services
 */
export const CORROBORATION = {
  /** Penalty for single source (no corroboration) */
  SINGLE_SOURCE_PENALTY: 0.80,
  /** Baseline with 2 independent sources */
  TWO_SOURCE_BASELINE: 1.00,
  /** Increment per additional independent source */
  ADDITIONAL_SOURCE_BONUS: 0.10,
  /** Maximum multiplier with 3+ sources */
  MAX_MULTIPLIER: 1.10,
  /** Minimum multiplier floor */
  MIN_MULTIPLIER: 0.50,
  /** Penalty per major conflict */
  MAJOR_CONFLICT_PENALTY: 0.10,
  /** Penalty per minor conflict */
  MINOR_CONFLICT_PENALTY: 0.05,
  /** Maximum confidence after cross-validation */
  MAX_CONFIDENCE: 0.98,
  /** Numeric comparison tolerance (5%) */
  NUMERIC_TOLERANCE: 0.05,
  /** Numeric conflict threshold for minor (20%) */
  NUMERIC_MINOR_THRESHOLD: 0.20,
};

@Injectable()
export class CrossValidationService {
  /**
   * Get the independence group for a source type
   */
  getSourceGroup(sourceType: FieldDataSourceType): SourceIndependenceGroup {
    return SOURCE_TO_GROUP[sourceType] || 'web'; // Default to web if unknown
  }

  /**
   * Count unique independent source groups
   */
  countIndependentGroups(sources: FieldDataSource[]): number {
    const groups = new Set<SourceIndependenceGroup>();
    for (const source of sources) {
      groups.add(this.getSourceGroup(source.type));
    }
    return groups.size;
  }

  /**
   * Get which independence groups are represented
   */
  getRepresentedGroups(sources: FieldDataSource[]): SourceIndependenceGroup[] {
    const groups = new Set<SourceIndependenceGroup>();
    for (const source of sources) {
      groups.add(this.getSourceGroup(source.type));
    }
    return Array.from(groups);
  }

  /**
   * Check if two values are considered "agreeing"
   * Handles string comparison, numeric tolerance, etc.
   */
  valuesAgree(value1: unknown, value2: unknown): boolean {
    // Exact match
    if (value1 === value2) return true;

    // Both null/undefined
    if (value1 == null && value2 == null) return true;

    // One null, one not
    if (value1 == null || value2 == null) return false;

    // String comparison (case-insensitive, trimmed)
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.toLowerCase().trim() === value2.toLowerCase().trim();
    }

    // Numeric comparison (within tolerance)
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      const diff = Math.abs(value1 - value2);
      const avg = (value1 + value2) / 2;
      return avg === 0 ? diff === 0 : diff / avg <= CORROBORATION.NUMERIC_TOLERANCE;
    }

    // Array comparison (same elements, order doesn't matter)
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) return false;
      const sorted1 = [...value1].sort();
      const sorted2 = [...value2].sort();
      return sorted1.every((v, i) => this.valuesAgree(v, sorted2[i]));
    }

    return false;
  }

  /**
   * Assess severity of a conflict
   */
  private assessConflictSeverity(v1: unknown, v2: unknown): 'minor' | 'major' {
    // String similarity check
    if (typeof v1 === 'string' && typeof v2 === 'string') {
      const s1 = v1.toLowerCase();
      const s2 = v2.toLowerCase();
      // If one contains the other, it's minor (partial match)
      if (s1.includes(s2) || s2.includes(s1)) return 'minor';
      // If they share significant overlap, minor
      const shorter = s1.length < s2.length ? s1 : s2;
      const longer = s1.length >= s2.length ? s1 : s2;
      if (shorter.length > 3 && longer.includes(shorter.substring(0, 3))) return 'minor';
    }

    // Numeric range check
    if (typeof v1 === 'number' && typeof v2 === 'number') {
      const diff = Math.abs(v1 - v2);
      const avg = (v1 + v2) / 2;
      if (avg > 0 && diff / avg <= CORROBORATION.NUMERIC_MINOR_THRESHOLD) return 'minor';
    }

    return 'major';
  }

  /**
   * Detect conflicts between sources
   * Only checks between sources from DIFFERENT independence groups
   */
  detectConflicts(
    fieldName: string,
    sources: FieldDataSource[],
  ): FieldConflict[] {
    const conflicts: FieldConflict[] = [];

    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const s1 = sources[i];
        const s2 = sources[j];
        const g1 = this.getSourceGroup(s1.type);
        const g2 = this.getSourceGroup(s2.type);

        // Only check conflicts between different independence groups
        if (g1 === g2) continue;

        // Skip if no raw values to compare
        if (s1.rawValue === undefined || s2.rawValue === undefined) continue;

        if (!this.valuesAgree(s1.rawValue, s2.rawValue)) {
          conflicts.push({
            fieldName,
            value1: s1.rawValue,
            source1: s1.type,
            group1: g1,
            value2: s2.rawValue,
            source2: s2.type,
            group2: g2,
            severity: this.assessConflictSeverity(s1.rawValue, s2.rawValue),
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Calculate the base corroboration multiplier from source count only
   * Used by mergeConfidence() where we don't detect conflicts
   *
   * Rules:
   * - 1 independent source: 0.80 (single source penalty)
   * - 2 independent sources: 1.00 (baseline)
   * - 3+ independent sources: up to 1.10 (corroboration bonus)
   */
  getBaseCorroborationMultiplier(independentCount: number): number {
    if (independentCount <= 1) {
      return CORROBORATION.SINGLE_SOURCE_PENALTY;
    } else if (independentCount === 2) {
      return CORROBORATION.TWO_SOURCE_BASELINE;
    } else {
      // 3+ sources: 0.80 + (count * 0.10), capped at 1.10
      return Math.min(
        CORROBORATION.MAX_MULTIPLIER,
        CORROBORATION.SINGLE_SOURCE_PENALTY + (independentCount * CORROBORATION.ADDITIONAL_SOURCE_BONUS),
      );
    }
  }

  /**
   * Calculate the corroboration multiplier based on source independence
   *
   * Rules:
   * - 1 independent source: 0.80 (single source penalty)
   * - 2 independent sources: 1.00 (baseline)
   * - 3+ independent sources: up to 1.10 (corroboration bonus)
   * - Each major conflict: -0.10
   * - Each minor conflict: -0.05
   */
  calculateCorroborationMultiplier(
    sources: FieldDataSource[],
    conflicts: FieldConflict[],
  ): number {
    const independentCount = this.countIndependentGroups(sources);
    const baseMultiplier = this.getBaseCorroborationMultiplier(independentCount);

    // Apply conflict penalties
    const majorConflicts = conflicts.filter((c) => c.severity === 'major').length;
    const minorConflicts = conflicts.filter((c) => c.severity === 'minor').length;
    const conflictPenalty =
      majorConflicts * CORROBORATION.MAJOR_CONFLICT_PENALTY +
      minorConflicts * CORROBORATION.MINOR_CONFLICT_PENALTY;

    return Math.max(CORROBORATION.MIN_MULTIPLIER, baseMultiplier - conflictPenalty);
  }

  /**
   * Calculate cross-validated confidence
   */
  calculateCrossValidatedConfidence(
    baseConfidence: number,
    sources: FieldDataSource[],
    conflicts: FieldConflict[],
  ): { confidence: number; multiplier: number; agreementScore: number } {
    const multiplier = this.calculateCorroborationMultiplier(sources, conflicts);

    // Calculate agreement score (1.0 = perfect agreement, 0.0 = all conflicts)
    // Only count cross-group pairs
    const groups = this.getRepresentedGroups(sources);
    const crossGroupPairs = (groups.length * (groups.length - 1)) / 2;
    const agreementScore = crossGroupPairs > 0 ? 1 - conflicts.length / Math.max(1, crossGroupPairs) : 1.0;

    const confidence = Math.min(CORROBORATION.MAX_CONFIDENCE, Math.max(0, baseConfidence * multiplier));

    return { confidence, multiplier, agreementScore };
  }

  /**
   * Cross-validate a single field
   */
  crossValidateField(fieldName: string, value: unknown, confidenceScore: FieldConfidenceScore): CrossValidatedField {
    const conflicts = this.detectConflicts(fieldName, confidenceScore.sources);
    const { confidence, multiplier, agreementScore } = this.calculateCrossValidatedConfidence(
      confidenceScore.value,
      confidenceScore.sources,
      conflicts,
    );

    return {
      fieldName,
      value,
      baseConfidence: confidenceScore.value,
      crossValidatedConfidence: confidence,
      sources: confidenceScore.sources,
      independentGroupCount: this.countIndependentGroups(confidenceScore.sources),
      agreementScore,
      conflicts,
      corroborationMultiplier: multiplier,
    };
  }

  /**
   * Cross-validate all fields
   */
  crossValidateAllFields(
    fields: Record<string, { value: unknown; confidence: FieldConfidenceScore }>,
  ): CrossValidationResult {
    const result: CrossValidationResult = {
      fields: {},
      totalConflicts: 0,
      averageCorroboration: 0,
      fieldsWithMultipleIndependentSources: 0,
    };

    let totalMultiplier = 0;
    let fieldCount = 0;

    for (const [fieldName, field] of Object.entries(fields)) {
      const crossValidated = this.crossValidateField(fieldName, field.value, field.confidence);
      result.fields[fieldName] = crossValidated;
      result.totalConflicts += crossValidated.conflicts.length;

      if (crossValidated.independentGroupCount >= 2) {
        result.fieldsWithMultipleIndependentSources++;
      }

      totalMultiplier += crossValidated.corroborationMultiplier;
      fieldCount++;
    }

    result.averageCorroboration = fieldCount > 0 ? totalMultiplier / fieldCount : 1.0;

    return result;
  }
}
