import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@listforge/ui';
import { TrendingUp, Minus, Clock, Users, Search, BarChart3, ArrowUpRight, ArrowDownRight, Hash, Store } from 'lucide-react';
import type { DemandSignal } from '@listforge/core-types';

interface DemandSignalsCardProps {
  demandSignals: DemandSignal[];
  competitorCount?: number;
}

const metricIcons: Record<DemandSignal['metric'], typeof TrendingUp> = {
  sell_through_rate: TrendingUp,
  days_to_sell: Clock,
  active_competition: Users,
  search_volume: Search,
  price_trend: BarChart3, // Slice 5: Price trend metric
  bsr: Hash, // Amazon BSR
  bsr_trend: TrendingUp, // Amazon BSR trend
};

const metricLabels: Record<DemandSignal['metric'], string> = {
  sell_through_rate: 'Sell-Through Rate',
  days_to_sell: 'Days to Sell',
  active_competition: 'Active Competition',
  search_volume: 'Search Volume',
  price_trend: 'Price Trend', // Slice 5
  bsr: 'Amazon BSR',
  bsr_trend: 'BSR Trend',
};

const metricDescriptions: Record<DemandSignal['metric'], string> = {
  sell_through_rate: 'Percentage of listings that sell',
  days_to_sell: 'Average time to sell similar items',
  active_competition: 'Number of active competing listings',
  search_volume: 'Buyer search interest level',
  price_trend: 'Price movement over last 90 days', // Slice 5
  bsr: 'Best Seller Rank on Amazon',
  bsr_trend: 'Sales velocity trend on Amazon',
};

function getMetricColor(metric: DemandSignal['metric'], value: number, direction?: DemandSignal['direction'], bsrTrend?: DemandSignal['bsrTrend']): string {
  switch (metric) {
    case 'sell_through_rate':
      if (value >= 70) return 'text-green-600';
      if (value >= 40) return 'text-amber-600';
      return 'text-red-600';
    case 'days_to_sell':
      if (value <= 7) return 'text-green-600';
      if (value <= 21) return 'text-amber-600';
      return 'text-red-600';
    case 'active_competition':
      if (value <= 10) return 'text-green-600';
      if (value <= 50) return 'text-amber-600';
      return 'text-red-600';
    case 'search_volume':
      if (value >= 70) return 'text-green-600';
      if (value >= 30) return 'text-amber-600';
      return 'text-red-600';
    // Slice 5: Price trend color based on direction
    case 'price_trend':
      if (direction === 'up') return 'text-green-600';
      if (direction === 'down') return 'text-red-600';
      return 'text-amber-600'; // stable
    // Amazon BSR: Lower = better (more sales)
    case 'bsr':
      if (value <= 10000) return 'text-green-600';
      if (value <= 100000) return 'text-amber-600';
      return 'text-red-600';
    // BSR Trend: Rising (lower rank = more sales) is good
    case 'bsr_trend':
      if (bsrTrend === 'rising') return 'text-green-600';
      if (bsrTrend === 'falling') return 'text-red-600';
      return 'text-amber-600';
    default:
      return 'text-foreground';
  }
}

function formatValue(metric: DemandSignal['metric'], value: number, unit: string): string {
  switch (metric) {
    case 'sell_through_rate':
      return `${value}${unit}`;
    case 'days_to_sell':
      return `${value} ${unit}`;
    case 'active_competition':
      return `${value}`;
    case 'search_volume':
      return `${value}${unit}`;
    // Slice 5: Format price trend with sign
    case 'price_trend':
      const sign = value > 0 ? '+' : '';
      return `${sign}${value.toFixed(1)}${unit}`;
    // Amazon BSR: Format with commas
    case 'bsr':
      return `#${value.toLocaleString()}`;
    case 'bsr_trend':
      return `#${value.toLocaleString()}`;
    default:
      return `${value} ${unit}`;
  }
}

// Slice 5: Get direction icon for price trend
function getDirectionIcon(direction?: DemandSignal['direction']) {
  switch (direction) {
    case 'up':
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    case 'down':
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-amber-600" />;
  }
}

export function DemandSignalsCard({
  demandSignals,
  competitorCount,
}: DemandSignalsCardProps) {
  if (demandSignals.length === 0 && competitorCount === undefined) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Market Demand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title="No demand data available"
            description="Run research to get market signals"
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Market Demand
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {demandSignals.map((signal, idx) => {
            const Icon = metricIcons[signal.metric];
            const colorClass = getMetricColor(signal.metric, signal.value, signal.direction, signal.bsrTrend);
            const isPriceTrend = signal.metric === 'price_trend';
            const isBsrMetric = signal.metric === 'bsr' || signal.metric === 'bsr_trend';
            const isAmazonMetric = signal.source === 'amazon' || signal.source === 'keepa';

            return (
              <div
                key={`${signal.metric}-${signal.source}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {/* Slice 5: Show direction icon for price trend, regular icon otherwise */}
                  {isPriceTrend ? (
                    getDirectionIcon(signal.direction)
                  ) : isBsrMetric && signal.bsrTrend ? (
                    // Show trend icon for BSR
                    signal.bsrTrend === 'rising' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : signal.bsrTrend === 'falling' ? (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-amber-600" />
                    )
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      {metricLabels[signal.metric]}
                      {/* Show Amazon badge for Amazon/Keepa sources */}
                      {isAmazonMetric && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          <Store className="h-3 w-3 mr-0.5" />
                          {signal.source === 'keepa' ? 'Keepa' : 'Amazon'}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {metricDescriptions[signal.metric]}
                      {signal.period && ` (${signal.period})`}
                      {signal.bsrCategory && ` in ${signal.bsrCategory}`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  {/* Slice 5: Show direction label for price trend */}
                  {isPriceTrend && signal.direction && (
                    <span className={`text-xs ${colorClass}`}>
                      {signal.direction === 'up' ? 'Rising' : signal.direction === 'down' ? 'Falling' : 'Stable'}
                    </span>
                  )}
                  {/* Show BSR trend label */}
                  {isBsrMetric && signal.bsrTrend && (
                    <span className={`text-xs ${colorClass}`}>
                      {signal.bsrTrend === 'rising' ? 'Improving' : signal.bsrTrend === 'falling' ? 'Declining' : 'Stable'}
                    </span>
                  )}
                  <span className={`text-sm font-semibold ${colorClass}`}>
                    {formatValue(signal.metric, signal.value, signal.unit)}
                  </span>
                  {signal.source && !isPriceTrend && !isAmazonMetric && (
                    <p className="text-xs text-muted-foreground">
                      via {signal.source}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {competitorCount !== undefined && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Active Competitors</p>
                  <p className="text-xs text-muted-foreground">
                    Currently listed similar items
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-semibold ${getMetricColor('active_competition', competitorCount)}`}
                >
                  {competitorCount}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
