import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useGetListingDraftQuery } from '@listforge/api-rtk';
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
  component: ListingDraftDetailPage,
});

function ListingDraftDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data, isLoading, error } = useGetListingDraftQuery(id);

  const getStatusBadge = (ingestionStatus: string, reviewStatus: string) => {
    if (ingestionStatus === 'ai_error') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }
    if (ingestionStatus === 'ai_complete') {
      if (reviewStatus === 'approved' || reviewStatus === 'auto_approved') {
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Ready
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Ready for Review
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

  if (error || !data?.draft) {
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
          <h1 className="text-2xl font-bold">Draft Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              The listing draft you're looking for doesn't exist or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const draft = data.draft;

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
            {draft.title || draft.userTitleHint || 'Untitled Item'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(draft.ingestionStatus, draft.reviewStatus)}
            {draft.suggestedPrice && (
              <span className="text-sm text-muted-foreground">
                ${draft.suggestedPrice.toFixed(2)} {draft.currency}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Media Gallery */}
      {draft.media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {draft.media.map((media, index) => (
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
      {(draft.userTitleHint || draft.userDescriptionHint || draft.userNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {draft.userTitleHint && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  What is this?
                </p>
                <p>{draft.userTitleHint}</p>
              </div>
            )}
            {draft.userDescriptionHint && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Additional details
                </p>
                <p>{draft.userDescriptionHint}</p>
              </div>
            )}
            {draft.userNotes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Notes
                </p>
                <p>{draft.userNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI-Generated Content */}
      {draft.ingestionStatus === 'ai_complete' && (
        <>
          {draft.title && (
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {draft.title && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Title
                    </p>
                    <p className="text-lg">{draft.title}</p>
                  </div>
                )}
                {draft.subtitle && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Subtitle
                    </p>
                    <p>{draft.subtitle}</p>
                  </div>
                )}
                {draft.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="whitespace-pre-wrap">{draft.description}</p>
                  </div>
                )}
                {draft.condition && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Condition
                    </p>
                    <p>{draft.condition}</p>
                  </div>
                )}
                {draft.categoryPath && draft.categoryPath.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Category
                    </p>
                    <p>{draft.categoryPath.join(' > ')}</p>
                  </div>
                )}
                {draft.attributes && draft.attributes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Attributes
                    </p>
                    <div className="space-y-1">
                      {draft.attributes.map((attr, idx) => (
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
        </>
      )}

      {/* AI Processing Status */}
      {draft.ingestionStatus !== 'ai_complete' && draft.ingestionStatus !== 'ai_error' && (
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
      {draft.ingestionStatus === 'ai_error' && draft.aiErrorMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Processing Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{draft.aiErrorMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
