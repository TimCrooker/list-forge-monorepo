import { MessageSquare, Plus, ChevronDown, Package, LayoutDashboard, ListChecks } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@listforge/ui';
import { useChat } from '../../contexts/ChatContext';
import { useGetChatSessionsQuery } from '@listforge/api-rtk';

export function SessionSwitcher() {
  const { sessionId, sessionTitle, sessionType, startNewConversation, switchToSession } = useChat();
  const { data: sessionsData } = useGetChatSessionsQuery({ limit: 10 });

  const getIcon = (type: string) => {
    switch (type) {
      case 'item_scoped':
        return Package;
      case 'dashboard':
        return LayoutDashboard;
      case 'review_queue':
        return ListChecks;
      default:
        return MessageSquare;
    }
  };

  const Icon = getIcon(sessionType || 'general');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{sessionTitle || 'Select conversation'}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[320px]">
        <DropdownMenuItem onClick={() => startNewConversation('general')}>
          <Plus className="h-4 w-4 mr-2" />
          New General Conversation
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Recent Conversations</DropdownMenuLabel>
        {sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
          sessionsData.sessions.map((session) => {
            const SessionIcon = getIcon(session.conversationType);
            return (
              <DropdownMenuItem
                key={session.id}
                onClick={() => switchToSession(session.id)}
                className={sessionId === session.id ? 'bg-accent' : ''}
              >
                <SessionIcon className="h-4 w-4 mr-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{session.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(session.lastActivityAt))} ago
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
