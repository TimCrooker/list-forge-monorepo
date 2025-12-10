import { FieldDiffDto } from '@listforge/api-types';
import { ArrowRight, Plus, Minus, RefreshCw } from 'lucide-react';
import { cn } from '@listforge/ui';

interface FieldDiffDisplayProps {
  diffs: FieldDiffDto[];
  compact?: boolean;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Get change type for a diff
 */
function getChangeType(diff: FieldDiffDto): 'added' | 'removed' | 'changed' {
  if (diff.previousValue === null || diff.previousValue === undefined) {
    return 'added';
  }
  if (diff.newValue === null || diff.newValue === undefined) {
    return 'removed';
  }
  return 'changed';
}

/**
 * Display component for field-level diffs
 *
 * Shows before/after values with visual indicators for:
 * - Added fields (green)
 * - Removed fields (red)
 * - Changed fields (yellow/amber)
 */
export function FieldDiffDisplay({ diffs, compact = false }: FieldDiffDisplayProps) {
  if (!diffs || diffs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No changes detected</p>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {diffs.map((diff, index) => {
          const changeType = getChangeType(diff);
          return (
            <span
              key={index}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                changeType === 'added' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                changeType === 'removed' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                changeType === 'changed' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
              )}
            >
              {changeType === 'added' && <Plus className="h-3 w-3" />}
              {changeType === 'removed' && <Minus className="h-3 w-3" />}
              {changeType === 'changed' && <RefreshCw className="h-3 w-3" />}
              {diff.path}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {diffs.map((diff, index) => {
        const changeType = getChangeType(diff);
        return (
          <div
            key={index}
            className={cn(
              'rounded-lg border p-3',
              changeType === 'added' && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
              changeType === 'removed' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
              changeType === 'changed' && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {changeType === 'added' && (
                <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
              {changeType === 'removed' && (
                <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              {changeType === 'changed' && (
                <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <span className="font-medium text-sm">{diff.path}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {changeType !== 'added' && (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground block mb-1">Previous</span>
                  <code className="block px-2 py-1 rounded bg-background/50 text-sm font-mono overflow-x-auto">
                    {formatValue(diff.previousValue)}
                  </code>
                </div>
              )}

              {changeType === 'changed' && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              {changeType !== 'removed' && (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground block mb-1">New</span>
                  <code className="block px-2 py-1 rounded bg-background/50 text-sm font-mono overflow-x-auto">
                    {formatValue(diff.newValue)}
                  </code>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
