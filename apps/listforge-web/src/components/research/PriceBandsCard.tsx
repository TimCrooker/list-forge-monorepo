import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@listforge/ui';
import { DollarSign, TrendingDown, Target, TrendingUp, Info } from 'lucide-react';
import type { PriceBand } from '@listforge/core-types';

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

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let color = 'text-red-600 bg-red-50';
  if (percentage >= 70) {
    color = 'text-green-600 bg-green-50';
  } else if (percentage >= 40) {
    color = 'text-amber-600 bg-amber-50';
  }

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>
      {percentage}% confident
    </span>
  );
}

export function PriceBandsCard({ priceBands }: PriceBandsCardProps) {
  const formatPrice = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount);
  };

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
          <div className="text-center text-muted-foreground py-4">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No price recommendations available</p>
            <p className="text-xs mt-1">Run research to get pricing data</p>
          </div>
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
