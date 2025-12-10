import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChatActionDto } from '@listforge/api-types';
import { showSuccess, showError } from '../../utils/toast';

/**
 * Result of executing an action
 */
export interface ActionExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Hook to handle client-side action execution (navigate, copy, external_link)
 * Server-side actions (update_field, trigger_research) are handled by useChatSocket
 */
export function useClientActionExecutor() {
  const navigate = useNavigate();

  /**
   * Execute a navigate action
   */
  const executeNavigate = useCallback(async (
    action: ChatActionDto,
  ): Promise<ActionExecutionResult> => {
    const path = action.payload?.path as string | undefined;
    if (!path) {
      return { success: false, error: 'Invalid navigate payload' };
    }

    try {
      // Build the path with params if needed
      let finalPath = path;
      const params = action.payload?.params as Record<string, string> | undefined;
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          finalPath = finalPath.replace(`:${key}`, value);
        }
      }

      navigate({ to: finalPath });
      return { success: true, message: `Navigated to ${finalPath}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Navigation failed';
      return { success: false, error: message };
    }
  }, [navigate]);

  /**
   * Execute an open_item action
   */
  const executeOpenItem = useCallback(async (
    action: ChatActionDto,
  ): Promise<ActionExecutionResult> => {
    const itemId = action.payload?.itemId as string | undefined;
    if (!itemId) {
      return { success: false, error: 'Invalid open_item payload' };
    }

    try {
      const path = `/items/${itemId}`;
      navigate({ to: path });
      return { success: true, message: `Opened item ${itemId}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open item';
      return { success: false, error: message };
    }
  }, [navigate]);

  /**
   * Execute a copy action
   */
  const executeCopy = useCallback(async (
    action: ChatActionDto,
  ): Promise<ActionExecutionResult> => {
    const text = action.payload?.text as string | undefined;
    if (!text) {
      return { success: false, error: 'Invalid copy payload' };
    }

    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard');
      return { success: true, message: 'Copied to clipboard' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to copy';
      showError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Execute an external_link action
   */
  const executeExternalLink = useCallback(async (
    action: ChatActionDto,
  ): Promise<ActionExecutionResult> => {
    const url = action.payload?.url as string | undefined;
    if (!url) {
      return { success: false, error: 'Invalid external_link payload' };
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true, message: `Opened ${url}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open link';
      return { success: false, error: message };
    }
  }, []);

  /**
   * Check if an action is a client-side action
   */
  const isClientAction = useCallback((action: ChatActionDto): boolean => {
    return ['navigate', 'open_item', 'copy', 'external_link'].includes(action.type);
  }, []);

  /**
   * Execute a client-side action
   * Returns null if not a client-side action (should be handled by server)
   */
  const executeClientAction = useCallback(async (
    action: ChatActionDto,
  ): Promise<ActionExecutionResult | null> => {
    switch (action.type) {
      case 'navigate':
        return executeNavigate(action);
      case 'open_item':
        return executeOpenItem(action);
      case 'copy':
        return executeCopy(action);
      case 'external_link':
        return executeExternalLink(action);
      default:
        // Not a client-side action
        return null;
    }
  }, [executeNavigate, executeOpenItem, executeCopy, executeExternalLink]);

  /**
   * Check if an action should auto-execute
   */
  const shouldAutoExecute = useCallback((action: ChatActionDto): boolean => {
    return action.autoExecute === true;
  }, []);

  return {
    executeClientAction,
    isClientAction,
    shouldAutoExecute,
    executeNavigate,
    executeOpenItem,
    executeCopy,
    executeExternalLink,
  };
}

/**
 * Get display info for an action type
 */
export function getActionDisplayInfo(action: ChatActionDto): {
  icon: string;
  className: string;
} {
  switch (action.type) {
    case 'navigate':
      return { icon: '→', className: 'action-navigate' };
    case 'open_item':
      return { icon: '📦', className: 'action-open' };
    case 'copy':
      return { icon: '📋', className: 'action-copy' };
    case 'update_field':
      return { icon: '✏️', className: 'action-update' };
    case 'external_link':
      return { icon: '🔗', className: 'action-external' };
    case 'trigger_research':
    case 'start_research':
      return { icon: '🔍', className: 'action-research' };
    case 'run_tool':
      return { icon: '⚙️', className: 'action-tool' };
    default:
      return { icon: '▶', className: 'action-default' };
  }
}

/**
 * Get button variant based on action priority
 */
export function getActionButtonVariant(action: ChatActionDto): 'default' | 'secondary' | 'outline' {
  switch (action.priority) {
    case 'high':
      return 'default';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
}
