import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ResearchOutcome } from '../entities/research-outcome.entity';
import { ToolEffectiveness } from '../entities/tool-effectiveness.entity';
import { Item } from '../../items/entities/item.entity';
import { MarketplaceListing } from '../../marketplaces/entities/marketplace-listing.entity';
import type {
  OutcomeQuality,
  ToolUsageRecord,
  ResearchOutcome as ResearchOutcomeType,
  ToolEffectivenessMetrics,
  LearningDashboardSummary,
} from '@listforge/core-types';
import type {
  ListResearchOutcomesQuery,
  ListResearchOutcomesResponse,
  CorrectOutcomeDto,
  ToolEffectivenessQuery,
  GetToolEffectivenessResponse,
  GetToolEffectivenessTrendResponse,
  ToolEffectivenessTrendPoint,
  LearningDashboardQuery,
} from '@listforge/api-types';

/**
 * ResearchLearningService - Slice 10 (Learning Loop)
 *
 * Links AI research predictions to actual sales outcomes.
 * Tracks accuracy metrics and updates tool effectiveness data.
 */
@Injectable()
export class ResearchLearningService {
  private readonly logger = new Logger(ResearchLearningService.name);

  constructor(
    @InjectRepository(ResearchOutcome)
    private readonly outcomeRepo: Repository<ResearchOutcome>,
    @InjectRepository(ToolEffectiveness)
    private readonly toolEffectivenessRepo: Repository<ToolEffectiveness>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(MarketplaceListing)
    private readonly listingRepo: Repository<MarketplaceListing>,
  ) {}

  /**
   * Record a sale outcome from webhook
   * Creates ResearchOutcome record and updates tool effectiveness
   */
  async recordSaleOutcome(
    listingId: string,
    soldPrice: number,
    soldAt: Date,
    marketplace: string,
  ): Promise<ResearchOutcome | null> {
    // Find the listing with its item
    const listing = await this.listingRepo.findOne({
      where: { id: listingId },
    });

    if (!listing) {
      this.logger.warn(`Listing not found for sale outcome: ${listingId}`);
      return null;
    }

    // Find the associated item
    const item = await this.itemRepo.findOne({
      where: { id: listing.itemId },
    });

    if (!item) {
      this.logger.warn(`Item not found for listing: ${listingId}`);
      return null;
    }

    // Extract research predictions from item
    // Price predictions come from priceMin/priceMax/defaultPrice
    const predictedPriceFloor = item.priceMin ?? null;
    const predictedPriceTarget = item.defaultPrice ?? null;
    const predictedPriceCeiling = item.priceMax ?? null;
    // Brand and model are in canonicalFields
    const canonicalFields = item.canonicalFields ?? {};
    const identifiedBrand = (canonicalFields['brand'] as string) ?? null;
    const identifiedModel = (canonicalFields['model'] as string) ?? null;
    // Category from categoryPath
    const predictedCategory = item.categoryPath?.[item.categoryPath.length - 1] ?? null;
    const researchConfidence = item.aiConfidenceScore ?? null;

    // Calculate days to sell
    const listedAt = listing.createdAt;
    const daysToSell = listedAt
      ? Math.floor((soldAt.getTime() - listedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate price accuracy ratio: |predicted - actual| / actual
    let priceAccuracyRatio: number | null = null;
    if (predictedPriceTarget && soldPrice > 0) {
      priceAccuracyRatio = Math.abs(predictedPriceTarget - soldPrice) / soldPrice;
    }

    // Check if price is within predicted bands
    let priceWithinBands: boolean | null = null;
    if (predictedPriceFloor !== null && predictedPriceCeiling !== null) {
      priceWithinBands = soldPrice >= predictedPriceFloor && soldPrice <= predictedPriceCeiling;
    }

    // Determine outcome quality based on price accuracy
    const outcomeQuality = this.calculateOutcomeQuality(priceAccuracyRatio, priceWithinBands);

    // Extract tool usage from research evidence
    const toolsUsed = this.extractToolUsage(item);

    // Create outcome record
    const outcome = this.outcomeRepo.create({
      organizationId: item.organizationId,
      itemId: item.id,
      researchRunId: null, // Will be populated if research run tracking is added to Item
      marketplaceListingId: listingId,
      predictedPriceFloor,
      predictedPriceTarget,
      predictedPriceCeiling,
      predictedCategory,
      identifiedBrand,
      identifiedModel,
      researchConfidence,
      toolsUsed,
      listedPrice: listing.originalListPrice ?? listing.price,
      soldPrice,
      soldAt,
      listedAt,
      daysToSell,
      marketplace,
      wasReturned: false,
      returnReason: null,
      priceAccuracyRatio,
      identificationCorrect: null, // Will be determined by feedback or analysis
      priceWithinBands,
      outcomeQuality,
    });

    const savedOutcome = await this.outcomeRepo.save(outcome);

    // Update tool effectiveness metrics
    await this.updateToolEffectiveness(savedOutcome);

    this.logger.log(
      `Recorded sale outcome for item ${item.id}: ${outcomeQuality} quality, ` +
        `$${soldPrice} (predicted: $${predictedPriceTarget})`,
    );

    return savedOutcome;
  }

  /**
   * Record a return
   */
  async recordReturn(
    listingId: string,
    returnedAt: Date,
    reason: string | null,
  ): Promise<void> {
    // Find outcome by listing ID
    const outcome = await this.outcomeRepo.findOne({
      where: { marketplaceListingId: listingId },
    });

    if (!outcome) {
      this.logger.warn(`No outcome found for returned listing: ${listingId}`);
      return;
    }

    outcome.wasReturned = true;
    outcome.returnReason = reason;
    // Downgrade outcome quality for returns
    outcome.outcomeQuality = 'poor';

    await this.outcomeRepo.save(outcome);

    // Update tool effectiveness for return
    await this.updateToolEffectivenessForReturn(outcome);

    this.logger.log(`Recorded return for listing ${listingId}`);
  }

  /**
   * List research outcomes with pagination and filters
   */
  async listOutcomes(
    orgId: string,
    query: ListResearchOutcomesQuery,
  ): Promise<ListResearchOutcomesResponse> {
    const where: FindOptionsWhere<ResearchOutcome> = {
      organizationId: orgId,
    };

    if (query.quality) {
      where.outcomeQuality = query.quality;
    }

    if (query.marketplace) {
      where.marketplace = query.marketplace;
    }

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
    }

    const [outcomes, total] = await this.outcomeRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
    });

