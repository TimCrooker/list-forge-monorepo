import { Button, cn } from '@listforge/ui'
import { useChat } from '@/contexts/ChatContext'
import { ChatPanel } from './ChatPanel'
import { SessionSwitcher } from './SessionSwitcher'
import { ContextSwitchPrompt } from './ContextSwitchPrompt'
import { ContextBadge } from './ContextBadge'
import { X } from 'lucide-react'

const SIDEBAR_WIDTH = 400

export function ChatSidebar() {
  const { isOpen, toggleChat, sessionType, sessionTitle, currentContext } = useChat()

  return (
    <>
      {/* Context Switch Prompt (rendered globally) */}
      <ContextSwitchPrompt />

      <div
        className={cn(
          'h-full border-l bg-background flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        style={{ width: isOpen ? SIDEBAR_WIDTH : 0 }}
      >
        {/* Header with session switcher */}
        <div className="flex flex-col gap-2 px-4 py-3 border-b shrink-0 bg-muted/30">
          <div className="flex items-center justify-between">
            <SessionSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChat}
              className="h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </div>

          {/* Context badge */}
          {sessionType && (
            <ContextBadge type={sessionType} title={sessionTitle} />
          )}
        </div>

        {/* Chat Panel Content */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            itemId={currentContext?.itemId}
          />
        </div>
      </div>
    </>
  )
}
