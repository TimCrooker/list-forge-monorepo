import { OrgRole } from './roles';

export type OrgStatus = 'active' | 'suspended';

/**
 * Auto-approval settings for an organization.
 * When enabled, listing drafts that meet criteria are auto-approved.
 */
export interface AutoApprovalSettings {
  /** Whether auto-approval is enabled */
  enabled: boolean;
  /** Minimum AI confidence score required (0-1) */
  minConfidenceScore: number;
  /** Maximum price threshold for auto-approval (null = no limit) */
  maxPriceThreshold: number | null;
}

export const DEFAULT_AUTO_APPROVAL_SETTINGS: AutoApprovalSettings = {
  enabled: false,
  minConfidenceScore: 0.8,
  maxPriceThreshold: null,
};

/**
 * Auto-publish settings for an organization.
 * When enabled, items that meet criteria after research completes are auto-published.
 * Slice 7: Auto-Publish & Production Polish
 */
export interface AutoPublishSettings {
  /** Whether auto-publish is enabled */
  enabled: boolean;
  /** Minimum AI confidence score required (0-1). Default: 0.90 */
  minConfidenceScore: number;
  /** Minimum number of validated comps required. Default: 5 */
  minValidatedComps: number;
  /** Maximum price threshold for auto-publish (null = no limit) */
  maxPriceThreshold: number | null;
}

export const DEFAULT_AUTO_PUBLISH_SETTINGS: AutoPublishSettings = {
  enabled: false,
  minConfidenceScore: 0.90,
  minValidatedComps: 5,
  maxPriceThreshold: null,
};

// ============================================================================
// Workflow Settings
// ============================================================================

/**
 * Workflow settings for an organization.
 * Controls AI provider, research parameters, and service toggles.
 */
export interface WorkflowSettings {
  /** AI provider to use for workflows */
  aiProvider: 'openai' | 'anthropic';
  /** Default model for AI operations */
  defaultModel: string;
  /** Minimum confidence threshold for auto-approval (0-1) */
  confidenceThreshold: number;
  /** Whether to automatically trigger research on new items */
  enableAutoResearch: boolean;
  /** Maximum number of research retries on failure */
  maxResearchRetries: number;
  /** Research timeout in minutes */
  researchTimeoutMinutes: number;
  /** Whether OCR is enabled for image processing */
  enableOCR: boolean;
  /** Whether web search is enabled for research */
  enableWebSearch: boolean;
  /** Maximum concurrent workflow runs */
  maxConcurrentWorkflows: number;
}

export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  aiProvider: 'openai',
  defaultModel: 'gpt-4o',
  confidenceThreshold: 0.75,
  enableAutoResearch: true,
  maxResearchRetries: 3,
  researchTimeoutMinutes: 30,
  enableOCR: true,
  enableWebSearch: true,
  maxConcurrentWorkflows: 5,
};

// ============================================================================
// Notification Settings
// ============================================================================

/**
 * Email notification preferences for an organization.
 */
export interface EmailNotificationSettings {
  /** Master toggle for email notifications */
  enabled: boolean;
  /** Notify when an item is ready for review */
  onItemReady: boolean;
  /** Notify when publishing succeeds */
  onPublishSuccess: boolean;
  /** Notify when publishing fails */
  onPublishFailure: boolean;
  /** Notify when AI confidence is low */
  onLowConfidence: boolean;
}

/**
 * Webhook configuration for an organization.
 */
export interface WebhookSettings {
  /** Whether webhooks are enabled */
  enabled: boolean;
  /** Webhook endpoint URL */
  url: string | null;
  /** Event types to send to webhook */
  events: string[];
  /** Webhook signing secret */
  secret: string | null;
}

/**
 * Notification settings for an organization.
 * Controls email notifications and webhook configuration.
 */
export interface NotificationSettings {
  /** Email notification preferences */
  emailNotifications: EmailNotificationSettings;
  /** Webhook configuration */
  webhooks: WebhookSettings;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: {
    enabled: true,
    onItemReady: true,
    onPublishSuccess: true,
    onPublishFailure: true,
    onLowConfidence: false,
  },
  webhooks: {
    enabled: false,
    url: null,
    events: [],
    secret: null,
  },
};

// ============================================================================
// Team Settings
// ============================================================================

/**
 * Team settings for an organization.
 * Controls review assignment, permissions, and collaboration.
 */
export interface TeamSettings {
  /** Whether to automatically assign reviewers to items */
  autoAssignReviewer: boolean;
  /** How to rotate reviewer assignments */
  reviewerRotation: 'round_robin' | 'manual' | 'least_busy';
  /** Whether items require dual review */
  requireDualReview: boolean;
  /** Whether members (non-admins) can publish to marketplaces */
  allowMembersToPublish: boolean;
  /** Whether publishing requires admin approval */
  requireAdminApproval: boolean;
  /** Whether bulk operations are allowed */
  allowBulkOperations: boolean;
}

