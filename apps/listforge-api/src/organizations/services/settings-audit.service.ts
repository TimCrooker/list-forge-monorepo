import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  SettingsVersion,
  SettingsType,
} from '../entities/settings-version.entity';
import {
  SettingsAuditLog,
  SettingsAuditEventType,
  FieldDiff,
} from '../entities/settings-audit-log.entity';

/**
 * Audit context passed when recording settings changes
 */
export interface AuditContext {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  isAdmin?: boolean;
}

/**
 * Parameters for recording a settings change
 */
export interface RecordSettingsChangeParams {
  orgId: string;
  settingsType: SettingsType;
  previousSettings: Record<string, unknown> | null;
  newSettings: Record<string, unknown>;
  context: AuditContext;
  isRevert?: boolean;
  revertedFromVersionId?: string;
  revertReason?: string;
}

/**
 * Parameters for querying audit logs
 */
export interface QueryAuditLogsParams {
  orgId?: string;
  settingsType?: SettingsType;
  eventType?: SettingsAuditEventType;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Settings Audit Service
 *
 * Handles audit logging and version tracking for organization settings.
 * Creates immutable audit trails with field-level diffs.
 */
@Injectable()
export class SettingsAuditService {
  private readonly logger = new Logger(SettingsAuditService.name);

  /** Maximum number of versions to keep per settings type per org */
  private readonly MAX_VERSIONS = 5;

  constructor(
    @InjectRepository(SettingsVersion)
    private versionRepo: Repository<SettingsVersion>,
    @InjectRepository(SettingsAuditLog)
    private auditLogRepo: Repository<SettingsAuditLog>,
  ) {}

  /**
   * Record a settings change by creating a version snapshot and audit log entry
   */
  async recordSettingsChange(
    params: RecordSettingsChangeParams,
  ): Promise<{ version: SettingsVersion; auditLog: SettingsAuditLog }> {
    const {
      orgId,
      settingsType,
      previousSettings,
      newSettings,
      context,
      isRevert = false,
      revertedFromVersionId,
      revertReason,
    } = params;

    // Compute field diffs
    const fieldDiffs = this.computeFieldDiffs(previousSettings, newSettings);

    // Get next version number
    const latestVersion = await this.versionRepo.findOne({
      where: { orgId, settingsType },
      order: { versionNumber: 'DESC' },
    });
    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    // Determine event type
    let eventType: SettingsAuditEventType;
    if (!previousSettings) {
      eventType = 'settings:created';
    } else if (isRevert) {
      eventType = 'settings:reverted';
    } else if (context.isAdmin) {
      eventType = 'settings:admin_update';
    } else {
      eventType = 'settings:updated';
    }

    // Create version snapshot
    const version = this.versionRepo.create({
      orgId,
      settingsType,
      versionNumber: nextVersionNumber,
      settingsSnapshot: newSettings,
      userId: context.userId || null,
      isRevert,
      revertedFromVersionId: revertedFromVersionId || null,
      revertReason: revertReason || null,
    });
    await this.versionRepo.save(version);

    // Create audit log entry
    const message = this.generateAuditMessage(
      settingsType,
      eventType,
      isRevert ? latestVersion?.versionNumber : undefined,
    );
    const auditLog = this.auditLogRepo.create({
      orgId,
      userId: context.userId || null,
      settingsType,
      eventType,
      message,
      fieldDiffs,
      versionId: version.id,
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
      metadata: isRevert
        ? { revertedFromVersion: latestVersion?.versionNumber, revertReason }
        : null,
    });
    await this.auditLogRepo.save(auditLog);

    // Prune old versions
    await this.pruneOldVersions(orgId, settingsType);

    this.logger.log(
      `Settings ${settingsType} ${eventType} for org ${orgId} (v${nextVersionNumber})`,
    );

    return { version, auditLog };
  }

  /**
   * Get version history for a settings type
   */
  async getVersionHistory(
    orgId: string,
    settingsType: SettingsType,
  ): Promise<SettingsVersion[]> {
    return this.versionRepo.find({
      where: { orgId, settingsType },
      order: { versionNumber: 'DESC' },
      take: this.MAX_VERSIONS,
      relations: ['user'],
    });
  }

  /**
   * Get a specific version by ID
   */
  async getVersion(versionId: string): Promise<SettingsVersion | null> {
    return this.versionRepo.findOne({
      where: { id: versionId },
      relations: ['user'],
    });
  }

