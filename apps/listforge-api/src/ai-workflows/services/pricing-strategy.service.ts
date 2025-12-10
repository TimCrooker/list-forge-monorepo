/**
 * Pricing Strategy Service - Slice 5
 *
 * Calculates pricing strategies (fast/balanced/premium) with time-to-sell estimates.
 * Uses IQR-based outlier filtering and derives price trends from sold comps.
 */

import { Injectable } from '@nestjs/common';
import {
  PriceBand,
  PricingStrategyOption,
  DemandSignal,
  ResearchEvidenceRecord,
} from '@listforge/core-types';

/**
 * Configuration for pricing strategy calculation
 */
export interface PricingStrategyConfig {
  /** Multiplier for fast sale price relative to floor (default: 1.0) */
  fastSaleMultiplier: number;
  /** Multiplier for premium price relative to ceiling (default: 1.0) */
  premiumMultiplier: number;
  /** Base days estimate for balanced strategy */
  baseDaysBalanced: { min: number; max: number };
  /** IQR multiplier for outlier detection (default: 1.5) */
  iqrMultiplier: number;
}

const DEFAULT_CONFIG: PricingStrategyConfig = {
  fastSaleMultiplier: 1.0,
  premiumMultiplier: 1.0,
  baseDaysBalanced: { min: 7, max: 14 },
  iqrMultiplier: 1.5,
};

/**
 * Result of IQR filtering
 */
export interface IQRFilterResult {
  filteredPrices: number[];
  removedCount: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
}

/**
 * Price trend analysis result
 */
export interface PriceTrendResult {
  direction: 'up' | 'down' | 'stable';
  percentChange: number;
  recentAvg: number;
  olderAvg: number;
}

@Injectable()
export class PricingStrategyService {
  /**
   * Filter outliers from price data using IQR method
   * More robust than z-score for non-normal distributions
   */
  filterOutliersIQR(
    prices: number[],
    multiplier: number = DEFAULT_CONFIG.iqrMultiplier,
  ): IQRFilterResult {
    if (prices.length < 4) {
      // Not enough data for IQR
      return {
        filteredPrices: prices,
        removedCount: 0,
        q1: prices[0] || 0,
        q3: prices[prices.length - 1] || 0,
        iqr: 0,
        lowerBound: 0,
        upperBound: Infinity,
      };
    }

    const sorted = [...prices].sort((a, b) => a - b);
    const n = sorted.length;

    // Calculate Q1 (25th percentile) and Q3 (75th percentile)
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    // Calculate bounds
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    // Filter outliers
    const filteredPrices = sorted.filter(
      (p) => p >= lowerBound && p <= upperBound,
    );

    return {
      filteredPrices,
      removedCount: prices.length - filteredPrices.length,
      q1,
      q3,
      iqr,
      lowerBound,
      upperBound,
    };
  }

  /**
   * Calculate price trend from sold comps
   * Compares recent sales (last 30 days) to older sales (30-90 days)
   */
  calculatePriceTrend(soldComps: ResearchEvidenceRecord[]): PriceTrendResult {
    const { getDaysAgo } = require('../utils/date');
    const now = new Date();
    const thirtyDaysAgo = getDaysAgo(30);
    const ninetyDaysAgo = getDaysAgo(90);

    // Split into recent and older
    const recentSales: number[] = [];
    const olderSales: number[] = [];

    for (const comp of soldComps) {
      if (!comp.price || comp.price <= 0) continue;
      if (!comp.soldDate) continue;

      const soldDate = new Date(comp.soldDate);
      if (soldDate >= thirtyDaysAgo) {
        recentSales.push(comp.price);
      } else if (soldDate >= ninetyDaysAgo) {
        olderSales.push(comp.price);
      }
    }

    // Need at least 2 sales in each period to detect trend
    if (recentSales.length < 2 || olderSales.length < 2) {
      return {
        direction: 'stable',
        percentChange: 0,
        recentAvg: recentSales.length > 0 ? this.average(recentSales) : 0,
        olderAvg: olderSales.length > 0 ? this.average(olderSales) : 0,
      };
    }

    const recentAvg = this.average(recentSales);
    const olderAvg = this.average(olderSales);
    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Consider stable if change is within 5%
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (percentChange > 5) {
      direction = 'up';
    } else if (percentChange < -5) {
      direction = 'down';
    }

    return {
      direction,
      percentChange,
      recentAvg,
      olderAvg,
    };
  }

  /**
   * Estimate time to sell based on strategy and market signals
   */
  estimateTimeToSell(
    strategy: 'aggressive' | 'balanced' | 'premium',
    sellThroughRate: number | undefined,
    competitionCount: number | undefined,
    config: PricingStrategyConfig = DEFAULT_CONFIG,
  ): { min: number; max: number } {
    // Base estimates by strategy
    const baseEstimates = {
      aggressive: { min: 1, max: 5 }, // 'aggressive' = fast sale
      balanced: config.baseDaysBalanced,
      premium: { min: 21, max: 45 },
    };

    let estimate = { ...baseEstimates[strategy] };

    // Adjust based on sell-through rate (if available)
    // High sell-through = faster sales
    if (sellThroughRate !== undefined) {
      if (sellThroughRate >= 0.7) {
        // Hot market - reduce estimates by 30%
        estimate.min = Math.max(1, Math.round(estimate.min * 0.7));
        estimate.max = Math.round(estimate.max * 0.7);
      } else if (sellThroughRate <= 0.3) {
        // Cold market - increase estimates by 50%
        estimate.min = Math.round(estimate.min * 1.5);
        estimate.max = Math.round(estimate.max * 1.5);
      }
    }

    // Adjust based on competition (if available)
    // More competition = slower sales
    if (competitionCount !== undefined) {
      if (competitionCount > 50) {
        // High competition - add 30% to estimates
        estimate.min = Math.round(estimate.min * 1.3);
        estimate.max = Math.round(estimate.max * 1.3);
      } else if (competitionCount <= 5) {
        // Low competition - reduce estimates by 20%
        estimate.min = Math.max(1, Math.round(estimate.min * 0.8));
        estimate.max = Math.round(estimate.max * 0.8);
      }
    }

    return estimate;
  }

