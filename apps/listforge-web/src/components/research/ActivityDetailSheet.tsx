import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Badge,
} from '@listforge/ui';
import type { ResearchActivityLogEntry } from '@listforge/core-types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityDetailSheetProps {
  entry: ResearchActivityLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Map status to badge variant
 */
function getStatusVariant(status: string) {
  switch (status) {
    case 'success':
      return 'default';
    case 'error':
      return 'destructive';
    case 'warning':
      return 'secondary';
    case 'processing':
      return 'secondary';
    case 'info':
    default:
      return 'outline';
  }
}

/**
 * ActivityDetailSheet - Modal for viewing detailed activity metadata
 *
 * Shows the full JSON metadata for an activity log entry.
 * Allows deep diving into exactly what the bot found and did.
 */
export function ActivityDetailSheet({
  entry,
  open,
  onOpenChange,
}: ActivityDetailSheetProps) {
  if (!entry) {
    return null;
  }

  const timestamp = new Date(entry.timestamp);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Activity Details</SheetTitle>
          <SheetDescription>
            {formatDistanceToNow(timestamp, { addSuffix: true })} •{' '}
            {timestamp.toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Type and Status */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {entry.type}
            </Badge>
            <Badge variant={getStatusVariant(entry.status)}>
              {entry.status}
            </Badge>
            {entry.stepId && (
              <Badge variant="secondary" className="font-mono text-xs">
                step: {entry.stepId}
              </Badge>
            )}
          </div>

          {/* Message */}
          <div>
            <h3 className="text-sm font-semibold mb-1">Message</h3>
            <p className="text-sm text-muted-foreground">{entry.message}</p>
          </div>

          {/* Metadata */}
          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Metadata</h3>
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono">
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* IDs */}
          <div className="pt-4 border-t space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Entry ID:</span>
              <p className="text-xs font-mono">{entry.id}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Research Run ID:</span>
              <p className="text-xs font-mono">{entry.researchRunId}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Item ID:</span>
              <p className="text-xs font-mono">{entry.itemId}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
