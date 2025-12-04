import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
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
  type MediaItem,
} from '@listforge/ui';
import { ArrowLeft, Loader2, Edit, Trash2, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import AiStatusBadge from '@/components/AiStatusBadge';
import { showSuccess } from '@/utils/toast';

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

  const handlePublish = async () => {
    if (!metaListing) return;
    const activeAccounts = accountsData?.accounts?.filter(
      (acc) => acc.status === 'active' && acc.marketplace === 'EBAY'
    );
    if (!activeAccounts?.length) return;

    try {
      await publishListing({
        metaListingId: metaListing.id,
        data: { accountIds: activeAccounts.map((acc) => acc.id) },
      }).unwrap();
      refetchListings();
      showSuccess('Listing published successfully!');
    } catch (err) {
      // Error toast shown automatically
    }
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
                  <div className="space-y-4">
                    {accountsData?.accounts && accountsData.accounts.length === 0 ? (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                          No marketplace accounts connected
                        </p>
                        <Link to="/settings/marketplaces" search={{ code: undefined, state: undefined }}>
                          <Button variant="outline" size="sm">
                            Connect Marketplace
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Publish this listing to your connected marketplace accounts
                          </p>
                          <Button
                            onClick={handlePublish}
                            disabled={
                              !accountsData?.accounts?.some(
                                (acc) => acc.status === 'active' && acc.marketplace === 'EBAY'
                              )
                            }
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Publish to eBay
                          </Button>
                        </div>

                        {listingsData?.listings && listingsData.listings.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-sm font-medium mb-3">Published Listings</h3>
                            <div className="space-y-2">
                              {listingsData.listings.map((listing) => (
                                <div
                                  key={listing.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(listing.status)}
                                    <div>
                                      <div className="flex items-center gap-2">
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
                                          View on eBay
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
                              ))}
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

