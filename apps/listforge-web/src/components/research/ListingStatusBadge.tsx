import { Badge, cn } from '@listforge/ui';
import { Rocket, Clock, AlertCircle } from 'lucide-react';
import type { ListingReadinessStatus } from '@listforge/core-types';

interface ListingStatusBadgeProps {
  status: ListingReadinessStatus;
  confidence?: number;
  showConfidence?: boolean;
  size?: 'sm' | 'default';
}

const statusConfig: Record<
  ListingReadinessStatus,
  {
    label: string;
    icon: typeof Rocket;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  READY_FOR_PUBLISH: {
    label: 'Ready to Publish',
    icon: Rocket,
    variant: 'default',
    className: 'bg-green-600 hover:bg-green-700 text-white',
  },
  READY_FOR_REVIEW: {
    label: 'Ready for Review',
    icon: Clock,
    variant: 'secondary',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  },
  NEEDS_INFO: {
    label: 'Needs Info',
    icon: AlertCircle,
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  },
};

export function ListingStatusBadge({
  status,
  confidence,
  showConfidence = false,
  size = 'default',
}: ListingStatusBadgeProps) {
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
      {showConfidence && confidence !== undefined && (
        <span className="opacity-75">({Math.round(confidence * 100)}%)</span>
      )}
    </Badge>
  );
}





