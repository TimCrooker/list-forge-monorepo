import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@listforge/ui';
import { AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import type { MissingInfoHint } from '@listforge/core-types';

interface MissingInfoCardProps {
  missingInfo: MissingInfoHint[];
}

const importanceConfig: Record<
  MissingInfoHint['importance'],
  {
    icon: typeof AlertCircle;
    badgeVariant: 'destructive' | 'secondary' | 'outline';
    label: string;
    color: string;
  }
> = {
  required: {
    icon: AlertCircle,
    badgeVariant: 'destructive',
    label: 'Required',
    color: 'text-red-600',
  },
  recommended: {
    icon: AlertTriangle,
    badgeVariant: 'secondary',
    label: 'Recommended',
    color: 'text-amber-600',
  },
  optional: {
    icon: Info,
    badgeVariant: 'outline',
    label: 'Optional',
    color: 'text-muted-foreground',
  },
};

export function MissingInfoCard({ missingInfo }: MissingInfoCardProps) {
  if (missingInfo.length === 0) {
    return null; // Don't show card if no missing info
  }

  // Sort by importance: required first, then recommended, then optional
  const sortedInfo = [...missingInfo].sort((a, b) => {
    const order = { required: 0, recommended: 1, optional: 2 };
    return order[a.importance] - order[b.importance];
  });

  const requiredCount = missingInfo.filter((m) => m.importance === 'required').length;
  const recommendedCount = missingInfo.filter((m) => m.importance === 'recommended').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Missing Information
          </CardTitle>
          <div className="flex gap-1">
            {requiredCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {requiredCount} required
              </Badge>
            )}
            {recommendedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {recommendedCount} recommended
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Adding this information could improve pricing accuracy
        </p>
        <div className="space-y-2">
          {sortedInfo.map((hint, idx) => {
            const config = importanceConfig[hint.importance];
            const Icon = config.icon;

            return (
              <div
                key={`${hint.field}-${idx}`}
                className="p-3 rounded-lg border bg-background"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">
                        {hint.field.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={config.badgeVariant} className="text-xs py-0">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {hint.reason}
                    </p>
                    {hint.suggestedPrompt && (
                      <p className="text-xs text-primary mt-1.5 italic">
                        "{hint.suggestedPrompt}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
