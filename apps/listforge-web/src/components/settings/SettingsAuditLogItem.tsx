import { useState } from 'react';
import {
  SettingsAuditLogDto,
  SETTINGS_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from '@listforge/api-types';
import {
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Settings,
  RotateCcw,
  Shield,
  Edit,
} from 'lucide-react';
import { Badge, cn } from '@listforge/ui';
import { FieldDiffDisplay } from './FieldDiffDisplay';

interface SettingsAuditLogItemProps {
  log: SettingsAuditLogDto;
  showOrg?: boolean;
}

/**
 * Get icon for event type
 */
function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'settings:created':
      return Settings;
    case 'settings:updated':
      return Edit;
    case 'settings:reverted':
      return RotateCcw;
    case 'settings:admin_update':
      return Shield;
    default:
      return Settings;
  }
}

/**
 * Get badge variant for event type
 */
function getEventBadgeVariant(eventType: string) {
  switch (eventType) {
    case 'settings:created':
      return 'default' as const;
    case 'settings:updated':
      return 'secondary' as const;
    case 'settings:reverted':
      return 'outline' as const;
    case 'settings:admin_update':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

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
 * Expandable audit log item component
 *
 * Shows summary by default, expands to show field-level diffs
 */
export function SettingsAuditLogItem({ log }: SettingsAuditLogItemProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getEventIcon(log.eventType);
  const hasChanges = log.fieldDiffs && log.fieldDiffs.length > 0;

  // Format revert reason as string for display
  const revertReason = log.eventType === 'settings:reverted' && log.metadata?.revertReason
    ? String(log.metadata.revertReason)
    : null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-start gap-3 p-4 text-left transition-colors',
          'hover:bg-muted/50',
          expanded && 'bg-muted/30',
        )}
      >
        <div className="mt-0.5">
          {hasChanges ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
        </div>

        <Icon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={getEventBadgeVariant(log.eventType)} className="shrink-0">
              {EVENT_TYPE_LABELS[log.eventType] || log.eventType}
            </Badge>
            <Badge variant="outline" className="shrink-0">
              {SETTINGS_TYPE_LABELS[log.settingsType] || log.settingsType}
            </Badge>
          </div>

          <p className="text-sm font-medium truncate">{log.message}</p>

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {log.user?.email || 'System'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(log.timestamp)}
            </span>
            {hasChanges && (
              <span>
                {log.fieldDiffs.length} change{log.fieldDiffs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {revertReason && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              Reason: "{revertReason}"
            </p>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && hasChanges && (
        <div className="px-4 pb-4 border-t bg-muted/20">
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-3">Field Changes</h4>
            <FieldDiffDisplay diffs={log.fieldDiffs} />
          </div>

          {/* Additional metadata */}
          {(log.ipAddress || log.userAgent) && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Request Details</h4>
              <dl className="text-xs space-y-1">
                {log.ipAddress && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">IP Address:</dt>
                    <dd className="font-mono">{log.ipAddress}</dd>
                  </div>
                )}
                {log.userAgent && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">User Agent:</dt>
                    <dd className="font-mono truncate max-w-md">{log.userAgent}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
