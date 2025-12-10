import { Injectable, Logger } from '@nestjs/common';
import type {
  FieldState,
  ItemFieldStates,
  FieldDataSource,
  FieldConfidenceScore,
  FieldRequirement,
  FieldDataSourceType,
  CANONICAL_FIELDS,
  UNIVERSAL_REQUIRED_FIELDS,
} from '@listforge/core-types';
import {
  CANONICAL_FIELDS as CanonicalFieldsData,
  UNIVERSAL_REQUIRED_FIELDS as UniversalRequiredFieldsData,
} from '@listforge/core-types';

/**
 * Item data for initializing field states
 */
export interface ItemForFieldInit {
  title?: string | null;
  description?: string | null;
  condition?: string | null;
  categoryPath?: string[] | null;
  attributes?: Array<{ key: string; value: string }>;
  defaultPrice?: number | null;
}

/**
 * Readiness check result
 */
export interface ReadinessCheckResult {
  ready: boolean;
  completionScore: number;
  missingFields: string[];
  lowConfidenceFields: Array<{ field: string; confidence: number }>;
  requiredFieldsComplete: number;
  requiredFieldsTotal: number;
}

/**
 * FieldStateManagerService
 *
 * Central service for managing field-level confidence tracking and state updates.
 * Core component of the field-driven research system.
 *
 * Responsibilities:
 * - Initialize field states from marketplace requirements
 * - Update individual fields with new data
 * - Merge confidence from multiple sources
 * - Check readiness (all required fields meet threshold)
 * - Get fields that need more research
 * - Calculate overall completion score
 * - Map canonical field values to marketplace-specific formats
 */
@Injectable()
export class FieldStateManagerService {
  private readonly logger = new Logger(FieldStateManagerService.name);

  /**
   * Source confidence weights - how much to trust each source type
   */
  private readonly SOURCE_WEIGHTS: Record<FieldDataSourceType, number> = {
    upc_lookup: 0.95,
    keepa: 0.90,
    amazon_catalog: 0.88,
    ebay_api: 0.90,
    user_input: 1.0,  // User is always right
    user_hint: 0.85,
    vision_ai: 0.70,
    web_search: 0.65,
    ocr: 0.75,
  };

  /**
   * Initialize field states from marketplace requirements and existing item data
   */
  initializeFieldStates(
    requiredFields: FieldRequirement[],
    recommendedFields: FieldRequirement[],
    existingItem: ItemForFieldInit,
    targetMarketplaces: string[] = ['ebay'],
  ): ItemFieldStates {
    const fields: Record<string, FieldState> = {};
    const now = new Date().toISOString();

    // First, add universal required fields
    for (const fieldName of UniversalRequiredFieldsData) {
      const canonicalDef = CanonicalFieldsData[fieldName];
      if (!canonicalDef) continue;

      fields[fieldName] = this.createFieldState(
        fieldName,
        canonicalDef.displayName,
        canonicalDef.dataType,
        true,
        targetMarketplaces,
        undefined,
        now,
      );
    }

    // Add marketplace-specific required fields
    for (const req of requiredFields) {
      const canonicalName = this.findCanonicalFieldName(req.name);
      const canonicalDef = CanonicalFieldsData[canonicalName];

      if (!fields[canonicalName]) {
        fields[canonicalName] = this.createFieldState(
          canonicalName,
          canonicalDef?.displayName || req.localizedName,
          canonicalDef?.dataType || req.dataType,
          true,
          targetMarketplaces,
          req.allowedValues,
          now,
        );
      } else {
        // Already exists, just add to requiredBy if not present
        if (!fields[canonicalName].requiredBy.includes(targetMarketplaces[0])) {
          fields[canonicalName].requiredBy.push(...targetMarketplaces);
        }
        // Merge allowed values
        if (req.allowedValues) {
          fields[canonicalName].allowedValues = req.allowedValues;
        }
      }
    }

    // Add recommended fields (not required)
    for (const rec of recommendedFields) {
      const canonicalName = this.findCanonicalFieldName(rec.name);
      const canonicalDef = CanonicalFieldsData[canonicalName];

      if (!fields[canonicalName]) {
        fields[canonicalName] = this.createFieldState(
          canonicalName,
          canonicalDef?.displayName || rec.localizedName,
          canonicalDef?.dataType || rec.dataType,
          false,
          [],
          rec.allowedValues,
          now,
        );
      }
    }

    // Pre-populate from existing item data
    this.populateFromExistingItem(fields, existingItem, now);

    // Calculate initial metrics
    const metrics = this.calculateMetrics(fields, 0.70); // Default threshold

    return {
      fields,
      requiredFieldsComplete: metrics.requiredFieldsComplete,
      requiredFieldsTotal: metrics.requiredFieldsTotal,
      recommendedFieldsComplete: metrics.recommendedFieldsComplete,
      recommendedFieldsTotal: metrics.recommendedFieldsTotal,
      completionScore: metrics.completionScore,
      readyToPublish: metrics.readyToPublish,
      totalCost: 0,
      totalTimeMs: 0,
      iterations: 0,
      version: '1.0.0',
    };
  }

