import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual, In } from 'typeorm';
import { ResearchAnomaly } from '../entities/research-anomaly.entity';
import { ResearchOutcome } from '../entities/research-outcome.entity';
import type {
  AnomalyType,
  AnomalySeverity,
  ResearchAnomaly as ResearchAnomalyType,
} from '@listforge/core-types';
import type {
  ListAnomaliesQuery,
  ListAnomaliesResponse,
  ResolveAnomalyDto,
} from '@listforge/api-types';

/**
 * Anomaly detection thresholds
 * All magic numbers extracted here for easy tuning
 */
const THRESHOLDS = {
  // Price deviation: flag if average deviation > 15% over 10+ items
  PRICE_DEVIATION_THRESHOLD: 0.15,
  PRICE_DEVIATION_WARNING_THRESHOLD: 0.25, // Upgrade to warning at this level
  PRICE_DEVIATION_MIN_ITEMS: 10,

  // Tool failure: flag if failure rate > 20% over recent items
  TOOL_FAILURE_THRESHOLD: 0.20,
  TOOL_FAILURE_WINDOW_ITEMS: 20,

  // Confidence miscalibration: flag if confidence differs from accuracy by > 25%
  CALIBRATION_DEVIATION_THRESHOLD: 0.25,
  CALIBRATION_MIN_ITEMS: 15,

  // Category misidentification / return rate thresholds
  CATEGORY_MISID_THRESHOLD: 0.20,
  CATEGORY_MISID_MIN_ITEMS: 10,
  RETURN_RATE_THRESHOLD: 0.15, // Flag if return rate > 15%
  RETURN_RATE_WARNING_THRESHOLD: 0.25, // Upgrade to critical at this level
  RETURN_RATE_MIN_SAMPLES: 10,

  // Slow sales: flag if average days to sell > 30 days
  SLOW_SALES_THRESHOLD_DAYS: 30,
  SLOW_SALES_WARNING_DAYS: 45, // Upgrade to warning at this level
  SLOW_SALES_MIN_ITEMS: 5,

  // Real-time check thresholds
  SIGNIFICANT_PRICE_DEVIATION: 0.30, // Single item deviation worth logging
  SLOW_SALE_DAYS: 45, // Single item slow sale threshold

  // Lookback period for anomaly analysis
  ANOMALY_LOOKBACK_DAYS: 30,
  MIN_DATA_POINTS: 5, // Minimum samples needed for any analysis
};

/**
 * Helper to get lookback date for anomaly analysis
 */
function getLookbackDate(days: number = THRESHOLDS.ANOMALY_LOOKBACK_DAYS): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * AnomalyDetectionService - Slice 10 (Learning Loop)
 *
 * Detects patterns of problematic research outcomes and flags anomalies.
 */
