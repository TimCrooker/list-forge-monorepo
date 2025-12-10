import { useGetLatestResearchQuery, useGetResearchRunQuery, useGetItemQuery, useUpdateItemMutation, useResearchProgress, useResearchActivityFeed } from '@listforge/api-rtk';
import {
  Card,
  CardContent,
  Button,
  Badge,
  LoadingButton,
  EmptyState,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';
import { FlaskConical, RefreshCw, Clock, Tag, Store } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { PriceBandsCard } from './PriceBandsCard';
import { DemandSignalsCard } from './DemandSignalsCard';
import { MissingInfoCard } from './MissingInfoCard';
import { ResearchChecklist } from './ResearchChecklist';
import { ResearchActivityFeed } from './ResearchActivityFeed';
import { ResearchPanelSkeleton } from './ResearchPanelSkeleton';
import { ResearchControlButtons } from './ResearchControlButtons';
import { ResearchRunStatusBadge } from './ResearchRunStatusBadge';
import { ComponentErrorBoundary } from '../common/ComponentErrorBoundary';
// Slice 4: Marketplace Schema Awareness
import { CategoryPathCard } from './CategoryPathCard';
import { FieldRequirementsCard } from './FieldRequirementsCard';
import { ListingReadinessCard } from './ListingReadinessCard';
// Slice 5: Pricing Strategies
import { PricingStrategySelector } from './PricingStrategySelector';
// Slice 6: Full Listing Assembly
import { ListingPreview } from './ListingPreview';
import type { PricingStrategyOption } from '@listforge/core-types';

interface ResearchPanelProps {
  itemId: string;
  onTriggerResearch?: () => void;
  isResearchRunning?: boolean;
  activeRunId?: string | null;
  onResearchComplete?: () => void;
  onPriceUpdated?: () => void; // Slice 5: Callback when price strategy is applied
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
  onPriceUpdated, // Slice 5
}: ResearchPanelProps) {
  const {
    data: researchResponse,
    isLoading,
    refetch,
    isFetching,
  } = useGetLatestResearchQuery(itemId);

  // Slice 5: Get current item to know selected pricing strategy
  const { data: itemResponse } = useGetItemQuery(itemId);
  const [updateItem, { isLoading: isUpdatingPrice }] = useUpdateItemMutation();

  // Use WebSocket-based progress tracking (old system for backward compatibility)
  const progress = useResearchProgress(activeRunId ?? null);

  // Use new activity feed system
  const { operationEvents, checklistStatus } = useResearchActivityFeed(activeRunId ?? null);

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

  // Slice 5: Handle pricing strategy selection
  const handleSelectStrategy = async (strategy: PricingStrategyOption) => {
    try {
      await updateItem({
        id: itemId,
        data: {
          defaultPrice: strategy.price,
          pricingStrategy: strategy.strategy,
        },
      }).unwrap();

      const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: strategy.currency,
      }).format(strategy.price);
      showSuccess('Price Updated', `Applied ${strategy.label} pricing: ${formattedPrice}`);

      onPriceUpdated?.();
    } catch (error) {
      showError('Failed to update price', error instanceof Error ? error.message : 'An error occurred');
    }
  };

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
      <ComponentErrorBoundary context="research">
        <div className="flex gap-4 h-full min-h-0 w-full overflow-hidden">
          {/* Left sidebar - Checklist */}
          <ResearchChecklist steps={checklistStatus} className="w-56 shrink-0" />

          {/* Right panel - Activity Feed */}
          <Card className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
              <div className="p-4 border-b shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Research Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Live stream of research activities
                  </p>
                </div>
                {activeRunId && runStatus && (
                  <div className="flex items-center gap-2">
                    <ResearchRunStatusBadge status={runStatus.status} size="sm" />
                    <ResearchControlButtons
                      researchRunId={activeRunId}
                      status={runStatus.status}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 min-w-0 h-full overflow-hidden">
                <ResearchActivityFeed
                  operationEvents={operationEvents}
                  isLive={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentErrorBoundary>
    );
  }

  // Show error state if research failed
  if (activeRunId && (progress.status === 'error' || runStatus?.status === 'error')) {
    const errorMessage = progress.error || runStatus?.errorMessage || 'An error occurred during research';
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-destructive">Research Failed</h3>
              {runStatus && (
                <>
                  <ResearchRunStatusBadge status={runStatus.status} size="sm" />
                  <ResearchControlButtons
                    researchRunId={activeRunId}
                    status={runStatus.status}
                  />
                </>
              )}
            </div>
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

  // Show paused state
  if (activeRunId && runStatus?.status === 'paused') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">Research Paused</h3>
              <ResearchRunStatusBadge status="paused" size="sm" />
              <ResearchControlButtons
                researchRunId={activeRunId}
                status="paused"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Research has been paused. You can resume it when ready.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show cancelled state
  if (activeRunId && runStatus?.status === 'cancelled') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">Research Cancelled</h3>
              <ResearchRunStatusBadge status="cancelled" size="sm" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This research run was cancelled.
            </p>
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
          <EmptyState
            icon={FlaskConical}
            title="No Research Yet"
            description="Run AI research to get pricing recommendations, market demand signals, and identify information that could improve listing accuracy."
            size="lg"
            action={
              onTriggerResearch && (
                <LoadingButton
                  onClick={onTriggerResearch}
                  isLoading={isResearchRunning}
                  loadingText="Running Research..."
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Run Research
                </LoadingButton>
              )
            }
          />
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
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={onTriggerResearch}
              isLoading={isResearchRunning}
              loadingText="Running..."
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Re-run Research
            </LoadingButton>
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

      {/* Slice 4: Listing Readiness Summary */}
      {(data.marketplaceCategory || data.fieldCompletion) && (
        <ListingReadinessCard
          fieldCompletion={data.fieldCompletion}
          marketplaceCategory={data.marketplaceCategory}
        />
      )}

      {/* Slice 4: Marketplace Category */}
      {data.marketplaceCategory && (
        <CategoryPathCard marketplaceCategory={data.marketplaceCategory} />
      )}

      {/* Slice 4: Field Requirements */}
      {data.fieldCompletion && (
        <FieldRequirementsCard fieldCompletion={data.fieldCompletion} />
      )}

      {/* Price Bands */}
      <PriceBandsCard priceBands={data.priceBands} />

      {/* Slice 5: Pricing Strategy Selector */}
      {data.pricingStrategies && data.pricingStrategies.length > 0 && (
        <PricingStrategySelector
          strategies={data.pricingStrategies}
          selectedStrategy={itemResponse?.item?.pricingStrategy}
          onSelect={handleSelectStrategy}
          disabled={isUpdatingPrice}
        />
      )}

      {/* Slice 6: Listing Preview */}
      {data.listings && data.listings.length > 0 && (
        <ListingPreview
          listing={data.listings[0]}
          onEditTitle={async (newTitle) => {
            try {
              await updateItem({
                id: itemId,
                data: { title: newTitle },
              }).unwrap();
              showSuccess('Title Updated', 'Listing title has been updated');
              refetch();
            } catch (error) {
              showError('Failed to update title', error instanceof Error ? error.message : 'An error occurred');
            }
          }}
          onEditDescription={async (newDescription) => {
            try {
              await updateItem({
                id: itemId,
                data: { description: newDescription },
              }).unwrap();
              showSuccess('Description Updated', 'Listing description has been updated');
              refetch();
            } catch (error) {
              showError('Failed to update description', error instanceof Error ? error.message : 'An error occurred');
            }
          }}
          disabled={isUpdatingPrice}
        />
      )}

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
