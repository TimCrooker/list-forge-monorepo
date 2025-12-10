import { History } from 'lucide-react';
import { Button, Badge } from '@listforge/ui';

interface ResearchActivityLogsToggleProps {
  onClick: () => void;
  operationCount: number;
}

export function ResearchActivityLogsToggle({
  onClick,
  operationCount,
}: ResearchActivityLogsToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <History className="h-4 w-4" />
      Activity Logs
      {operationCount > 0 && (
        <Badge variant="secondary" className="ml-1">
          {operationCount}
        </Badge>
      )}
    </Button>
  );
}
