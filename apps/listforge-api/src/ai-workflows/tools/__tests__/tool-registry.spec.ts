import {
  TOOL_REGISTRY,
  getToolsForContext,
  getToolsByCategory,
  getToolMetadata,
  ToolMetadata,
} from '../tool-registry';
import { ChatToolDependencies } from '../index';
import { StructuredTool } from '@langchain/core/tools';

describe('Tool Registry', () => {
  // ============================================================================
  // Mock Dependencies
  // ============================================================================
  const mockDeps: ChatToolDependencies = {
    getItem: jest.fn(),
    updateItem: jest.fn(),
    searchItems: jest.fn(),
    getLatestResearch: jest.fn(),
    searchComps: jest.fn(),
    startResearchJob: jest.fn(),
    searchEvidence: jest.fn(),
    getDashboardStats: jest.fn(),
    getReviewQueueStats: jest.fn(),
    emitAction: jest.fn(),
    researchField: jest.fn(),
  };

  // ============================================================================
  // Registry Structure Tests
  // ============================================================================
  describe('TOOL_REGISTRY Structure', () => {
    it('should contain all expected tools', () => {
      const toolNames = TOOL_REGISTRY.map((meta) => meta.name);

      // Item tools
      expect(toolNames).toContain('get_item_snapshot');
      expect(toolNames).toContain('get_item_facet');
      expect(toolNames).toContain('update_item_field');

      // Research tools
      expect(toolNames).toContain('get_research_data');
      expect(toolNames).toContain('search_comps');
      expect(toolNames).toContain('trigger_research');

      // Search tools
      expect(toolNames).toContain('search_items');
      expect(toolNames).toContain('search_research');
      expect(toolNames).toContain('search_evidence');

      // Aggregate tools
      expect(toolNames).toContain('get_dashboard_stats');
      expect(toolNames).toContain('get_review_queue_summary');
      expect(toolNames).toContain('get_inventory_value');

      // Action tools
      expect(toolNames).toContain('suggest_action');

      // Domain knowledge tools (Slice 1)
      expect(toolNames).toContain('decode_identifier');
      expect(toolNames).toContain('check_authenticity');
      expect(toolNames).toContain('get_value_drivers');
      expect(toolNames).toContain('explain_pricing');
      expect(toolNames).toContain('validate_comp');
    });

    it('should have valid metadata for each tool', () => {
      TOOL_REGISTRY.forEach((meta) => {
        expect(meta.name).toBeDefined();
        expect(meta.factory).toBeDefined();
        expect(typeof meta.factory).toBe('function');
        expect(meta.category).toBeDefined();
        expect(meta.requiredContext).toBeDefined();
        expect(Array.isArray(meta.availableInPages)).toBe(true);
      });
    });

    it('should categorize tools correctly', () => {
      const itemTools = TOOL_REGISTRY.filter((m) => m.category === 'item');
      const researchTools = TOOL_REGISTRY.filter((m) => m.category === 'research');
      const searchTools = TOOL_REGISTRY.filter((m) => m.category === 'search');
      const aggregateTools = TOOL_REGISTRY.filter((m) => m.category === 'aggregate');
      const actionTools = TOOL_REGISTRY.filter((m) => m.category === 'action');
      const domainTools = TOOL_REGISTRY.filter((m) => m.category === 'domain');

      expect(itemTools.length).toBe(3); // get_item_snapshot, get_item_facet, update_item_field
      expect(researchTools.length).toBe(3); // get_research_data, search_comps, trigger_research
      expect(searchTools.length).toBe(3); // search_items, search_research, search_evidence
      expect(aggregateTools.length).toBe(3); // get_dashboard_stats, get_review_queue_summary, get_inventory_value
      expect(actionTools.length).toBe(1); // suggest_action
      expect(domainTools.length).toBe(5); // decode_identifier, check_authenticity, get_value_drivers, explain_pricing, validate_comp
    });

    it('should have unique tool names', () => {
      const names = TOOL_REGISTRY.map((meta) => meta.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  // ============================================================================
  // getToolsForContext Tests - Core Filtering Logic
  // ============================================================================
  describe('getToolsForContext', () => {
    describe('Item Detail Page Context', () => {
      const itemDetailContext = {
        pageType: 'item_detail',
        hasItemId: true,
        organizationId: 'org-123',
      };

      it('should return item tools on item_detail page with itemId', () => {
        const tools = getToolsForContext(mockDeps, itemDetailContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_item_snapshot');
        expect(toolNames).toContain('get_item_facet');
        expect(toolNames).toContain('update_item_field');
      });

      it('should return research tools on item_detail page', () => {
        const tools = getToolsForContext(mockDeps, itemDetailContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_research_data');
        expect(toolNames).toContain('trigger_research');
        expect(toolNames).toContain('search_comps'); // Available on multiple pages
      });

      it('should return domain tools on item_detail page', () => {
        const tools = getToolsForContext(mockDeps, itemDetailContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('decode_identifier');
        expect(toolNames).toContain('check_authenticity');
        expect(toolNames).toContain('get_value_drivers');
        expect(toolNames).toContain('explain_pricing');
        expect(toolNames).toContain('validate_comp');
      });

      it('should always include suggest_action (alwaysAvailable: true)', () => {
        const tools = getToolsForContext(mockDeps, itemDetailContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('suggest_action');
      });

      it('should exclude search tools not available on item_detail', () => {
        const tools = getToolsForContext(mockDeps, itemDetailContext);
        const toolNames = tools.map((t) => t.name);

        // search_items is only on dashboard, items, review, other
        expect(toolNames).not.toContain('search_items');
        expect(toolNames).not.toContain('search_research');
        expect(toolNames).not.toContain('search_evidence');
      });

      it('should exclude aggregate tools not available on item_detail', () => {
        const tools = getToolsForContext(mockDeps, itemDetailContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).not.toContain('get_dashboard_stats');
        expect(toolNames).not.toContain('get_inventory_value');
      });
    });

    describe('Dashboard Page Context', () => {
      const dashboardContext = {
        pageType: 'dashboard',
        hasItemId: false,
        organizationId: 'org-123',
      };

      it('should exclude item tools on dashboard (no itemId)', () => {
        const tools = getToolsForContext(mockDeps, dashboardContext);
        const toolNames = tools.map((t) => t.name);

        // All item tools require itemId
        expect(toolNames).not.toContain('get_item_snapshot');
        expect(toolNames).not.toContain('get_item_facet');
        expect(toolNames).not.toContain('update_item_field');
        expect(toolNames).not.toContain('get_research_data');
        expect(toolNames).not.toContain('trigger_research');
      });

      it('should return aggregate tools on dashboard', () => {
        const tools = getToolsForContext(mockDeps, dashboardContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_dashboard_stats');
        expect(toolNames).toContain('get_review_queue_summary');
        expect(toolNames).toContain('get_inventory_value');
      });

      it('should return search tools on dashboard', () => {
        const tools = getToolsForContext(mockDeps, dashboardContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('search_items');
        expect(toolNames).toContain('search_research');
        expect(toolNames).toContain('search_evidence');
      });

      it('should include search_comps on dashboard', () => {
        const tools = getToolsForContext(mockDeps, dashboardContext);
        const toolNames = tools.map((t) => t.name);

        // search_comps is available on multiple pages including dashboard
        expect(toolNames).toContain('search_comps');
      });

      it('should always include suggest_action', () => {
        const tools = getToolsForContext(mockDeps, dashboardContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('suggest_action');
      });
    });

    describe('Review Page Context', () => {
      const reviewContext = {
        pageType: 'review',
        hasItemId: true,
        organizationId: 'org-123',
      };

      it('should return item tools on review page with itemId', () => {
        const tools = getToolsForContext(mockDeps, reviewContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_item_snapshot');
        expect(toolNames).toContain('get_item_facet');
        expect(toolNames).toContain('update_item_field');
      });

      it('should return research tools on review page', () => {
        const tools = getToolsForContext(mockDeps, reviewContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_research_data');
        expect(toolNames).toContain('trigger_research');
        expect(toolNames).toContain('search_comps');
      });

      it('should return get_review_queue_summary on review page', () => {
        const tools = getToolsForContext(mockDeps, reviewContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_review_queue_summary');
      });

      it('should return search tools on review page', () => {
        const tools = getToolsForContext(mockDeps, reviewContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('search_items');
        expect(toolNames).toContain('search_research');
        expect(toolNames).toContain('search_evidence');
      });

      it('should return domain tools on review page', () => {
        const tools = getToolsForContext(mockDeps, reviewContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('decode_identifier');
        expect(toolNames).toContain('check_authenticity');
        expect(toolNames).toContain('get_value_drivers');
        expect(toolNames).toContain('explain_pricing');
        expect(toolNames).toContain('validate_comp');
      });
    });

    describe('Items List Page Context', () => {
      const itemsContext = {
        pageType: 'items',
        hasItemId: false,
        organizationId: 'org-123',
      };

      it('should exclude item-specific tools without itemId', () => {
        const tools = getToolsForContext(mockDeps, itemsContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).not.toContain('get_item_snapshot');
        expect(toolNames).not.toContain('get_item_facet');
        expect(toolNames).not.toContain('update_item_field');
        expect(toolNames).not.toContain('get_research_data');
        expect(toolNames).not.toContain('trigger_research');
      });

      it('should include search_comps on items page', () => {
        const tools = getToolsForContext(mockDeps, itemsContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('search_comps');
      });

      it('should include get_inventory_value on items page', () => {
        const tools = getToolsForContext(mockDeps, itemsContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_inventory_value');
      });

      it('should include search tools on items page', () => {
        const tools = getToolsForContext(mockDeps, itemsContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('search_items');
        expect(toolNames).toContain('search_research');
        expect(toolNames).toContain('search_evidence');
      });
    });

    describe('Capture Page Context', () => {
      const captureContext = {
        pageType: 'capture',
        hasItemId: true,
        organizationId: 'org-123',
      };

      it('should include item read tools on capture page', () => {
        const tools = getToolsForContext(mockDeps, captureContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_item_snapshot');
        expect(toolNames).toContain('get_item_facet');
      });

      it('should exclude update_item_field on capture page', () => {
        const tools = getToolsForContext(mockDeps, captureContext);
        const toolNames = tools.map((t) => t.name);

        // update_item_field is only on item_detail and review
        expect(toolNames).not.toContain('update_item_field');
      });
    });

    describe('Settings Page Context', () => {
      const settingsContext = {
        pageType: 'settings',
        hasItemId: false,
        organizationId: 'org-123',
      };

      it('should only include suggest_action (alwaysAvailable)', () => {
        const tools = getToolsForContext(mockDeps, settingsContext);
        const toolNames = tools.map((t) => t.name);

        // Settings page has no tools in their availableInPages, only universal tools
        expect(toolNames).toContain('suggest_action');
        expect(toolNames.length).toBe(1);
      });
    });

    describe('Other Page Type Context', () => {
      const otherContext = {
        pageType: 'other',
        hasItemId: false,
        organizationId: 'org-123',
      };

      it('should include search tools on other page', () => {
        const tools = getToolsForContext(mockDeps, otherContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('search_items');
        expect(toolNames).toContain('search_research');
        expect(toolNames).toContain('search_evidence');
      });

      it('should include search_comps on other page', () => {
        const tools = getToolsForContext(mockDeps, otherContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('search_comps');
      });

      it('should include aggregate tools on other page', () => {
        const tools = getToolsForContext(mockDeps, otherContext);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('get_dashboard_stats');
        expect(toolNames).toContain('get_review_queue_summary');
        expect(toolNames).toContain('get_inventory_value');
      });
    });

    describe('Required Context Filtering', () => {
      it('should filter by requiredContext.itemId when hasItemId is false', () => {
        const context = {
          pageType: 'review', // review page normally has item tools
          hasItemId: false, // but no itemId in context
          organizationId: 'org-123',
        };

        const tools = getToolsForContext(mockDeps, context);
        const toolNames = tools.map((t) => t.name);

        // Should exclude all tools requiring itemId
        expect(toolNames).not.toContain('get_item_snapshot');
        expect(toolNames).not.toContain('get_item_facet');
        expect(toolNames).not.toContain('update_item_field');
        expect(toolNames).not.toContain('get_research_data');
        expect(toolNames).not.toContain('trigger_research');

        // Should include tools that don't require itemId
        expect(toolNames).toContain('search_comps'); // No itemId required
        expect(toolNames).toContain('suggest_action'); // alwaysAvailable
      });

      it('should include tools requiring only organizationId', () => {
        const context = {
          pageType: 'dashboard',
          hasItemId: false,
          organizationId: 'org-123',
        };

        const tools = getToolsForContext(mockDeps, context);
        const toolNames = tools.map((t) => t.name);

        // All these tools require only organizationId
        expect(toolNames).toContain('get_dashboard_stats');
        expect(toolNames).toContain('get_review_queue_summary');
        expect(toolNames).toContain('search_items');
      });

      it('should include tools requiring both itemId and organizationId when hasItemId is true', () => {
        const context = {
          pageType: 'item_detail',
          hasItemId: true,
          organizationId: 'org-123',
        };

        const tools = getToolsForContext(mockDeps, context);
        const toolNames = tools.map((t) => t.name);

        // All item tools require both
        expect(toolNames).toContain('get_item_snapshot');
        expect(toolNames).toContain('get_item_facet');
        expect(toolNames).toContain('update_item_field');
        expect(toolNames).toContain('get_research_data');
        expect(toolNames).toContain('trigger_research');
      });
    });

    describe('AlwaysAvailable Tools', () => {
      it('should always include suggest_action regardless of page context', () => {
        const pageTypes = ['item_detail', 'items', 'dashboard', 'review', 'capture', 'settings', 'other'];

        pageTypes.forEach((pageType) => {
          const context = {
            pageType,
            hasItemId: false,
            organizationId: 'org-123',
          };

          const tools = getToolsForContext(mockDeps, context);
          const toolNames = tools.map((t) => t.name);

          expect(toolNames).toContain('suggest_action');
        });
      });

      it('should include alwaysAvailable tools even on unrecognized pages', () => {
        const context = {
          pageType: 'unknown_page',
          hasItemId: false,
          organizationId: 'org-123',
        };

        const tools = getToolsForContext(mockDeps, context);
        const toolNames = tools.map((t) => t.name);

        expect(toolNames).toContain('suggest_action');
      });
    });

    describe('Tool Instance Creation', () => {
      it('should return StructuredTool instances', () => {
        const context = {
          pageType: 'dashboard',
          hasItemId: false,
          organizationId: 'org-123',
        };

        const tools = getToolsForContext(mockDeps, context);

        tools.forEach((tool) => {
          expect(tool).toBeDefined();
          expect(tool.name).toBeDefined();
          // StructuredTools should have these properties
          expect(typeof tool.invoke).toBe('function');
        });
      });

      it('should pass dependencies to tool factories', () => {
        const context = {
          pageType: 'dashboard',
          hasItemId: false,
          organizationId: 'org-123',
        };

        // Should not throw - factories should accept deps
        expect(() => getToolsForContext(mockDeps, context)).not.toThrow();
      });
    });

    describe('Different Tool Sets for Different Pages', () => {
      it('should return different tool sets for item_detail vs dashboard', () => {
        const itemDetailTools = getToolsForContext(mockDeps, {
          pageType: 'item_detail',
          hasItemId: true,
          organizationId: 'org-123',
        });

        const dashboardTools = getToolsForContext(mockDeps, {
          pageType: 'dashboard',
          hasItemId: false,
          organizationId: 'org-123',
        });

        const itemDetailNames = itemDetailTools.map((t) => t.name).sort();
        const dashboardNames = dashboardTools.map((t) => t.name).sort();

        // Should have different sets
        expect(itemDetailNames).not.toEqual(dashboardNames);

        // Item detail should have item tools
        expect(itemDetailNames).toContain('get_item_snapshot');

        // Dashboard should have aggregate tools
        expect(dashboardNames).toContain('get_dashboard_stats');
      });

      it('should return different tool sets for review vs items pages', () => {
        const reviewTools = getToolsForContext(mockDeps, {
          pageType: 'review',
          hasItemId: true,
          organizationId: 'org-123',
        });

        const itemsTools = getToolsForContext(mockDeps, {
          pageType: 'items',
          hasItemId: false,
          organizationId: 'org-123',
        });

        const reviewNames = reviewTools.map((t) => t.name).sort();
        const itemsNames = itemsTools.map((t) => t.name).sort();

        // Review with itemId should have item tools
        expect(reviewNames).toContain('get_item_snapshot');

        // Items without itemId should not
        expect(itemsNames).not.toContain('get_item_snapshot');
      });
    });

    describe('Empty availableInPages (All Pages)', () => {
      it('should include tools with empty availableInPages on all pages if alwaysAvailable', () => {
        const suggestActionMeta = TOOL_REGISTRY.find(
          (m) => m.name === 'suggest_action'
        );

        expect(suggestActionMeta?.availableInPages).toEqual([]);
        expect(suggestActionMeta?.alwaysAvailable).toBe(true);

        const pageTypes = ['item_detail', 'dashboard', 'settings'];
        pageTypes.forEach((pageType) => {
          const tools = getToolsForContext(mockDeps, {
            pageType,
            hasItemId: false,
            organizationId: 'org-123',
          });

          const toolNames = tools.map((t) => t.name);
          expect(toolNames).toContain('suggest_action');
        });
      });
    });
  });

  // ============================================================================
  // getToolsByCategory Tests
  // ============================================================================
  describe('getToolsByCategory', () => {
    it('should return only item category tools', () => {
      const tools = getToolsByCategory(mockDeps, 'item');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('get_item_snapshot');
      expect(toolNames).toContain('get_item_facet');
      expect(toolNames).toContain('update_item_field');
      expect(toolNames.length).toBe(3);

      // Should not contain other categories
      expect(toolNames).not.toContain('search_comps');
      expect(toolNames).not.toContain('suggest_action');
    });

    it('should return only research category tools', () => {
      const tools = getToolsByCategory(mockDeps, 'research');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('get_research_data');
      expect(toolNames).toContain('search_comps');
      expect(toolNames).toContain('trigger_research');
      expect(toolNames.length).toBe(3);

      // Should not contain other categories
      expect(toolNames).not.toContain('get_item_snapshot');
      expect(toolNames).not.toContain('suggest_action');
    });

    it('should return only search category tools', () => {
      const tools = getToolsByCategory(mockDeps, 'search');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('search_items');
      expect(toolNames).toContain('search_research');
      expect(toolNames).toContain('search_evidence');
      expect(toolNames.length).toBe(3);

      // Should not contain other categories
      expect(toolNames).not.toContain('get_item_snapshot');
      expect(toolNames).not.toContain('search_comps');
    });

    it('should return only aggregate category tools', () => {
      const tools = getToolsByCategory(mockDeps, 'aggregate');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('get_dashboard_stats');
      expect(toolNames).toContain('get_review_queue_summary');
      expect(toolNames).toContain('get_inventory_value');
      expect(toolNames.length).toBe(3);

      // Should not contain other categories
      expect(toolNames).not.toContain('get_item_snapshot');
      expect(toolNames).not.toContain('search_items');
    });

    it('should return only action category tools', () => {
      const tools = getToolsByCategory(mockDeps, 'action');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('suggest_action');
      expect(toolNames.length).toBe(1);

      // Should not contain other categories
      expect(toolNames).not.toContain('get_item_snapshot');
      expect(toolNames).not.toContain('search_items');
    });

    it('should return only domain category tools', () => {
      const tools = getToolsByCategory(mockDeps, 'domain');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('decode_identifier');
      expect(toolNames).toContain('check_authenticity');
      expect(toolNames).toContain('get_value_drivers');
      expect(toolNames).toContain('explain_pricing');
      expect(toolNames).toContain('validate_comp');
      expect(toolNames.length).toBe(5);

      // Should not contain other categories
      expect(toolNames).not.toContain('get_item_snapshot');
      expect(toolNames).not.toContain('search_items');
      expect(toolNames).not.toContain('suggest_action');
    });

    it('should return StructuredTool instances', () => {
      const tools = getToolsByCategory(mockDeps, 'item');

      tools.forEach((tool) => {
        expect(tool).toBeDefined();
        expect(tool.name).toBeDefined();
        expect(typeof tool.invoke).toBe('function');
      });
    });
  });

  // ============================================================================
  // getToolMetadata Tests
  // ============================================================================
  describe('getToolMetadata', () => {
    it('should return metadata for known tool name', () => {
      const metadata = getToolMetadata('get_item_snapshot');

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('get_item_snapshot');
      expect(metadata?.category).toBe('item');
      expect(metadata?.factory).toBeDefined();
      expect(metadata?.requiredContext.itemId).toBe(true);
      expect(metadata?.requiredContext.organizationId).toBe(true);
    });

    it('should return metadata for all registered tools', () => {
      const toolNames = [
        'get_item_snapshot',
        'get_item_facet',
        'update_item_field',
        'get_research_data',
        'search_comps',
        'trigger_research',
        'search_items',
        'search_research',
        'search_evidence',
        'get_dashboard_stats',
        'get_review_queue_summary',
        'get_inventory_value',
        'suggest_action',
        // Domain knowledge tools (Slice 1)
        'decode_identifier',
        'check_authenticity',
        'get_value_drivers',
        'explain_pricing',
        'validate_comp',
      ];

      toolNames.forEach((name) => {
        const metadata = getToolMetadata(name);
        expect(metadata).toBeDefined();
        expect(metadata?.name).toBe(name);
      });
    });

    it('should return undefined for unknown tool name', () => {
      const metadata = getToolMetadata('unknown_tool');
      expect(metadata).toBeUndefined();
    });

    it('should return metadata with correct category', () => {
      const itemMeta = getToolMetadata('get_item_snapshot');
      const researchMeta = getToolMetadata('search_comps');
      const searchMeta = getToolMetadata('search_items');
      const aggregateMeta = getToolMetadata('get_dashboard_stats');
      const actionMeta = getToolMetadata('suggest_action');
      const domainMeta = getToolMetadata('decode_identifier');

      expect(itemMeta?.category).toBe('item');
      expect(researchMeta?.category).toBe('research');
      expect(searchMeta?.category).toBe('search');
      expect(aggregateMeta?.category).toBe('aggregate');
      expect(actionMeta?.category).toBe('action');
      expect(domainMeta?.category).toBe('domain');
    });

    it('should return metadata with correct requiredContext', () => {
      const itemToolMeta = getToolMetadata('get_item_snapshot');
      const searchToolMeta = getToolMetadata('search_items');

      expect(itemToolMeta?.requiredContext.itemId).toBe(true);
      expect(itemToolMeta?.requiredContext.organizationId).toBe(true);

      expect(searchToolMeta?.requiredContext.itemId).toBeUndefined();
      expect(searchToolMeta?.requiredContext.organizationId).toBe(true);
    });

    it('should return metadata with correct availableInPages', () => {
      const itemDetailOnlyMeta = getToolMetadata('get_research_data');
      const multiPageMeta = getToolMetadata('search_comps');
      const alwaysAvailableMeta = getToolMetadata('suggest_action');

      expect(itemDetailOnlyMeta?.availableInPages).toContain('item_detail');
      expect(itemDetailOnlyMeta?.availableInPages).toContain('review');

      expect(multiPageMeta?.availableInPages).toContain('item_detail');
      expect(multiPageMeta?.availableInPages).toContain('review');
      expect(multiPageMeta?.availableInPages).toContain('dashboard');
      expect(multiPageMeta?.availableInPages).toContain('items');
      expect(multiPageMeta?.availableInPages).toContain('other');

      expect(alwaysAvailableMeta?.availableInPages).toEqual([]);
      expect(alwaysAvailableMeta?.alwaysAvailable).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle empty string pageType', () => {
      const context = {
        pageType: '',
        hasItemId: false,
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // Should only include alwaysAvailable tools
      expect(toolNames).toContain('suggest_action');
    });

    it('should handle unusual pageType values', () => {
      const context = {
        pageType: 'custom_page_type',
        hasItemId: false,
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // Should include alwaysAvailable tools
      expect(toolNames).toContain('suggest_action');

      // Should not include page-specific tools
      expect(toolNames).not.toContain('get_item_snapshot');
    });

    it('should handle context with hasItemId true on pages without item tools', () => {
      const context = {
        pageType: 'settings',
        hasItemId: true, // Has itemId but settings page doesn't define item tools
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // Settings page has no tools in availableInPages
      // Should only get alwaysAvailable
      expect(toolNames).toContain('suggest_action');
      expect(toolNames).not.toContain('get_item_snapshot');
    });

    it('should return empty array when no tools match criteria (except alwaysAvailable)', () => {
      const context = {
        pageType: 'nonexistent_page',
        hasItemId: false,
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // Only alwaysAvailable tools should be returned
      expect(toolNames).toEqual(['suggest_action']);
    });
  });

  // ============================================================================
  // Integration Tests - Real-World Scenarios
  // ============================================================================
  describe('Real-World Scenarios', () => {
    it('should provide correct tools for user viewing an item', () => {
      const context = {
        pageType: 'item_detail',
        hasItemId: true,
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // User should be able to:
      // - View item details
      expect(toolNames).toContain('get_item_snapshot');
      expect(toolNames).toContain('get_item_facet');

      // - Update item
      expect(toolNames).toContain('update_item_field');

      // - View and trigger research
      expect(toolNames).toContain('get_research_data');
      expect(toolNames).toContain('trigger_research');

      // - Search comparables
      expect(toolNames).toContain('search_comps');

      // - Get action suggestions
      expect(toolNames).toContain('suggest_action');
    });

    it('should provide correct tools for user on dashboard', () => {
      const context = {
        pageType: 'dashboard',
        hasItemId: false,
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // User should be able to:
      // - View dashboard stats
      expect(toolNames).toContain('get_dashboard_stats');
      expect(toolNames).toContain('get_review_queue_summary');
      expect(toolNames).toContain('get_inventory_value');

      // - Search for items/research
      expect(toolNames).toContain('search_items');
      expect(toolNames).toContain('search_research');
      expect(toolNames).toContain('search_evidence');

      // - Search comparables (for general price research)
      expect(toolNames).toContain('search_comps');

      // - Get action suggestions
      expect(toolNames).toContain('suggest_action');

      // Should NOT be able to access item-specific tools
      expect(toolNames).not.toContain('get_item_snapshot');
      expect(toolNames).not.toContain('update_item_field');
    });

    it('should provide correct tools for user reviewing items', () => {
      const context = {
        pageType: 'review',
        hasItemId: true,
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // User should have full access to item and research tools
      expect(toolNames).toContain('get_item_snapshot');
      expect(toolNames).toContain('get_item_facet');
      expect(toolNames).toContain('update_item_field');
      expect(toolNames).toContain('get_research_data');
      expect(toolNames).toContain('trigger_research');

      // Plus review-specific stats
      expect(toolNames).toContain('get_review_queue_summary');

      // Plus search capabilities
      expect(toolNames).toContain('search_items');
      expect(toolNames).toContain('search_comps');
    });

    it('should provide minimal tools for user in settings', () => {
      const context = {
        pageType: 'settings',
        hasItemId: false,
        organizationId: 'org-123',
      };

      const tools = getToolsForContext(mockDeps, context);
      const toolNames = tools.map((t) => t.name);

      // Settings page should have minimal tools
      // Only universal tools available
      expect(toolNames).toEqual(['suggest_action']);
    });
  });
});
