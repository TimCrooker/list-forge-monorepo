import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  cn,
} from '@listforge/ui';
import { Zap, Scale, Crown, Clock, Check, Info } from 'lucide-react';
import type { PricingStrategyOption, PricingStrategy } from '@listforge/core-types';

interface PricingStrategySelectorProps {
  strategies: PricingStrategyOption[];
  selectedStrategy?: PricingStrategy | null;
  onSelect?: (strategy: PricingStrategyOption) => void;
  disabled?: boolean;
}

const strategyIcons: Record<PricingStrategyOption['strategy'], typeof Zap> = {
  aggressive: Zap,
  balanced: Scale,
  premium: Crown,
};

const strategyColors: Record<PricingStrategyOption['strategy'], {
  bg: string;
  text: string;
  border: string;
  selectedBg: string;
}> = {
  aggressive: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    selectedBg: 'bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-500',
  },
  balanced: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    selectedBg: 'bg-green-100 dark:bg-green-900/50 ring-2 ring-green-500',
  },
  premium: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    selectedBg: 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500',
  },
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

function formatDaysToSell(estimate: { min: number; max: number }): string {
  if (estimate.min === estimate.max) {
    return `~${estimate.min} days`;
  }
  return `${estimate.min}-${estimate.max} days`;
}

export function PricingStrategySelector({
  strategies,
  selectedStrategy,
  onSelect,
  disabled = false,
}: PricingStrategySelectorProps) {
  // Order strategies as aggressive, balanced, premium
  const orderedStrategies = ['aggressive', 'balanced', 'premium']
    .map((s) => strategies.find((strategy) => strategy.strategy === s))
    .filter((s): s is PricingStrategyOption => s !== undefined);

  if (orderedStrategies.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Pricing Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pricing strategies available</p>
            <p className="text-xs mt-1">Run research to get strategy options</p>
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
            <Scale className="h-4 w-4" />
            Choose Pricing Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orderedStrategies.map((strategy) => {
              const Icon = strategyIcons[strategy.strategy];
              const colors = strategyColors[strategy.strategy];
              const isSelected = selectedStrategy === strategy.strategy;

              return (
                <button
                  key={strategy.strategy}
                  onClick={() => onSelect?.(strategy)}
                  disabled={disabled}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                    disabled && 'opacity-50 cursor-not-allowed',
                    isSelected
                      ? colors.selectedBg
                      : `${colors.bg} ${colors.border} hover:${colors.border}`,
                    !isSelected && 'focus:ring-gray-300',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg', colors.bg)}>
                        <Icon className={cn('h-4 w-4', colors.text)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {strategy.label}
                          </span>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Check className="h-3 w-3" />
                              Selected
                            </Badge>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-sm">{strategy.reasoning}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn('text-xs gap-1', colors.text)}
                          >
                            <Clock className="h-3 w-3" />
                            Est. {formatDaysToSell(strategy.estimatedDaysToSell)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(strategy.confidence * 100)}% confident
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn('text-lg font-bold', colors.text)}>
                        {formatPrice(strategy.price, strategy.currency)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedStrategy && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Click a strategy to update your item's price
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
