import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useGetItemQuery } from '@listforge/api-rtk';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@listforge/ui';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/capture/$id')({
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data, isLoading, error } = useGetItemQuery(id);

  const getStatusBadge = (lifecycleStatus: string, aiReviewState: string) => {
    if (lifecycleStatus === 'ready' && aiReviewState === 'approved') {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Ready
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'rejected') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Needs Work
        </Badge>
      );
    }
    if (lifecycleStatus === 'draft' && aiReviewState === 'pending') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Ready for Review
        </Badge>
      );
    }
    if (lifecycleStatus === 'listed') {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Listed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3 animate-pulse" />
        AI Processing
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/capture' })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data?.item) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/capture' })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Item Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              The item you're looking for doesn't exist or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const item = data.item;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/capture' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {item.title || item.userTitleHint || 'Untitled Item'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(item.lifecycleStatus, item.aiReviewState)}
            {item.defaultPrice && (
              <span className="text-sm text-muted-foreground">
                ${item.defaultPrice.toFixed(2)} {item.currency}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Media Gallery */}
      {item.media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {item.media.map((media, index) => (
                <div
                  key={media.id}
                  className="aspect-square rounded-lg overflow-hidden bg-muted relative"
                >
                  <img
                    src={media.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {media.isPrimary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Hints */}
      {(item.userTitleHint || item.userDescriptionHint || item.userNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.userTitleHint && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  What is this?
                </p>
                <p>{item.userTitleHint}</p>
              </div>
            )}
            {item.userDescriptionHint && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Additional details
                </p>
                <p>{item.userDescriptionHint}</p>
              </div>
            )}
            {item.userNotes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Notes
                </p>
                <p>{item.userNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI-Generated Content */}
      {item.title && (item.lifecycleStatus === 'ready' || item.lifecycleStatus === 'listed' || item.aiReviewState === 'pending') && (
            <Card>
              <CardHeader>
            <CardTitle>{item.source === 'ai_capture' ? 'AI-Generated Listing' : 'Item Details'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
            {item.title && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Title
                    </p>
                <p className="text-lg">{item.title}</p>
                  </div>
                )}
            {item.subtitle && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Subtitle
                    </p>
                <p>{item.subtitle}</p>
                  </div>
                )}
            {item.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                <p className="whitespace-pre-wrap">{item.description}</p>
                  </div>
                )}
            {item.condition && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Condition
                    </p>
                <p>{item.condition}</p>
                  </div>
                )}
            {item.categoryPath && item.categoryPath.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Category
                    </p>
                <p>{item.categoryPath.join(' > ')}</p>
                  </div>
                )}
            {item.attributes && item.attributes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Attributes
                    </p>
                    <div className="space-y-1">
                  {item.attributes.map((attr, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-medium">{attr.key}:</span>
                          <span>{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
      )}

      {/* AI Processing Status */}
      {item.lifecycleStatus === 'draft' && item.aiReviewState === 'pending' && !item.title && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>AI is processing this item. Check back soon!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {item.aiLastRunError && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Processing Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{item.aiLastRunError}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
