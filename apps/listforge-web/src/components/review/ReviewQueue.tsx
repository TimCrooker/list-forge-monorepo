import { cn } from '@listforge/ui';
import { Badge } from '@listforge/ui';
import { Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import type { ListingDraftSummaryDto } from '@listforge/api-types';

interface ReviewQueueProps {
  items: ListingDraftSummaryDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReviewQueue({ items, selectedId, onSelect }: ReviewQueueProps) {
  const getStatusBadge = (ingestionStatus: string, reviewStatus: string) => {
    if (ingestionStatus === 'ai_error') {
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }
    if (reviewStatus === 'auto_approved') {
      return (
        <Badge variant="default" className="gap-1 text-xs bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Auto
        </Badge>
      );
    }
    if (reviewStatus === 'needs_review') {
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          Review
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
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
                {item.title || item.userTitleHint || 'Untitled Item'}
              </p>
              {item.suggestedPrice && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  ${item.suggestedPrice.toFixed(2)} {item.currency}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {getStatusBadge(item.ingestionStatus, item.reviewStatus)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
