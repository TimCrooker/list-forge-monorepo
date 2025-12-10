import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessageDto } from '@listforge/api-types';
import { ChatAction } from './ChatAction';
import { FoundryAvatar } from '../foundry';

interface ChatMessageProps {
  message: ChatMessageDto;
  onApplyAction: (messageId: string, actionIndex: number) => void;
}

/**
 * Chat Message Component
 *
 * Memoized to prevent unnecessary re-renders during streaming.
 * Only re-renders if the message content or actions change.
 */
export const ChatMessage = memo(function ChatMessage({ message, onApplyAction }: ChatMessageProps) {
  return (
    <div
      className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'assistant' && (
        <div className="shrink-0 mt-1">
          <FoundryAvatar state="idle" size="sm" mode="dark" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {message.role === 'assistant' ? (
          <div className="text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.actions.map((action, index) => (
              <ChatAction
                key={index}
                action={action}
                messageId={message.id}
                actionIndex={index}
                onApply={onApplyAction}
              />
            ))}
          </div>
        )}
        <p
          className={`text-[10px] mt-1.5 ${
            message.role === 'user'
              ? 'text-primary-foreground/60'
              : 'text-muted-foreground'
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  // Only re-render if message content, actions, or createdAt changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.role === nextProps.message.role &&
    prevProps.message.createdAt === nextProps.message.createdAt &&
    JSON.stringify(prevProps.message.actions) === JSON.stringify(nextProps.message.actions)
  );
});
