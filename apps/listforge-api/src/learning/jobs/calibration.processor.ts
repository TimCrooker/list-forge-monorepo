import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ToolCalibrationService } from '../services/tool-calibration.service';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';

/**
 * CalibrationProcessor - Slice 10 (Learning Loop)
 *
 * Scheduled jobs for the learning module:
 * - Weekly tool weight recalibration (Sundays at 2 AM)
 * - Daily anomaly detection sweep (2 AM)
 */
@Injectable()
export class CalibrationProcessor {
  private readonly logger = new Logger(CalibrationProcessor.name);

  constructor(
    private readonly calibrationService: ToolCalibrationService,
    private readonly anomalyService: AnomalyDetectionService,
  ) {}

  /**
   * Weekly tool recalibration
   * Runs every Sunday at 2:00 AM
   *
   * Analyzes the past 90 days of outcome data to adjust tool confidence weights
   * based on actual accuracy vs reported confidence.
   */
  @Cron('0 2 * * 0') // Sunday at 2 AM
  async handleWeeklyCalibration() {
    this.logger.log('Starting weekly tool calibration...');

    try {
      const results = await this.calibrationService.recalibrateAllTools(90, 'scheduled');

      this.logger.log(
        `Weekly calibration complete: ${results.length} tools calibrated`,
      );

      // Log summary of significant changes
      const significantChanges = results.filter(
        (r) => Math.abs(r.newWeight - r.previousWeight) > 0.05,
      );

      if (significantChanges.length > 0) {
        this.logger.log(
          `Significant weight changes: ${significantChanges
            .map((r) => `${r.toolType}: ${r.previousWeight.toFixed(2)} -> ${r.newWeight.toFixed(2)}`)
            .join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Weekly calibration failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Daily anomaly detection sweep
   * Runs every day at 2:00 AM
   *
   * Scans all organizations for patterns that might indicate
   * research quality issues, such as:
   * - Consistent price deviations
   * - High return rates
   * - Slow-selling items
   * - Tool failure spikes
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyAnomalySweep() {
    this.logger.log('Starting daily anomaly detection sweep...');

    try {
      const anomaliesCreated = await this.anomalyService.runFullAnomalySweep();

      this.logger.log(
        `Daily anomaly sweep complete: ${anomaliesCreated} new anomalies detected`,
      );
    } catch (error) {
      this.logger.error(
        'Daily anomaly sweep failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Monthly metrics summary (for logging/monitoring)
   * Runs on the 1st of each month at 3:00 AM
   */
  @Cron('0 3 1 * *') // 1st of month at 3 AM
  async handleMonthlySummary() {
    this.logger.log('Generating monthly learning metrics summary...');

    try {
      const weights = await this.calibrationService.getCurrentWeights();
      const history = this.calibrationService.getHistory(4);

      this.logger.log('=== Monthly Learning Metrics Summary ===');
      this.logger.log('Current tool weights:');

      for (const [tool, weight] of Object.entries(weights)) {
        this.logger.log(`  ${tool}: ${weight.toFixed(3)}`);
      }

      this.logger.log(`Recent calibrations: ${history.calibrations.length}`);
      this.logger.log('========================================');
    } catch (error) {
      this.logger.error(
        'Monthly summary generation failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