    return {
      outcomes: outcomes.map((o) => this.mapToOutcomeType(o)),
      total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  /**
   * Get a single outcome by ID
   */
  async getOutcome(orgId: string, id: string): Promise<ResearchOutcomeType> {
    const outcome = await this.outcomeRepo.findOne({
      where: { id, organizationId: orgId },
    });

    if (!outcome) {
      throw new NotFoundException(`Research outcome ${id} not found`);
    }

    return this.mapToOutcomeType(outcome);
  }

  /**
   * Manually correct an outcome
   */
  async correctOutcome(
    orgId: string,
    id: string,
    dto: CorrectOutcomeDto,
    _userId: string,
  ): Promise<ResearchOutcomeType> {
    const outcome = await this.outcomeRepo.findOne({
      where: { id, organizationId: orgId },
    });

    if (!outcome) {
      throw new NotFoundException(`Research outcome ${id} not found`);
    }

    if (dto.identificationCorrect !== undefined) {
      outcome.identificationCorrect = dto.identificationCorrect;
    }

    if (dto.outcomeQuality !== undefined) {
      outcome.outcomeQuality = dto.outcomeQuality;
    }

    await this.outcomeRepo.save(outcome);

    this.logger.log(`Outcome ${id} corrected by user`);

    return this.mapToOutcomeType(outcome);
  }

  /**
   * Get tool effectiveness metrics for an organization
   */
  async getToolEffectiveness(
    orgId: string | null,
    query: ToolEffectivenessQuery,
  ): Promise<GetToolEffectivenessResponse> {
    const periodDays = query.periodDays ?? 90;
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    const where: FindOptionsWhere<ToolEffectiveness> = {
      organizationId: orgId,
      periodStart: MoreThanOrEqual(periodStart),
    };

    if (query.toolType) {
      where.toolType = query.toolType;
    }

    const effectivenessRecords = await this.toolEffectivenessRepo.find({
      where,
      order: { toolType: 'ASC', periodStart: 'DESC' },
    });

    // Aggregate by tool type
    const toolMetrics = this.aggregateToolMetrics(effectivenessRecords);

    return {
      tools: toolMetrics,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };
  }

  /**
   * Get tool effectiveness trends over time
   */
  async getToolEffectivenessTrends(
    orgId: string | null,
    periodDays: number = 90,
  ): Promise<GetToolEffectivenessTrendResponse> {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    const records = await this.toolEffectivenessRepo.find({
      where: {
        organizationId: orgId,
        periodStart: MoreThanOrEqual(periodStart),
      },
      order: { periodStart: 'ASC', toolType: 'ASC' },
    });

    const toolTypes = [...new Set(records.map((r) => r.toolType))];

    const trends: ToolEffectivenessTrendPoint[] = records.map((r) => ({
      date: r.periodStart.toISOString().split('T')[0],
      toolType: r.toolType,
      averagePriceAccuracy:
        r.priceAccuracyCount > 0 ? Number(r.totalPriceDeviationSum) / r.priceAccuracyCount : 0,
      identificationAccuracy:
        r.identificationTotalCount > 0
          ? r.identificationCorrectCount / r.identificationTotalCount
          : 0,
      calibrationScore: r.calibrationScore ? Number(r.calibrationScore) : null,
      totalUses: r.totalUses,
    }));

    return {
      trends,
      toolTypes,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };
  }

  /**
   * Get learning dashboard summary
   */
  async getDashboardSummary(
    orgId: string,
    query: LearningDashboardQuery,
  ): Promise<LearningDashboardSummary> {
    const periodDays = query.periodDays ?? 30;
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Get outcomes in period
    const outcomes = await this.outcomeRepo.find({
      where: {
        organizationId: orgId,
        createdAt: MoreThanOrEqual(periodStart),
      },
    });

    // Calculate aggregate metrics
    const totalOutcomes = outcomes.length;
    let totalPriceAccuracy = 0;
    let priceAccuracyCount = 0;
    let identificationCorrectCount = 0;
    let identificationTotalCount = 0;

    const outcomesByQuality: Record<OutcomeQuality, number> = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };

    for (const outcome of outcomes) {
      if (outcome.priceAccuracyRatio !== null) {
        totalPriceAccuracy += Number(outcome.priceAccuracyRatio);
        priceAccuracyCount++;
      }
      if (outcome.identificationCorrect !== null) {
        identificationTotalCount++;
        if (outcome.identificationCorrect) {
          identificationCorrectCount++;
        }
      }
      if (outcome.outcomeQuality) {
        outcomesByQuality[outcome.outcomeQuality]++;
      }
    }

    // Get tool effectiveness
    const toolEffectivenessResponse = await this.getToolEffectiveness(orgId, {
      periodDays,
    });

    // Get active anomalies (import from anomaly service would create circular dep, use repo directly)
    // For now, return empty array - will be populated by AnomalyDetectionService
    const activeAnomalies: never[] = [];

    return {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      totalOutcomes,
      averagePriceAccuracy: priceAccuracyCount > 0 ? totalPriceAccuracy / priceAccuracyCount : 0,
      identificationAccuracy:
        identificationTotalCount > 0
          ? identificationCorrectCount / identificationTotalCount
          : 0,
      outcomesByQuality,
      toolEffectiveness: toolEffectivenessResponse.tools,
      activeAnomalies,
      recentCalibrations: [], // Will be populated by ToolCalibrationService
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Calculate outcome quality based on price accuracy
   */
  private calculateOutcomeQuality(
    priceAccuracyRatio: number | null,
    priceWithinBands: boolean | null,
  ): OutcomeQuality {
    if (priceAccuracyRatio === null) {
      return 'fair'; // Can't assess without data
    }

    // Lower ratio is better (less deviation)
    if (priceAccuracyRatio <= 0.05) {
      return 'excellent'; // Within 5%
    } else if (priceAccuracyRatio <= 0.15) {
      return 'good'; // Within 15%
    } else if (priceAccuracyRatio <= 0.30 || priceWithinBands) {
      return 'fair'; // Within 30% or at least within bands
    } else {
      return 'poor'; // More than 30% off
    }
  }

  /**
   * Extract tool usage records from item research evidence
   *
   * TODO: Tool usage tracking needs to be implemented in the research graph.
   * Currently returns empty array. When research runs track tool usage,
   * this method should be updated to pull from that data.
   */
  private extractToolUsage(_item: Item): ToolUsageRecord[] {
    // Tool usage data would come from research runs, which aren't currently
    // linked directly to items. For now, return empty array.
    // Future: Look up research run by item ID and extract tool usage from there.
    return [];
  }

  /**
   * Update tool effectiveness metrics based on an outcome
   */
  private async updateToolEffectiveness(outcome: ResearchOutcome): Promise<void> {
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1); // First of month
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last of month

    for (const tool of outcome.toolsUsed) {
      // Find or create effectiveness record for this period
      let effectiveness = await this.toolEffectivenessRepo.findOne({
        where: {
          organizationId: outcome.organizationId,
          toolType: tool.toolType,
          periodStart,
          periodEnd,
        },
      });

      if (!effectiveness) {
        effectiveness = this.toolEffectivenessRepo.create({
          organizationId: outcome.organizationId,
          toolType: tool.toolType,
          periodStart,
          periodEnd,
          totalUses: 0,
          contributedToSale: 0,
          contributedToReturn: 0,
          totalPriceDeviationSum: 0,
          priceAccuracyCount: 0,
          identificationCorrectCount: 0,
          identificationTotalCount: 0,
          confidenceWhenUsedSum: 0,
          confidenceWhenUsedCount: 0,
          actualAccuracySum: 0,
          currentWeight: 1.0,
        });
      }

      // Update usage counts
      effectiveness.totalUses++;
      effectiveness.contributedToSale++;

      // Update price accuracy if available
      if (outcome.priceAccuracyRatio !== null) {
        effectiveness.totalPriceDeviationSum =
          Number(effectiveness.totalPriceDeviationSum) + Number(outcome.priceAccuracyRatio);
        effectiveness.priceAccuracyCount++;
      }

      // Update identification stats if available
      if (outcome.identificationCorrect !== null) {
        effectiveness.identificationTotalCount++;
        if (outcome.identificationCorrect) {
          effectiveness.identificationCorrectCount++;
        }
      }

      // Update confidence calibration data
      effectiveness.confidenceWhenUsedSum =
        Number(effectiveness.confidenceWhenUsedSum) + tool.confidence;
      effectiveness.confidenceWhenUsedCount++;

      // Calculate actual accuracy (1 - priceAccuracyRatio for price-based tools)
      if (outcome.priceAccuracyRatio !== null) {
        const actualAccuracy = Math.max(0, 1 - Number(outcome.priceAccuracyRatio));
        effectiveness.actualAccuracySum =
          Number(effectiveness.actualAccuracySum) + actualAccuracy;
      }

      await this.toolEffectivenessRepo.save(effectiveness);
    }
  }

  /**
   * Update tool effectiveness for a return
   */
  private async updateToolEffectivenessForReturn(outcome: ResearchOutcome): Promise<void> {
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    for (const tool of outcome.toolsUsed) {
      const effectiveness = await this.toolEffectivenessRepo.findOne({
        where: {
          organizationId: outcome.organizationId,
          toolType: tool.toolType,
          periodStart,
          periodEnd,
        },
      });

      if (effectiveness) {
        effectiveness.contributedToReturn++;
        await this.toolEffectivenessRepo.save(effectiveness);
      }
    }
  }

  /**
   * Aggregate tool effectiveness records into metrics
   */
  private aggregateToolMetrics(records: ToolEffectiveness[]): ToolEffectivenessMetrics[] {
    const toolMap = new Map<string, ToolEffectiveness[]>();

    for (const record of records) {
      const existing = toolMap.get(record.toolType) || [];
      existing.push(record);
      toolMap.set(record.toolType, existing);
    }

    const metrics: ToolEffectivenessMetrics[] = [];

    for (const [toolType, toolRecords] of toolMap.entries()) {
      // Aggregate across all periods
      let totalUses = 0;
      let contributedToSale = 0;
      let contributedToReturn = 0;
      let totalPriceDeviation = 0;
      let priceAccuracyCount = 0;
      let identificationCorrectCount = 0;
      let identificationTotalCount = 0;
      let confidenceSum = 0;
      let confidenceCount = 0;

      const latestRecord = toolRecords[0]; // Already sorted by periodStart DESC

      for (const record of toolRecords) {
        totalUses += record.totalUses;
        contributedToSale += record.contributedToSale;
        contributedToReturn += record.contributedToReturn;
        totalPriceDeviation += Number(record.totalPriceDeviationSum);
        priceAccuracyCount += record.priceAccuracyCount;
        identificationCorrectCount += record.identificationCorrectCount;
        identificationTotalCount += record.identificationTotalCount;
        confidenceSum += Number(record.confidenceWhenUsedSum);
        confidenceCount += record.confidenceWhenUsedCount;
      }

      metrics.push({
        toolType,
        periodStart: toolRecords[toolRecords.length - 1].periodStart.toISOString(),
        periodEnd: latestRecord.periodEnd.toISOString(),
        totalUses,
        contributedToSale,
        contributedToReturn,
        averagePriceAccuracy: priceAccuracyCount > 0 ? totalPriceDeviation / priceAccuracyCount : 0,
        averageConfidenceWhenUsed: confidenceCount > 0 ? confidenceSum / confidenceCount : 0,
        identificationAccuracy:
          identificationTotalCount > 0
            ? identificationCorrectCount / identificationTotalCount
            : 0,
        calibrationScore: latestRecord.calibrationScore
          ? Number(latestRecord.calibrationScore)
          : null,
        currentWeight: Number(latestRecord.currentWeight),
        suggestedWeight: latestRecord.suggestedWeight
          ? Number(latestRecord.suggestedWeight)
          : null,
        saleContributionRate: totalUses > 0 ? contributedToSale / totalUses : 0,
        returnRate: contributedToSale > 0 ? contributedToReturn / contributedToSale : 0,
      });
    }

    return metrics;
  }

  /**
   * Map entity to type
   */
  private mapToOutcomeType(outcome: ResearchOutcome): ResearchOutcomeType {
    return {
      id: outcome.id,
      organizationId: outcome.organizationId,
      itemId: outcome.itemId,
      researchRunId: outcome.researchRunId,
      marketplaceListingId: outcome.marketplaceListingId,
      predictedPriceFloor: outcome.predictedPriceFloor
        ? Number(outcome.predictedPriceFloor)
        : null,
      predictedPriceTarget: outcome.predictedPriceTarget
        ? Number(outcome.predictedPriceTarget)
        : null,
      predictedPriceCeiling: outcome.predictedPriceCeiling
        ? Number(outcome.predictedPriceCeiling)
        : null,
      predictedCategory: outcome.predictedCategory,
      identifiedBrand: outcome.identifiedBrand,
      identifiedModel: outcome.identifiedModel,
      researchConfidence: outcome.researchConfidence
        ? Number(outcome.researchConfidence)
        : null,
      toolsUsed: outcome.toolsUsed,
      listedPrice: outcome.listedPrice ? Number(outcome.listedPrice) : null,
      soldPrice: outcome.soldPrice ? Number(outcome.soldPrice) : null,
      soldAt: outcome.soldAt?.toISOString() ?? null,
      listedAt: outcome.listedAt?.toISOString() ?? null,
      daysToSell: outcome.daysToSell,
      marketplace: outcome.marketplace,
      wasReturned: outcome.wasReturned,
      returnReason: outcome.returnReason,
      priceAccuracyRatio: outcome.priceAccuracyRatio
        ? Number(outcome.priceAccuracyRatio)
        : null,
      identificationCorrect: outcome.identificationCorrect,
      priceWithinBands: outcome.priceWithinBands,
      outcomeQuality: outcome.outcomeQuality,
      createdAt: outcome.createdAt.toISOString(),
      updatedAt: outcome.updatedAt.toISOString(),
    };
  }
}
