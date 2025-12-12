import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { MarketplaceAccountService } from './marketplace-account.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { EventsService } from '../../events/events.service';
import {
  SocketEvents,
  Rooms,
  MarketplaceTokenExpiringPayload,
  MarketplaceTokenExpiredPayload,
  MarketplaceTokenRefreshedPayload,
} from '@listforge/socket-types';

/**
 * TokenExpirationMonitorService
 *
 * Monitors marketplace OAuth tokens for expiration and automatically
 * attempts to refresh them before they expire. Runs hourly via cron.
 *
 * Features:
 * - Proactive monitoring: Checks tokens 24 hours before expiry
 * - Auto-refresh: Attempts refresh 1 hour before expiry (if refresh token available)
 * - Failure handling: Marks as 'expired' if refresh fails or no refresh token
 * - Real-time updates: Emits events to frontend for immediate UI updates
 * - Rate limiting: Max 3 auto-refresh attempts to prevent infinite loops
 */
@Injectable()
export class TokenExpirationMonitorService {
  private readonly logger = new Logger(TokenExpirationMonitorService.name);

  // Thresholds for token expiration actions
  private readonly EXPIRY_WARNING_HOURS = 24; // Check tokens expiring within 24 hours
  private readonly AUTO_REFRESH_HOURS = 1; // Auto-refresh if expires within 1 hour
  private readonly MAX_REFRESH_ATTEMPTS = 3; // Maximum automatic refresh attempts

  constructor(
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    private accountService: MarketplaceAccountService,
    private eventsService: EventsService,
    private auditService: MarketplaceAuditService,
  ) {}

  /**
   * Cron job: Check for expiring tokens every hour
   *
   * Runs at the top of every hour (HH:00:00)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiringTokens(): Promise<void> {
    this.logger.log('Starting token expiration monitoring check...');

    try {
      const expiringAccounts = await this.findExpiringAccounts(this.EXPIRY_WARNING_HOURS);

      if (expiringAccounts.length === 0) {
        this.logger.log('No expiring tokens found');
        return;
      }

      this.logger.log(`Found ${expiringAccounts.length} account(s) with expiring tokens`);

      for (const account of expiringAccounts) {
        await this.processExpiringAccount(account);
      }

      this.logger.log('Token expiration monitoring check complete');
    } catch (error) {
      this.logger.error('Error during token expiration monitoring', error);
    }
  }

  /**
   * Find accounts with tokens expiring within specified hours
   *
   * @param hoursUntilExpiry - Number of hours to look ahead
   * @returns Array of accounts with expiring tokens
   */
  async findExpiringAccounts(hoursUntilExpiry: number): Promise<MarketplaceAccount[]> {
    const expiryThreshold = new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000);