export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  autoAssignReviewer: false,
  reviewerRotation: 'manual',
  requireDualReview: false,
  allowMembersToPublish: true,
  requireAdminApproval: false,
  allowBulkOperations: true,
};

// ============================================================================
// Inventory Settings
// ============================================================================

/**
 * Inventory settings for an organization.
 * Controls pricing defaults, margins, and item requirements.
 */
export interface InventorySettings {
  /** Default pricing strategy for new items */
  defaultPricingStrategy: 'competitive' | 'premium' | 'quick_sale' | 'custom';
  /** Default margin percentage */
  defaultMarginPercent: number;
  /** Minimum margin percentage */
  minimumMarginPercent: number;
  /** Whether to automatically relist ended items */
  enableAutoRelist: boolean;
  /** Days to wait before auto-relisting */
  autoRelistDelayDays: number;
  /** Low stock warning threshold */
  lowStockThreshold: number;
  /** Whether condition notes are required */
  requireConditionNotes: boolean;
  /** Fields that must be filled before publishing */
  mandatoryFields: string[];
}

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  defaultPricingStrategy: 'competitive',
  defaultMarginPercent: 30,
  minimumMarginPercent: 10,
  enableAutoRelist: false,
  autoRelistDelayDays: 7,
  lowStockThreshold: 5,
  requireConditionNotes: true,
  mandatoryFields: ['title', 'condition', 'price'],
};

// ============================================================================
// Marketplace Default Settings
// ============================================================================

/**
 * eBay-specific default settings.
 */
export interface EbayDefaultSettings {
  /** Default listing duration in days */
  listingDurationDays: number;
  /** Default shipping service code */
  defaultShippingService: string;
  /** Default return policy code */
  defaultReturnPolicy: string;
  /** Whether to enable Best Offer on listings */
  enableBestOffer: boolean;
}

/**
 * Amazon-specific default settings.
 */
export interface AmazonDefaultSettings {
  /** Fulfillment channel (FBA or FBM) */
  fulfillmentChannel: 'FBA' | 'FBM';
  /** Default condition for listings */
  defaultCondition: string;
}

/**
 * Marketplace default settings for an organization.
 * Controls default values for marketplace listings.
 */
export interface MarketplaceDefaultSettings {
  /** eBay-specific defaults */
  ebay: EbayDefaultSettings;
  /** Amazon-specific defaults */
  amazon: AmazonDefaultSettings;
}

export const DEFAULT_MARKETPLACE_SETTINGS: MarketplaceDefaultSettings = {
  ebay: {
    listingDurationDays: 30,
    defaultShippingService: 'USPS_PRIORITY',
    defaultReturnPolicy: '30_DAYS_MONEY_BACK',
    enableBestOffer: false,
  },
  amazon: {
    fulfillmentChannel: 'FBM',
    defaultCondition: 'Used - Good',
  },
};

// ============================================================================
// Billing Settings
// ============================================================================

/**
 * Plan limits for an organization.
 */
export interface PlanLimits {
  /** Maximum number of items */
  maxItems: number;
  /** Maximum number of marketplace accounts */
  maxMarketplaceAccounts: number;
  /** Maximum number of team members */
  maxTeamMembers: number;
  /** Maximum research runs per month */
  maxMonthlyResearch: number;
}

/**
 * Billing settings for an organization.
 * Controls plan tier and usage limits.
 */
export interface BillingSettings {
  /** Current plan tier */
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  /** Billing email address */
  billingEmail: string | null;
  /** Plan limits */
  limits: PlanLimits;
}

export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  plan: 'free',
  billingEmail: null,
  limits: {
    maxItems: 100,
    maxMarketplaceAccounts: 1,
    maxTeamMembers: 1,
    maxMonthlyResearch: 50,
  },
};

// ============================================================================
// Security Settings
// ============================================================================

/**
 * Security settings for an organization.
 * Controls authentication, session management, and API access.
 */
export interface SecuritySettings {
  /** Whether MFA is required for all users */
  mfaRequired: boolean;
  /** Session timeout in minutes */
  sessionTimeoutMinutes: number;
  /** Allowed IP ranges (CIDR notation) */
  allowedIPRanges: string[];
  /** Whether API access is enabled */
  apiAccessEnabled: boolean;
  /** API rate limit (requests per minute) */
  apiRateLimit: number;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  mfaRequired: false,
  sessionTimeoutMinutes: 480, // 8 hours
  allowedIPRanges: [],
  apiAccessEnabled: false,
  apiRateLimit: 100,
};

// ============================================================================
// Organization Interface
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  status: OrgStatus;
  autoApprovalSettings: AutoApprovalSettings;
  autoPublishSettings: AutoPublishSettings;
  workflowSettings: WorkflowSettings;
  notificationSettings: NotificationSettings;
  teamSettings: TeamSettings;
  inventorySettings: InventorySettings;
  marketplaceDefaultSettings: MarketplaceDefaultSettings;
  billingSettings: BillingSettings;
  securitySettings: SecuritySettings;
  createdAt: Date;
}

export interface UserOrganization {
  userId: string;
  orgId: string;
  role: OrgRole;
}

