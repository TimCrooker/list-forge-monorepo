import { X, Activity, Loader2 } from 'lucide-react';
import { Button, cn } from '@listforge/ui';
import { useResearchActivityFeed } from '@listforge/api-rtk';
import { AgentActivityFeed } from './agent-activity/agent-activity-feed';

interface ResearchActivityLogsSidebarProps {
  researchRunId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ResearchActivityLogsSidebar({
  researchRunId,
  isOpen,
  onClose,
}: ResearchActivityLogsSidebarProps) {
  const { operationEvents, isLoading } = useResearchActivityFeed(researchRunId);

  return (
    <div
      className={cn(
        'fixed right-0 top-16 bottom-0 w-[450px] bg-background border-l',
        'transition-transform duration-300 ease-in-out z-40',
        'flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Research Activity Logs
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : operationEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No activity logs yet</p>
          </div>
        ) : (
          <AgentActivityFeed
            events={operationEvents}
            isLive={false}
            autoScroll={false}
            expandAll={true}
          />
        )}
      </div>
    </div>
  );
}
