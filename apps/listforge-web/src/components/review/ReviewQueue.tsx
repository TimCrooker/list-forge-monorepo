import { cn } from '@listforge/ui';
import { Badge } from '@listforge/ui';
import { Clock, CheckCircle, AlertCircle, Sparkles, ThumbsUp, Eye } from 'lucide-react';
import type { ItemSummaryDto } from '@listforge/api-types';

interface ReviewQueueProps {
  items: ItemSummaryDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReviewQueue({ items, selectedId, onSelect }: ReviewQueueProps) {
  const getStatusBadge = (lifecycleStatus: string, aiReviewState: string) => {
    if (aiReviewState === 'pending') {
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          Pending Review
        </Badge>
      );
    }
    if (lifecycleStatus === 'ready' && aiReviewState === 'approved') {
      return (
        <Badge variant="default" className="gap-1 text-xs bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Ready
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <AlertCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Clock className="h-3 w-3" />
        Processing
      </Badge>
    );
  };

  const getRecommendationBadge = (recommendation: 'approve' | 'review' | null | undefined) => {
    if (recommendation === 'approve') {
      return (
        <Badge variant="outline" className="gap-1 text-xs border-green-500 text-green-600">
          <ThumbsUp className="h-3 w-3" />
          Spot-Check
        </Badge>
      );
    }
    if (recommendation === 'review') {
      return (
        <Badge variant="outline" className="gap-1 text-xs border-amber-500 text-amber-600">
          <Eye className="h-3 w-3" />
          Full Review
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="divide-y">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            'w-full text-left p-3 hover:bg-muted/50 transition-colors',
            selectedId === item.id && 'bg-muted border-l-2 border-l-primary'
          )}
        >
          <div className="flex gap-3">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {item.primaryImageUrl ? (
                <img
                  src={item.primaryImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {item.title || 'Untitled Item'}
              </p>
              {item.defaultPrice && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  ${item.defaultPrice.toFixed(2)} {item.currency}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {getStatusBadge(item.lifecycleStatus, item.aiReviewState)}
                {getRecommendationBadge(item.reviewRecommendation)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
