import { cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@listforge/ui';
import { Badge } from '@listforge/ui';
import { Clock, CheckCircle, AlertCircle, Sparkles, ThumbsUp, Eye } from 'lucide-react';
import type { ItemSummaryDto } from '@listforge/api-types';
import { useCallback } from 'react';

interface ReviewQueueProps {
  items: ItemSummaryDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReviewQueue({ items, selectedId, onSelect }: ReviewQueueProps) {
  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === 'ArrowDown' && currentIndex < items.length - 1) {
        e.preventDefault();
        onSelect(items[currentIndex + 1].id);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        onSelect(items[currentIndex - 1].id);
      }
    },
    [items, onSelect]
  );

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

  const itemTitle = (item: ItemSummaryDto) => item.title || 'Untitled Item';

  return (
    <TooltipProvider delayDuration={500}>
      <div className="divide-y" role="listbox" aria-label="Review queue items">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="option"
            aria-selected={selectedId === item.id}
            aria-label={`${itemTitle(item)}${item.defaultPrice ? `, $${item.defaultPrice.toFixed(2)}` : ''}`}
            className={cn(
              'w-full text-left p-3 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
              selectedId === item.id && 'bg-muted border-l-2 border-l-primary'
            )}
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {item.primaryImageUrl ? (
                  <img
                    src={item.primaryImageUrl}
                    alt={`Thumbnail for ${itemTitle(item)}`}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-medium text-sm truncate">
                      {itemTitle(item)}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{itemTitle(item)}</p>
                  </TooltipContent>
                </Tooltip>
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
    </TooltipProvider>
  );
}
