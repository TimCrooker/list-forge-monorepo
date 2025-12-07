import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@listforge/ui';
import { TrendingUp, Clock, Users, Search, BarChart3 } from 'lucide-react';
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
};

const metricLabels: Record<DemandSignal['metric'], string> = {
  sell_through_rate: 'Sell-Through Rate',
  days_to_sell: 'Days to Sell',
  active_competition: 'Active Competition',
  search_volume: 'Search Volume',
};

const metricDescriptions: Record<DemandSignal['metric'], string> = {
  sell_through_rate: 'Percentage of listings that sell',
  days_to_sell: 'Average time to sell similar items',
  active_competition: 'Number of active competing listings',
  search_volume: 'Buyer search interest level',
};

function getMetricColor(metric: DemandSignal['metric'], value: number): string {
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
    default:
      return `${value} ${unit}`;
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
          <div className="text-center text-muted-foreground py-4">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No demand data available</p>
            <p className="text-xs mt-1">Run research to get market signals</p>
          </div>
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
            const colorClass = getMetricColor(signal.metric, signal.value);

            return (
              <div
                key={`${signal.metric}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {metricLabels[signal.metric]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {metricDescriptions[signal.metric]}
                      {signal.period && ` (${signal.period})`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${colorClass}`}>
                    {formatValue(signal.metric, signal.value, signal.unit)}
                  </span>
                  {signal.source && (
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
