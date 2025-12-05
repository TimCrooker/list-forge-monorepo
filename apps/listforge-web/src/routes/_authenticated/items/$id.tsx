import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  useGetItemQuery,
  useDeleteItemMutation,
  useListMarketplaceAccountsQuery,
  usePublishMetaListingMutation,
  useGetMarketplaceListingsQuery,
} from '@listforge/api-rtk';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  MediaGallery,
  Checkbox,
  Label,
  type MediaItem,
} from '@listforge/ui';
import { ArrowLeft, Loader2, Edit, Trash2, ExternalLink, CheckCircle2, XCircle, Clock, Store, RefreshCw } from 'lucide-react';
import AiStatusBadge from '@/components/AiStatusBadge';
import { showSuccess } from '@/utils/toast';
import type { MarketplaceType, MarketplaceAccountDto } from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/items/$id')({
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: itemResponse, isLoading, error, refetch } = useGetItemQuery(id);
  const item = itemResponse?.item;
  const [deleteItem] = useDeleteItemMutation();
  const { data: accountsData } = useListMarketplaceAccountsQuery();
  const [publishListing] = usePublishMetaListingMutation();

  const metaListing = item?.metaListing;
  const isProcessing =
    metaListing?.aiStatus === 'pending' || metaListing?.aiStatus === 'in_progress';

  const { data: listingsData, refetch: refetchListings } = useGetMarketplaceListingsQuery(
    metaListing?.id || '',
    { skip: !metaListing?.id }
  );

  // Polling while AI is processing
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing, refetch]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem(id).unwrap();
      navigate({ to: '/items' });
    } catch (err) {
      // Error toast shown automatically
    }
  };

  // Track selected marketplaces for publishing
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);

  // Group accounts by marketplace
  const accountsByMarketplace = useMemo(() => {
    const groups: Record<MarketplaceType, MarketplaceAccountDto[]> = {
      EBAY: [],
      AMAZON: [],
    };
    accountsData?.accounts?.forEach((acc) => {
      if (acc.status === 'active') {
        groups[acc.marketplace as MarketplaceType]?.push(acc);
      }
    });
    return groups;
  }, [accountsData?.accounts]);

  const toggleMarketplace = (marketplace: MarketplaceType) => {
    setSelectedMarketplaces((prev) => {
      const next = new Set(prev);
      if (next.has(marketplace)) {
        next.delete(marketplace);
      } else {
        next.add(marketplace);
      }
      return next;
    });
  };

  const handlePublish = async () => {
    if (!metaListing) return;

    // Get all active accounts for selected marketplaces
    const accountIds: string[] = [];
    selectedMarketplaces.forEach((marketplace) => {
      const accounts = accountsByMarketplace[marketplace as MarketplaceType] || [];
      accounts.forEach((acc) => accountIds.push(acc.id));
    });

    if (accountIds.length === 0) return;

    setIsPublishing(true);
    try {
      await publishListing({
        metaListingId: metaListing.id,
        data: { accountIds },
      }).unwrap();
      refetchListings();
      showSuccess(`Listing published to ${selectedMarketplaces.size} marketplace(s)!`);
      setSelectedMarketplaces(new Set());
    } catch (err) {
      // Error toast shown automatically
    } finally {
      setIsPublishing(false);
    }
  };

  const getMarketplaceName = (marketplace: string) => {
    switch (marketplace) {
      case 'EBAY':
        return 'eBay';
      case 'AMAZON':
        return 'Amazon';
      default:
        return marketplace;
    }
  };

  const getMarketplaceFromAccountId = (accountId: string): string => {
    const account = accountsData?.accounts?.find((acc) => acc.id === accountId);
    return account?.marketplace || 'UNKNOWN';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  // Transform photos to MediaItem format
  const mediaItems: MediaItem[] = useMemo(() => {
    if (!item?.photos) return [];
    return item.photos.map((photo) => ({
      id: photo.id,
      url: photo.storagePath,
      type: 'image' as const,
      title: photo.isPrimary ? 'Primary Photo' : undefined,
    }));
  }, [item?.photos]);

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
            Back to Inventory
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
              Back to Inventory
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {item.title || 'Untitled Item'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="capitalize">
                {item.status}
              </Badge>
              {metaListing && <AiStatusBadge status={metaListing.aiStatus} />}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {isProcessing && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  AI is processing your photos...
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This may take a minute. The page will update automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            {mediaItems.length === 0 ? (
              <p className="text-muted-foreground">No photos</p>
            ) : (
              <MediaGallery
                items={mediaItems}
                view="grid"
                columns={2}
                aspectRatio={1}
                showControls={false}
              />
            )}
          </CardContent>
        </Card>

            {/* Meta Listing */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Listing</CardTitle>
              </CardHeader>
              <CardContent>
                {!metaListing ? (
                  <p className="text-muted-foreground">No meta listing yet</p>
                ) : (
                  <div className="space-y-4">
                    {metaListing.generatedTitle && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Title</h3>
                        <p className="text-lg font-semibold">{metaListing.generatedTitle}</p>
                      </div>
                    )}

                    {(metaListing.brand || metaListing.model || metaListing.category) && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Details</h3>
                        <div className="space-y-1 text-sm">
                          {metaListing.category && (
                            <p>
                              <span className="font-medium">Category:</span>{' '}
                              {metaListing.category}
                            </p>
                          )}
                          {metaListing.brand && (
                            <p>
                              <span className="font-medium">Brand:</span>{' '}
                              {metaListing.brand}
                            </p>
                          )}
                          {metaListing.model && (
                            <p>
                              <span className="font-medium">Model:</span>{' '}
                              {metaListing.model}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {metaListing.priceSuggested && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Pricing</h3>
                        <p className="text-2xl font-bold">
                          ${metaListing.priceSuggested.toFixed(2)}
                        </p>
                        {(metaListing.priceMin || metaListing.priceMax) && (
                          <p className="text-sm text-muted-foreground">
                            Range: ${metaListing.priceMin?.toFixed(2)} - $
                            {metaListing.priceMax?.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {metaListing.generatedDescription && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Description</h3>
                        <p className="text-sm whitespace-pre-wrap">
                          {metaListing.generatedDescription}
                        </p>
                      </div>
                    )}

                    {metaListing.bulletPoints &&
                      metaListing.bulletPoints.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-1">Key Features</h3>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {metaListing.bulletPoints.map((point: string, index: number) => (
                              <li key={index}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {metaListing.missingFields &&
                      metaListing.missingFields.length > 0 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                          <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                            Missing Fields
                          </h3>
                          <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200">
                            {metaListing.missingFields.map((field: string, index: number) => (
                              <li key={index}>{field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Marketplace Publishing */}
            {metaListing && metaListing.aiStatus === 'complete' && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Marketplace Publishing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {accountsData?.accounts && accountsData.accounts.length === 0 ? (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                          No marketplace accounts connected
                        </p>
                        <Link to="/settings/marketplaces" search={{ code: undefined, state: undefined, spapi_oauth_code: undefined, selling_partner_id: undefined }}>
                          <Button variant="outline" size="sm">
                            Connect Marketplace
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        {/* Marketplace Selection */}
                        <div>
                          <h3 className="text-sm font-medium mb-3">Select Marketplaces to Publish</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* eBay Option */}
                            <div
                              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                accountsByMarketplace.EBAY.length === 0
                                  ? 'opacity-50 cursor-not-allowed'
                                  : selectedMarketplaces.has('EBAY')
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'hover:border-muted-foreground'
                              }`}
                              onClick={() => accountsByMarketplace.EBAY.length > 0 && toggleMarketplace('EBAY')}
                            >
                              <Checkbox
                                checked={selectedMarketplaces.has('EBAY')}
                                disabled={accountsByMarketplace.EBAY.length === 0}
                                onCheckedChange={() => toggleMarketplace('EBAY')}
                              />
                              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <Label className="font-medium cursor-pointer">eBay</Label>
                                <p className="text-xs text-muted-foreground">
                                  {accountsByMarketplace.EBAY.length > 0
                                    ? `${accountsByMarketplace.EBAY.length} account(s) connected`
                                    : 'No accounts connected'}
                                </p>
                              </div>
                            </div>

                            {/* Amazon Option */}
                            <div
                              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                accountsByMarketplace.AMAZON.length === 0
                                  ? 'opacity-50 cursor-not-allowed'
                                  : selectedMarketplaces.has('AMAZON')
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                                    : 'hover:border-muted-foreground'
                              }`}
                              onClick={() => accountsByMarketplace.AMAZON.length > 0 && toggleMarketplace('AMAZON')}
                            >
                              <Checkbox
                                checked={selectedMarketplaces.has('AMAZON')}
                                disabled={accountsByMarketplace.AMAZON.length === 0}
                                onCheckedChange={() => toggleMarketplace('AMAZON')}
                              />
                              <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <Store className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="flex-1">
                                <Label className="font-medium cursor-pointer">Amazon</Label>
                                <p className="text-xs text-muted-foreground">
                                  {accountsByMarketplace.AMAZON.length > 0
                                    ? `${accountsByMarketplace.AMAZON.length} account(s) connected`
                                    : 'No accounts connected'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={handlePublish}
                            disabled={selectedMarketplaces.size === 0 || isPublishing}
                            className="mt-4"
                          >
                            {isPublishing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                                Publish to {selectedMarketplaces.size || 'Selected'} Marketplace{selectedMarketplaces.size !== 1 ? 's' : ''}
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Published Listings */}
                        {listingsData?.listings && listingsData.listings.length > 0 && (
                          <div className="border-t pt-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-medium">Published Listings</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetchListings()}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Refresh Status
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {listingsData.listings.map((listing) => {
                                const marketplace = getMarketplaceFromAccountId(listing.marketplaceAccountId);
                                return (
                                <div
                                  key={listing.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(listing.status)}
                                    <div>
                                      <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {getMarketplaceName(marketplace)}
                                          </Badge>
                                        <span className="font-medium capitalize">
                                          {listing.status}
                                        </span>
                                        {listing.remoteListingId && (
                                          <span className="text-xs text-muted-foreground">
                                            ID: {listing.remoteListingId}
                                          </span>
                                        )}
                                      </div>
                                      {listing.url && (
                                        <a
                                          href={listing.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            View on {getMarketplaceName(marketplace)}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                      {listing.errorMessage && (
                                        <p className="text-xs text-destructive mt-1">
                                          {listing.errorMessage}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {listing.price && (
                                    <span className="font-medium">
                                      ${listing.price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
    </div>
  );
}

