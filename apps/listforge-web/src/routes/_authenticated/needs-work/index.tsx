import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import {
  useGetNeedsWorkQueueQuery,
  useGetItemQuery,
  useUpdateItemMutation,
  useMarkItemReadyMutation,
} from '@listforge/api-rtk';
import {
  Skeleton,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Label,
  MediaGallery,
  type MediaItem,
} from '@listforge/ui';
import { Inbox, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { EvidencePanel } from '@/components/review/EvidencePanel';
import { useOrgFeatures } from '@/hooks';
import type { UpdateItemRequest } from '@listforge/api-types';
import { useMemo } from 'react';

export const Route = createFileRoute('/_authenticated/needs-work/')({
  component: NeedsWorkPage,
});

function NeedsWorkPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { itemsLabel } = useOrgFeatures();

  // Fetch needs work queue
  const {
    data: queueData,
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useGetNeedsWorkQueueQuery({
    page: 1,
    pageSize: 50,
  });

  // Fetch selected item details
  const { data: itemData, isLoading: isLoadingItem } = useGetItemQuery(
    selectedItemId!,
    { skip: !selectedItemId }
  );

  // Update item mutation
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();

  // Mark ready mutation
  const [markReady, { isLoading: isMarkingReady }] = useMarkItemReadyMutation();

  // Auto-select first item if none selected
  useEffect(() => {
    if (queueData?.items && queueData.items.length > 0 && !selectedItemId) {
      setSelectedItemId(queueData.items[0].id);
    }
  }, [queueData, selectedItemId]);

  // Handle item selection
  const handleSelectItem = useCallback((id: string) => {
    setSelectedItemId(id);
  }, []);

  // Handle mark ready
  const handleMarkReady = useCallback(async () => {
    if (!selectedItemId) return;

    try {
      await markReady(selectedItemId).unwrap();
      showSuccess(`Item marked as ready and moved to ${itemsLabel.toLowerCase()}`);

      // Refetch queue and advance to next item
      await refetchQueue();

      // Find next item
      const currentIndex = queueData?.items.findIndex(
        (item) => item.id === selectedItemId
      );
      if (currentIndex !== undefined && queueData?.items) {
        const nextItem = queueData.items[currentIndex + 1] || queueData.items[0];
        if (nextItem && nextItem.id !== selectedItemId) {
          setSelectedItemId(nextItem.id);
        } else {
          setSelectedItemId(null);
        }
      }
    } catch (error) {
      showError('Failed to mark item as ready');
    }
  }, [selectedItemId, markReady, refetchQueue, queueData, itemsLabel]);

  // Handle field updates
  const handleUpdate = useCallback(
    async (field: keyof UpdateItemRequest, value: any) => {
      if (!selectedItemId) return;

      try {
        await updateItem({
          id: selectedItemId,
          data: { [field]: value },
        }).unwrap();
        showSuccess('Saved');
      } catch (error) {
        showError('Failed to save changes');
      }
    },
    [selectedItemId, updateItem]
  );

  const item = itemData?.item;

  const mediaItems: MediaItem[] = useMemo(() => {
    if (!item?.media) return [];
    return item.media.map((media) => ({
      id: media.id,
      url: media.url,
      type: 'image' as const,
      title: media.isPrimary ? 'Primary' : undefined,
    }));
  }, [item?.media]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Needs Work
          </h1>
          <p className="text-sm text-muted-foreground">
            {queueData?.total ?? 0} items requiring human intervention
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Item List (30%) */}
        <div className="w-[30%] min-w-[320px] border-r overflow-y-auto bg-muted/30">
          {isLoadingQueue ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : queueData?.items && queueData.items.length > 0 ? (
            <div className="p-3 space-y-2">
              {queueData.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedItemId === item.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex gap-3">
                    {item.primaryImageUrl && (
                      <img
                        src={item.primaryImageUrl}
                        alt={item.title || 'Item'}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                        {item.defaultPrice && (
                          <span className="text-sm text-muted-foreground">
                            ${item.defaultPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <Inbox className="h-12 w-12 mb-4" />
              <p className="text-center">No items need work</p>
              <p className="text-sm text-center mt-1">
                All rejected items have been fixed
              </p>
            </div>
          )}
        </div>

        {/* Right: Item Details & Edit Form (70%) */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingItem ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : item ? (
            <div className="p-6">
              {/* Status Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      AI Review Failed
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      This item was rejected during AI review. Please review the details below,
                      make necessary corrections, and mark it as ready when complete.
                    </p>
                    {item.reviewComment && (
                      <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Reviewer Comment:
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                          {item.reviewComment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Photos */}
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

                  {/* Edit Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Item Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={item.title || ''}
                          onChange={(e) => handleUpdate('title', e.target.value)}
                          placeholder="Enter item title"
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={item.description || ''}
                          onChange={(e) => handleUpdate('description', e.target.value)}
                          placeholder="Enter item description"
                          rows={6}
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Condition */}
                      <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <Input
                          id="condition"
                          value={item.condition || ''}
                          onChange={(e) => handleUpdate('condition', e.target.value)}
                          placeholder="e.g., used_good, new"
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="defaultPrice">Price</Label>
                          <Input
                            id="defaultPrice"
                            type="number"
                            step="0.01"
                            value={item.defaultPrice || ''}
                            onChange={(e) =>
                              handleUpdate('defaultPrice', parseFloat(e.target.value) || null)
                            }
                            placeholder="0.00"
                            disabled={isUpdating}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdate('quantity', parseInt(e.target.value) || 1)
                            }
                            min="1"
                            disabled={isUpdating}
                          />
                        </div>
                      </div>

                      {/* Category */}
                      {item.categoryPath && (
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <p className="text-sm text-muted-foreground">
                            {item.categoryPath.join(' > ')}
                          </p>
                        </div>
                      )}

                      {/* User Notes */}
                      {item.userNotes && (
                        <div className="space-y-2">
                          <Label>Original Notes</Label>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            {item.userNotes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Mark Ready Button */}
                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      onClick={handleMarkReady}
                      disabled={isMarkingReady}
                      className="gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      {isMarkingReady ? 'Marking Ready...' : `Mark Ready for ${itemsLabel}`}
                    </Button>
                  </div>
                </div>

                {/* Evidence Panel (1 column) */}
                <div className="lg:col-span-1">
                  <EvidencePanel
                    itemId={selectedItemId}
                    item={item || null}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>Select an item from the list to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
