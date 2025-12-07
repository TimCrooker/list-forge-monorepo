import { Badge } from '@listforge/ui';
import type { LifecycleStatus, AiReviewState, ItemSource } from '@listforge/core-types';
import { Bot, User, Clock, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: LifecycleStatus;
  className?: string;
}

interface AiReviewBadgeProps {
  state: AiReviewState;
  className?: string;
}

interface SourceBadgeProps {
  source: ItemSource;
  className?: string;
}

/**
 * Get color classes for lifecycle status
 */
function getLifecycleColor(status: LifecycleStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-300 dark:border-amber-800';
    case 'ready':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border-blue-300 dark:border-blue-800';
    case 'listed':
      return 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border-green-300 dark:border-green-800';
    case 'sold':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400 border-purple-300 dark:border-purple-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-400 border-gray-300 dark:border-gray-800';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-400 border-gray-300 dark:border-gray-800';
  }
}

/**
 * Get label for lifecycle status
 */
function getLifecycleLabel(status: LifecycleStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'ready':
      return 'Ready';
    case 'listed':
      return 'Listed';
    case 'sold':
      return 'Sold';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

/**
 * Get color classes for AI review state
 */
function getAiReviewColor(state: AiReviewState): string {
  switch (state) {
    case 'none':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-950/20 dark:text-gray-400 border-gray-300 dark:border-gray-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border-green-300 dark:border-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 border-red-300 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-950/20 dark:text-gray-400 border-gray-300 dark:border-gray-800';
  }
}

/**
 * Get label and icon for AI review state
 */
function getAiReviewInfo(state: AiReviewState): { label: string; icon: React.ReactNode } {
  switch (state) {
    case 'none':
      return { label: 'No AI', icon: null };
    case 'pending':
      return { label: 'AI Pending', icon: <Clock className="h-3 w-3 mr-1" /> };
    case 'approved':
      return { label: 'AI Approved', icon: <CheckCircle className="h-3 w-3 mr-1" /> };
    case 'rejected':
      return { label: 'AI Rejected', icon: <XCircle className="h-3 w-3 mr-1" /> };
    default:
      return { label: state, icon: null };
  }
}

/**
 * Lifecycle Status Badge Component
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = getLifecycleColor(status);
  const label = getLifecycleLabel(status);

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${className || ''}`}
    >
      {label}
    </Badge>
  );
}

/**
 * AI Review State Badge Component
 */
export function AiReviewBadge({ state, className }: AiReviewBadgeProps) {
  // Don't show badge for 'none' state
  if (state === 'none') {
    return null;
  }

  const colorClass = getAiReviewColor(state);
  const { label, icon } = getAiReviewInfo(state);

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${className || ''} flex items-center`}
    >
      {icon}
      {label}
    </Badge>
  );
}

/**
 * Source Badge Component (AI Capture vs Manual)
 */
export function SourceBadge({ source, className }: SourceBadgeProps) {
  const isAi = source === 'ai_capture';
  const label = isAi ? 'AI Capture' : 'Manual';
  const icon = isAi ? <Bot className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />;
  const colorClass = isAi
    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
    : 'bg-slate-100 text-slate-800 dark:bg-slate-950/20 dark:text-slate-400 border-slate-300 dark:border-slate-800';

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${className || ''} flex items-center`}
    >
      {icon}
      {label}
    </Badge>
  );
}
