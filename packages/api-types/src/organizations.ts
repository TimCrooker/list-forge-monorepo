import {
  OrgRole,
  AutoPublishSettings,
  WorkflowSettings,
  NotificationSettings,
  EmailNotificationSettings,
  WebhookSettings,
  TeamSettings,
  InventorySettings,
  MarketplaceDefaultSettings,
  EbayDefaultSettings,
  AmazonDefaultSettings,
  BillingSettings,
  SecuritySettings,
  ResearchSettings,
} from '@listforge/core-types';
import { OrgDto } from './auth';

export interface CreateOrgRequest {
  name: string;
}

export interface CreateOrgResponse {
  org: OrgDto;
}

export interface OrgMemberDto {
  userId: string;
  orgId: string;
  role: OrgRole;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface OrgDetailResponse {
  org: OrgDto;
  members: OrgMemberDto[];
}

export interface AddOrgMemberRequest {
  email: string;
  role: OrgRole;
}

export interface AddOrgMemberResponse {
  member: OrgMemberDto;
}

export interface UpdateOrgMemberRequest {
  role: OrgRole;
}

export interface UpdateOrgMemberResponse {
  member: OrgMemberDto;
}

// ============================================================================
// Organization Type Management (Personal vs Team)
// ============================================================================

export interface EnableTeamRequest {
  name: string; // New organization name
}

export interface EnableTeamResponse {
  org: OrgDto;
}

export interface DisableTeamResponse {
  org: OrgDto;
}

// ============================================================================
// Auto-Publish Settings (Slice 7)
// ============================================================================

export interface GetAutoPublishSettingsResponse {
  settings: AutoPublishSettings;
}

export interface UpdateAutoPublishSettingsRequest {
  enabled?: boolean;
  minConfidenceScore?: number;
  minValidatedComps?: number;
  maxPriceThreshold?: number | null;
}

export interface UpdateAutoPublishSettingsResponse {
  settings: AutoPublishSettings;
}

// ============================================================================
// Workflow Settings
// ============================================================================

export interface GetWorkflowSettingsResponse {
  settings: WorkflowSettings;
}

export interface UpdateWorkflowSettingsRequest {
  aiProvider?: 'openai' | 'anthropic';
  defaultModel?: string;
  confidenceThreshold?: number;
  enableAutoResearch?: boolean;
  maxResearchRetries?: number;
  researchTimeoutMinutes?: number;
  enableOCR?: boolean;
  enableWebSearch?: boolean;
  maxConcurrentWorkflows?: number;
}

export interface UpdateWorkflowSettingsResponse {
  settings: WorkflowSettings;
}

// ============================================================================
// Notification Settings
// ============================================================================

export interface GetNotificationSettingsResponse {
  settings: NotificationSettings;
}

export interface UpdateNotificationSettingsRequest {
  emailNotifications?: Partial<EmailNotificationSettings>;
  webhooks?: Partial<WebhookSettings>;
}

export interface UpdateNotificationSettingsResponse {
  settings: NotificationSettings;
}

export interface TestWebhookRequest {
  eventType: string;
}

export interface TestWebhookResponse {
  success: boolean;
  statusCode?: number;
  message: string;
}

// ============================================================================
// Team Settings
// ============================================================================

export interface GetTeamSettingsResponse {
  settings: TeamSettings;
}

export interface UpdateTeamSettingsRequest {
  autoAssignReviewer?: boolean;
  reviewerRotation?: 'round_robin' | 'manual' | 'least_busy';
  requireDualReview?: boolean;
  allowMembersToPublish?: boolean;
  requireAdminApproval?: boolean;
  allowBulkOperations?: boolean;
}

export interface UpdateTeamSettingsResponse {
  settings: TeamSettings;
}

// ============================================================================
// Inventory Settings
// ============================================================================

export interface GetInventorySettingsResponse {
  settings: InventorySettings;
}

export interface UpdateInventorySettingsRequest {
  defaultPricingStrategy?: 'competitive' | 'premium' | 'quick_sale' | 'custom';
  defaultMarginPercent?: number;
  minimumMarginPercent?: number;
  enableAutoRelist?: boolean;
  autoRelistDelayDays?: number;
  lowStockThreshold?: number;
  requireConditionNotes?: boolean;
  mandatoryFields?: string[];
}

export interface UpdateInventorySettingsResponse {
  settings: InventorySettings;
}

// ============================================================================
// Marketplace Default Settings
// ============================================================================

export interface GetMarketplaceDefaultSettingsResponse {
  settings: MarketplaceDefaultSettings;
}

export interface UpdateMarketplaceDefaultSettingsRequest {
  ebay?: Partial<EbayDefaultSettings>;
  amazon?: Partial<AmazonDefaultSettings>;
}

export interface UpdateMarketplaceDefaultSettingsResponse {
  settings: MarketplaceDefaultSettings;
}

// ============================================================================
// Billing Settings
// ============================================================================

export interface GetBillingSettingsResponse {
  settings: BillingSettings;
}

export interface UpdateBillingSettingsRequest {
  billingEmail?: string | null;
}

export interface UpdateBillingSettingsResponse {
  settings: BillingSettings;
}

// ============================================================================
// Security Settings
// ============================================================================

export interface GetSecuritySettingsResponse {
  settings: SecuritySettings;
}

export interface UpdateSecuritySettingsRequest {
  mfaRequired?: boolean;
  sessionTimeoutMinutes?: number;
  allowedIPRanges?: string[];
  apiAccessEnabled?: boolean;
  apiRateLimit?: number;
}

export interface UpdateSecuritySettingsResponse {
  settings: SecuritySettings;
}

// ============================================================================
// Research Settings (Confidence-Based Review Routing)
// ============================================================================

export interface GetResearchSettingsResponse {
  settings: ResearchSettings;
}

export interface UpdateResearchSettingsRequest {
  enableAutoApproval?: boolean;
  autoApproveThreshold?: number;
  spotCheckThreshold?: number;
  minCompsForAutoApproval?: number;
  maxAutoApprovalsPerDay?: number;
}

export interface UpdateResearchSettingsResponse {
  settings: ResearchSettings;
}