  /**
   * Update a single field with new data from a research source
   */
  updateField(
    states: ItemFieldStates,
    fieldName: string,
    value: unknown,
    source: FieldDataSource,
    confidenceThreshold: number = 0.70,
  ): ItemFieldStates {
    const field = states.fields[fieldName];

    if (!field) {
      this.logger.warn(`Attempted to update unknown field: ${fieldName}`);
      return states;
    }

    // Skip if value is null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return states;
    }

    // Merge confidence from new source
    const updatedConfidence = this.mergeConfidence(field.confidence, source);

    // Determine if we should update the value
    // Only update if new source has higher weighted confidence than existing
    const shouldUpdateValue = this.shouldUpdateValue(field, source);

    const updatedField: FieldState = {
      ...field,
      value: shouldUpdateValue ? value : field.value,
      confidence: updatedConfidence,
      attempts: field.attempts + 1,
      status: this.determineFieldStatus(updatedConfidence.value, field.required, confidenceThreshold),
    };

    const updatedFields = {
      ...states.fields,
      [fieldName]: updatedField,
    };

    // Recalculate metrics
    const metrics = this.calculateMetrics(updatedFields, confidenceThreshold);

    // Add source cost to total
    const newTotalCost = states.totalCost + (source.cost || 0);

    return {
      ...states,
      fields: updatedFields,
      requiredFieldsComplete: metrics.requiredFieldsComplete,
      requiredFieldsTotal: metrics.requiredFieldsTotal,
      recommendedFieldsComplete: metrics.recommendedFieldsComplete,
      recommendedFieldsTotal: metrics.recommendedFieldsTotal,
      completionScore: metrics.completionScore,
      readyToPublish: metrics.readyToPublish,
      totalCost: newTotalCost,
    };
  }

  /**
   * Batch update multiple fields from a research task result
   */
  updateMultipleFields(
    states: ItemFieldStates,
    updates: Array<{ fieldName: string; value: unknown; source: FieldDataSource }>,
    confidenceThreshold: number = 0.70,
  ): ItemFieldStates {
    let currentStates = states;

    for (const update of updates) {
      currentStates = this.updateField(
        currentStates,
        update.fieldName,
        update.value,
        update.source,
        confidenceThreshold,
      );
    }

    return currentStates;
  }

  /**
   * Merge confidence from a new source into existing confidence
   * Uses weighted averaging based on source type
   */
  mergeConfidence(
    existing: FieldConfidenceScore,
    newSource: FieldDataSource,
  ): FieldConfidenceScore {
    const now = new Date().toISOString();
    const weight = this.SOURCE_WEIGHTS[newSource.type] || 0.5;
    const weightedNewConfidence = newSource.confidence * weight;

    // If no existing sources, just use the new one
    if (existing.sources.length === 0) {
      return {
        value: weightedNewConfidence,
        sources: [newSource],
        lastUpdated: now,
      };
    }

    // Calculate total weight from all sources
    let totalWeight = 0;
    let weightedSum = 0;

    for (const source of existing.sources) {
      const sourceWeight = this.SOURCE_WEIGHTS[source.type] || 0.5;
      totalWeight += sourceWeight;
      weightedSum += source.confidence * sourceWeight;
    }

    // Add new source
    totalWeight += weight;
    weightedSum += weightedNewConfidence;

    // Calculate weighted average
    const newConfidence = Math.min(1, weightedSum / totalWeight);

    return {
      value: newConfidence,
      sources: [...existing.sources, newSource],
      lastUpdated: now,
    };
  }

  /**
   * Check if all required fields meet confidence threshold
   */
  checkReadiness(
    states: ItemFieldStates,
    threshold: number = 0.70,
  ): ReadinessCheckResult {
    const missingFields: string[] = [];
    const lowConfidenceFields: Array<{ field: string; confidence: number }> = [];
    let requiredComplete = 0;
    let requiredTotal = 0;

    for (const [fieldName, field] of Object.entries(states.fields)) {
      if (!field.required) continue;

      requiredTotal++;

      if (field.value === null || field.value === undefined || field.value === '') {
        missingFields.push(fieldName);
      } else if (field.confidence.value < threshold) {
        lowConfidenceFields.push({
          field: fieldName,
          confidence: field.confidence.value,
        });
      } else {
        requiredComplete++;
      }
    }

    const ready = missingFields.length === 0 && lowConfidenceFields.length === 0;
    const completionScore = requiredTotal > 0 ? requiredComplete / requiredTotal : 1;

    return {
      ready,
      completionScore,
      missingFields,
      lowConfidenceFields,
      requiredFieldsComplete: requiredComplete,
      requiredFieldsTotal: requiredTotal,
    };
  }

  /**
   * Get fields that need more research, sorted by priority
   * Priority: required > recommended, lower confidence > higher confidence
   */
  getFieldsNeedingResearch(
    states: ItemFieldStates,
    requiredThreshold: number = 0.70,
    recommendedThreshold: number = 0.50,
  ): FieldState[] {
    const fieldsNeedingWork: FieldState[] = [];

    for (const field of Object.values(states.fields)) {
      const threshold = field.required ? requiredThreshold : recommendedThreshold;

      // Field needs work if:
      // 1. No value and not marked as failed
      // 2. Has value but confidence below threshold
      const needsWork =
        (field.value === null || field.value === undefined || field.value === '') ||
        (field.confidence.value < threshold && field.status !== 'failed');

      if (needsWork && field.status !== 'user_required') {
        fieldsNeedingWork.push(field);
      }
    }

    // Sort by priority:
    // 1. Required fields first
    // 2. Lower confidence first
    // 3. Fewer attempts first (fresh fields)
    return fieldsNeedingWork.sort((a, b) => {
      // Required first
      if (a.required !== b.required) {
        return a.required ? -1 : 1;
      }

      // Lower confidence first
      if (a.confidence.value !== b.confidence.value) {
        return a.confidence.value - b.confidence.value;
      }

      // Fewer attempts first
      return a.attempts - b.attempts;
    });
  }

  /**
   * Calculate overall completion score
   * Weighted: 70% required fields, 30% recommended fields
   */
  calculateCompletionScore(
    states: ItemFieldStates,
    requiredThreshold: number = 0.70,
    recommendedThreshold: number = 0.50,
  ): number {
    const metrics = this.calculateMetrics(states.fields, requiredThreshold);
    return metrics.completionScore;
  }

  /**
   * Map canonical field value to marketplace-specific format
   * Handles enum value mapping and validation
   */
  mapToMarketplace(
    fieldName: string,
    value: unknown,
    marketplace: string,
    allowedValues?: string[],
  ): { mappedValue: unknown; confidence: number; valid: boolean } {
    if (value === null || value === undefined) {
      return { mappedValue: null, confidence: 0, valid: false };
    }

    // For enum fields, try to match against allowed values
    if (allowedValues && allowedValues.length > 0 && typeof value === 'string') {
      const match = this.fuzzyMatchEnumValue(value, allowedValues);
      return match;
    }

    // For non-enum fields, just return as-is
    return { mappedValue: value, confidence: 1, valid: true };
  }

  /**
   * Mark a field as requiring user input (failed all research attempts)
   */
  markAsUserRequired(
    states: ItemFieldStates,
    fieldName: string,
  ): ItemFieldStates {
    const field = states.fields[fieldName];
    if (!field) return states;

    return {
      ...states,
      fields: {
        ...states.fields,
        [fieldName]: {
          ...field,
          status: 'user_required',
        },
      },
    };
  }

  /**
   * Set user-provided value for a field
   */
  setUserValue(
    states: ItemFieldStates,
    fieldName: string,
    value: unknown,
    confidenceThreshold: number = 0.70,
  ): ItemFieldStates {
    const source: FieldDataSource = {
      type: 'user_input',
      confidence: 1.0,
      timestamp: new Date().toISOString(),
      rawValue: value,
    };

    return this.updateField(states, fieldName, value, source, confidenceThreshold);
  }

  /**
   * Get a summary of field states for display
   */
  getSummary(states: ItemFieldStates, requiredThreshold: number = 0.70): {
    totalFields: number;
    completeFields: number;
    incompleteFields: number;
    userRequiredFields: string[];
    topMissingFields: string[];
    // Additional metrics for research nodes
    completionScore: number;
    requiredFieldsComplete: number;
    requiredFieldsTotal: number;
    recommendedFieldsComplete: number;
    recommendedFieldsTotal: number;
    readyToPublish: boolean;
    fieldsNeedingResearch: Array<{ name: string; required: boolean }>;
  } {
    let complete = 0;
    let incomplete = 0;
    const userRequired: string[] = [];
    const missing: Array<{ field: string; required: boolean }> = [];
    const fieldsNeedingResearch: Array<{ name: string; required: boolean }> = [];

    for (const [name, field] of Object.entries(states.fields)) {
      if (field.status === 'complete') {
        complete++;
      } else {
        incomplete++;
        if (field.status === 'user_required') {
          userRequired.push(name);
        }
        if (field.value === null || field.value === undefined) {
          missing.push({ field: name, required: field.required });
        }
        if (field.status !== 'user_required' && field.status !== 'failed') {
          fieldsNeedingResearch.push({ name, required: field.required });
        }
      }
    }

    // Sort missing fields: required first
    missing.sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));
    fieldsNeedingResearch.sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));

    // Get metrics
    const metrics = this.calculateMetrics(states.fields, requiredThreshold);

    return {
      totalFields: Object.keys(states.fields).length,
      completeFields: complete,
      incompleteFields: incomplete,
      userRequiredFields: userRequired,
      topMissingFields: missing.slice(0, 5).map(m => m.field),
      // Additional metrics
      completionScore: metrics.completionScore,
      requiredFieldsComplete: metrics.requiredFieldsComplete,
      requiredFieldsTotal: metrics.requiredFieldsTotal,
      recommendedFieldsComplete: metrics.recommendedFieldsComplete,
      recommendedFieldsTotal: metrics.recommendedFieldsTotal,
      readyToPublish: metrics.readyToPublish,
      fieldsNeedingResearch,
    };
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Create a new field state with default values
   */
  private createFieldState(
    name: string,
    displayName: string,
    dataType: 'string' | 'number' | 'enum' | 'boolean' | 'array',
    required: boolean,
    requiredBy: string[],
    allowedValues: string[] | undefined,
    timestamp: string,
  ): FieldState {
    return {
      name,
      displayName,
      value: null,
      confidence: {
        value: 0,
        sources: [],
        lastUpdated: timestamp,
      },
      required,
      requiredBy,
      dataType,
      allowedValues,
      attempts: 0,
      status: 'pending',
    };
  }

  /**
   * Find the canonical field name for a marketplace-specific field name
   */
  private findCanonicalFieldName(marketplaceFieldName: string): string {
    const normalized = marketplaceFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check if it's already a canonical name
    if (CanonicalFieldsData[normalized]) {
      return normalized;
    }

    // Search through aliases
    for (const [canonicalName, def] of Object.entries(CanonicalFieldsData)) {
      if (def.aliases.some(alias =>
        alias.toLowerCase().replace(/[^a-z0-9]/g, '_') === normalized
      )) {
        return canonicalName;
      }
    }

    // Not found, return normalized version as new field
    return normalized;
  }

  /**
   * Populate field states from existing item data
   */
  private populateFromExistingItem(
    fields: Record<string, FieldState>,
    item: ItemForFieldInit,
    timestamp: string,
  ): void {
    const existingSource: FieldDataSource = {
      type: 'user_hint',
      confidence: 0.85,
      timestamp,
    };

    // Map item fields to canonical fields
    const mappings: Array<{ field: string; value: unknown }> = [
      { field: 'title', value: item.title },
      { field: 'description', value: item.description },
      { field: 'condition', value: item.condition },
      { field: 'category', value: item.categoryPath?.join(' > ') },
      { field: 'price', value: item.defaultPrice },
    ];

    // Add attributes
    if (item.attributes) {
      for (const attr of item.attributes) {
        const canonicalName = this.findCanonicalFieldName(attr.key);
        mappings.push({ field: canonicalName, value: attr.value });
      }
    }

    // Apply mappings
    for (const { field, value } of mappings) {
      if (value !== null && value !== undefined && value !== '' && fields[field]) {
        fields[field].value = value;
        fields[field].confidence = {
          value: existingSource.confidence,
          sources: [existingSource],
          lastUpdated: timestamp,
        };
        fields[field].status = 'complete';
      }
    }
  }

  /**
   * Calculate metrics from field states
   */
  private calculateMetrics(
    fields: Record<string, FieldState>,
    requiredThreshold: number,
  ): {
    requiredFieldsComplete: number;
    requiredFieldsTotal: number;
    recommendedFieldsComplete: number;
    recommendedFieldsTotal: number;
    completionScore: number;
    readyToPublish: boolean;
  } {
    let requiredComplete = 0;
    let requiredTotal = 0;
    let recommendedComplete = 0;
    let recommendedTotal = 0;

    for (const field of Object.values(fields)) {
      if (field.required) {
        requiredTotal++;
        if (field.value !== null && field.value !== undefined && field.confidence.value >= requiredThreshold) {
          requiredComplete++;
        }
      } else {
        recommendedTotal++;
        if (field.value !== null && field.value !== undefined && field.confidence.value >= 0.50) {
          recommendedComplete++;
        }
      }
    }

    // Weighted score: 70% required, 30% recommended
    const requiredScore = requiredTotal > 0 ? requiredComplete / requiredTotal : 1;
    const recommendedScore = recommendedTotal > 0 ? recommendedComplete / recommendedTotal : 1;
    const completionScore = requiredScore * 0.7 + recommendedScore * 0.3;

    const readyToPublish = requiredComplete === requiredTotal;

    return {
      requiredFieldsComplete: requiredComplete,
      requiredFieldsTotal: requiredTotal,
      recommendedFieldsComplete: recommendedComplete,
      recommendedFieldsTotal: recommendedTotal,
      completionScore,
      readyToPublish,
    };
  }

  /**
   * Determine if we should update the field value based on source confidence
   */
  private shouldUpdateValue(field: FieldState, newSource: FieldDataSource): boolean {
    // Always update if no current value
    if (field.value === null || field.value === undefined) {
      return true;
    }

    // Compare weighted confidence
    const newWeight = this.SOURCE_WEIGHTS[newSource.type] || 0.5;
    const newWeightedConfidence = newSource.confidence * newWeight;

    // Get best existing source confidence
    let bestExistingConfidence = 0;
    for (const source of field.confidence.sources) {
      const weight = this.SOURCE_WEIGHTS[source.type] || 0.5;
      const weighted = source.confidence * weight;
      if (weighted > bestExistingConfidence) {
        bestExistingConfidence = weighted;
      }
    }

    // Update if new source is significantly better (> 10% improvement)
    return newWeightedConfidence > bestExistingConfidence * 1.1;
  }

  /**
   * Determine field status based on confidence and requirements
   */
  private determineFieldStatus(
    confidence: number,
    required: boolean,
    threshold: number,
  ): FieldState['status'] {
    if (confidence >= threshold) {
      return 'complete';
    }
    if (confidence >= threshold * 0.5) {
      return 'pending'; // Has some data but not enough confidence
    }
    return 'pending';
  }

  /**
   * Fuzzy match a value against allowed enum values
   */
  private fuzzyMatchEnumValue(
    value: string,
    allowedValues: string[],
  ): { mappedValue: string | null; confidence: number; valid: boolean } {
    const normalizedValue = value.toLowerCase().trim();

    // Exact match
    const exactMatch = allowedValues.find(v => v.toLowerCase() === normalizedValue);
    if (exactMatch) {
      return { mappedValue: exactMatch, confidence: 1.0, valid: true };
    }

    // Contains match
    const containsMatch = allowedValues.find(v =>
      v.toLowerCase().includes(normalizedValue) ||
      normalizedValue.includes(v.toLowerCase())
    );
    if (containsMatch) {
      return { mappedValue: containsMatch, confidence: 0.8, valid: true };
    }

    // Word overlap match
    const valueWords = new Set(normalizedValue.split(/\s+/));
    let bestMatch: string | null = null;
    let bestOverlap = 0;

    for (const allowed of allowedValues) {
      const allowedWords = new Set(allowed.toLowerCase().split(/\s+/));
      let overlap = 0;
      for (const word of valueWords) {
        if (allowedWords.has(word)) overlap++;
      }
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestMatch = allowed;
      }
    }

    if (bestMatch && bestOverlap >= 1) {
      const overlapRatio = bestOverlap / Math.max(valueWords.size, 1);
      return { mappedValue: bestMatch, confidence: 0.5 + overlapRatio * 0.3, valid: true };
    }

    // No match found
    return { mappedValue: null, confidence: 0, valid: false };
  }
}
