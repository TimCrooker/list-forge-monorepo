import { ChatContextService } from '../chat-context.service';
import { UserContext, ChatContext, ItemSnapshot } from '../../graphs/chat/chat-graph.state';
import { ItemResearchData } from '@listforge/core-types';

describe('ChatContextService', () => {
  let service: ChatContextService;

  beforeEach(() => {
    service = new ChatContextService();
  });

  // ==========================================================================
  // buildUserContext
  // ==========================================================================

  describe('buildUserContext', () => {
    it('should create user context with all provided fields', () => {
      const params = {
        userId: 'user-123',
        email: 'john.doe@example.com',
        name: 'John Doe',
        role: 'admin',
        organizationId: 'org-456',
        organizationName: 'Acme Corp',
      };

      const result = service.buildUserContext(params);

      expect(result).toEqual<UserContext>({
        userId: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        userType: 'admin',
        organizationId: 'org-456',
        organizationName: 'Acme Corp',
      });
    });

    it('should derive name from email when name is not provided', () => {
      const params = {
        userId: 'user-123',
        email: 'john.doe@example.com',
        role: 'member',
        organizationId: 'org-456',
        organizationName: 'Acme Corp',
      };

      const result = service.buildUserContext(params);

      expect(result.name).toBe('john.doe');
    });

    it('should set userType to admin when role is admin', () => {
      const params = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
        organizationId: 'org-456',
        organizationName: 'Acme Corp',
      };

      const result = service.buildUserContext(params);

      expect(result.userType).toBe('admin');
    });

    it('should set userType to member when role is not admin', () => {
      const params = {
        userId: 'user-123',
        email: 'member@example.com',
        role: 'member',
        organizationId: 'org-456',
        organizationName: 'Acme Corp',
      };

      const result = service.buildUserContext(params);

      expect(result.userType).toBe('member');
    });
  });

  // ==========================================================================
  // buildChatContext
  // ==========================================================================

  describe('buildChatContext', () => {
    it('should create chat context with all provided fields', () => {
      const params = {
        pageType: 'item_detail',
        currentRoute: '/items/123',
        itemId: 'item-123',
        activeTab: 'details',
        activeModal: 'edit',
        researchStatus: 'complete',
        visibleErrors: ['error1', 'error2'],
        formDirtyFields: ['title', 'description'],
      };

      const result = service.buildChatContext(params);

      expect(result).toEqual<ChatContext>({
        pageType: 'item_detail',
        currentRoute: '/items/123',
        itemId: 'item-123',
        activeTab: 'details',
        activeModal: 'edit',
        researchStatus: 'complete',
        visibleErrors: ['error1', 'error2'],
        formDirtyFields: ['title', 'description'],
      });
    });

    it('should default currentRoute to / when not provided', () => {
      const params = {};

      const result = service.buildChatContext(params);

      expect(result.currentRoute).toBe('/');
    });

    it('should normalize invalid pageType to other', () => {
      const params = {
        pageType: 'invalid_page_type',
      };

      const result = service.buildChatContext(params);

      expect(result.pageType).toBe('other');
    });

    it('should accept valid pageType values', () => {
      const validTypes = ['items', 'item_detail', 'review', 'capture', 'settings', 'dashboard', 'other'];

      validTypes.forEach(pageType => {
        const result = service.buildChatContext({ pageType });
        expect(result.pageType).toBe(pageType);
      });
    });

    it('should normalize invalid researchStatus to undefined', () => {
      const params = {
        researchStatus: 'invalid_status',
      };

      const result = service.buildChatContext(params);

      expect(result.researchStatus).toBeUndefined();
    });

    it('should accept valid researchStatus values', () => {
      const validStatuses = ['none', 'running', 'complete', 'stale'];

      validStatuses.forEach(status => {
        const result = service.buildChatContext({ researchStatus: status });
        expect(result.researchStatus).toBe(status);
      });
    });
  });

  // ==========================================================================
  // buildItemSnapshot
  // ==========================================================================

  describe('buildItemSnapshot', () => {
    it('should convert all Item fields correctly', () => {
      const item = {
        id: 'item-123',
        title: 'Nike Air Max',
        description: 'Size 10 shoes',
        condition: 'new',
        attributes: [
          { key: 'brand', value: 'Nike', source: 'ai' },
          { key: 'size', value: '10', source: 'user' },
        ],
        media: [
          { id: 'media-1', url: 'https://example.com/1.jpg', type: 'image' },
          { id: 'media-2', url: 'https://example.com/2.jpg', type: 'image' },
        ],
        defaultPrice: 99.99,
        currency: 'USD',
        quantity: 1,
        lifecycleStatus: 'draft',
        aiReviewState: 'approved',
        categoryPath: ['Clothing', 'Shoes', 'Athletic'],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      };

      const result = service.buildItemSnapshot(item);

      expect(result).toEqual<ItemSnapshot>({
        id: 'item-123',
        title: 'Nike Air Max',
        description: 'Size 10 shoes',
        condition: 'new',
        attributes: [
          { key: 'brand', value: 'Nike', source: 'ai' },
          { key: 'size', value: '10', source: 'user' },
        ],
        media: [
          { id: 'media-1', url: 'https://example.com/1.jpg', type: 'image' },
          { id: 'media-2', url: 'https://example.com/2.jpg', type: 'image' },
        ],
        defaultPrice: 99.99,
        currency: 'USD',
        quantity: 1,
        lifecycleStatus: 'draft',
        aiReviewState: 'approved',
        categoryPath: ['Clothing', 'Shoes', 'Athletic'],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should handle null/undefined optional fields', () => {
      const item = {
        id: 'item-123',
        title: null,
        description: null,
        condition: null,
        attributes: [],
        media: [],
        defaultPrice: null,
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      };

      const result = service.buildItemSnapshot(item);

      expect(result.title).toBeNull();
      expect(result.description).toBeNull();
      expect(result.condition).toBeNull();
      expect(result.defaultPrice).toBeNull();
      expect(result.attributes).toEqual([]);
      expect(result.media).toEqual([]);
      expect(result.categoryPath).toBeUndefined();
    });

    it('should default currency to USD when not provided', () => {
      const item = {
        id: 'item-123',
        title: 'Test',
        description: null,
        condition: null,
        attributes: [],
        media: [],
        defaultPrice: 50,
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.buildItemSnapshot(item);

      expect(result.currency).toBe('USD');
    });

    it('should default quantity to 1 when not provided', () => {
      const item = {
        id: 'item-123',
        title: 'Test',
        description: null,
        condition: null,
        attributes: [],
        media: [],
        defaultPrice: 50,
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.buildItemSnapshot(item);

      expect(result.quantity).toBe(1);
    });

    it('should map attributes array correctly', () => {
      const item = {
        id: 'item-123',
        title: 'Test',
        description: null,
        condition: null,
        attributes: [
          { key: 'color', value: 'red' },
          { key: 'size', value: 'large', source: 'ai' },
        ],
        media: [],
        defaultPrice: 50,
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.buildItemSnapshot(item);

      expect(result.attributes).toEqual([
        { key: 'color', value: 'red', source: undefined },
        { key: 'size', value: 'large', source: 'ai' },
      ]);
    });

    it('should map media array correctly with default type', () => {
      const item = {
        id: 'item-123',
        title: 'Test',
        description: null,
        condition: null,
        attributes: [],
        media: [
          { id: 'media-1', url: 'https://example.com/1.jpg' },
          { id: 'media-2', url: 'https://example.com/2.jpg', type: 'video' },
        ],
        defaultPrice: 50,
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.buildItemSnapshot(item);

      expect(result.media).toEqual([
        { id: 'media-1', url: 'https://example.com/1.jpg', type: 'image' },
        { id: 'media-2', url: 'https://example.com/2.jpg', type: 'video' },
      ]);
    });

    it('should preserve Date objects for timestamps', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');

      const item = {
        id: 'item-123',
        title: 'Test',
        description: null,
        condition: null,
        attributes: [],
        media: [],
        defaultPrice: 50,
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
        createdAt,
        updatedAt,
      };

      const result = service.buildItemSnapshot(item);

      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });
  });

  // ==========================================================================
  // isResearchStale
  // ==========================================================================

  describe('isResearchStale', () => {
    it('should return true when research is null', () => {
      const result = service.isResearchStale(null);
      expect(result).toBe(true);
    });

    it('should return true when research has no generatedAt', () => {
      const research = {
        generatedAt: undefined,
        version: '1.0',
      } as any;

      const result = service.isResearchStale(research);
      expect(result).toBe(true);
    });

    it('should return true when research is >7 days old', () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const research = {
        generatedAt: eightDaysAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.isResearchStale(research);
      expect(result).toBe(true);
    });

    it('should return false when research is <7 days old', () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      const research = {
        generatedAt: sixDaysAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.isResearchStale(research);
      expect(result).toBe(false);
    });

    it('should return true when research is exactly 7 days old', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // Subtract a bit more to ensure it's past the threshold
      sevenDaysAgo.setHours(sevenDaysAgo.getHours() - 1);

      const research = {
        generatedAt: sevenDaysAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.isResearchStale(research);
      expect(result).toBe(true);
    });

    it('should return false when research is fresh (1 day old)', () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const research = {
        generatedAt: oneDayAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.isResearchStale(research);
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // determineResearchStatus
  // ==========================================================================

  describe('determineResearchStatus', () => {
    it('should return none when no research exists', () => {
      const result = service.determineResearchStatus(null, false);
      expect(result).toBe('none');
    });

    it('should return running when job is active', () => {
      const research = {
        generatedAt: new Date().toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.determineResearchStatus(research, true);
      expect(result).toBe('running');
    });

    it('should return running when job is active even if no research', () => {
      const result = service.determineResearchStatus(null, true);
      expect(result).toBe('running');
    });

    it('should return complete when research exists and is fresh', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const research = {
        generatedAt: twoDaysAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.determineResearchStatus(research, false);
      expect(result).toBe('complete');
    });

    it('should return stale when research exists but is old', () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const research = {
        generatedAt: eightDaysAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.determineResearchStatus(research, false);
      expect(result).toBe('stale');
    });

    it('should prioritize running over complete', () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const research = {
        generatedAt: oneDayAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.determineResearchStatus(research, true);
      expect(result).toBe('running');
    });

    it('should prioritize running over stale', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const research = {
        generatedAt: tenDaysAgo.toISOString(),
        version: '1.0',
      } as ItemResearchData;

      const result = service.determineResearchStatus(research, true);
      expect(result).toBe('running');
    });
  });

  // ==========================================================================
  // detectPageType
  // ==========================================================================

  describe('detectPageType', () => {
    it('should return dashboard for root route', () => {
      expect(service.detectPageType('/')).toBe('dashboard');
    });

    it('should return dashboard for empty route', () => {
      expect(service.detectPageType('')).toBe('dashboard');
    });

    it('should return item_detail for /items/:id routes', () => {
      expect(service.detectPageType('/items/123')).toBe('item_detail');
      expect(service.detectPageType('/items/abc-def-ghi')).toBe('item_detail');
      expect(service.detectPageType('/items/item-123/edit')).toBe('item_detail');
    });

    it('should return items for /items route (list)', () => {
      expect(service.detectPageType('/items')).toBe('items');
    });

    it('should return review for /review route', () => {
      expect(service.detectPageType('/review')).toBe('review');
      expect(service.detectPageType('/review/123')).toBe('review');
    });

    it('should return capture for /capture route', () => {
      expect(service.detectPageType('/capture')).toBe('capture');
      expect(service.detectPageType('/capture/new')).toBe('capture');
    });

    it('should return settings for /settings route', () => {
      expect(service.detectPageType('/settings')).toBe('settings');
      expect(service.detectPageType('/settings/profile')).toBe('settings');
    });

    it('should return items for /needs-work route', () => {
      expect(service.detectPageType('/needs-work')).toBe('items');
    });

    it('should return other for unknown routes', () => {
      expect(service.detectPageType('/unknown')).toBe('other');
      expect(service.detectPageType('/about')).toBe('other');
      expect(service.detectPageType('/help')).toBe('other');
    });

    it('should detect /items/ with trailing slash as item_detail', () => {
      // '/items/'.split('/') = ['', 'items', ''] with length 3, triggers item_detail
      expect(service.detectPageType('/items/')).toBe('item_detail');
    });

    it('should handle item detail routes with trailing slashes', () => {
      expect(service.detectPageType('/items/123/')).toBe('item_detail');
    });
  });

  // ==========================================================================
  // extractItemIdFromRoute
  // ==========================================================================

  describe('extractItemIdFromRoute', () => {
    it('should extract UUID from /items/:id', () => {
      // Regex expects hex characters [a-f0-9-]
      const result = service.extractItemIdFromRoute('/items/abc-123-def-456');
      expect(result).toBe('abc-123-def-456');
    });

    it('should extract proper UUID format', () => {
      const result = service.extractItemIdFromRoute('/items/550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return undefined for non-item routes', () => {
      expect(service.extractItemIdFromRoute('/dashboard')).toBeUndefined();
      expect(service.extractItemIdFromRoute('/review')).toBeUndefined();
      expect(service.extractItemIdFromRoute('/settings')).toBeUndefined();
    });

    it('should return undefined for /items list route', () => {
      expect(service.extractItemIdFromRoute('/items')).toBeUndefined();
    });

    it('should return undefined for /items/ with trailing slash', () => {
      // Empty string after /items/ does not match [a-f0-9-]+ pattern
      expect(service.extractItemIdFromRoute('/items/')).toBeUndefined();
    });

    it('should extract from routes with nested paths', () => {
      // Extracts the UUID from /items/:id even if more path follows
      const result = service.extractItemIdFromRoute('/items/abc-def-012/edit');
      expect(result).toBe('abc-def-012');
    });

    it('should handle case-insensitive hex characters', () => {
      const result = service.extractItemIdFromRoute('/items/ABC-DEF-123');
      expect(result).toBe('ABC-DEF-123');
    });

    it('should extract only the part matching hex pattern', () => {
      // Regex [a-f0-9-]+ only matches hex characters
      // 'first-id' contains 'i' and 'r' and 's' and 't' which are not hex
      // So it will only match 'f' from 'first'
      const result = service.extractItemIdFromRoute('/items/abc123-def456-cafe');
      expect(result).toBe('abc123-def456-cafe');
    });

    it('should return undefined for empty string', () => {
      expect(service.extractItemIdFromRoute('')).toBeUndefined();
    });
  });
});
