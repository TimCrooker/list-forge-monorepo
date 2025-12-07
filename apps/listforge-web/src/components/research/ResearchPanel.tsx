import { useGetLatestResearchQuery, useGetResearchRunQuery, useResearchProgress } from '@listforge/api-rtk';
import {
  Card,
  CardContent,
  Button,
  Badge,
} from '@listforge/ui';
import { Loader2, FlaskConical, RefreshCw, Clock, Tag, Store } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { PriceBandsCard } from './PriceBandsCard';
import { DemandSignalsCard } from './DemandSignalsCard';
import { MissingInfoCard } from './MissingInfoCard';
import { ResearchProgress } from './ResearchProgress';
import { ResearchPanelSkeleton } from './ResearchPanelSkeleton';
import { ComponentErrorBoundary } from '../common/ComponentErrorBoundary';

interface ResearchPanelProps {
  itemId: string;
  onTriggerResearch?: () => void;
  isResearchRunning?: boolean;
  activeRunId?: string | null;
  onResearchComplete?: () => void;
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

export function ResearchPanel({
  itemId,
  onTriggerResearch,
  isResearchRunning = false,
  activeRunId,
  onResearchComplete,
}: ResearchPanelProps) {
  const {
    data: researchResponse,
    isLoading,
    refetch,
    isFetching,
  } = useGetLatestResearchQuery(itemId);

  // Use WebSocket-based progress tracking
  const progress = useResearchProgress(activeRunId ?? null);

  // Fallback polling: Use RTK Query polling if WebSocket progress hasn't updated in 5 seconds
  // This provides graceful degradation if WebSocket fails
  const lastProgressUpdateRef = useRef<number>(Date.now());
  const shouldPoll = activeRunId && isResearchRunning && progress.status === 'running';

  // Update last progress update time when progress changes
  useEffect(() => {
    if (progress.currentNode || progress.completedNodes.size > 0) {
      lastProgressUpdateRef.current = Date.now();
    }
  }, [progress.currentNode, progress.completedNodes.size]);

  // Check if we should fall back to polling (no updates in 5 seconds)
  const timeSinceLastUpdate = Date.now() - lastProgressUpdateRef.current;
  const usePollingFallback = shouldPoll && timeSinceLastUpdate > 5000;

  const {
    data: runStatusResponse,
  } = useGetResearchRunQuery(activeRunId || '', {
    skip: !activeRunId || !usePollingFallback,
    pollingInterval: usePollingFallback ? 2000 : 0,
  });

  const research = researchResponse?.research;
  const runStatus = runStatusResponse?.researchRun;

  // Check if research completed and refresh data
  useEffect(() => {
    if (progress.status === 'success' && onResearchComplete) {
      onResearchComplete();
      refetch();
    }
  }, [progress.status, onResearchComplete, refetch]);

  // Also check RTK Query status as fallback
  useEffect(() => {
    if (runStatus?.status === 'success' && onResearchComplete) {
      onResearchComplete();
      refetch();
    }
  }, [runStatus?.status, onResearchComplete, refetch]);

  if (isLoading) {
    return (
      <ComponentErrorBoundary context="research">
        <ResearchPanelSkeleton />
      </ComponentErrorBoundary>
    );
  }

  // Show loading/progress state when research is running
  if (isResearchRunning || (activeRunId && (progress.status === 'running' || runStatus?.status === 'running'))) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Research in Progress</h3>
              <p className="text-sm text-muted-foreground">
                Analyzing your item and searching for comparable listings...
              </p>
            </div>
            <ResearchProgress researchRunId={activeRunId ?? null} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if research failed
  if (activeRunId && (progress.status === 'error' || runStatus?.status === 'error')) {
    const errorMessage = progress.error || runStatus?.errorMessage || 'An error occurred during research';
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Research Failed</h3>
            <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
            {onTriggerResearch && (
              <Button onClick={onTriggerResearch}>
                <FlaskConical className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no research yet
  if (!research) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Research Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Run AI research to get pricing recommendations, market demand signals, and
              identify information that could improve listing accuracy.
            </p>
            {onTriggerResearch && (
              <Button onClick={onTriggerResearch} disabled={isResearchRunning}>
                {isResearchRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Research...
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Run Research
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data } = research;

  return (
    <ComponentErrorBoundary context="research">
      <div className="space-y-4" aria-busy={isFetching} aria-label="Research data">
      {/* Research Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Updated {formatTimeAgo(data.generatedAt)}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            v{data.version}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          {onTriggerResearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTriggerResearch}
              disabled={isResearchRunning}
            >
              {isResearchRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Re-run Research
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Product Identification (if available) */}
      {data.productId && data.productId.confidence > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Product Identified</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(data.productId.confidence * 100)}% confidence
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {data.productId.brand && (
                    <span className="text-muted-foreground">
                      Brand: <span className="text-foreground">{data.productId.brand}</span>
                    </span>
                  )}
                  {data.productId.model && (
                    <span className="text-muted-foreground">
                      Model: <span className="text-foreground">{data.productId.model}</span>
                    </span>
                  )}
                  {data.productId.mpn && (
                    <span className="text-muted-foreground">
                      MPN: <span className="text-foreground">{data.productId.mpn}</span>
                    </span>
                  )}
                  {data.productId.upc && (
                    <span className="text-muted-foreground">
                      UPC: <span className="text-foreground">{data.productId.upc}</span>
                    </span>
                  )}
                </div>
                {data.productId.category && data.productId.category.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {data.productId.category.join(' > ')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Bands */}
      <PriceBandsCard priceBands={data.priceBands} />

      {/* Demand Signals */}
      <DemandSignalsCard
        demandSignals={data.demandSignals}
        competitorCount={data.competitorCount}
      />

      {/* Recommended Marketplaces */}
      {data.recommendedMarketplaces.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-sm">Recommended Marketplaces</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.recommendedMarketplaces.map((marketplace) => (
                    <Badge key={marketplace} variant="secondary">
                      {marketplace}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Information */}
      <MissingInfoCard missingInfo={data.missingInfo} />
      </div>
    </ComponentErrorBoundary>
  );
}
