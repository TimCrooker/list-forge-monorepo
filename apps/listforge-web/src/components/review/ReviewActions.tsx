import { useState } from 'react';
import {
  Button,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@listforge/ui';
import { Check, X, Loader2 } from 'lucide-react';

interface ReviewActionsProps {
  onAction: (action: 'approve' | 'reject', comment?: string) => Promise<void>;
  isLoading: boolean;
}

export function ReviewActions({ onAction, isLoading }: ReviewActionsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const handleApprove = () => {
    onAction('approve');
  };

  const handleRejectConfirm = () => {
    onAction('reject', rejectComment || undefined);
    setShowRejectDialog(false);
    setRejectComment('');
  };

  return (
    <>
      <div className="flex items-center gap-3 justify-center">
        {/* Reject Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={() => setShowRejectDialog(true)}
          disabled={isLoading}
          className="gap-2 min-w-[140px]"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Reject
        </Button>

        {/* Approve Button */}
        <Button
          variant="default"
          size="lg"
          onClick={handleApprove}
          disabled={isLoading}
          className="gap-2 min-w-[140px] bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </Button>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
        <span>← or R: Reject</span>
        <span>→ or A: Approve</span>
      </div>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this listing? You can optionally
              add a comment explaining why.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Rejection reason (optional)"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
