import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  useGetItemAiReviewQueueQuery,
  useGetItemQuery,
  useApproveItemMutation,
  useRejectItemMutation,
  useMeQuery,
} from '@listforge/api-rtk';
import { ReviewQueue } from '@/components/review/ReviewQueue';
import { ListingCard } from '@/components/review/ListingCard';
import { ReviewActions } from '@/components/review/ReviewActions';
import { EvidencePanel } from '@/components/review/EvidencePanel';
import {
  Skeleton,
  Badge,
} from '@listforge/ui';
import { Inbox, Keyboard } from 'lucide-react';
import { showSuccess, showError, showInfo } from '@/utils/toast';

export const Route = createFileRoute('/_authenticated/review/')({
  component: ReviewPage,
});

function ReviewPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Get current user
  useMeQuery();

  // Fetch AI review queue (Phase 6)
  const {
    data: queueData,
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useGetItemAiReviewQueueQuery({
    page: 1,
    pageSize: 50,
  });

  // Fetch selected item details
  const { data: itemData, isLoading: isLoadingItem } = useGetItemQuery(
    selectedItemId!,
    { skip: !selectedItemId }
  );

  // Review decision mutations (Phase 6)
  const [approveItem, { isLoading: isApproving }] = useApproveItemMutation();
  const [rejectItem, { isLoading: isRejecting }] = useRejectItemMutation();

  const isApplying = isApproving || isRejecting;

  // Auto-select first item if none selected
  useEffect(() => {
    if (queueData?.items && queueData.items.length > 0 && !selectedItemId) {
      setSelectedItemId(queueData.items[0].id);
    }
  }, [queueData, selectedItemId]);

  // Handle review action
  const handleAction = useCallback(
    async (action: 'approve' | 'reject', comment?: string) => {
      if (!selectedItemId) return;

      try {
        if (action === 'approve') {
          await approveItem(selectedItemId).unwrap();
          showSuccess('Item approved!');
        } else {
          await rejectItem({ id: selectedItemId, comment }).unwrap();
          showSuccess('Item rejected - moved to Needs Work queue');
        }

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
        showError('Failed to apply review decision');
      }
    },
    [selectedItemId, approveItem, rejectItem, refetchQueue, queueData]
  );

  // Handle queue item selection
  const handleSelectItem = useCallback((id: string) => {
    setSelectedItemId(id);
  }, []);

  // Track if currently applying to prevent double-actions
  const isApplyingRef = useRef(false);
  useEffect(() => {
    isApplyingRef.current = isApplying;
  }, [isApplying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Ignore if no item selected or currently applying
      if (!selectedItemId || isApplyingRef.current) return;

      // Approve: A or ArrowRight
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleAction('approve');
        return;
      }

      // Reject: R or ArrowLeft
      if (e.key === 'r' || e.key === 'R' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAction('reject');
        return;
      }

      // Show keyboard shortcuts help: ?
      if (e.key === '?') {
        e.preventDefault();
        showInfo('Keyboard shortcuts: A/→ Approve, R/← Reject');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, handleAction]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI Review Deck</h1>
            <p className="text-sm text-muted-foreground">
              {queueData?.total ?? 0} AI-captured items awaiting review
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts:</span>
          <Badge variant="outline" className="text-xs py-0 px-1.5">A</Badge>
          <span>Approve</span>
          <Badge variant="outline" className="text-xs py-0 px-1.5">R</Badge>
          <span>Reject</span>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Review Queue (25%) */}
        <div className="w-1/4 min-w-[280px] border-r overflow-y-auto bg-muted/30">
          {isLoadingQueue ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : queueData?.items && queueData.items.length > 0 ? (
            <ReviewQueue
              items={queueData.items}
              selectedId={selectedItemId}
              onSelect={handleSelectItem}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <Inbox className="h-12 w-12 mb-4" />
              <p className="text-center">No items in queue</p>
              <p className="text-sm text-center mt-1">
                All AI-captured items have been reviewed
              </p>
            </div>
          )}
        </div>

        {/* Center: Listing Card (50%) */}
        <div className="w-1/2 overflow-y-auto">
          {isLoadingItem ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : itemData?.item ? (
            <div className="p-6">
              <ListingCard
                draft={itemData.item}
                onRerunAi={() => {}}
                isRerunningAi={false}
                onUpdate={() => Promise.resolve()}
              />
              <div className="mt-6">
                <ReviewActions
                  onAction={handleAction}
                  isLoading={isApplying}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>Select an item from the queue to review</p>
            </div>
          )}
        </div>

        {/* Right: Evidence Panel (25%) */}
        <div className="w-1/4 min-w-[280px] border-l overflow-y-auto bg-muted/30">
          <EvidencePanel
            draftId={selectedItemId}
            draft={itemData?.item ?? null}
          />
        </div>
      </div>
    </div>
  );
}
