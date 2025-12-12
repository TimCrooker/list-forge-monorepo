import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import {
  SettingsVersion,
  SettingsType,
} from '../entities/settings-version.entity';
import { FieldDiff } from '../entities/settings-audit-log.entity';
import { SettingsAuditService, AuditContext } from './settings-audit.service';

/**
 * Parameters for reverting to a previous version
 */
export interface RevertParams {
  orgId: string;
  versionId: string;
  reason: string;
  context: AuditContext;
}

/**
 * Preview of what a revert would change
 */
export interface RevertPreview {
  version: SettingsVersion;
  currentSettings: Record<string, unknown>;
  targetSettings: Record<string, unknown>;
  fieldDiffs: FieldDiff[];
}

/**
 * Settings Version Service
 *
 * Handles version retrieval and revert operations for organization settings.
 */
@Injectable()
export class SettingsVersionService {
  private readonly logger = new Logger(SettingsVersionService.name);

  /** Minimum length for revert reason */
  private readonly MIN_REASON_LENGTH = 10;

  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(SettingsVersion)
    private versionRepo: Repository<SettingsVersion>,
    private auditService: SettingsAuditService,
  ) {}

  /**
   * Get versions available for revert
   */
  async getRevertableVersions(
    orgId: string,
    settingsType: SettingsType,
  ): Promise<SettingsVersion[]> {
    return this.auditService.getVersionHistory(orgId, settingsType);
  }

  /**
   * Preview what a revert would change
   */
  async previewRevert(
    orgId: string,
    versionId: string,
  ): Promise<RevertPreview> {
    const version = await this.versionRepo.findOne({
      where: { id: versionId },
      relations: ['user'],
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.orgId !== orgId) {
      throw new BadRequestException('Version does not belong to this organization');
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const currentSettings = this.getCurrentSettings(org, version.settingsType);
    const targetSettings = version.settingsSnapshot;

    const fieldDiffs = this.auditService.computeFieldDiffs(
      currentSettings,
      targetSettings,
    );

    return {
      version,
      currentSettings,
      targetSettings,
      fieldDiffs,
    };
  }

  /**
   * Revert settings to a previous version
   */
  async revertToVersion(
    params: RevertParams,
  ): Promise<{ newVersion: SettingsVersion; appliedSettings: Record<string, unknown> }> {
    const { orgId, versionId, reason, context } = params;

    // Validate reason
    if (!reason || reason.trim().length < this.MIN_REASON_LENGTH) {
      throw new BadRequestException(
        `Revert reason must be at least ${this.MIN_REASON_LENGTH} characters`,
      );
    }

    // Get the version to revert to
    const targetVersion = await this.versionRepo.findOne({
      where: { id: versionId },
    });

    if (!targetVersion) {
      throw new NotFoundException('Version not found');
    }

    if (targetVersion.orgId !== orgId) {
      throw new BadRequestException('Version does not belong to this organization');
    }

    // Get the organization
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Get current settings for comparison
    const currentSettings = this.getCurrentSettings(org, targetVersion.settingsType);

    // Apply the reverted settings
    const targetSettings = targetVersion.settingsSnapshot as Record<string, unknown>;
    this.applySettings(org, targetVersion.settingsType, targetSettings);
    await this.orgRepo.save(org);

    // Record the change with audit trail
    const { version: newVersion } = await this.auditService.recordSettingsChange({
      orgId,
      settingsType: targetVersion.settingsType,
      previousSettings: currentSettings,
      newSettings: targetSettings,
      context,
      isRevert: true,
      revertedFromVersionId: versionId,
      revertReason: reason.trim(),
    });

    this.logger.log(
      `Settings ${targetVersion.settingsType} reverted to v${targetVersion.versionNumber} for org ${orgId}`,
    );

    return {
      newVersion,
      appliedSettings: targetSettings,
    };
  }

  /**
   * Get current settings from organization based on settings type
   */
  private getCurrentSettings(
    org: Organization,
    settingsType: SettingsType,
  ): Record<string, unknown> {
    const settingsMap: Record<SettingsType, unknown> = {
      workflow: org.workflowSettings,
      notification: org.notificationSettings,
      team: org.teamSettings,
      inventory: org.inventorySettings,
      marketplaceDefaults: org.marketplaceDefaultSettings,
      billing: org.billingSettings,
      security: org.securitySettings,
      autoPublish: org.autoPublishSettings,
      autoApproval: org.autoApprovalSettings,
      research: org.researchSettings,
    };

    return settingsMap[settingsType] as Record<string, unknown>;
  }

  /**
   * Apply settings to organization based on settings type
   */
  private applySettings(
    org: Organization,
    settingsType: SettingsType,
    settings: Record<string, unknown>,
  ): void {
    switch (settingsType) {
      case 'workflow':
        org.workflowSettings = settings as any;
        break;
      case 'notification':
        org.notificationSettings = settings as any;
        break;
      case 'team':
        org.teamSettings = settings as any;
        break;
      case 'inventory':
        org.inventorySettings = settings as any;
        break;
      case 'marketplaceDefaults':
        org.marketplaceDefaultSettings = settings as any;
        break;
      case 'billing':
        org.billingSettings = settings as any;
        break;
      case 'security':
        org.securitySettings = settings as any;
        break;
      case 'autoPublish':
        org.autoPublishSettings = settings as any;
        break;
      case 'autoApproval':
        org.autoApprovalSettings = settings as any;
        break;
      case 'research':
        org.researchSettings = settings as any;
        break;
    }
  }
}
