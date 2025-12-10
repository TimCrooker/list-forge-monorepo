import { useState } from 'react';
import {
  SettingsVersionDto,
  PreviewSettingsRevertResponse,
  SETTINGS_TYPE_LABELS,
} from '@listforge/api-types';
import {
  useRevertSettingsMutation,
  useLazyPreviewSettingsRevertQuery,
} from '@listforge/api-rtk';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Textarea,
  Alert,
  AlertDescription,
  Skeleton,
} from '@listforge/ui';
import { Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { FieldDiffDisplay } from './FieldDiffDisplay';
import { showSuccess, showError } from '@/utils/toast';

interface RevertSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  version: SettingsVersionDto;
  onSuccess?: () => void;
}

const MIN_REASON_LENGTH = 10;

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Dialog for confirming and executing a settings revert
 *
 * Shows preview of changes and requires a reason
 */
export function RevertSettingsDialog({
  open,
  onOpenChange,
  orgId,
  version,
  onSuccess,
}: RevertSettingsDialogProps) {
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<PreviewSettingsRevertResponse | null>(null);

  const [fetchPreview, { isLoading: previewLoading }] = useLazyPreviewSettingsRevertQuery();
  const [revertSettings, { isLoading: revertLoading }] = useRevertSettingsMutation();

  // Load preview when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && !preview) {
      try {
        const result = await fetchPreview({ orgId, versionId: version.id }).unwrap();
        setPreview(result);
      } catch (err: any) {
        showError(err?.data?.message || 'Failed to load preview');
        onOpenChange(false);
        return;
      }
    }
    if (!isOpen) {
      setReason('');
      setPreview(null);
    }
    onOpenChange(isOpen);
  };

  const handleRevert = async () => {
    if (reason.trim().length < MIN_REASON_LENGTH) {
      showError(`Reason must be at least ${MIN_REASON_LENGTH} characters`);
      return;
    }

    try {
      await revertSettings({
        orgId,
        versionId: version.id,
        data: { reason: reason.trim() },
      }).unwrap();
      showSuccess('Settings reverted successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to revert settings');
    }
  };

  const settingsTypeLabel = SETTINGS_TYPE_LABELS[version.settingsType] || version.settingsType;
  const isReasonValid = reason.trim().length >= MIN_REASON_LENGTH;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Revert {settingsTypeLabel} Settings
          </DialogTitle>
          <DialogDescription>
            Revert to version {version.versionNumber} from {formatDate(version.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will replace your current settings with the values from version{' '}
              {version.versionNumber}. A new version will be created to record this change.
            </AlertDescription>
          </Alert>

          {/* Preview of changes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Changes that will be applied</Label>
            {previewLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : preview?.fieldDiffs && preview.fieldDiffs.length > 0 ? (
              <FieldDiffDisplay diffs={preview.fieldDiffs} />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No changes detected between current settings and version {version.versionNumber}
              </p>
            )}
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="revert-reason">
              Reason for revert <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="revert-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're reverting to this version..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Minimum {MIN_REASON_LENGTH} characters required ({reason.trim().length}/
              {MIN_REASON_LENGTH})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={revertLoading}>
            Cancel
          </Button>
          <Button onClick={handleRevert} disabled={!isReasonValid || revertLoading}>
            {revertLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reverting...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Revert to Version {version.versionNumber}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
