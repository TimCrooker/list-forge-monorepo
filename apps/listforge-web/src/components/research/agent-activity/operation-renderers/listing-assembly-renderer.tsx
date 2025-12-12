import { FileText, Tag, DollarSign, Image as ImageIcon, CheckCircle2, AlertCircle, Clock, Rocket } from 'lucide-react';
import { Badge } from '@listforge/ui';
import type { OperationRendererProps } from './index';
import type { ListingReadinessStatus, ListingValidation } from '@listforge/core-types';

interface ListingAssemblyData {
  marketplace?: string;
  status?: ListingReadinessStatus;
  statusReason?: string;
  confidence?: number;
  title?: string;
  titleLength?: number;
  price?: number;
  categoryId?: string;
  photoCount?: number;
  attributeCount?: number;
  validation?: ListingValidation;
  missingRequired?: string[];
  readyForPublish?: number;
  readyForReview?: number;
  needsInfo?: number;
}

const statusConfig: Record<ListingReadinessStatus, {
  icon: typeof Rocket;
  label: string;
  color: string;
  bg: string;
}> = {
  READY_FOR_PUBLISH: {
    icon: Rocket,
    label: 'Ready to Publish',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
  },
  READY_FOR_REVIEW: {
    icon: Clock,
    label: 'Ready for Review',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
  },
  NEEDS_INFO: {
    icon: AlertCircle,
    label: 'Needs Info',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900',
  },
};

function formatPrice(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Renderer for listing assembly operations
 * Shows assembled listing status, title preview, and validation results
 */
export default function ListingAssemblyRenderer({
  operation,
}: OperationRendererProps) {
  // Extract data from completed event
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed',
  );
  const data = completedEvent?.data as ListingAssemblyData | undefined;

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No listing data available
      </div>
    );
  }

  const statusInfo = data.status ? statusConfig[data.status] : null;
  const StatusIcon = statusInfo?.icon || FileText;
  const confidence = data.confidence ? Math.round(data.confidence * 100) : undefined;

  return (
    <div className="space-y-3 text-sm">
      {/* Status Banner */}
      {statusInfo && (
        <div className={`flex items-center justify-between p-3 rounded border ${statusInfo.bg}`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
            <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          {confidence !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {confidence}% confidence
            </Badge>
          )}
        </div>
      )}

      {/* Title Preview */}
      {data.title && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Generated Title</span>
            {data.titleLength !== undefined && (
              <span className={data.titleLength > 80 ? 'text-red-500' : ''}>
                {data.titleLength}/80 chars
              </span>
            )}
          </div>
          <p className="text-sm font-medium line-clamp-2">{data.title}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2">
        {data.price !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="text-sm font-semibold text-green-600">
                {formatPrice(data.price)}
              </div>
            </div>
          </div>
        )}

        {data.photoCount !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
            <div>
              <div className="text-xs text-muted-foreground">Photos</div>
              <div className="text-sm font-semibold">{data.photoCount}</div>
            </div>
          </div>
        )}

        {data.categoryId && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <Tag className="h-3.5 w-3.5 text-purple-600" />
            <div>
              <div className="text-xs text-muted-foreground">Category</div>
              <div className="text-sm font-medium truncate">{data.categoryId}</div>
            </div>
          </div>
        )}

        {data.attributeCount !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <FileText className="h-3.5 w-3.5 text-amber-600" />
            <div>
              <div className="text-xs text-muted-foreground">Attributes</div>
              <div className="text-sm font-semibold">{data.attributeCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      {data.validation && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Validation</div>
          <div className="flex flex-wrap gap-1.5">
            <ValidationBadge valid={data.validation.titleValid} label="Title" />
            <ValidationBadge valid={data.validation.descriptionValid} label="Description" />
            <ValidationBadge valid={data.validation.categoryValid} label="Category" />
            <ValidationBadge valid={data.validation.priceSet} label="Price" />
            <ValidationBadge valid={data.validation.photosValid} label="Photos" />
            <ValidationBadge valid={data.validation.attributesComplete} label="Attributes" />
          </div>
        </div>
      )}

      {/* Missing Required Fields */}
      {data.missingRequired && data.missingRequired.length > 0 && (
        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-900">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
            Missing Required Fields
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            {data.missingRequired.slice(0, 5).join(', ')}
            {data.missingRequired.length > 5 && ` +${data.missingRequired.length - 5} more`}
          </p>
        </div>
      )}

      {/* Status Reason */}
      {data.statusReason && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
          {data.statusReason}
        </div>
      )}

      {/* Marketplace Badge */}
      {data.marketplace && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Target Marketplace:</span>
          <Badge variant="outline" className="text-[10px] uppercase">
            {data.marketplace}
          </Badge>
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

function ValidationBadge({ valid, label }: { valid: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 ${
        valid
          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400'
          : 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
      }`}
    >
      {valid ? (
        <CheckCircle2 className="h-2.5 w-2.5" />
      ) : (
        <AlertCircle className="h-2.5 w-2.5" />
      )}
      {label}
    </Badge>
  );
}





