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

export interface Organization {
  id: string;
  name: string;
  status: OrgStatus;
  autoApprovalSettings: AutoApprovalSettings;
  createdAt: Date;
}

export interface UserOrganization {
  userId: string;
  orgId: string;
  role: OrgRole;
}

