import { Link } from '@tanstack/react-router';
import { Loader2, FlaskConical, ExternalLink } from 'lucide-react';

interface ResearchStatusProps {
  researchRunId: string;
  itemId: string;
  className?: string;
}

/**
 * ResearchStatus Component
 * Phase 7 Slice 7
 *
 * Small inline component showing research progress in chat.
 * Displays "Research running..." with a link to the Research tab.
 */
export function ResearchStatus({ itemId, className }: ResearchStatusProps) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/20 ${className || ''}`}>
      <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
      <span className="text-sm text-blue-700 dark:text-blue-400">
        Research running...
      </span>
      <Link
        to="/items/$id"
        params={{ id: itemId }}
        search={{ tab: 'research' }}
        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        <FlaskConical className="h-3 w-3" />
        View progress
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
