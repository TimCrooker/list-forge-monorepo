/**
 * Domain Expertise API Types - Slice 9.1
 *
 * Types for admin-configurable domain knowledge system.
 */

import type { CategoryId } from '@listforge/core-types';

// =============================================================================
// LOOKUP TABLE TYPES
// =============================================================================

/** Schema definition for a lookup table value field */
export interface LookupValueField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

/** Lookup table entity */
export interface LookupTableDto {
  id: string;
  moduleId: string | null;
  name: string;
  description: string;
  keyField: string;
  valueSchema: LookupValueField[];
  entryCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lookup entry entity */
export interface LookupEntryDto {
  id: string;
  tableId: string;
  key: string;
  values: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Request to create a lookup table */
export interface CreateLookupTableDto {
  moduleId?: string;
  name: string;
  description?: string;
  keyField: string;
  valueSchema: LookupValueField[];
}

/** Request to update a lookup table */
export interface UpdateLookupTableDto {
  name?: string;
  description?: string;
  keyField?: string;
  valueSchema?: LookupValueField[];
  isActive?: boolean;
}

/** Request to create a lookup entry */
export interface CreateLookupEntryDto {
  key: string;
  values: Record<string, unknown>;
}

/** Request to update a lookup entry */
export interface UpdateLookupEntryDto {
  key?: string;
  values?: Record<string, unknown>;
  isActive?: boolean;
}

/** Bulk operation request for entries */
export interface BulkLookupEntriesDto {
  operation: 'create' | 'update' | 'delete';
  entries: Array<{
    id?: string;
    key?: string;
    values?: Record<string, unknown>;
  }>;
}

/** Response for listing lookup tables */
export interface ListLookupTablesResponse {
  tables: LookupTableDto[];
  total: number;
}

/** Response for listing lookup entries */
export interface ListLookupEntriesResponse {
  entries: LookupEntryDto[];
  total: number;
  page: number;
  limit: number;
}

/** Response for bulk operations */
export interface BulkOperationResponse {
  created: number;
  updated: number;
  deleted: number;
  errors: Array<{ index: number; error: string }>;
}

/** Import request for lookup entries */
export interface ImportLookupEntriesDto {
  entries: Array<{
    key: string;
    values: Record<string, unknown>;
  }>;
  overwriteExisting?: boolean;
}

// =============================================================================
// DOMAIN EXPERTISE MODULE TYPES
// =============================================================================

/** Module status */
export type DomainExpertiseModuleStatus = 'draft' | 'published' | 'archived';

/** Domain expertise module entity */
export interface DomainExpertiseModuleDto {
  id: string;
  name: string;
  description: string;
  categoryId: CategoryId;
  applicableBrands: string[];
  currentVersion: number;
  status: DomainExpertiseModuleStatus;
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  publishedAt: string | null;
}

/** Module with relations */
export interface DomainExpertiseModuleWithRelationsDto extends DomainExpertiseModuleDto {
  decoders?: DecoderDefinitionDto[];
  lookupTables?: LookupTableDto[];
  valueDrivers?: ValueDriverDefinitionDto[];
  authenticityMarkers?: AuthenticityMarkerDefinitionDto[];
}

/** Request to create a module */
export interface CreateDomainExpertiseModuleDto {
  name: string;
  description?: string;
  categoryId: CategoryId;
  applicableBrands?: string[];
}

/** Request to update a module */
export interface UpdateDomainExpertiseModuleDto {
  name?: string;
  description?: string;
  applicableBrands?: string[];
}

/** Request to publish a module */
export interface PublishModuleDto {
  changelog: string;
}

/** Request to rollback a module */
export interface RollbackModuleDto {
  versionId: string;
  reason?: string;
}

/** Response for listing modules */
export interface ListDomainExpertiseModulesResponse {
  modules: DomainExpertiseModuleDto[];
  total: number;
}

// =============================================================================
// DECODER DEFINITION TYPES
// =============================================================================

/** Extraction rule for decoder */
export interface ExtractionRule {
  captureGroup: number;
  outputField: string;
  transform?: 'none' | 'parseInt' | 'parseYear' | 'lookup';
  transformConfig?: Record<string, unknown>;
}

/** Validation rule for decoder */
export interface ValidationRule {
  field: string;
  type: 'range' | 'regex' | 'lookup_exists' | 'custom';
  config: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage: string;
    failureConfidence?: number;
  };
}

/** Output field mapping for decoder */
export interface OutputFieldMapping {
  sourceField: string;
  outputField: string;
  type: 'string' | 'number' | 'boolean';
}

/** Test case for decoder */
export interface DecoderTestCase {
  input: string;
  expectedSuccess: boolean;
  expectedOutput?: Record<string, unknown>;
  description: string;
}

/** Decoder definition entity */
export interface DecoderDefinitionDto {
  id: string;
  moduleId: string;
  name: string;
  identifierType: string;
  description: string;
  inputPattern: string;
  inputMaxLength: number;
  extractionRules: ExtractionRule[];
  lookupTableId: string | null;
  lookupKeyGroup: number | null;
  validationRules: ValidationRule[];
  outputFields: OutputFieldMapping[];
  baseConfidence: number;
  priority: number;
  isActive: boolean;
  testCases: DecoderTestCase[];
  createdAt: string;
  updatedAt: string;
}

/** Request to create a decoder */
export interface CreateDecoderDefinitionDto {
  name: string;
  identifierType: string;
  description?: string;
  inputPattern: string;
  inputMaxLength?: number;
  extractionRules: ExtractionRule[];
  lookupTableId?: string;
  lookupKeyGroup?: number;
  validationRules?: ValidationRule[];
  outputFields: OutputFieldMapping[];
  baseConfidence?: number;
  priority?: number;
  testCases?: DecoderTestCase[];
}

/** Request to update a decoder */
export interface UpdateDecoderDefinitionDto {
  name?: string;
  identifierType?: string;
  description?: string;
  inputPattern?: string;
  inputMaxLength?: number;
  extractionRules?: ExtractionRule[];
  lookupTableId?: string | null;
  lookupKeyGroup?: number | null;
  validationRules?: ValidationRule[];
  outputFields?: OutputFieldMapping[];
  baseConfidence?: number;
  priority?: number;
  isActive?: boolean;
  testCases?: DecoderTestCase[];
}

/** Request to test a decoder */
export interface TestDecoderDto {
  input: string;
}

/** Response from testing a decoder */
export interface TestDecoderResponse {
  success: boolean;
  decoded?: Record<string, unknown>;
  confidence?: number;
  lookupUsed?: {
    table: string;
    key: string;
    values: Record<string, unknown>;
  };
  errors?: string[];
}

/** Request to validate a regex pattern */
export interface ValidatePatternDto {
  pattern: string;
}

/** Response from pattern validation */
export interface ValidatePatternResponse {
  valid: boolean;
  warnings: string[];
  estimatedComplexity: 'low' | 'medium' | 'high' | 'dangerous';
}

// =============================================================================
// VALUE DRIVER DEFINITION TYPES
// =============================================================================

/** Condition type for value drivers */
export type ValueDriverConditionType = 'contains' | 'equals' | 'regex' | 'range' | 'custom';

/** Condition config for complex conditions */
export interface ConditionConfig {
  min?: number;
  max?: number;
  pattern?: string;
  flags?: string;
  expression?: string;
}

/** Value driver definition entity */
export interface ValueDriverDefinitionDto {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  attribute: string;
  conditionType: ValueDriverConditionType;
  conditionValue: string | ConditionConfig;
  caseSensitive: boolean;
  priceMultiplier: number;
  priority: number;
  applicableBrands: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Request to create a value driver */
export interface CreateValueDriverDefinitionDto {
  name: string;
  description?: string;
  attribute: string;
  conditionType: ValueDriverConditionType;
  conditionValue: string | ConditionConfig;
  caseSensitive?: boolean;
  priceMultiplier: number;
  priority?: number;
  applicableBrands?: string[];
}

/** Request to update a value driver */
export interface UpdateValueDriverDefinitionDto {
  name?: string;
  description?: string;
  attribute?: string;
  conditionType?: ValueDriverConditionType;
  conditionValue?: string | ConditionConfig;
  caseSensitive?: boolean;
  priceMultiplier?: number;
  priority?: number;
  applicableBrands?: string[];
  isActive?: boolean;
}

/** Request to reorder value drivers */
export interface ReorderValueDriversDto {
  orderedIds: string[];
}

/** Request to test value drivers */
export interface TestValueDriversDto {
  fields: Record<string, unknown>;
}

/** Response from testing value drivers */
export interface TestValueDriversResponse {
  matches: Array<{
    driver: string;
    driverId: string;
    multiplier: number;
    confidence: number;
    reasoning: string;
  }>;
  combinedMultiplier: number;
}

// =============================================================================
// AUTHENTICITY MARKER DEFINITION TYPES
// =============================================================================

/** Importance level for authenticity markers */
export type AuthenticityMarkerImportance = 'critical' | 'important' | 'helpful';

/** Authenticity marker definition entity */
export interface AuthenticityMarkerDefinitionDto {
  id: string;
  moduleId: string;
  name: string;
  checkDescription: string;
  pattern: string | null;
  patternMaxLength: number;
  importance: AuthenticityMarkerImportance;
  indicatesAuthentic: boolean;
  applicableBrands: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Request to create an authenticity marker */
export interface CreateAuthenticityMarkerDefinitionDto {
  name: string;
  checkDescription: string;
  pattern?: string;
  patternMaxLength?: number;
  importance: AuthenticityMarkerImportance;
  indicatesAuthentic?: boolean;
  applicableBrands?: string[];
}

/** Request to update an authenticity marker */
export interface UpdateAuthenticityMarkerDefinitionDto {
  name?: string;
  checkDescription?: string;
  pattern?: string | null;
  patternMaxLength?: number;
  importance?: AuthenticityMarkerImportance;
  indicatesAuthentic?: boolean;
  applicableBrands?: string[];
  isActive?: boolean;
}

/** Request to test authenticity markers */
export interface TestAuthenticityDto {
  identifiers: Array<{
    type: string;
    value: string;
  }>;
  extractedText: string[];
}

/** Response from testing authenticity */
export interface TestAuthenticityResponse {
  assessment: 'likely_authentic' | 'uncertain' | 'likely_fake' | 'insufficient_data';
  confidence: number;
  markersChecked: Array<{
    marker: string;
    markerId: string;
    passed: boolean;
    confidence: number;
    details: string;
    checkedValue?: string;
  }>;
  warnings: string[];
}

// =============================================================================
// VERSION TYPES
// =============================================================================

/** Domain expertise version entity */
export interface DomainExpertiseVersionDto {
  id: string;
  moduleId: string;
  version: number;
  changelog: string;
  publishedBy: string;
  publishedAt: string;
  isActive: boolean;
}

/** Version with full snapshot */
export interface DomainExpertiseVersionWithSnapshotDto extends DomainExpertiseVersionDto {
  snapshot: {
    module: Omit<DomainExpertiseModuleDto, 'id' | 'currentVersion'>;
    decoders: DecoderDefinitionDto[];
    lookupTables: LookupTableDto[];
    lookupEntries: LookupEntryDto[];
    valueDrivers: ValueDriverDefinitionDto[];
    authenticityMarkers: AuthenticityMarkerDefinitionDto[];
  };
}

/** Response for listing versions */
export interface ListVersionsResponse {
  versions: DomainExpertiseVersionDto[];
  total: number;
}

/** Response for comparing versions */
export interface CompareVersionsResponse {
  fromVersion: number;
  toVersion: number;
  changes: {
    decoders: { added: string[]; removed: string[]; modified: string[] };
    lookupTables: { added: string[]; removed: string[]; modified: string[] };
    valueDrivers: { added: string[]; removed: string[]; modified: string[] };
    authenticityMarkers: { added: string[]; removed: string[]; modified: string[] };
  };
}

// =============================================================================
// QUERY PARAMETERS
// =============================================================================

/** Query parameters for listing modules */
export interface ListModulesQuery {
  categoryId?: CategoryId;
  status?: DomainExpertiseModuleStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/** Query parameters for listing lookup entries */
export interface ListLookupEntriesQuery {
  search?: string;
  page?: number;
  limit?: number;
}
