import { Injectable } from '@nestjs/common';
import { UserContext, ChatContext, ItemSnapshot } from '../graphs/chat/chat-graph.state';
import { ItemResearchData } from '@listforge/core-types';
import { isResearchStale as checkResearchStale } from '../utils/date';

/**
 * Chat Context Service
 *
 * Provides context injection for the chat agent.
 * This service gathers all relevant context about:
 * - User (who is asking)
 * - Application state (where they are)
 * - Item (what they're looking at)
 * - Research (what data we have)
 */
@Injectable()
export class ChatContextService {
  /**
   * Build user context from auth data
   */
  buildUserContext(params: {
    userId: string;
    email: string;
    name?: string;
    role: string;
    organizationId: string;
    organizationName: string;
  }): UserContext {
    return {
      userId: params.userId,
      name: params.name || params.email.split('@')[0],
      email: params.email,
      role: params.role,
      userType: params.role === 'admin' ? 'admin' : 'member',
      organizationId: params.organizationId,
      organizationName: params.organizationName,
    };
  }

  /**
   * Build chat context from frontend-provided data
   */
  buildChatContext(params: {
    pageType?: string;
    currentRoute?: string;
    itemId?: string;
    activeTab?: string;
    activeModal?: string;
    researchStatus?: string;
    visibleErrors?: string[];
    formDirtyFields?: string[];
  }): ChatContext {
    return {
      pageType: this.normalizePageType(params.pageType),
      currentRoute: params.currentRoute || '/',
      itemId: params.itemId,
      activeTab: params.activeTab,
      activeModal: params.activeModal,
      researchStatus: this.normalizeResearchStatus(params.researchStatus),
      visibleErrors: params.visibleErrors,
      formDirtyFields: params.formDirtyFields,
    };
  }

  /**
   * Build item snapshot from item entity
   */
  buildItemSnapshot(item: any): ItemSnapshot {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      condition: item.condition,
      attributes: (item.attributes || []).map((a: any) => ({
        key: a.key,
        value: a.value,
        source: a.source,
      })),
      media: (item.media || []).map((m: any) => ({
        id: m.id,
        url: m.url,
        type: m.type || 'image',
      })),
      defaultPrice: item.defaultPrice,
      currency: item.currency || 'USD',
      quantity: item.quantity || 1,
      lifecycleStatus: item.lifecycleStatus,
      aiReviewState: item.aiReviewState,
      categoryPath: item.categoryPath,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Check if research data is stale (>7 days old)
   */
  isResearchStale(research: ItemResearchData | null): boolean {
    if (!research || !research.generatedAt) return true;
    return checkResearchStale(research.generatedAt);
  }

  /**
   * Determine research status based on available data
   */
  determineResearchStatus(
    research: ItemResearchData | null,
    hasActiveJob: boolean,
  ): ChatContext['researchStatus'] {
    if (hasActiveJob) return 'running';
    if (!research) return 'none';
    if (this.isResearchStale(research)) return 'stale';
    return 'complete';
  }

  /**
   * Detect page type from route
   */
  detectPageType(route: string): ChatContext['pageType'] {
    if (!route || route === '/') return 'dashboard';
    if (route.startsWith('/items/') && route.split('/').length > 2) return 'item_detail';
    if (route.startsWith('/items')) return 'items';
    if (route.startsWith('/review')) return 'review';
    if (route.startsWith('/capture')) return 'capture';
    if (route.startsWith('/settings')) return 'settings';
    if (route.startsWith('/needs-work')) return 'items';
    return 'other';
  }

  /**
   * Extract item ID from route if present
   */
  extractItemIdFromRoute(route: string): string | undefined {
    const match = route.match(/\/items\/([a-f0-9-]+)/i);
    return match ? match[1] : undefined;
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  private normalizePageType(pageType?: string): ChatContext['pageType'] {
    const validTypes = ['items', 'item_detail', 'review', 'capture', 'settings', 'dashboard', 'other'];
    if (pageType && validTypes.includes(pageType)) {
      return pageType as ChatContext['pageType'];
    }
    return 'other';
  }

  private normalizeResearchStatus(status?: string): ChatContext['researchStatus'] {
    const validStatuses = ['none', 'running', 'complete', 'stale'];
    if (status && validStatuses.includes(status)) {
      return status as ChatContext['researchStatus'];
    }
    return undefined;
  }
}