    return this.accountRepo.find({
      where: {
        status: 'active',
        tokenExpiresAt: LessThan(expiryThreshold),
      },
      order: { tokenExpiresAt: 'ASC' },
    });
  }

  /**
   * Process a single account with expiring token
   *
   * Decision logic:
   * - If expires < 1 hour AND has refresh token AND attempts < 3 → Auto-refresh
   * - If expired (< 0 hours) AND no refresh token → Mark expired
   * - Otherwise → Update lastCheckedAt and log warning
   */
  private async processExpiringAccount(account: MarketplaceAccount): Promise<void> {
    const hoursUntilExpiry = this.getHoursUntilExpiry(account.tokenExpiresAt);

    this.logger.log(
      `Processing account ${account.id} (${account.marketplace}): ` +
      `Expires in ${hoursUntilExpiry.toFixed(2)} hours`
    );

    // Update lastCheckedAt timestamp
    account.lastCheckedAt = new Date();
    await this.accountRepo.save(account);

    // Check if token has already expired
    if (hoursUntilExpiry <= 0) {
      await this.handleExpiredToken(account);
      return;
    }

    // Check if we should attempt auto-refresh
    if (
      hoursUntilExpiry <= this.AUTO_REFRESH_HOURS &&
      account.refreshToken &&
      account.autoRefreshAttempts < this.MAX_REFRESH_ATTEMPTS
    ) {
      await this.attemptAutoRefresh(account);
      return;
    }

    // Token expiring soon but not ready for auto-refresh yet
    if (hoursUntilExpiry <= this.EXPIRY_WARNING_HOURS) {
      this.emitExpirationWarning(account, hoursUntilExpiry);
    }
  }

  /**
   * Handle token that has already expired
   */
  private async handleExpiredToken(account: MarketplaceAccount): Promise<void> {
    this.logger.warn(
      `Token for account ${account.id} (${account.marketplace}) has expired`
    );

    // Mark as expired
    await this.markAsExpired(account);

    // Emit event to frontend
    this.emitTokenExpired(account);

    // Audit log: Token expired
    await this.auditService.logTokenExpired({
      orgId: account.orgId,
      accountId: account.id,
      marketplace: account.marketplace,
    }).catch(err => {
      this.logger.error('Failed to log token expiration audit', err);
    });
  }

  /**
   * Attempt automatic token refresh
   *
   * @param account - Account with expiring token
   * @returns True if refresh successful, false otherwise
   */
  async attemptAutoRefresh(account: MarketplaceAccount): Promise<boolean> {
    this.logger.log(
      `Attempting automatic token refresh for account ${account.id} ` +
      `(attempt ${account.autoRefreshAttempts + 1}/${this.MAX_REFRESH_ATTEMPTS})`
    );

    // Increment attempt counter
    account.autoRefreshAttempts += 1;
    await this.accountRepo.save(account);

    try {
      // Attempt refresh via AccountService
      await this.accountService.refreshTokens(account.id, account.orgId);

      // Success - reset attempt counter
      account.autoRefreshAttempts = 0;
      await this.accountRepo.save(account);

      this.logger.log(`Successfully refreshed token for account ${account.id}`);

      const payload: MarketplaceTokenRefreshedPayload = {
        accountId: account.id,
        marketplace: account.marketplace,
        refreshedAt: new Date().toISOString(),
      };
      this.eventsService.emit(
        Rooms.org(account.orgId),
        SocketEvents.MARKETPLACE_TOKEN_REFRESHED,
        payload,
      );

      // Audit log: Token auto-refreshed successfully
      await this.auditService.logTokenRefreshed({
        orgId: account.orgId,
        userId: null, // System-initiated
        accountId: account.id,
        marketplace: account.marketplace,
        automatic: true,
      }).catch(err => {
        this.logger.error('Failed to log token refresh audit', err);
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to auto-refresh token for account ${account.id}`,
        errorMessage
      );

      // Audit log: Token auto-refresh failed
      await this.auditService.logTokenRefreshFailed({
        orgId: account.orgId,
        userId: null, // System-initiated
        accountId: account.id,
        marketplace: account.marketplace,
        error: errorMessage,
        automatic: true,
      }).catch(err => {
        this.logger.error('Failed to log token refresh failure audit', err);
      });

      // If max attempts reached, mark as expired
      if (account.autoRefreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
        this.logger.warn(
          `Max refresh attempts (${this.MAX_REFRESH_ATTEMPTS}) reached for account ${account.id}. Marking as expired.`
        );
        await this.markAsExpired(account);
        this.emitTokenExpired(account);
      }

      return false;
    }
  }

  /**
   * Mark account as expired
   */
  async markAsExpired(account: MarketplaceAccount): Promise<void> {
    account.status = 'expired';
    await this.accountRepo.save(account);

    this.logger.log(`Marked account ${account.id} as expired`);
  }

  /**
   * Emit warning event to frontend for token expiring soon
   */
  private emitExpirationWarning(account: MarketplaceAccount, hoursUntilExpiry: number): void {
    const payload: MarketplaceTokenExpiringPayload = {
      accountId: account.id,
      marketplace: account.marketplace,
      expiresAt: account.tokenExpiresAt?.toISOString() ?? '',
      hoursUntilExpiry: Math.round(hoursUntilExpiry * 10) / 10,
    };
    this.eventsService.emit(
      Rooms.org(account.orgId),
      SocketEvents.MARKETPLACE_TOKEN_EXPIRING,
      payload,
    );
  }

  /**
   * Emit event to frontend that token has expired
   */
  private emitTokenExpired(account: MarketplaceAccount): void {
    const payload: MarketplaceTokenExpiredPayload = {
      accountId: account.id,
      marketplace: account.marketplace,
      expiredAt: account.tokenExpiresAt?.toISOString() ?? '',
    };
    this.eventsService.emit(
      Rooms.org(account.orgId),
      SocketEvents.MARKETPLACE_TOKEN_EXPIRED,
      payload,
    );
  }

  /**
   * Calculate hours until token expiry
   */
  private getHoursUntilExpiry(tokenExpiresAt: Date | null): number {
    if (!tokenExpiresAt) {
      return Infinity;
    }

    const now = Date.now();
    const expiryTime = tokenExpiresAt.getTime();
    const millisecondsUntilExpiry = expiryTime - now;

    return millisecondsUntilExpiry / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Manual check for specific account (for testing/debugging)
   */
  async checkAccount(accountId: string): Promise<void> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    await this.processExpiringAccount(account);
  }
}
