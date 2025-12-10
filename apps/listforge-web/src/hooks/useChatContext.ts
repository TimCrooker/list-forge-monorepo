import { useMemo } from 'react';
import { useRouterState } from '@tanstack/react-router';

/**
 * Chat Context Data
 * Describes the current page/route context for the chat agent
 */
export interface ChatContextData {
  /** Current route path */
  currentRoute: string;

  /** Type of page user is on */
  pageType: 'item_detail' | 'items' | 'dashboard' | 'review' | 'capture' | 'settings' | 'other';

  /** Item ID if on an item page */
  itemId?: string;

  /** Active tab (from query params) */
  activeTab?: string;

  /** Active modal (from query params) */
  activeModal?: string;
}

/**
 * Detect page type from pathname
 */
function detectPageType(pathname: string): ChatContextData['pageType'] {
  if (!pathname || pathname === '/') return 'dashboard';

  // Item detail page: /items/{id}
  if (pathname.startsWith('/items/') && pathname.split('/').length > 2) {
    return 'item_detail';
  }

  // Items list page: /items
  if (pathname.startsWith('/items')) return 'items';

  // Review queue: /review
  if (pathname.startsWith('/review')) return 'review';

  // Capture pages: /capture or /capture/{id}
  if (pathname.startsWith('/capture')) return 'capture';

  // Settings pages: /settings/*
  if (pathname.startsWith('/settings')) return 'settings';

  // Everything else
  return 'other';
}

/**
 * Extract item ID from pathname
 * Matches patterns like /items/{uuid} or /capture/{uuid}
 */
function extractItemIdFromPath(pathname: string): string | undefined {
  // Match UUID pattern after /items/ or /capture/
  const match = pathname.match(/^\/(items|capture)\/([a-f0-9-]{36})/);
  return match?.[2];
}

/**
 * Hook to automatically collect current page context for chat
 *
 * This hook observes the current route and extracts context information
 * that helps the chat agent understand where the user is and what they're doing.
 *
 * @example
 * ```tsx
 * const context = useChatContext();
 * // On /items/abc-123 page:
 * // { pageType: 'item_detail', itemId: 'abc-123', currentRoute: '/items/abc-123' }
 * ```
 */
export function useChatContext(): ChatContextData {
  const router = useRouterState();
  const { pathname, search } = router.location;

  return useMemo(() => {
    const pageType = detectPageType(pathname);
    const itemId = extractItemIdFromPath(pathname);

    // Parse query params for additional context
    const searchParams = new URLSearchParams(search);
    const activeTab = searchParams.get('tab') || undefined;
    const activeModal = searchParams.get('modal') || undefined;

    return {
      currentRoute: pathname + search,
      pageType,
      itemId,
      activeTab,
      activeModal,
    };
  }, [pathname, search]);
}
