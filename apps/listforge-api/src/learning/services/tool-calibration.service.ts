import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { ToolEffectiveness } from '../entities/tool-effectiveness.entity';
import type { CalibrationResult } from '@listforge/core-types';
import type { GetCalibrationHistoryResponse } from '@listforge/api-types';

/**
 * ToolCalibrationService - Slice 10 (Learning Loop)
 *
 * Analyzes tool effectiveness data and adjusts confidence weights
 * based on actual accuracy vs reported confidence.
 */
@Injectable()
export class ToolCalibrationService {
  private readonly logger = new Logger(ToolCalibrationService.name);

  // Store calibration history in memory (could be moved to DB for persistence)
  private calibrationHistory: {
    calibratedAt: string;
    triggeredBy: 'scheduled' | 'manual';
    results: CalibrationResult[];
  }[] = [];

  constructor(
    @InjectRepository(ToolEffectiveness)
    private readonly toolEffectivenessRepo: Repository<ToolEffectiveness>,
  ) {}

  /**
   * Recalibrate all tools based on recent outcomes
   * Called weekly by scheduled job or manually by admin
   *
   * @param periodDays - Number of days of data to analyze
   * @param triggeredBy - Whether triggered by scheduled job or manual admin action
   * @param adminUserId - User ID of admin who triggered (for manual calibrations)
   */
  async recalibrateAllTools(
    periodDays: number = 90,
    triggeredBy: 'scheduled' | 'manual' = 'manual',
    adminUserId?: string,
  ): Promise<CalibrationResult[]> {
    // AUDIT LOG: Track who triggered calibration
    this.logger.log(
      `Starting GLOBAL tool recalibration (${triggeredBy}) ` +
        `triggered by: ${adminUserId || 'system'}, analyzing ${periodDays} days`,
    );

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Get all tool effectiveness records for the period
    // Aggregate across all organizations (global calibration)
    const records = await this.toolEffectivenessRepo.find({
      where: {
        periodStart: MoreThanOrEqual(periodStart),
      },
      order: { toolType: 'ASC' },
    });

    // Group by tool type
    const toolMap = new Map<string, ToolEffectiveness[]>();
    for (const record of records) {
      const existing = toolMap.get(record.toolType) || [];
      existing.push(record);
      toolMap.set(record.toolType, existing);
    }

    const results: CalibrationResult[] = [];

    for (const [toolType, toolRecords] of toolMap.entries()) {
      const result = await this.calibrateTool(toolType, toolRecords);
      if (result) {
        results.push(result);
      }
    }

    // Store in history
    const calibrationRun = {
      calibratedAt: new Date().toISOString(),
      triggeredBy,
      results,
    };
    this.calibrationHistory.unshift(calibrationRun);

    // Keep only last 50 calibration runs
    if (this.calibrationHistory.length > 50) {
      this.calibrationHistory = this.calibrationHistory.slice(0, 50);
    }

    this.logger.log(`Calibration complete: ${results.length} tools calibrated`);

    return results;
  }

