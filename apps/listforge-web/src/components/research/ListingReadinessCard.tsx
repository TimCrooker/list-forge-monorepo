import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from '@listforge/ui';
import { CheckCircle2, AlertCircle, Clock, Rocket } from 'lucide-react';
import type { FieldCompletion, MarketplaceCategory } from '@listforge/core-types';

interface ListingReadinessCardProps {
  fieldCompletion: FieldCompletion | null | undefined;
  marketplaceCategory: MarketplaceCategory | null | undefined;
}

type ReadinessStatus = 'ready' | 'review' | 'incomplete';

function getReadinessStatus(
  fieldCompletion: FieldCompletion | null | undefined,
  marketplaceCategory: MarketplaceCategory | null | undefined
): { status: ReadinessStatus; message: string } {
  if (!marketplaceCategory || !fieldCompletion) {
    return {
      status: 'incomplete',
      message: 'Category detection pending',
    };
  }

  const hasAllRequired = fieldCompletion.required.missing.length === 0;
  const hasHighConfidence = marketplaceCategory.confidence >= 0.8;
  const readinessScore = fieldCompletion.readinessScore;

  if (hasAllRequired && hasHighConfidence && readinessScore >= 0.9) {
    return {
      status: 'ready',
      message: 'Ready to list',
    };
  }

  if (hasAllRequired && readinessScore >= 0.7) {
    return {
      status: 'review',
      message: 'Review recommended',
    };
  }

  return {
    status: 'incomplete',
    message: 'Missing required fields',
  };
}

const statusConfig: Record<
  ReadinessStatus,
  { icon: typeof CheckCircle2; color: string; bgColor: string; badgeVariant: 'default' | 'secondary' | 'destructive' }
> = {
  ready: {
    icon: Rocket,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    badgeVariant: 'default',
  },
  review: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    badgeVariant: 'secondary',
  },
  incomplete: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    badgeVariant: 'destructive',
  },
};

export function ListingReadinessCard({
  fieldCompletion,
  marketplaceCategory,
}: ListingReadinessCardProps) {
  const { status, message } = getReadinessStatus(fieldCompletion, marketplaceCategory);
  const config = statusConfig[status];
  const Icon = config.icon;

  // Calculate percentages
  const requiredPercent = fieldCompletion?.required.total
    ? Math.round((fieldCompletion.required.filled / fieldCompletion.required.total) * 100)
    : 0;
  const recommendedPercent = fieldCompletion?.recommended.total
    ? Math.round((fieldCompletion.recommended.filled / fieldCompletion.recommended.total) * 100)
    : 0;
  const overallPercent = fieldCompletion
    ? Math.round(fieldCompletion.readinessScore * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Listing Readiness
          </CardTitle>
          <Badge variant={config.badgeVariant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {message}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Readiness</span>
            <span className={config.color}>{overallPercent}%</span>
          </div>
          <Progress
            value={overallPercent}
            className="h-3"
          />
        </div>

        {/* Breakdown */}
        {fieldCompletion && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Required Fields */}
            <div className={`rounded-lg p-3 ${requiredPercent === 100 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Required</span>
                <span className={`text-sm font-semibold ${requiredPercent === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {requiredPercent}%
                </span>
              </div>
              <Progress
                value={requiredPercent}
                className="h-1.5"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {fieldCompletion.required.filled} of {fieldCompletion.required.total} fields
              </p>
            </div>

            {/* Recommended Fields */}
            <div className={`rounded-lg p-3 ${recommendedPercent >= 70 ? 'bg-green-50' : 'bg-amber-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Recommended</span>
                <span className={`text-sm font-semibold ${recommendedPercent >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                  {recommendedPercent}%
                </span>
              </div>
              <Progress
                value={recommendedPercent}
                className="h-1.5"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {fieldCompletion.recommended.filled} of {fieldCompletion.recommended.total} fields
              </p>
            </div>
          </div>
        )}

        {/* Category confidence indicator */}
        {marketplaceCategory && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>Category Confidence</span>
            <span className={marketplaceCategory.confidence >= 0.8 ? 'text-green-600' : 'text-amber-600'}>
              {Math.round(marketplaceCategory.confidence * 100)}%
            </span>
          </div>
        )}

        {/* Action hint */}
        {status === 'incomplete' && fieldCompletion && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3">
            <p className="font-medium mb-1">Missing Required Fields:</p>
            <p>{fieldCompletion.required.missing.slice(0, 3).join(', ')}
              {fieldCompletion.required.missing.length > 3 && ` and ${fieldCompletion.required.missing.length - 3} more`}
            </p>
          </div>
        )}

        {status === 'ready' && (
          <div className="text-xs text-green-600 bg-green-50 rounded-lg p-3 flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            <p>This item is ready to be listed on eBay!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
