import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  useGetReviewQueueQuery,
  useGetListingDraftQuery,
  useApplyReviewDecisionMutation,
  useRerunListingDraftAiMutation,
  useUpdateListingDraftMutation,
  useAssignReviewerMutation,
  useMeQuery,
} from '@listforge/api-rtk';
import { ReviewQueue } from '@/components/review/ReviewQueue';
import { ListingCard } from '@/components/review/ListingCard';
import { ReviewActions } from '@/components/review/ReviewActions';
import { EvidencePanel } from '@/components/review/EvidencePanel';
import {
  Skeleton,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@listforge/ui';
import { Inbox, Keyboard, UserPlus, Filter, Check } from 'lucide-react';
import { showSuccess, showError, showInfo } from '@/utils/toast';
import type { ReviewAction, UpdateListingDraftRequest, ReviewQueueFilters } from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/review/')({
  component: ReviewPage,
});

function ReviewPage() {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'mine' | 'unassigned'>('all');

  // Get current user
  const { data: meData } = useMeQuery();
  const currentUserId = meData?.user?.id;

  // Build filters based on assignment filter
  const filters: ReviewQueueFilters | undefined = assignedFilter === 'mine' && currentUserId
    ? { assignedTo: currentUserId }
    : assignedFilter === 'unassigned'
    ? { assignedTo: '' } // Backend can handle empty string as "unassigned"
    : undefined;

  // Fetch review queue
  const {
    data: queueData,
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useGetReviewQueueQuery({
    page: 1,
    pageSize: 50,
    filters,
  });

  // Fetch selected draft details
  const { data: draftData, isLoading: isLoadingDraft } = useGetListingDraftQuery(
    selectedDraftId!,
    { skip: !selectedDraftId }
  );

  // Review decision mutation
  const [applyDecision, { isLoading: isApplying }] = useApplyReviewDecisionMutation();

  // Re-run AI mutation
  const [rerunAi, { isLoading: isRerunningAi }] = useRerunListingDraftAiMutation();

  // Update draft mutation
  const [updateDraft] = useUpdateListingDraftMutation();

  // Assign reviewer mutation
  const [assignReviewer, { isLoading: isAssigning }] = useAssignReviewerMutation();

  // Auto-select first item if none selected
  useEffect(() => {
    if (queueData?.items && queueData.items.length > 0 && !selectedDraftId) {
      setSelectedDraftId(queueData.items[0].id);
    }
  }, [queueData, selectedDraftId]);

  // Handle review action
  const handleAction = useCallback(
    async (action: ReviewAction, comment?: string) => {
      if (!selectedDraftId) return;

      try {
        await applyDecision({
          id: selectedDraftId,
          data: {
            action,
            reviewComment: comment,
          },
        }).unwrap();

        showSuccess(
          action === 'approve'
            ? 'Listing approved!'
            : action === 'reject'
            ? 'Listing rejected'
            : 'Marked for manual review'
        );

        // Refetch queue and advance to next item
        await refetchQueue();

        // Find next item
        const currentIndex = queueData?.items.findIndex(
          (item) => item.id === selectedDraftId
        );
        if (currentIndex !== undefined && queueData?.items) {
          const nextItem = queueData.items[currentIndex + 1] || queueData.items[0];
          if (nextItem && nextItem.id !== selectedDraftId) {
            setSelectedDraftId(nextItem.id);
          } else {
            setSelectedDraftId(null);
          }
        }
      } catch (error) {
        showError('Failed to apply review decision');
      }
    },
    [selectedDraftId, applyDecision, refetchQueue, queueData]
  );

  // Handle queue item selection
  const handleSelectDraft = useCallback((id: string) => {
    setSelectedDraftId(id);
  }, []);

  // Handle re-run AI
  const handleRerunAi = useCallback(async () => {
    if (!selectedDraftId) return;

    try {
      await rerunAi(selectedDraftId).unwrap();
      showSuccess('AI processing started');
    } catch (error) {
      showError('Failed to start AI processing');
    }
  }, [selectedDraftId, rerunAi]);

  // Handle draft update (for inline editing)
  const handleUpdateDraft = useCallback(
    async (data: UpdateListingDraftRequest) => {
      if (!selectedDraftId) return;

      try {
        await updateDraft({ id: selectedDraftId, data }).unwrap();
        showSuccess('Saved');
      } catch (error) {
        showError('Failed to save changes');
        throw error; // Re-throw so InlineEditField knows save failed
      }
    },
    [selectedDraftId, updateDraft]
  );

  // Handle assign to me
  const handleAssignToMe = useCallback(async () => {
    if (!selectedDraftId || !currentUserId) return;

    try {
      await assignReviewer({
        id: selectedDraftId,
        data: { assignedReviewerUserId: currentUserId },
      }).unwrap();
      showSuccess('Assigned to you');
      refetchQueue();
    } catch (error) {
      showError('Failed to assign reviewer');
    }
  }, [selectedDraftId, currentUserId, assignReviewer, refetchQueue]);

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

      // Ignore if no draft selected or currently applying
      if (!selectedDraftId || isApplyingRef.current) return;

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

      // Skip/Needs Manual: S or ArrowDown
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleAction('needs_manual');
        return;
      }

      // Show keyboard shortcuts help: ?
      if (e.key === '?') {
        e.preventDefault();
        showInfo('Keyboard shortcuts: A/→ Approve, R/← Reject, S/↓ Skip');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDraftId, handleAction]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Review Deck</h1>
            <p className="text-sm text-muted-foreground">
              {queueData?.total ?? 0} items awaiting review
            </p>
          </div>

          {/* Assignment Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-4 w-4" />
                {assignedFilter === 'all' && 'All Items'}
                {assignedFilter === 'mine' && 'Assigned to Me'}
                {assignedFilter === 'unassigned' && 'Unassigned'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setAssignedFilter('all')}>
                {assignedFilter === 'all' && <Check className="h-4 w-4 mr-2" />}
                {assignedFilter !== 'all' && <div className="w-4 mr-2" />}
                All Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignedFilter('mine')}>
                {assignedFilter === 'mine' && <Check className="h-4 w-4 mr-2" />}
                {assignedFilter !== 'mine' && <div className="w-4 mr-2" />}
                Assigned to Me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignedFilter('unassigned')}>
                {assignedFilter === 'unassigned' && <Check className="h-4 w-4 mr-2" />}
                {assignedFilter !== 'unassigned' && <div className="w-4 mr-2" />}
                Unassigned
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assign to Me button */}
          {selectedDraftId && draftData?.draft?.assignedReviewerUserId !== currentUserId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAssignToMe}
              disabled={isAssigning}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Assign to Me
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts:</span>
          <Badge variant="outline" className="text-xs py-0 px-1.5">A</Badge>
          <span>Approve</span>
          <Badge variant="outline" className="text-xs py-0 px-1.5">R</Badge>
          <span>Reject</span>
          <Badge variant="outline" className="text-xs py-0 px-1.5">S</Badge>
          <span>Skip</span>
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
              selectedId={selectedDraftId}
              onSelect={handleSelectDraft}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <Inbox className="h-12 w-12 mb-4" />
              <p className="text-center">No items in queue</p>
              <p className="text-sm text-center mt-1">
                All listings have been reviewed
              </p>
            </div>
          )}
        </div>

        {/* Center: Listing Card (50%) */}
        <div className="w-1/2 overflow-y-auto">
          {isLoadingDraft ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : draftData?.draft ? (
            <div className="p-6">
              <ListingCard
                draft={draftData.draft}
                onRerunAi={handleRerunAi}
                isRerunningAi={isRerunningAi}
                onUpdate={handleUpdateDraft}
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
            draftId={selectedDraftId}
            draft={draftData?.draft ?? null}
          />
        </div>
      </div>
    </div>
  );
}
