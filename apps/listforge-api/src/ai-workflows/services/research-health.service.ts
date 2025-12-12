import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecoveryService } from './recovery.service';

/**
 * Research Health Service - Research Flow Recovery System
 *
 * Periodic health check service that runs recovery checks
 * to detect and recover stalled research runs.
 */
@Injectable()
export class ResearchHealthService {
  private readonly logger = new Logger(ResearchHealthService.name);

  constructor(private readonly recoveryService: RecoveryService) {}

  /**
   * Run recovery check every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleRecoveryCheck() {
    this.logger.debug('Running periodic research recovery check...');
    try {
      await this.recoveryService.recoverStalledRuns();
    } catch (error) {
      this.logger.error('Periodic recovery check failed:', error);
    }
  }
}



