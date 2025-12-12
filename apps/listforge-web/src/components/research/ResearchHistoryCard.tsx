import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useGetResearchHistoryQuery } from '@listforge/api-rtk';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
} from '@listforge/ui';
import {
  History,
  ChevronDown,
  ChevronRight,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import type { ItemResearchDto } from '@listforge/api-types';
import type { PriceBand } from '@listforge/core-types';

interface ResearchHistoryCardProps {
  itemId: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function ResearchHistoryItem({
  research,
  itemId,
  isExpanded,
  onToggle,
}: {
  research: ItemResearchDto;
  itemId: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const data = research.data;
  const productId = data?.productId;
  const priceBands = data?.priceBands || [];

  // Helper to find price band by label
  const getPriceBand = (label: PriceBand['label']) =>
    priceBands.find((band) => band.label === label);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {research.isCurrent ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {productId?.brand && productId?.model
                    ? `${productId.brand} ${productId.model}`
                    : productId?.brand || 'Research Result'}
                </span>
                {research.isCurrent && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(research.createdAt)} - {formatDate(research.createdAt)}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 border rounded-lg mt-2 bg-muted/30 space-y-4">
          {/* Product Identification */}
          {productId && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Product Identification
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {productId.brand && (
                  <div>
                    <span className="text-muted-foreground">Brand:</span>{' '}
                    <span className="font-medium">{productId.brand}</span>
                  </div>
                )}
                {productId.model && (
                  <div>
                    <span className="text-muted-foreground">Model:</span>{' '}
                    <span className="font-medium">{productId.model}</span>
                  </div>
                )}
                {productId.mpn && (
                  <div>
                    <span className="text-muted-foreground">MPN:</span>{' '}
                    <span className="font-medium">{productId.mpn}</span>
                  </div>
                )}
                {productId.upc && (
                  <div>
                    <span className="text-muted-foreground">UPC:</span>{' '}
                    <span className="font-medium">{productId.upc}</span>
                  </div>
                )}
              </div>
              {productId.confidence && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(productId.confidence * 100)}% confidence
                </Badge>
              )}
            </div>
          )}

          {/* Pricing Analysis */}
          {priceBands.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Pricing Analysis
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {getPriceBand('floor') && (
                  <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded">
                    <p className="text-xs text-muted-foreground">Floor</p>
                    <p className="font-semibold text-amber-600">
                      ${getPriceBand('floor')!.amount.toFixed(2)}
                    </p>
                  </div>
                )}
                {getPriceBand('target') && (
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="font-semibold text-green-600">
                      ${getPriceBand('target')!.amount.toFixed(2)}
                    </p>
                  </div>
                )}
                {getPriceBand('ceiling') && (
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                    <p className="text-xs text-muted-foreground">Ceiling</p>
                    <p className="font-semibold text-blue-600">
                      ${getPriceBand('ceiling')!.amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Link to full research run */}
          {research.researchRunId && (
            <div className="pt-2 border-t">
              <Link
                to="/items/$id/research/$runId"
                params={{ id: itemId, runId: research.researchRunId }}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View Full Research Details
              </Link>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ResearchHistoryCard({ itemId }: ResearchHistoryCardProps) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 10;

  const { data, isLoading, isFetching, error } = useGetResearchHistoryQuery({
    itemId,
    page,
    pageSize,
  });

  const researches = data?.researches || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Research History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Research History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load research history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Research History
        </CardTitle>
        <CardDescription>
          Past research results for this item ({total} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {researches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No research history available</p>
            <p className="text-sm">Research results will appear here after running research</p>
          </div>
        ) : (
          <>
            {researches.map((research) => (
              <ResearchHistoryItem
                key={research.id}
                research={research}
                itemId={itemId}
                isExpanded={expandedId === research.id}
                onToggle={() => toggleExpand(research.id)}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