  /**
   * Calibrate a single tool based on its effectiveness data
   */
  private async calibrateTool(
    toolType: string,
    records: ToolEffectiveness[],
  ): Promise<CalibrationResult | null> {
    // Aggregate statistics across all records
    let totalConfidenceSum = 0;
    let totalConfidenceCount = 0;
    let totalAccuracySum = 0;
    let totalDataPoints = 0;
    let latestWeight = 1.0;

    for (const record of records) {
      totalConfidenceSum += Number(record.confidenceWhenUsedSum);
      totalConfidenceCount += record.confidenceWhenUsedCount;
      totalAccuracySum += Number(record.actualAccuracySum);
      totalDataPoints += record.totalUses;
      latestWeight = Number(record.currentWeight);
    }

    // Need minimum data points for meaningful calibration
    if (totalConfidenceCount < 10) {
      this.logger.debug(
        `Skipping ${toolType}: insufficient data points (${totalConfidenceCount})`,
      );
      return null;
    }

    const averageConfidence = totalConfidenceSum / totalConfidenceCount;
    const averageActualAccuracy = totalAccuracySum / totalConfidenceCount;

    // Calibration score: actual accuracy / reported confidence
    // < 1 means overconfident, > 1 means underconfident
    const calibrationScore =
      averageConfidence > 0 ? averageActualAccuracy / averageConfidence : 1;

    // Determine new weight based on calibration
    let newWeight = latestWeight;
    let reasoning = '';

    if (calibrationScore < 0.7) {
      // Tool is significantly overconfident - reduce weight by 15%
      newWeight = Math.max(0.1, latestWeight * 0.85);
      reasoning = `Tool is overconfident (score: ${calibrationScore.toFixed(2)}). ` +
        `Reducing weight by 15% to account for lower actual accuracy.`;
    } else if (calibrationScore > 1.3) {
      // Tool is underconfident - increase weight by 10%
      newWeight = Math.min(2.0, latestWeight * 1.1);
      reasoning = `Tool is underconfident (score: ${calibrationScore.toFixed(2)}). ` +
        `Increasing weight by 10% as actual accuracy exceeds reported confidence.`;
    } else if (calibrationScore >= 0.9 && calibrationScore <= 1.1) {
      // Well calibrated - keep weight
      reasoning = `Tool is well calibrated (score: ${calibrationScore.toFixed(2)}). ` +
        `Maintaining current weight.`;
    } else {
      // Slight miscalibration - minor adjustment
      if (calibrationScore < 0.9) {
        newWeight = Math.max(0.1, latestWeight * 0.95);
        reasoning = `Tool is slightly overconfident (score: ${calibrationScore.toFixed(2)}). ` +
          `Minor weight reduction of 5%.`;
      } else {
        newWeight = Math.min(2.0, latestWeight * 1.05);
        reasoning = `Tool is slightly underconfident (score: ${calibrationScore.toFixed(2)}). ` +
          `Minor weight increase of 5%.`;
      }
    }

    // Update tool effectiveness records with new weight and calibration data
    await this.updateToolWeights(toolType, newWeight, calibrationScore);

    const result: CalibrationResult = {
      toolType,
      previousWeight: latestWeight,
      newWeight,
      calibrationScore,
      dataPoints: totalDataPoints,
      reasoning,
      calibratedAt: new Date().toISOString(),
    };

    this.logger.log(
      `Calibrated ${toolType}: ${latestWeight.toFixed(2)} -> ${newWeight.toFixed(2)} ` +
        `(score: ${calibrationScore.toFixed(2)}, ${totalDataPoints} data points)`,
    );

    return result;
  }

  /**
   * Update tool effectiveness records with new weight
   */
  private async updateToolWeights(
    toolType: string,
    newWeight: number,
    calibrationScore: number,
  ): Promise<void> {
    // Update all records for this tool type with new weight and calibration score
    await this.toolEffectivenessRepo.update(
      { toolType },
      {
        suggestedWeight: newWeight,
        calibrationScore,
        lastCalibrated: new Date(),
      },
    );

    // For the current period records, also update currentWeight
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

    await this.toolEffectivenessRepo.update(
      {
        toolType,
        periodStart: MoreThanOrEqual(periodStart),
      },
      {
        currentWeight: newWeight,
      },
    );
  }

  /**
   * Get calibration history
   */
  getHistory(limit: number = 10): GetCalibrationHistoryResponse {
    return {
      calibrations: this.calibrationHistory.slice(0, limit),
    };
  }

  /**
   * Get next scheduled calibration time (for display purposes)
   */
  getNextScheduledTime(): Date {
    // Calibration runs weekly on Sunday at 2 AM
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(2, 0, 0, 0);

    if (nextSunday <= now) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }

    return nextSunday;
  }

  /**
   * Get current weights for all tools
   */
  async getCurrentWeights(): Promise<Record<string, number>> {
    // Get most recent effectiveness record for each tool type
    const records = await this.toolEffectivenessRepo
      .createQueryBuilder('te')
      .select('DISTINCT ON (te.toolType) te.toolType', 'toolType')
      .addSelect('te.currentWeight', 'currentWeight')
      .orderBy('te.toolType')
      .addOrderBy('te.periodStart', 'DESC')
      .getRawMany();

    const weights: Record<string, number> = {};
    for (const record of records) {
      weights[record.toolType] = Number(record.currentWeight);
    }

    return weights;
  }
}