  /**
   * Calculate pricing strategies from price bands and market data
   */
  calculateStrategies(
    priceBands: PriceBand[],
    validatedComps: ResearchEvidenceRecord[],
    demandSignals: DemandSignal[],
    config: Partial<PricingStrategyConfig> = {},
  ): PricingStrategyOption[] {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    // Find price bands
    const floorBand = priceBands.find((b) => b.label === 'floor');
    const targetBand = priceBands.find((b) => b.label === 'target');
    const ceilingBand = priceBands.find((b) => b.label === 'ceiling');

    if (!floorBand || !targetBand || !ceilingBand) {
      console.log(
        '[pricing-strategy] Missing price bands, cannot calculate strategies',
      );
      return [];
    }

    // Extract market signals
    const sellThroughSignal = demandSignals.find(
      (s) => s.metric === 'sell_through_rate',
    );
    const competitionSignal = demandSignals.find(
      (s) => s.metric === 'active_competition',
    );

    const sellThroughRate = sellThroughSignal?.value;
    const competitionCount = competitionSignal?.value;

    // Calculate time estimates for each strategy
    const aggressiveTime = this.estimateTimeToSell(
      'aggressive',
      sellThroughRate,
      competitionCount,
      fullConfig,
    );
    const balancedTime = this.estimateTimeToSell(
      'balanced',
      sellThroughRate,
      competitionCount,
      fullConfig,
    );
    const premiumTime = this.estimateTimeToSell(
      'premium',
      sellThroughRate,
      competitionCount,
      fullConfig,
    );

    // Calculate strategy prices
    const aggressivePrice = floorBand.amount * fullConfig.fastSaleMultiplier;
    const balancedPrice = targetBand.amount;
    const premiumPrice = ceilingBand.amount * fullConfig.premiumMultiplier;

    // Calculate confidence based on comp quality and quantity
    const validComps = validatedComps.filter(
      (c) => c.validation?.isValid !== false,
    );
    const baseConfidence = Math.min(0.9, validComps.length / 15);

    // Build strategy options
    const strategies: PricingStrategyOption[] = [
      {
        strategy: 'aggressive',
        label: 'Fast Sale',
        price: Math.round(aggressivePrice * 100) / 100,
        currency: floorBand.currency,
        estimatedDaysToSell: aggressiveTime,
        confidence: Math.min(
          floorBand.confidence,
          baseConfidence + 0.1,
        ),
        reasoning: this.generateReasoning(
          'aggressive',
          aggressivePrice,
          aggressiveTime,
          sellThroughRate,
          competitionCount,
        ),
      },
      {
        strategy: 'balanced',
        label: 'Balanced',
        price: Math.round(balancedPrice * 100) / 100,
        currency: targetBand.currency,
        estimatedDaysToSell: balancedTime,
        confidence: targetBand.confidence,
        reasoning: this.generateReasoning(
          'balanced',
          balancedPrice,
          balancedTime,
          sellThroughRate,
          competitionCount,
        ),
      },
      {
        strategy: 'premium',
        label: 'Premium',
        price: Math.round(premiumPrice * 100) / 100,
        currency: ceilingBand.currency,
        estimatedDaysToSell: premiumTime,
        confidence: Math.max(
          ceilingBand.confidence - 0.1,
          baseConfidence - 0.1,
        ),
        reasoning: this.generateReasoning(
          'premium',
          premiumPrice,
          premiumTime,
          sellThroughRate,
          competitionCount,
        ),
      },
    ];

    return strategies;
  }

  /**
   * Generate human-readable reasoning for a pricing strategy
   */
  private generateReasoning(
    strategy: 'aggressive' | 'balanced' | 'premium',
    price: number,
    timeEstimate: { min: number; max: number },
    sellThroughRate: number | undefined,
    competitionCount: number | undefined,
  ): string {
    const parts: string[] = [];

    switch (strategy) {
      case 'aggressive':
        parts.push('Priced at floor for quick turnover.');
        break;
      case 'balanced':
        parts.push('Optimal price balancing speed and profit margin.');
        break;
      case 'premium':
        parts.push('Maximum price for patient sellers seeking best return.');
        break;
    }

    // Add market context
    if (sellThroughRate !== undefined) {
      if (sellThroughRate >= 0.7) {
        parts.push('Strong market demand detected.');
      } else if (sellThroughRate <= 0.3) {
        parts.push('Slow market - consider lower pricing.');
      }
    }

    if (competitionCount !== undefined) {
      if (competitionCount > 50) {
        parts.push(`High competition (${competitionCount} active listings).`);
      } else if (competitionCount <= 5) {
        parts.push(`Low competition (${competitionCount} active listings).`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Create a price trend demand signal from comp analysis
   */
  createPriceTrendSignal(
    soldComps: ResearchEvidenceRecord[],
  ): DemandSignal | null {
    const trend = this.calculatePriceTrend(soldComps);

    // Only create signal if we have enough data
    if (trend.recentAvg === 0 || trend.olderAvg === 0) {
      return null;
    }

    return {
      metric: 'price_trend',
      value: Math.round(trend.percentChange * 10) / 10, // Round to 1 decimal
      unit: '%',
      period: '90d',
      source: 'ebay',
      direction: trend.direction,
    };
  }

  /**
   * Calculate average of numbers
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
