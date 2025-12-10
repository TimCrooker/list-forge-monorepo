/**
 * Settings Audit API Types
 *
 * Types for settings version history, audit logging, and revert functionality.
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * All organization settings types that can be versioned
 */
export type SettingsType =
  | 'workflow'
  | 'notification'
  | 'team'
  | 'inventory'
  | 'marketplaceDefaults'
  | 'billing'
  | 'security'
  | 'autoPublish'
  | 'autoApproval';

/**
 * Settings audit event types
 */
export type SettingsAuditEventType =
  | 'settings:created'
  | 'settings:updated'
  | 'settings:reverted'
  | 'settings:admin_update';

// ============================================================================
// Field Diff Types
// ============================================================================

/**
 * Represents a single field change with before/after values
 */
export interface FieldDiffDto {
  /** Field name (leaf property name) */
  field: string;
  /** Full path to field (e.g., "ebay.listingDurationDays") */
  path: string;
  /** Previous value (null if field was added) */
  previousValue: unknown;
  /** New value (null if field was removed) */
  newValue: unknown;
}

// ============================================================================
// Version Types
// ============================================================================

/**
 * Basic user info for audit display
 */
export interface AuditUserDto {
  id: string;
  email: string;
  name?: string | null;
}

/**
 * Settings version snapshot
 */
export interface SettingsVersionDto {
  id: string;
  orgId: string;
  settingsType: SettingsType;
  versionNumber: number;
  settingsSnapshot: Record<string, unknown>;
  user: AuditUserDto | null;
  isRevert: boolean;
  revertedFromVersionId: string | null;
  revertReason: string | null;
  createdAt: string;
}

/**
 * Settings audit log entry
 */
export interface SettingsAuditLogDto {
  id: string;
  orgId: string;
  user: AuditUserDto | null;
  settingsType: SettingsType;
  eventType: SettingsAuditEventType;
  message: string;
  fieldDiffs: FieldDiffDto[];
  versionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Query parameters for fetching audit logs
 */
export interface GetSettingsAuditLogsRequest {
  settingsType?: SettingsType;
  eventType?: SettingsAuditEventType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Admin query parameters for fetching audit logs across orgs
 */
export interface GetAdminSettingsAuditLogsRequest extends GetSettingsAuditLogsRequest {
  orgId?: string;
}

/**
 * Request body for reverting settings
 */
export interface RevertSettingsRequest {
  reason: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response for version history list
 */
export interface GetSettingsVersionsResponse {
  versions: SettingsVersionDto[];
}

/**
 * Response for audit logs list
 */
export interface GetSettingsAuditLogsResponse {
  logs: SettingsAuditLogDto[];
  total: number;
}

/**
 * Response for revert preview
 */
export interface PreviewSettingsRevertResponse {
  version: SettingsVersionDto;
  currentSettings: Record<string, unknown>;
  targetSettings: Record<string, unknown>;
  fieldDiffs: FieldDiffDto[];
}

/**
 * Response for successful revert
 */
export interface RevertSettingsResponse {
  newVersion: SettingsVersionDto;
  appliedSettings: Record<string, unknown>;
}

// ============================================================================
// Display Labels
// ============================================================================

/**
 * Human-readable labels for settings types
 */
export const SETTINGS_TYPE_LABELS: Record<SettingsType, string> = {
  workflow: 'Workflow',
  notification: 'Notification',
  team: 'Team',
  inventory: 'Inventory',
  marketplaceDefaults: 'Marketplace Defaults',
  billing: 'Billing',
  security: 'Security',
  autoPublish: 'Auto-Publish',
  autoApproval: 'Auto-Approval',
};

/**
 * Human-readable labels for event types
 */
export const EVENT_TYPE_LABELS: Record<SettingsAuditEventType, string> = {
  'settings:created': 'Created',
  'settings:updated': 'Updated',
  'settings:reverted': 'Reverted',
  'settings:admin_update': 'Admin Update',
};
