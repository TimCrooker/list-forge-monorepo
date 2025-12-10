import { AgentActivityFeed } from './agent-activity/agent-activity-feed';
import type { AgentOperationEvent } from '@listforge/core-types';

interface ResearchActivityFeedProps {
  /** New operation events for the AgentActivityFeed */
  operationEvents?: AgentOperationEvent[];
  /** Callback when an operation is clicked */
  onOperationClick?: (operationId: string) => void;
  /** Whether the feed is receiving live updates */
  isLive?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ResearchActivityFeed - Live feed of research activity operations
 *
 * Displays research operations as collapsible widgets using the AgentActivityFeed component.
 * Each operation (web search, product identification, etc.) is shown as an expandable widget
 * with type-specific content rendering.
 */
export function ResearchActivityFeed({
  operationEvents = [],
  onOperationClick,
  isLive = true,
  className,
}: ResearchActivityFeedProps) {
  return (
    <div className={`h-full w-full flex flex-col min-w-0 overflow-hidden ${className || ''}`}>
      <AgentActivityFeed
        events={operationEvents}
        isLive={isLive}
        autoScroll={true}
        onOperationClick={onOperationClick}
        emptyComponent={
          <div className="text-center py-12">
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Operations will appear here as research progresses
            </p>
          </div>
        }
      />
    </div>
  );
}