  /**
   * Query audit logs with flexible filtering
   */
  async queryAuditLogs(
    params: QueryAuditLogsParams,
  ): Promise<{ logs: SettingsAuditLog[]; total: number }> {
    const {
      orgId,
      settingsType,
      eventType,
      userId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    const qb = this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.timestamp', 'DESC')
      .skip(offset)
      .take(limit);

    if (orgId) {
      qb.andWhere('log.orgId = :orgId', { orgId });
    }
    if (settingsType) {
      qb.andWhere('log.settingsType = :settingsType', { settingsType });
    }
    if (eventType) {
      qb.andWhere('log.eventType = :eventType', { eventType });
    }
    if (userId) {
      qb.andWhere('log.userId = :userId', { userId });
    }
    if (startDate) {
      qb.andWhere('log.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.timestamp <= :endDate', { endDate });
    }

    const [logs, total] = await qb.getManyAndCount();
    return { logs, total };
  }

  /**
   * Get the latest version for a settings type
   */
  async getLatestVersion(
    orgId: string,
    settingsType: SettingsType,
  ): Promise<SettingsVersion | null> {
    return this.versionRepo.findOne({
      where: { orgId, settingsType },
      order: { versionNumber: 'DESC' },
    });
  }

  /**
   * Compute field-level diffs between two settings objects
   */
  computeFieldDiffs(
    previous: Record<string, unknown> | null,
    current: Record<string, unknown>,
    parentPath = '',
  ): FieldDiff[] {
    const diffs: FieldDiff[] = [];

    if (!previous) {
      // All fields are new
      for (const [key, value] of Object.entries(current)) {
        const path = parentPath ? `${parentPath}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recurse into nested objects
          diffs.push(
            ...this.computeFieldDiffs(
              null,
              value as Record<string, unknown>,
              path,
            ),
          );
        } else {
          diffs.push({
            field: key,
            path,
            previousValue: null,
            newValue: value,
          });
        }
      }
      return diffs;
    }

    // Compare each field
    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

    for (const key of allKeys) {
      const path = parentPath ? `${parentPath}.${key}` : key;
      const prevValue = previous[key];
      const currValue = current[key];

      // Check if values are different
      if (this.deepEqual(prevValue, currValue)) {
        continue;
      }

      // Handle nested objects
      if (
        typeof prevValue === 'object' &&
        prevValue !== null &&
        !Array.isArray(prevValue) &&
        typeof currValue === 'object' &&
        currValue !== null &&
        !Array.isArray(currValue)
      ) {
        diffs.push(
          ...this.computeFieldDiffs(
            prevValue as Record<string, unknown>,
            currValue as Record<string, unknown>,
            path,
          ),
        );
      } else {
        diffs.push({
          field: key,
          path,
          previousValue: prevValue ?? null,
          newValue: currValue ?? null,
        });
      }
    }

    return diffs;
  }

  /**
   * Prune old versions beyond the maximum limit
   */
  private async pruneOldVersions(
    orgId: string,
    settingsType: SettingsType,
  ): Promise<void> {
    const versions = await this.versionRepo.find({
      where: { orgId, settingsType },
      order: { versionNumber: 'DESC' },
    });

    if (versions.length > this.MAX_VERSIONS) {
      const versionsToDelete = versions.slice(this.MAX_VERSIONS);
      const idsToDelete = versionsToDelete.map((v) => v.id);

      // Update audit logs to null out the versionId reference
      await this.auditLogRepo.update(
        { versionId: In(idsToDelete) },
        { versionId: null as any },
      );

      await this.versionRepo.delete(idsToDelete);

      this.logger.log(
        `Pruned ${idsToDelete.length} old versions for ${settingsType} in org ${orgId}`,
      );
    }
  }

  /**
   * Generate human-readable audit message
   */
  private generateAuditMessage(
    settingsType: SettingsType,
    eventType: SettingsAuditEventType,
    revertedToVersion?: number,
  ): string {
    const typeLabel = this.getSettingsTypeLabel(settingsType);

    switch (eventType) {
      case 'settings:created':
        return `${typeLabel} settings initialized`;
      case 'settings:updated':
        return `${typeLabel} settings updated`;
      case 'settings:reverted':
        return `${typeLabel} settings reverted${revertedToVersion ? ` to version ${revertedToVersion}` : ''}`;
      case 'settings:admin_update':
        return `${typeLabel} settings updated by administrator`;
      default:
        return `${typeLabel} settings changed`;
    }
  }

  /**
   * Get display label for settings type
   */
  private getSettingsTypeLabel(settingsType: SettingsType): string {
    const labels: Record<SettingsType, string> = {
      workflow: 'Workflow',
      notification: 'Notification',
      team: 'Team',
      inventory: 'Inventory',
      marketplaceDefaults: 'Marketplace Defaults',
      billing: 'Billing',
      security: 'Security',
      autoPublish: 'Auto-Publish',
      autoApproval: 'Auto-Approval',
      research: 'Research',
    };
    return labels[settingsType] || settingsType;
  }

  /**
   * Deep equality check for values
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((val, idx) => this.deepEqual(val, b[idx]));
      }

      if (Array.isArray(a) !== Array.isArray(b)) return false;

      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const aKeys = Object.keys(aObj);
      const bKeys = Object.keys(bObj);

      if (aKeys.length !== bKeys.length) return false;

      return aKeys.every((key) => this.deepEqual(aObj[key], bObj[key]));
    }

    return false;
  }
}
