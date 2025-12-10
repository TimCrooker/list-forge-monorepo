import { useState } from 'react';
import { ChatActionDto } from '@listforge/api-types';
import { Button } from '@listforge/ui';
import {
  Check,
  X,
  Loader2,
  ArrowRight,
  Copy,
  ExternalLink,
  Search,
  Settings,
  Package,
} from 'lucide-react';

interface ChatActionProps {
  action: ChatActionDto;
  messageId: string;
  actionIndex: number;
  onApply: (messageId: string, actionIndex: number) => void;
  onDismiss?: (messageId: string, actionIndex: number) => void;
}

/**
 * Get icon for action type
 */
function getActionIcon(type: string) {
  switch (type) {
    case 'navigate':
      return <ArrowRight className="h-3 w-3" />;
    case 'open_item':
      return <Package className="h-3 w-3" />;
    case 'copy':
      return <Copy className="h-3 w-3" />;
    case 'external_link':
      return <ExternalLink className="h-3 w-3" />;
    case 'trigger_research':
    case 'start_research':
      return <Search className="h-3 w-3" />;
    case 'run_tool':
      return <Settings className="h-3 w-3" />;
    default:
      return null;
  }
}

/**
 * Get button variant based on action priority
 */
function getButtonVariant(priority?: string): 'default' | 'secondary' | 'outline' {
  switch (priority) {
    case 'high':
      return 'default';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get description for action based on type and payload
 */
function getActionDescription(action: ChatActionDto): string | null {
  // Use explicit description if provided
  if ('description' in action && action.description) {
    return action.description as string;
  }

  // Generate description based on type
  switch (action.type) {
    case 'update_field':
      if (action.field && action.value !== undefined) {
        return `${action.field}: ${String(action.value)}`;
      }
      break;
    case 'navigate':
      if ('routeName' in action && action.routeName) {
        return `Go to ${action.routeName}`;
      }
      break;
    case 'copy':
      return 'Copy to clipboard';
    case 'trigger_research':
    case 'start_research':
      return 'Start AI research';
  }

  return null;
}

/**
 * ChatAction Component - Enhanced for General Chatbot
 *
 * Displays an action button that can be applied or dismissed.
 * Supports multiple action types: navigate, copy, update_field, etc.
 * Shows loading state during application and success/error states.
 */
export function ChatAction({ action, messageId, actionIndex, onApply, onDismiss }: ChatActionProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Sync with prop updates (when message is refreshed after action applied)
  const isApplied = action.applied;
  const icon = getActionIcon(action.type);
  const description = getActionDescription(action);
  const buttonVariant = getButtonVariant((action as any).priority);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(messageId, actionIndex);
      // Note: isApplied will update automatically when message is refreshed via socket
    } catch (error) {
      console.error('Failed to apply action:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss(messageId, actionIndex);
    }
  };

  if (isDismissed) {
    return null;
  }

  if (isApplied) {
    return (
      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
          <Check className="h-4 w-4" />
          <span>{action.label} - Applied</span>
        </div>
      </div>
    );
  }

  // Compact button style for simple actions (navigate, copy, external_link)
  const isSimpleAction = ['navigate', 'copy', 'external_link', 'open_item'].includes(action.type);

  if (isSimpleAction) {
    return (
      <Button
        onClick={handleApply}
        disabled={isApplying}
        size="sm"
        variant={buttonVariant}
        className="h-8 px-3 text-xs gap-1.5"
      >
        {isApplying ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          icon
        )}
        {action.label}
      </Button>
    );
  }

  // Card style for complex actions (update_field, trigger_research)
  return (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            {icon}
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{action.label}</p>
          </div>
          {description && (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleApply}
            disabled={isApplying}
            size="sm"
            variant={buttonVariant}
            className="h-8 px-3 text-xs"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Applying...
              </>
            ) : (
              'Apply'
            )}
          </Button>
          {onDismiss && (
            <Button
              onClick={handleDismiss}
              disabled={isApplying}
              size="sm"
              variant="ghost"
              className="h-8 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