@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  constructor(
    @InjectRepository(ResearchAnomaly)
    private readonly anomalyRepo: Repository<ResearchAnomaly>,
    @InjectRepository(ResearchOutcome)
    private readonly outcomeRepo: Repository<ResearchOutcome>,
  ) {}

  /**
   * Check for anomalies after recording a new outcome
   */
  async checkForAnomalies(orgId: string, outcome: ResearchOutcome): Promise<void> {
    // Run all anomaly checks in parallel
    await Promise.all([
      this.checkPriceDeviationAnomaly(orgId, outcome),
      this.checkConfidenceMiscalibration(orgId, outcome),
      this.checkSlowSalesAnomaly(orgId, outcome),
    ]);
  }

  /**
   * Run full anomaly sweep for all organizations
   * Called by daily scheduled job
   */
  async runFullAnomalySweep(): Promise<number> {
    this.logger.log('Starting full anomaly sweep');

    // Get distinct organization IDs from recent outcomes
    const orgs = await this.outcomeRepo
      .createQueryBuilder('outcome')
      .select('DISTINCT outcome.organizationId', 'orgId')
      .where('outcome.createdAt >= :date', {
        date: getLookbackDate(),
      })
      .getRawMany();

    let anomaliesCreated = 0;

    for (const { orgId } of orgs) {
      const orgAnomalies = await this.runOrgAnomalySweep(orgId);
      anomaliesCreated += orgAnomalies;
    }

    this.logger.log(`Anomaly sweep complete: ${anomaliesCreated} new anomalies detected`);

    return anomaliesCreated;
  }

  /**
   * Run anomaly sweep for a single organization
   */
  private async runOrgAnomalySweep(orgId: string): Promise<number> {
    // Get recent outcomes for analysis
    const recentOutcomes = await this.outcomeRepo.find({
      where: {
        organizationId: orgId,
        createdAt: MoreThanOrEqual(getLookbackDate()),
      },
      order: { createdAt: 'DESC' },
    });

    if (recentOutcomes.length < THRESHOLDS.MIN_DATA_POINTS) {
      return 0; // Not enough data
    }

    // Run pattern checks in parallel
    const results = await Promise.all([
      this.checkPriceDeviationPattern(orgId, recentOutcomes),
      this.checkSlowSalesPattern(orgId, recentOutcomes),
      this.checkReturnRatePattern(orgId, recentOutcomes),
    ]);

    return results.filter(Boolean).length;
  }

  /**
   * Check for price deviation pattern across recent outcomes
   */
  private async checkPriceDeviationPattern(
    orgId: string,
    recentOutcomes: ResearchOutcome[],
  ): Promise<boolean> {
    const priceDeviations = recentOutcomes
      .filter((o) => o.priceAccuracyRatio !== null)
      .map((o) => Number(o.priceAccuracyRatio));

    if (priceDeviations.length < THRESHOLDS.PRICE_DEVIATION_MIN_ITEMS) {
      return false;
    }

    const avgDeviation =
      priceDeviations.reduce((a, b) => a + b, 0) / priceDeviations.length;

    if (avgDeviation <= THRESHOLDS.PRICE_DEVIATION_THRESHOLD) {
      return false;
    }

    return this.createAnomalyIfNotExists(orgId, {
      anomalyType: 'price_deviation',
      severity: avgDeviation > THRESHOLDS.PRICE_DEVIATION_WARNING_THRESHOLD ? 'warning' : 'info',
      description:
        `Average price deviation of ${(avgDeviation * 100).toFixed(1)}% ` +
        `across ${priceDeviations.length} recent sales. ` +
        `Research predictions may need calibration.`,
      affectedItems: recentOutcomes
        .filter((o) => o.priceAccuracyRatio && Number(o.priceAccuracyRatio) > THRESHOLDS.PRICE_DEVIATION_THRESHOLD)
        .map((o) => o.itemId),
      pattern: {
        avgDeviation,
        sampleSize: priceDeviations.length,
        threshold: THRESHOLDS.PRICE_DEVIATION_THRESHOLD,
      },
      suggestedAction:
        'Review tool weights and consider running manual calibration. ' +
        'Check if specific categories or price ranges are affected.',
    });
  }

  /**
   * Check for slow sales pattern across recent outcomes
   */
  private async checkSlowSalesPattern(
    orgId: string,
    recentOutcomes: ResearchOutcome[],
  ): Promise<boolean> {
    const daysToSellList = recentOutcomes
      .filter((o) => o.daysToSell !== null)
      .map((o) => o.daysToSell!);

    if (daysToSellList.length < THRESHOLDS.SLOW_SALES_MIN_ITEMS) {
      return false;
    }

    const avgDays = daysToSellList.reduce((a, b) => a + b, 0) / daysToSellList.length;

    if (avgDays <= THRESHOLDS.SLOW_SALES_THRESHOLD_DAYS) {
      return false;
    }

    return this.createAnomalyIfNotExists(orgId, {
      anomalyType: 'slow_sales',
      severity: avgDays > THRESHOLDS.SLOW_SALES_WARNING_DAYS ? 'warning' : 'info',
      description:
        `Average time to sell is ${avgDays.toFixed(1)} days ` +
        `across ${daysToSellList.length} recent sales. ` +
        `Items may be overpriced or in low-demand categories.`,
      affectedItems: recentOutcomes
        .filter((o) => o.daysToSell && o.daysToSell > THRESHOLDS.SLOW_SALES_THRESHOLD_DAYS)
        .map((o) => o.itemId),
      pattern: {
        avgDaysToSell: avgDays,
        sampleSize: daysToSellList.length,
        threshold: THRESHOLDS.SLOW_SALES_THRESHOLD_DAYS,
      },
      suggestedAction:
        'Consider adjusting pricing strategy. Review if target price is too high ' +
        'relative to floor price.',
    });
  }

  /**
   * Check for high return rate pattern across recent outcomes
   */
  private async checkReturnRatePattern(
    orgId: string,
    recentOutcomes: ResearchOutcome[],
  ): Promise<boolean> {
    if (recentOutcomes.length < THRESHOLDS.RETURN_RATE_MIN_SAMPLES) {
      return false;
    }

    const returnsCount = recentOutcomes.filter((o) => o.wasReturned).length;
    const returnRate = returnsCount / recentOutcomes.length;

    if (returnRate <= THRESHOLDS.RETURN_RATE_THRESHOLD) {
      return false;
    }

    return this.createAnomalyIfNotExists(orgId, {
      anomalyType: 'category_misidentification',
      severity: returnRate > THRESHOLDS.RETURN_RATE_WARNING_THRESHOLD ? 'critical' : 'warning',
      description:
        `High return rate of ${(returnRate * 100).toFixed(1)}% ` +
        `(${returnsCount} of ${recentOutcomes.length} items). ` +
        `This may indicate identification or condition assessment issues.`,
      affectedItems: recentOutcomes.filter((o) => o.wasReturned).map((o) => o.itemId),
      pattern: {
        returnRate,
        returnsCount,
        totalSales: recentOutcomes.length,
      },
      suggestedAction:
        'Review return reasons. Check if identification accuracy needs improvement ' +
        'or if condition assessment is lacking detail.',
    });
  }

  /**
   * Check for price deviation anomaly (real-time check)
   */
  private async checkPriceDeviationAnomaly(
    _orgId: string,
    outcome: ResearchOutcome,
  ): Promise<void> {
    if (outcome.priceAccuracyRatio === null) return;

    // Check if this is a significant deviation worth logging
    if (Number(outcome.priceAccuracyRatio) > THRESHOLDS.SIGNIFICANT_PRICE_DEVIATION) {
      this.logger.debug(
        `Significant price deviation for item ${outcome.itemId}: ` +
          `${(Number(outcome.priceAccuracyRatio) * 100).toFixed(1)}%`,
      );
    }
  }

  /**
   * Check for confidence miscalibration (real-time check)
   */
  private async checkConfidenceMiscalibration(
    _orgId: string,
    outcome: ResearchOutcome,
  ): Promise<void> {
    if (outcome.researchConfidence === null || outcome.priceAccuracyRatio === null) {
      return;
    }

    // Actual accuracy is inverse of price accuracy ratio
    const actualAccuracy = Math.max(0, 1 - Number(outcome.priceAccuracyRatio));
    const reportedConfidence = Number(outcome.researchConfidence);

    const deviation = Math.abs(actualAccuracy - reportedConfidence);

    if (deviation > THRESHOLDS.CALIBRATION_DEVIATION_THRESHOLD) {
      this.logger.debug(
        `Confidence miscalibration for item ${outcome.itemId}: ` +
          `reported ${(reportedConfidence * 100).toFixed(0)}%, ` +
          `actual ${(actualAccuracy * 100).toFixed(0)}%`,
      );
    }
  }

  /**
   * Check for slow sales anomaly (real-time check)
   */
  private async checkSlowSalesAnomaly(
    _orgId: string,
    outcome: ResearchOutcome,
  ): Promise<void> {
    if (outcome.daysToSell === null) return;

    if (outcome.daysToSell > THRESHOLDS.SLOW_SALE_DAYS) {
      this.logger.debug(
        `Slow sale for item ${outcome.itemId}: ${outcome.daysToSell} days`,
      );
    }
  }

  /**
   * Create anomaly if a similar one doesn't already exist (unresolved)
   */
  private async createAnomalyIfNotExists(
    orgId: string,
    data: {
      anomalyType: AnomalyType;
      severity: AnomalySeverity;
      description: string;
      affectedItems: string[];
      pattern: Record<string, unknown>;
      suggestedAction: string;
    },
  ): Promise<boolean> {
    // Check for existing unresolved anomaly of same type
    const existing = await this.anomalyRepo.findOne({
      where: {
        organizationId: orgId,
        anomalyType: data.anomalyType,
        resolved: false,
      },
    });

    if (existing) {
      // Update existing anomaly with new data
      existing.description = data.description;
      existing.affectedItems = data.affectedItems;
      existing.pattern = data.pattern;
      existing.severity = data.severity;
      existing.detectedAt = new Date();
      await this.anomalyRepo.save(existing);
      return false;
    }

    // Create new anomaly
    const anomaly = this.anomalyRepo.create({
      organizationId: orgId,
      detectedAt: new Date(),
      anomalyType: data.anomalyType,
      severity: data.severity,
      description: data.description,
      affectedItems: data.affectedItems,
      pattern: data.pattern,
      suggestedAction: data.suggestedAction,
      resolved: false,
    });

    await this.anomalyRepo.save(anomaly);

    this.logger.log(
      `Created ${data.severity} anomaly for org ${orgId}: ${data.anomalyType}`,
    );

    return true;
  }

  /**
   * List anomalies with pagination and filters
   */
  async listAnomalies(
    orgId: string | null, // null for admin view across all orgs
    query: ListAnomaliesQuery,
  ): Promise<ListAnomaliesResponse> {
    const where: FindOptionsWhere<ResearchAnomaly> = {};

    if (orgId) {
      where.organizationId = orgId;
    }

    if (query.resolved !== undefined) {
      where.resolved = query.resolved;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    const [anomalies, total] = await this.anomalyRepo.findAndCount({
      where,
      order: { detectedAt: 'DESC' },
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
    });

    return {
      anomalies: anomalies.map((a) => this.mapToAnomalyType(a)),
      total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  /**
   * Get active anomalies for an organization
   */
  async getActiveAnomalies(orgId: string): Promise<ResearchAnomalyType[]> {
    const anomalies = await this.anomalyRepo.find({
      where: {
        organizationId: orgId,
        resolved: false,
      },
      order: { severity: 'ASC', detectedAt: 'DESC' },
    });

    return anomalies.map((a) => this.mapToAnomalyType(a));
  }

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(
    orgId: string,
    id: string,
    dto: ResolveAnomalyDto,
    userId: string,
  ): Promise<ResearchAnomalyType> {
    const anomaly = await this.anomalyRepo.findOne({
      where: { id, organizationId: orgId },
    });

    if (!anomaly) {
      throw new NotFoundException(`Anomaly ${id} not found`);
    }

    anomaly.resolved = true;
    anomaly.resolvedAt = new Date();
    anomaly.resolvedBy = userId;
    anomaly.resolutionNotes = dto.resolutionNotes;

    await this.anomalyRepo.save(anomaly);

    this.logger.log(`Anomaly ${id} resolved by user ${userId}`);

    return this.mapToAnomalyType(anomaly);
  }

  /**
   * Map entity to type
   */
  private mapToAnomalyType(anomaly: ResearchAnomaly): ResearchAnomalyType {
    return {
      id: anomaly.id,
      organizationId: anomaly.organizationId,
      detectedAt: anomaly.detectedAt.toISOString(),
      anomalyType: anomaly.anomalyType,
      severity: anomaly.severity,
      description: anomaly.description,
      affectedItems: anomaly.affectedItems,
      toolType: anomaly.toolType,
      pattern: anomaly.pattern,
      suggestedAction: anomaly.suggestedAction,
      resolved: anomaly.resolved,
      resolvedAt: anomaly.resolvedAt?.toISOString() ?? null,
      resolvedBy: anomaly.resolvedBy,
      resolutionNotes: anomaly.resolutionNotes,
      createdAt: anomaly.createdAt.toISOString(),
      updatedAt: anomaly.updatedAt.toISOString(),
    };
  }
}
