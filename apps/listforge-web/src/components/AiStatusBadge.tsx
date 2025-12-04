import { Badge } from '@listforge/ui';
import { MetaListingAiStatus } from '@listforge/core-types';

interface AiStatusBadgeProps {
  status: MetaListingAiStatus;
}

export default function AiStatusBadge({ status }: AiStatusBadgeProps) {
  const statusConfig: Record<
    MetaListingAiStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    pending: { label: 'Pending', variant: 'outline' },
    in_progress: { label: 'Processing', variant: 'default' },
    complete: { label: 'Complete', variant: 'default' },
    failed: { label: 'Failed', variant: 'destructive' },
    needs_review: { label: 'Needs Review', variant: 'secondary' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

