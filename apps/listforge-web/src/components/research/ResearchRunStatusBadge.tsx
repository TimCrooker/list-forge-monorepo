import { Badge, cn } from '@listforge/ui';
import { Clock, CheckCircle2, XCircle, Pause, Ban } from 'lucide-react';
import type { ResearchRunStatus } from '@listforge/core-types';

interface ResearchRunStatusBadgeProps {
  status: ResearchRunStatus;
  size?: 'sm' | 'default';
}

const statusConfig: Record<
  ResearchRunStatus,
  {
    label: string;
    icon: typeof Clock;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  running: {
    label: 'Running',
    icon: Clock,
    variant: 'default',
    className: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    variant: 'secondary',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    variant: 'outline',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  success: {
    label: 'Completed',
    icon: CheckCircle2,
    variant: 'default',
    className: 'bg-green-600 hover:bg-green-700 text-white',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  },
};

export function ResearchRunStatusBadge({
  status,
  size = 'default',
}: ResearchRunStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1',
        config.className,
        size === 'sm' && 'text-xs px-2 py-0.5',
      )}
    >
      <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>{config.label}</span>
    </Badge>
  );
}
