import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { RootState } from '@/store/store';
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
  Card,
  CardContent,
  Button,
} from '@listforge/ui';
import { Inbox, Keyboard, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { showSuccess, showError, showInfo } from '@/utils/toast';
import { cn } from '@listforge/ui';

export const Route = createFileRoute('/_authenticated/review/')({
  component: ReviewPage,
  beforeLoad: ({ context }) => {
    // Review queue is team-only feature
    const state = (context as any).store?.getState() as RootState | undefined;
    const currentOrg = state?.auth?.currentOrg;

    if (currentOrg?.type === 'personal') {
      throw redirect({
        to: '/',
        search: {},
      });
    }
  },
});

function ReviewPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showQueue, setShowQueue] = useState(false);

  // Get current user
  useMeQuery();

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    if (isMobile) {
      setShowQueue(false);
    }
  }, [isMobile]);

  // Track if currently applying to prevent double-actions
  const isApplyingRef = useRef(false);
  useEffect(() => {
    isApplyingRef.current = isApplying;
  }, [isApplying]);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isApplyingRef.current && selectedItemId && isMobile) {
        setSwipeDirection('left');
        setTimeout(() => {
          handleAction('reject');
          setSwipeDirection(null);
        }, 150);
      }
    },
    onSwipedRight: () => {
      if (!isApplyingRef.current && selectedItemId && isMobile) {
        setSwipeDirection('right');
        setTimeout(() => {
          handleAction('approve');
          setSwipeDirection(null);
        }, 150);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50,
  });

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    if (isMobile) return;

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
  }, [selectedItemId, handleAction, isMobile]);

  // Mobile view
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Mobile Header */}
        <Card className="rounded-none border-x-0 border-t-0">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Review</h1>
                <p className="text-xs text-muted-foreground">
                  {queueData?.total ?? 0} items
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQueue(true)}
              >
                Queue ({queueData?.items.length ?? 0})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Queue Overlay */}
        {showQueue && (
          <div className="fixed inset-0 z-50 bg-background">
            <Card className="rounded-none border-x-0 border-t-0">
              <CardContent className="px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Review Queue</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQueue(false)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Main Content - Swipeable Card */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {isLoadingItem ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : itemData?.item ? (
            <>
              {/* Swipe Container */}
              <div
                {...swipeHandlers}
                className={cn(
                  "flex-1 overflow-y-auto transition-transform duration-150",
                  swipeDirection === 'left' && 'translate-x-[-20px] opacity-70',
                  swipeDirection === 'right' && 'translate-x-[20px] opacity-70'
                )}
              >
                <div className="p-4">
                  <ListingCard
                    draft={itemData.item}
                    onRerunAi={() => {}}
                    isRerunningAi={false}
                    onUpdate={() => Promise.resolve()}
                  />
                </div>
              </div>

              {/* Mobile Action Buttons - Fixed Bottom */}
              <div className="border-t bg-background p-4 safe-bottom">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => handleAction('reject')}
                    disabled={isApplying}
                    className="flex-1 h-14 text-base gap-2"
                  >
                    <ThumbsDown className="h-5 w-5" />
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => handleAction('approve')}
                    disabled={isApplying}
                    className="flex-1 h-14 text-base gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="h-5 w-5" />
                    Approve
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ChevronLeft className="h-3 w-3" />
                    Swipe left to reject
                  </span>
                  <span className="flex items-center gap-1">
                    Swipe right to approve
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>

              {/* Swipe Indicators */}
              {swipeDirection && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={cn(
                      "text-6xl font-bold p-8 rounded-2xl border-4",
                      swipeDirection === 'left'
                        ? "text-red-500 border-red-500 bg-red-500/10"
                        : "text-green-500 border-green-500 bg-green-500/10"
                    )}
                  >
                    {swipeDirection === 'left' ? '✗' : '✓'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <Inbox className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-center">No item selected</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowQueue(true)}
              >
                View Queue
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop view (existing layout)
  return (
    <div className="h-full flex flex-col">
      {/* Header with keyboard shortcuts */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Review Deck</h1>
              <p className="text-sm text-muted-foreground">
                {queueData?.total ?? 0} AI-captured items awaiting review
              </p>
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
        </CardContent>
      </Card>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
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
