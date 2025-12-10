import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import {
  WorkflowSettings,
  DEFAULT_WORKFLOW_SETTINGS,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  TeamSettings,
  DEFAULT_TEAM_SETTINGS,
  InventorySettings,
  DEFAULT_INVENTORY_SETTINGS,
  MarketplaceDefaultSettings,
  DEFAULT_MARKETPLACE_SETTINGS,
  BillingSettings,
  DEFAULT_BILLING_SETTINGS,
  SecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
} from '@listforge/core-types';
import { SettingsAuditService, AuditContext } from './settings-audit.service';

/**
 * Organization Settings Service
 *
 * Unified service for managing all organization-level settings.
 * Handles validation, persistence, and audit logging for:
 * - Workflow Settings
 * - Notification Settings
 * - Team Settings
 * - Inventory Settings
 * - Marketplace Default Settings
 * - Billing Settings (limited write access)
 * - Security Settings
 */
@Injectable()
export class OrganizationSettingsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    private auditService: SettingsAuditService,
  ) {}

  // ============================================================================
  // Workflow Settings
  // ============================================================================

  async getWorkflowSettings(orgId: string): Promise<WorkflowSettings> {
    const org = await this.getOrg(orgId);
    return org.workflowSettings ?? DEFAULT_WORKFLOW_SETTINGS;
  }

  async updateWorkflowSettings(
    orgId: string,
    updates: Partial<WorkflowSettings>,
    context: AuditContext = {},
  ): Promise<WorkflowSettings> {
    const org = await this.getOrg(orgId);
    const current = org.workflowSettings ?? DEFAULT_WORKFLOW_SETTINGS;
    const updated = { ...current, ...updates };

    // Validation
    if (updated.confidenceThreshold < 0 || updated.confidenceThreshold > 1) {
      throw new BadRequestException('confidenceThreshold must be between 0 and 1');
    }
    if (updated.maxResearchRetries < 1 || updated.maxResearchRetries > 10) {
      throw new BadRequestException('maxResearchRetries must be between 1 and 10');
    }
    if (updated.researchTimeoutMinutes < 5 || updated.researchTimeoutMinutes > 120) {
      throw new BadRequestException('researchTimeoutMinutes must be between 5 and 120');
    }
    if (updated.maxConcurrentWorkflows < 1 || updated.maxConcurrentWorkflows > 50) {
      throw new BadRequestException('maxConcurrentWorkflows must be between 1 and 50');
    }
    if (!['openai', 'anthropic'].includes(updated.aiProvider)) {
      throw new BadRequestException('aiProvider must be openai or anthropic');
    }

    org.workflowSettings = updated;
    await this.orgRepo.save(org);

    // Record audit
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'workflow',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context,
    });

    return updated;
  }

  // ============================================================================
  // Notification Settings
  // ============================================================================

  async getNotificationSettings(orgId: string): Promise<NotificationSettings> {
    const org = await this.getOrg(orgId);
    return org.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS;
  }

  async updateNotificationSettings(
    orgId: string,
    updates: {
      emailNotifications?: Partial<NotificationSettings['emailNotifications']>;
      webhooks?: Partial<NotificationSettings['webhooks']>;
    },
    context: AuditContext = {},
  ): Promise<NotificationSettings> {
    const org = await this.getOrg(orgId);
    const current = org.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS;

    const updated: NotificationSettings = {
      emailNotifications: {
        ...current.emailNotifications,
        ...(updates.emailNotifications || {}),
      },
      webhooks: {
        ...current.webhooks,
        ...(updates.webhooks || {}),
      },
    };

    // Validation
    if (updated.webhooks.enabled && updated.webhooks.url) {
      try {
        const url = new URL(updated.webhooks.url);
        if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
          throw new BadRequestException('Webhook URL must use HTTPS (except localhost)');
        }
      } catch {
        throw new BadRequestException('Invalid webhook URL');
      }
    }
    if (updated.webhooks.secret && updated.webhooks.secret.length < 16) {
      throw new BadRequestException('Webhook secret must be at least 16 characters');
    }

    org.notificationSettings = updated;
    await this.orgRepo.save(org);

    // Record audit
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'notification',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context,
    });

    return updated;
  }

  // ============================================================================
  // Team Settings
  // ============================================================================

  async getTeamSettings(orgId: string): Promise<TeamSettings> {
    const org = await this.getOrg(orgId);
    return org.teamSettings ?? DEFAULT_TEAM_SETTINGS;
  }

  async updateTeamSettings(
    orgId: string,
    updates: Partial<TeamSettings>,
    context: AuditContext = {},
  ): Promise<TeamSettings> {
    const org = await this.getOrg(orgId);
    const current = org.teamSettings ?? DEFAULT_TEAM_SETTINGS;
    const updated = { ...current, ...updates };

    // Validation
    if (!['round_robin', 'manual', 'least_busy'].includes(updated.reviewerRotation)) {
      throw new BadRequestException('reviewerRotation must be round_robin, manual, or least_busy');
    }

    org.teamSettings = updated;
    await this.orgRepo.save(org);

    // Record audit
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'team',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context,
    });

    return updated;
  }

  // ============================================================================
  // Inventory Settings
  // ============================================================================

  async getInventorySettings(orgId: string): Promise<InventorySettings> {
    const org = await this.getOrg(orgId);
    return org.inventorySettings ?? DEFAULT_INVENTORY_SETTINGS;
  }

  async updateInventorySettings(
    orgId: string,
    updates: Partial<InventorySettings>,
    context: AuditContext = {},
  ): Promise<InventorySettings> {
    const org = await this.getOrg(orgId);
    const current = org.inventorySettings ?? DEFAULT_INVENTORY_SETTINGS;
    const updated = { ...current, ...updates };

    // Validation
    if (updated.defaultMarginPercent < 0) {
      throw new BadRequestException('defaultMarginPercent must be >= 0');
    }
    if (updated.minimumMarginPercent < 0) {
      throw new BadRequestException('minimumMarginPercent must be >= 0');
    }
    if (updated.defaultMarginPercent < updated.minimumMarginPercent) {
      throw new BadRequestException('defaultMarginPercent must be >= minimumMarginPercent');
    }
    if (updated.autoRelistDelayDays < 1) {
      throw new BadRequestException('autoRelistDelayDays must be >= 1');
    }
    if (updated.lowStockThreshold < 0) {
      throw new BadRequestException('lowStockThreshold must be >= 0');
    }
    if (!['competitive', 'premium', 'quick_sale', 'custom'].includes(updated.defaultPricingStrategy)) {
      throw new BadRequestException('Invalid pricing strategy');
    }

    org.inventorySettings = updated;
    await this.orgRepo.save(org);

    // Record audit
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'inventory',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context,
    });

    return updated;
  }

  // ============================================================================
  // Marketplace Default Settings
  // ============================================================================

  async getMarketplaceDefaultSettings(orgId: string): Promise<MarketplaceDefaultSettings> {
    const org = await this.getOrg(orgId);
    return org.marketplaceDefaultSettings ?? DEFAULT_MARKETPLACE_SETTINGS;
  }

  async updateMarketplaceDefaultSettings(
    orgId: string,
    updates: {
      ebay?: Partial<MarketplaceDefaultSettings['ebay']>;
      amazon?: Partial<MarketplaceDefaultSettings['amazon']>;
    },
    context: AuditContext = {},
  ): Promise<MarketplaceDefaultSettings> {
    const org = await this.getOrg(orgId);
    const current = org.marketplaceDefaultSettings ?? DEFAULT_MARKETPLACE_SETTINGS;

    const updated: MarketplaceDefaultSettings = {
      ebay: {
        ...current.ebay,
        ...(updates.ebay || {}),
      },
      amazon: {
        ...current.amazon,
        ...(updates.amazon || {}),
      },
      facebook: current.facebook,
    };

    // Validation
    const validDurations = [1, 3, 5, 7, 10, 30];
    if (!validDurations.includes(updated.ebay.listingDurationDays)) {
      throw new BadRequestException('eBay listing duration must be 1, 3, 5, 7, 10, or 30 days');
    }
    if (!['FBA', 'FBM'].includes(updated.amazon.fulfillmentChannel)) {
      throw new BadRequestException('Amazon fulfillment channel must be FBA or FBM');
    }

    org.marketplaceDefaultSettings = updated;
    await this.orgRepo.save(org);

    // Record audit
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'marketplaceDefaults',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context,
    });

    return updated;
  }

  // ============================================================================
  // Billing Settings (Limited Write Access)
  // ============================================================================

  async getBillingSettings(orgId: string): Promise<BillingSettings> {
    const org = await this.getOrg(orgId);
    return org.billingSettings ?? DEFAULT_BILLING_SETTINGS;
  }

  /**
   * Update billing settings - only billingEmail is user-editable.
   * Plan and limits are admin-controlled.
   */
  async updateBillingSettings(
    orgId: string,
    updates: { billingEmail?: string | null },
    context: AuditContext = {},
  ): Promise<BillingSettings> {
    const org = await this.getOrg(orgId);
    const current = org.billingSettings ?? DEFAULT_BILLING_SETTINGS;

    // Only allow billingEmail updates from regular users
    const updated: BillingSettings = {
      ...current,
      billingEmail: updates.billingEmail !== undefined ? updates.billingEmail : current.billingEmail,
    };

    // Validate email format if provided
    if (updated.billingEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updated.billingEmail)) {
        throw new BadRequestException('Invalid billing email format');
      }
    }

    org.billingSettings = updated;
    await this.orgRepo.save(org);

    // Record audit
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'billing',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context,
    });

    return updated;
  }

  /**
   * Admin-only: Update billing plan and limits
   */
  async adminUpdateBillingSettings(
    orgId: string,
    updates: Partial<BillingSettings>,
    context: AuditContext = {},
  ): Promise<BillingSettings> {
    const org = await this.getOrg(orgId);
    const current = org.billingSettings ?? DEFAULT_BILLING_SETTINGS;

    const updated: BillingSettings = {
      plan: updates.plan ?? current.plan,
      billingEmail: updates.billingEmail !== undefined ? updates.billingEmail : current.billingEmail,
      limits: {
        ...current.limits,
        ...(updates.limits || {}),
      },
    };

    org.billingSettings = updated;
    await this.orgRepo.save(org);

    // Record audit with admin flag
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'billing',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context: { ...context, isAdmin: true },
    });

    return updated;
  }

  // ============================================================================
  // Security Settings
  // ============================================================================

  async getSecuritySettings(orgId: string): Promise<SecuritySettings> {
    const org = await this.getOrg(orgId);
    return org.securitySettings ?? DEFAULT_SECURITY_SETTINGS;
  }

  async updateSecuritySettings(
    orgId: string,
    updates: Partial<SecuritySettings>,
    context: AuditContext = {},
  ): Promise<SecuritySettings> {
    const org = await this.getOrg(orgId);
    const current = org.securitySettings ?? DEFAULT_SECURITY_SETTINGS;
    const updated = { ...current, ...updates };

    // Validation
    if (updated.sessionTimeoutMinutes < 15 || updated.sessionTimeoutMinutes > 10080) {
      throw new BadRequestException('sessionTimeoutMinutes must be between 15 and 10080 (7 days)');
    }
    if (updated.apiRateLimit < 10 || updated.apiRateLimit > 10000) {
      throw new BadRequestException('apiRateLimit must be between 10 and 10000');
    }

    // Validate IP ranges (basic CIDR validation)
    if (updated.allowedIPRanges && updated.allowedIPRanges.length > 0) {
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      for (const range of updated.allowedIPRanges) {
        if (!cidrRegex.test(range)) {
          throw new BadRequestException(`Invalid IP range format: ${range}`);
        }
      }
    }

    org.securitySettings = updated;
    await this.orgRepo.save(org);

    // Record audit
    await this.auditService.recordSettingsChange({
      orgId,
      settingsType: 'security',
      previousSettings: current as unknown as Record<string, unknown>,
      newSettings: updated as unknown as Record<string, unknown>,
      context,
    });

    return updated;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private async getOrg(orgId: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }
}
