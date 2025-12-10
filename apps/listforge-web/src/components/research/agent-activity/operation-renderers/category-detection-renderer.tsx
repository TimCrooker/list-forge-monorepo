import { FolderTree, Check, AlertCircle, ChevronRight, Package } from 'lucide-react';
import { Badge, Progress } from '@listforge/ui';
import type { OperationRendererProps } from './index';

interface CategoryDetectionData {
  detected?: boolean;
  categoryId?: string;
  categoryPath?: string[];
  categoryName?: string;
  confidence?: number;
  conditionId?: string;
  requiredFieldCount?: number;
  recommendedFieldCount?: number;
  requiredFieldsSample?: string[];
  fieldCompletion?: {
    requiredFilled: number;
    requiredTotal: number;
    recommendedFilled: number;
    recommendedTotal: number;
    readinessScore: number;
    missingRequired?: string[];
  };
  reason?: string;
}

/**
 * Renderer for category detection operations
 * Slice 4: Displays detected eBay category with confidence and field requirements
 */
export default function CategoryDetectionRenderer({
  operation,
}: OperationRendererProps) {
  // Extract data from completed event
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  );
  const data = completedEvent?.data as CategoryDetectionData | undefined;

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No category data available
      </div>
    );
  }

  // Not detected case
  if (!data.detected) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">Category could not be detected</span>
        </div>
        {data.reason && (
          <p className="text-xs text-muted-foreground">
            {data.reason}
          </p>
        )}
      </div>
    );
  }

  // Detected case
  const confidence = data.confidence ? Math.round(data.confidence * 100) : 0;
  const hasRequiredFields = (data.requiredFieldCount || 0) > 0;
  const hasRecommendedFields = (data.recommendedFieldCount || 0) > 0;

  return (
    <div className="space-y-3 text-sm">
      {/* Confidence indicator */}
      {data.confidence && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FolderTree className="h-3.5 w-3.5" />
              <span>Detection Confidence</span>
            </div>
            <span
              className={
                confidence >= 80
                  ? 'text-green-600 font-medium'
                  : confidence >= 60
                    ? 'text-blue-600 font-medium'
                    : 'text-amber-600 font-medium'
              }
            >
              {confidence}%
            </span>
          </div>
          <Progress value={confidence} className="h-1.5" />
        </div>
      )}

      {/* Category path */}
      {data.categoryPath && data.categoryPath.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            <Package className="h-3 w-3" />
            Category Path
          </div>
          <div className="flex items-center flex-wrap gap-1 text-xs">
            {data.categoryPath.map((segment, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                )}
                <span
                  className={
                    index === data.categoryPath!.length - 1
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                  }
                >
                  {segment}
                </span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-muted">
            <span className="text-[10px] text-muted-foreground">
              ID: <span className="font-mono">{data.categoryId}</span>
            </span>
            {data.conditionId && (
              <span className="text-[10px] text-muted-foreground">
                Condition: <span className="font-mono">{data.conditionId}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Field requirements summary */}
      {(hasRequiredFields || hasRecommendedFields) && (
        <div className="grid grid-cols-2 gap-2">
          {/* Required fields */}
          {hasRequiredFields && (
            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-green-700 dark:text-green-400 font-medium">
                  Required Fields
                </span>
                <Badge variant="outline" className="text-[8px] h-4 bg-green-100 text-green-700 border-green-300">
                  {data.requiredFieldCount}
                </Badge>
              </div>
              {data.requiredFieldsSample && data.requiredFieldsSample.length > 0 && (
                <div className="text-[10px] text-muted-foreground">
                  {data.requiredFieldsSample.slice(0, 3).join(', ')}
                  {data.requiredFieldsSample.length > 3 && '...'}
                </div>
              )}
            </div>
          )}

          {/* Recommended fields */}
          {hasRecommendedFields && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                  Recommended
                </span>
                <Badge variant="outline" className="text-[8px] h-4 bg-blue-100 text-blue-700 border-blue-300">
                  {data.recommendedFieldCount}
                </Badge>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Optional fields
              </div>
            </div>
          )}
        </div>
      )}

      {/* Field completion status */}
      {data.fieldCompletion && (
        <div className="bg-muted/30 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Field Completion
            </span>
            <span className="text-xs font-medium">
              {data.fieldCompletion.readinessScore}% Ready
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Required</span>
              <span className={data.fieldCompletion.requiredFilled === data.fieldCompletion.requiredTotal ? 'text-green-600' : 'text-amber-600'}>
                {data.fieldCompletion.requiredFilled}/{data.fieldCompletion.requiredTotal}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Recommended</span>
              <span className="text-muted-foreground">
                {data.fieldCompletion.recommendedFilled}/{data.fieldCompletion.recommendedTotal}
              </span>
            </div>
          </div>
          {data.fieldCompletion.missingRequired && data.fieldCompletion.missingRequired.length > 0 && (
            <div className="mt-2 pt-2 border-t border-muted">
              <div className="flex items-center gap-1 text-[10px] text-amber-600">
                <AlertCircle className="h-3 w-3" />
                <span>Missing: {data.fieldCompletion.missingRequired.slice(0, 2).join(', ')}</span>
                {data.fieldCompletion.missingRequired.length > 2 && (
                  <span>+{data.fieldCompletion.missingRequired.length - 2}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success indicator */}
      {data.detected && confidence >= 80 && (
        <div className="flex items-center gap-1.5 text-[10px] text-green-600">
          <Check className="h-3 w-3" />
          <span>Category successfully detected</span>
        </div>
      )}

      {/* Error state */}
      {operation.error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-600 dark:text-red-400">
            {operation.error}
          </p>
        </div>
      )}
    </div>
  );
}
