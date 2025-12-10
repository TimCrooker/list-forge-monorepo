import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  EmptyState,
} from '@listforge/ui';
import { DollarSign, TrendingDown, Target, TrendingUp, Info } from 'lucide-react';
import type { PriceBand } from '@listforge/core-types';
import { ConfidenceBadge } from '@/components/common';
import { formatPrice } from '@/utils/formatters';

interface PriceBandsCardProps {
  priceBands: PriceBand[];
}

const bandIcons: Record<PriceBand['label'], typeof TrendingDown> = {
  floor: TrendingDown,
  target: Target,
  ceiling: TrendingUp,
};

const bandColors: Record<PriceBand['label'], string> = {
  floor: 'text-amber-600 bg-amber-50',
  target: 'text-green-600 bg-green-50',
  ceiling: 'text-blue-600 bg-blue-50',
};

const bandLabels: Record<PriceBand['label'], string> = {
  floor: 'Floor Price',
  target: 'Target Price',
  ceiling: 'Ceiling Price',
};

const bandDescriptions: Record<PriceBand['label'], string> = {
  floor: 'Minimum viable price for a quick sale',
  target: 'Optimal price balancing speed and margin',
  ceiling: 'Maximum realistic price for patient sellers',
};

export function PriceBandsCard({ priceBands }: PriceBandsCardProps) {

  // Order bands as floor, target, ceiling
  const orderedBands = ['floor', 'target', 'ceiling']
    .map((label) => priceBands.find((b) => b.label === label))
    .filter((b): b is PriceBand => b !== undefined);

  if (orderedBands.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="No price recommendations available"
            description="Run research to get pricing data"
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orderedBands.map((band) => {
              const Icon = bandIcons[band.label];
              const colorClass = bandColors[band.label];

              return (
                <div
                  key={band.label}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {bandLabels[band.label]}
                        </span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">{bandDescriptions[band.label]}</p>
                            {band.reasoning && (
                              <p className="text-xs mt-1 text-muted-foreground">
                                {band.reasoning}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <ConfidenceBadge confidence={band.confidence} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      {formatPrice(band.amount, band.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
