import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  useGetItemQuery,
  useDeleteItemMutation,
  useListMarketplaceAccountsQuery,
  usePublishItemToMarketplacesMutation,
  useGetItemMarketplaceListingsQuery,
  useGetItemResearchRunsQuery,
  useTriggerItemResearchMutation,
  useGetResearchRunEvidenceQuery,
} from '@listforge/api-rtk';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  MediaGallery,
  type MediaItem,
} from '@listforge/ui';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, Store, RefreshCw, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import type { MarketplaceAccountDto } from '@listforge/api-types';
import { ItemChatPanel } from '@/components/chat/ItemChatPanel';

export const Route = createFileRoute('/_authenticated/items/$id')({
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: itemResponse, isLoading, error } = useGetItemQuery(id);
  const item = itemResponse?.item;
  const [deleteItem] = useDeleteItemMutation();
  const { data: accountsData } = useListMarketplaceAccountsQuery();
  const [publishItem, { isLoading: isPublishing }] = usePublishItemToMarketplacesMutation();
  const {
    data: listingsData,
    refetch: refetchListings,
    isFetching: isListingLoading,
  } = useGetItemMarketplaceListingsQuery(id);
  const {
    data: researchData,
    refetch: refetchResearch,
    isFetching: isResearchLoading,
  } = useGetItemResearchRunsQuery(id);
  const [triggerResearch, { isLoading: isTriggeringResearch }] = useTriggerItemResearchMutation();
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const activeAccounts =
    accountsData?.accounts?.filter((acc) => acc.status === 'active') || [];
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this item?')) return;
    await deleteItem(id).unwrap();
    navigate({ to: '/items' });
  };

  const handlePublish = async () => {
    if (selectedAccountIds.size === 0) return;
    await publishItem({
      itemId: id,
      data: { accountIds: Array.from(selectedAccountIds) },
    }).unwrap();
    showSuccess('Publish jobs queued');
    setSelectedAccountIds(new Set());
    refetchListings();
  };

  const handleTriggerResearch = async () => {
    await triggerResearch({ itemId: id }).unwrap();
    showSuccess('Research run triggered');
    refetchResearch();
  };

  const toggleRunExpansion = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const mediaItems: MediaItem[] = useMemo(() => {
    if (!item?.media) return [];
    return item.media.map((media) => ({
      id: media.id,
      url: media.url,
      type: 'image' as const,
      title: media.isPrimary ? 'Primary' : undefined,
    }));
  }, [item?.media]);

  // Check if item can be published (must be ready or listed)
  const canPublish = item?.lifecycleStatus === 'ready' || item?.lifecycleStatus === 'listed';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading item</p>
        <Link to="/items">
          <Button variant="outline" className="mt-4">
            Back to Items
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/items">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Items
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{item.title || item.userTitleHint || 'Untitled Item'}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize">
                {item.lifecycleStatus}
              </Badge>
              <Badge variant="outline" className="capitalize">
                AI: {item.aiReviewState}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {item.source}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              {mediaItems.length === 0 ? (
                <p className="text-muted-foreground">No photos available</p>
              ) : (
                <MediaGallery items={mediaItems} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {item.title || item.userTitleHint || 'No title'}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {item.description || 'No description'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-lg font-semibold">
                    {item.defaultPrice ? `$${item.defaultPrice.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="text-lg font-semibold">
                    {item.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="text-lg font-semibold capitalize">
                    {item.condition ? item.condition.replace(/_/g, ' ') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="text-lg font-semibold">
                    {item.categoryPath ? item.categoryPath.join(' > ') : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {canPublish && (
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose accounts to publish this item. Only active connections are shown.
                </p>

                <div className="space-y-2">
                  {activeAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active marketplace accounts</p>
                  ) : (
                    activeAccounts.map((account: MarketplaceAccountDto) => (
                      <label key={account.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedAccountIds.has(account.id)}
                          onChange={() => toggleAccount(account.id)}
                        />
                        <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          {account.marketplace} ({account.remoteAccountId || account.id})
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <Button
                  disabled={selectedAccountIds.size === 0 || isPublishing}
                  onClick={handlePublish}
                  className="w-full"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Item'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {!canPublish && (
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Item must be in 'ready' or 'listed' status to publish. Current status: {item.lifecycleStatus}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Marketplace Listings</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => refetchListings()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isListingLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading listings...
                </div>
              ) : listingsData?.listings?.length ? (
                listingsData.listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {listing.status === 'listed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {listing.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        {listing.status === 'listing_pending' && <Clock className="h-4 w-4 text-amber-500" />}
                        {listing.status === 'not_listed' && <Clock className="h-4 w-4 text-gray-400" />}
                        <p className="font-medium capitalize">{listing.status.replace(/_/g, ' ')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {listing.marketplace}
                      </p>
                      {listing.url && (
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary inline-flex items-center gap-1"
                        >
                          View listing
                        </a>
                      )}
                    </div>
                    {listing.price && <p className="font-semibold">${listing.price.toFixed(2)}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No marketplace listings yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Research History</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchResearch()}
                  disabled={isResearchLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isResearchLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  onClick={handleTriggerResearch}
                  disabled={isTriggeringResearch}
                >
                  {isTriggeringResearch ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="mr-2 h-4 w-4" />
                      Run Research
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isResearchLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading research runs...
                </div>
              ) : researchData?.researchRuns?.length ? (
                researchData.researchRuns.map((run) => (
                  <ResearchRunCard
                    key={run.id}
                    run={run}
                    isExpanded={expandedRunId === run.id}
                    onToggle={() => toggleRunExpansion(run.id)}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No research runs yet</p>
              )}
            </CardContent>
          </Card>

          <ItemChatPanel itemId={id} itemTitle={item.title} />
        </div>
      </div>
    </div>
  );
}

function ResearchRunCard({
  run,
  isExpanded,
  onToggle,
}: {
  run: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: evidenceData, isFetching } = useGetResearchRunEvidenceQuery(run.id, {
    skip: !isExpanded,
  });

  const statusColorMap: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };
  const statusColor = statusColorMap[run.status] || 'bg-gray-100 text-gray-800';

  const runTypeLabelMap: Record<string, string> = {
    initial_intake: 'Initial Intake',
    pricing_refresh: 'Pricing Refresh',
    manual_request: 'Manual Research',
  };
  const runTypeLabel = runTypeLabelMap[run.runType] || run.runType;

  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {run.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {run.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            {run.status === 'running' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
            {run.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">{runTypeLabel}</span>
              <Badge className={`${statusColor} text-xs`}>
                {run.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(run.startedAt).toLocaleString()}
              {run.completedAt && ` - ${new Date(run.completedAt).toLocaleString()}`}
            </p>
            {run.summary && (
              <p className="text-sm text-muted-foreground mt-1">{run.summary}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t p-3 bg-gray-50">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading evidence...
            </div>
          ) : evidenceData?.evidence ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Evidence ({evidenceData.evidence.items.length} items)</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {evidenceData.evidence.items.map((item: any) => (
                  <div key={item.id} className="text-xs bg-white p-2 rounded border">
                    <span className="font-medium capitalize">{item.type.replace(/_/g, ' ')}</span>
                    {item.data.title && <p className="mt-1">{item.data.title}</p>}
                    {item.data.text && <p className="mt-1 text-muted-foreground">{item.data.text}</p>}
                    {item.data.price && <p className="mt-1">Price: ${item.data.price}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence available</p>
          )}
        </div>
      )}
    </div>
  );
}
