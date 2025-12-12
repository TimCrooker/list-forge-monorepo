import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ChatGraphService } from '../chat-graph.service';
import { Item } from '../../../items/entities/item.entity';
import { ResearchService } from '../../../research/research.service';
import { ChatService } from '../../../chat/chat.service';
import { LLMConfigService } from '../../config/llm.config';
import { ChatContextService } from '../chat-context.service';
import { ActionEmitterService } from '../action-emitter.service';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

/**
 * Multi-Tenancy Security Tests for ChatGraphService
 *
 * These tests verify that the service properly enforces organization-level
 * access control to prevent cross-org data leakage. This is CRITICAL for
 * data security in a multi-tenant application.
 *
 * Test Coverage:
 * 1. verifyOrganizationAccess - Authorization checks
 * 2. buildToolDependencies.getItem - Cross-org prevention
 * 3. buildToolDependencies.updateItem - Cross-org prevention
 * 4. buildToolDependencies.getLatestResearch - Cross-org prevention
 * 5. buildToolDependencies.searchItems - Organization filtering
 */
describe('ChatGraphService - Multi-Tenancy Security', () => {
  let service: ChatGraphService;
  let itemRepo: jest.Mocked<Repository<Item>>;
  let researchService: jest.Mocked<ResearchService>;
  let chatService: jest.Mocked<ChatService>;
  let llmConfigService: jest.Mocked<LLMConfigService>;
  let chatContextService: jest.Mocked<ChatContextService>;
  let actionEmitterService: jest.Mocked<ActionEmitterService>;
  let aiWorkflowQueue: jest.Mocked<Queue>;

  // Test data
  const ORG_ID_A = 'org-aaa-111';
  const ORG_ID_B = 'org-bbb-222';
  const USER_ID_A = 'user-aaa-111';
  const ITEM_ID_1 = 'item-111';
  const ITEM_ID_2 = 'item-222';

  beforeEach(async () => {
    // Create mock implementations
    const mockItemRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockResearchService = {
      findLatestResearch: jest.fn(),
    };

    const mockChatService = {
      getRecentMessages: jest.fn(),
    };

    const mockLLMConfigService = {
      getLLM: jest.fn(),
    };

    const mockChatContextService = {
      buildItemSnapshot: jest.fn(),
      isResearchStale: jest.fn(),
      determineResearchStatus: jest.fn(),
    };

    const mockActionEmitterService = {
      emitAction: jest.fn(),
      emitToolProgress: jest.fn(),
      flushPendingActions: jest.fn(),
      clearPendingActions: jest.fn(),
    };

    const mockAiWorkflowQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGraphService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepo,
        },
        {
          provide: ResearchService,
          useValue: mockResearchService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: LLMConfigService,
          useValue: mockLLMConfigService,
        },
        {
          provide: ChatContextService,
          useValue: mockChatContextService,
        },
        {
          provide: ActionEmitterService,
          useValue: mockActionEmitterService,
        },
        {
          provide: getQueueToken(QUEUE_AI_WORKFLOW),
          useValue: mockAiWorkflowQueue,
        },
      ],
    }).compile();

    service = module.get<ChatGraphService>(ChatGraphService);
    itemRepo = module.get(getRepositoryToken(Item));
    researchService = module.get(ResearchService);
    chatService = module.get(ChatService);
    llmConfigService = module.get(LLMConfigService);
    chatContextService = module.get(ChatContextService);
    actionEmitterService = module.get(ActionEmitterService);
    aiWorkflowQueue = module.get(getQueueToken(QUEUE_AI_WORKFLOW));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // verifyOrganizationAccess
  // ==========================================================================

  describe('verifyOrganizationAccess', () => {
    it('should throw when userId is missing', async () => {
      // Access the private method via reflection for testing
      const verifyAccess = (service as any).verifyOrganizationAccess.bind(service);

      await expect(verifyAccess('', ORG_ID_A)).rejects.toThrow(
        'Authorization failed: userId and organizationId required'
      );

      await expect(verifyAccess(null, ORG_ID_A)).rejects.toThrow(
        'Authorization failed: userId and organizationId required'
      );

      await expect(verifyAccess(undefined, ORG_ID_A)).rejects.toThrow(
        'Authorization failed: userId and organizationId required'
      );
    });

    it('should throw when organizationId is missing', async () => {
      const verifyAccess = (service as any).verifyOrganizationAccess.bind(service);

      await expect(verifyAccess(USER_ID_A, '')).rejects.toThrow(
        'Authorization failed: userId and organizationId required'
      );

      await expect(verifyAccess(USER_ID_A, null)).rejects.toThrow(
        'Authorization failed: userId and organizationId required'
      );

      await expect(verifyAccess(USER_ID_A, undefined)).rejects.toThrow(
        'Authorization failed: userId and organizationId required'
      );
    });

    it('should not throw when both userId and organizationId are present', async () => {
      const verifyAccess = (service as any).verifyOrganizationAccess.bind(service);

      await expect(verifyAccess(USER_ID_A, ORG_ID_A)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // buildToolDependencies - getItem
  // ==========================================================================

  describe('buildToolDependencies - getItem', () => {
    it('should return item when item belongs to organization', async () => {
      const mockItem = {
        id: ITEM_ID_1,
        organizationId: ORG_ID_A,
        title: 'Test Item',
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
      } as Item;

      itemRepo.findOne.mockResolvedValue(mockItem);

      // Build dependencies and call getItem
      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.getItem(ORG_ID_A, ITEM_ID_1);

      expect(result).toEqual(mockItem);
      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_1, organizationId: ORG_ID_A },
      });
    });

    it('should throw when item belongs to different organization', async () => {
      // Item belongs to ORG_ID_B but user is trying to access from ORG_ID_A
      const mockItem = {
        id: ITEM_ID_1,
        organizationId: ORG_ID_B, // Different org!
        title: 'Test Item',
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
      } as Item;

      itemRepo.findOne.mockResolvedValue(mockItem);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      await expect(deps.getItem(ORG_ID_A, ITEM_ID_1)).rejects.toThrow(
        'Authorization failed: item does not belong to organization'
      );

      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_1, organizationId: ORG_ID_A },
      });
    });

    it('should return null when item not found', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.getItem(ORG_ID_A, ITEM_ID_1);

      expect(result).toBeNull();
      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_1, organizationId: ORG_ID_A },
      });
    });

    it('should never find items from other organizations', async () => {
      // Simulate repository not finding the item because orgId doesn't match
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      // Try to access item from ORG_ID_B while authenticated as ORG_ID_A
      const result = await deps.getItem(ORG_ID_A, ITEM_ID_2);

      expect(result).toBeNull();
      // Verify query includes organization filter
      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_2, organizationId: ORG_ID_A },
      });
    });
  });

  // ==========================================================================
  // buildToolDependencies - updateItem
  // ==========================================================================

  describe('buildToolDependencies - updateItem', () => {
    it('should update item when item belongs to organization', async () => {
      const mockItem = {
        id: ITEM_ID_1,
        organizationId: ORG_ID_A,
        title: 'Original Title',
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
      } as Item;

      const updatedItem = {
        ...mockItem,
        title: 'Updated Title',
      } as Item;

      itemRepo.findOne
        .mockResolvedValueOnce(mockItem) // First call to verify existence
        .mockResolvedValueOnce(updatedItem); // Second call to return updated item

      itemRepo.update.mockResolvedValue({ affected: 1 } as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.updateItem(ORG_ID_A, ITEM_ID_1, { title: 'Updated Title' });

      expect(result).toEqual(updatedItem);
      expect(itemRepo.findOne).toHaveBeenCalledTimes(2);
      expect(itemRepo.update).toHaveBeenCalledWith(
        { id: ITEM_ID_1, organizationId: ORG_ID_A },
        { title: 'Updated Title' }
      );
    });

    it('should throw when item belongs to different organization', async () => {
      // Item belongs to ORG_ID_B but user is trying to update from ORG_ID_A
      const mockItem = {
        id: ITEM_ID_1,
        organizationId: ORG_ID_B, // Different org!
        title: 'Test Item',
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
      } as Item;

      itemRepo.findOne.mockResolvedValue(mockItem);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      await expect(
        deps.updateItem(ORG_ID_A, ITEM_ID_1, { title: 'Hacked Title' })
      ).rejects.toThrow('Authorization failed: item does not belong to organization');

      // Verify update was never called
      expect(itemRepo.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      await expect(
        deps.updateItem(ORG_ID_A, ITEM_ID_1, { title: 'Updated Title' })
      ).rejects.toThrow(NotFoundException);

      await expect(
        deps.updateItem(ORG_ID_A, ITEM_ID_1, { title: 'Updated Title' })
      ).rejects.toThrow(`Item ${ITEM_ID_1} not found`);

      // Verify update was never called
      expect(itemRepo.update).not.toHaveBeenCalled();
    });

    it('should prevent cross-org updates even with valid item ID', async () => {
      // First call returns null because item doesn't belong to ORG_ID_A
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      // Try to update item from ORG_ID_B while authenticated as ORG_ID_A
      await expect(
        deps.updateItem(ORG_ID_A, ITEM_ID_2, { title: 'Malicious Update' })
      ).rejects.toThrow(NotFoundException);

      // Verify query includes organization filter
      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_2, organizationId: ORG_ID_A },
      });

      // Verify update was never called
      expect(itemRepo.update).not.toHaveBeenCalled();
    });

    it('should include organizationId in update query to prevent race conditions', async () => {
      const mockItem = {
        id: ITEM_ID_1,
        organizationId: ORG_ID_A,
        title: 'Original Title',
        lifecycleStatus: 'draft',
        aiReviewState: 'none',
      } as Item;

      itemRepo.findOne.mockResolvedValue(mockItem);
      itemRepo.update.mockResolvedValue({ affected: 1 } as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.updateItem(ORG_ID_A, ITEM_ID_1, { title: 'Updated Title' });

      // Critical: update query MUST include organizationId
      expect(itemRepo.update).toHaveBeenCalledWith(
        { id: ITEM_ID_1, organizationId: ORG_ID_A },
        expect.any(Object)
      );
    });
  });

  // ==========================================================================
  // buildToolDependencies - getLatestResearch
  // ==========================================================================

  describe('buildToolDependencies - getLatestResearch', () => {
    it('should return research when item belongs to organization', async () => {
      const mockItem = {
        id: ITEM_ID_1,
        organizationId: ORG_ID_A,
        title: 'Test Item',
        lifecycleStatus: 'draft',
        aiReviewState: 'ai_reviewed',
      } as Item;

      const mockResearch = {
        id: 'research-1',
        itemId: ITEM_ID_1,
        data: {
          version: '1.0',
          generatedAt: new Date().toISOString(),
        },
      };

      itemRepo.findOne.mockResolvedValue(mockItem);
      researchService.findLatestResearch.mockResolvedValue(mockResearch as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.getLatestResearch(ITEM_ID_1, ORG_ID_A);

      expect(result).toEqual(mockResearch);
      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_1, organizationId: ORG_ID_A },
      });
      expect(researchService.findLatestResearch).toHaveBeenCalledWith(ITEM_ID_1, ORG_ID_A);
    });

    it('should throw when item belongs to different organization', async () => {
      // Item belongs to ORG_ID_B but user is trying to access from ORG_ID_A
      const mockItem = {
        id: ITEM_ID_1,
        organizationId: ORG_ID_B, // Different org!
        title: 'Test Item',
        lifecycleStatus: 'draft',
        aiReviewState: 'ai_reviewed',
      } as Item;

      itemRepo.findOne.mockResolvedValue(mockItem);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      await expect(deps.getLatestResearch(ITEM_ID_1, ORG_ID_A)).rejects.toThrow(
        'Authorization failed: item does not belong to organization'
      );

      // Verify research service was never called
      expect(researchService.findLatestResearch).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when item not found', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      await expect(deps.getLatestResearch(ITEM_ID_1, ORG_ID_A)).rejects.toThrow(NotFoundException);

      await expect(deps.getLatestResearch(ITEM_ID_1, ORG_ID_A)).rejects.toThrow(
        `Item ${ITEM_ID_1} not found`
      );

      // Verify research service was never called
      expect(researchService.findLatestResearch).not.toHaveBeenCalled();
    });

    it('should prevent accessing research from other organizations', async () => {
      // Simulate repository not finding the item because orgId doesn't match
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      // Try to access research for item from ORG_ID_B while authenticated as ORG_ID_A
      await expect(deps.getLatestResearch(ITEM_ID_2, ORG_ID_A)).rejects.toThrow(NotFoundException);

      // Verify query includes organization filter
      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_2, organizationId: ORG_ID_A },
      });

      // Verify research service was never called
      expect(researchService.findLatestResearch).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // buildToolDependencies - searchItems
  // ==========================================================================

  describe('buildToolDependencies - searchItems', () => {
    it('should only return items from the specified organization', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: ITEM_ID_1,
              organizationId: ORG_ID_A,
              title: 'Item 1',
              lifecycleStatus: 'draft',
              aiReviewState: 'none',
            },
          ],
          1,
        ]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.searchItems(ORG_ID_A, { query: 'test' });

      expect(result).toHaveLength(1);
      expect(result[0].organizationId).toBe(ORG_ID_A);

      // Verify organization filter is applied
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });
    });

    it('should never return items from other organizations', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.searchItems(ORG_ID_A, { query: 'test' });

      expect(result).toHaveLength(0);

      // Verify organization filter is always applied first
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });
    });

    it('should filter by lifecycleStatus within organization scope', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: ITEM_ID_1,
              organizationId: ORG_ID_A,
              title: 'Draft Item',
              lifecycleStatus: 'draft',
              aiReviewState: 'none',
            },
          ],
          1,
        ]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.searchItems(ORG_ID_A, { lifecycleStatus: 'draft' });

      // Verify org filter is applied first
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });

      // Verify additional filters use andWhere (never replace org filter)
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('item.lifecycleStatus = :status', {
        status: 'draft',
      });
    });

    it('should filter by aiReviewState within organization scope', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: ITEM_ID_1,
              organizationId: ORG_ID_A,
              title: 'Reviewed Item',
              lifecycleStatus: 'draft',
              aiReviewState: 'ai_reviewed',
            },
          ],
          1,
        ]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.searchItems(ORG_ID_A, { aiReviewState: 'ai_reviewed' });

      // Verify org filter is applied first
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });

      // Verify additional filters use andWhere
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('item.aiReviewState = :state', {
        state: 'ai_reviewed',
      });
    });

    it('should apply text search within organization scope', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: ITEM_ID_1,
              organizationId: ORG_ID_A,
              title: 'Nike Shoes',
              lifecycleStatus: 'draft',
              aiReviewState: 'none',
            },
          ],
          1,
        ]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.searchItems(ORG_ID_A, { query: 'Nike' });

      // Verify org filter is applied first
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });

      // Verify text search uses andWhere
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(item.title ILIKE :q OR item.description ILIKE :q)',
        { q: '%Nike%' }
      );
    });

    it('should respect limit parameter within organization scope', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.searchItems(ORG_ID_A, { limit: 5 });

      // Verify org filter is applied
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });

      // Verify limit is applied
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should use default limit of 10 within organization scope', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.searchItems(ORG_ID_A, {});

      // Verify default limit is applied
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should combine multiple filters with organization filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.searchItems(ORG_ID_A, {
        query: 'Nike',
        lifecycleStatus: 'draft',
        aiReviewState: 'ai_reviewed',
      });

      // Verify org filter is always first
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });

      // Verify all other filters use andWhere
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(item.title ILIKE :q OR item.description ILIKE :q)',
        { q: '%Nike%' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('item.lifecycleStatus = :status', {
        status: 'draft',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('item.aiReviewState = :state', {
        state: 'ai_reviewed',
      });
    });
  });

  // ==========================================================================
  // buildToolDependencies - getDashboardStats
  // ==========================================================================

  describe('buildToolDependencies - getDashboardStats', () => {
    it('should only return stats for the specified organization', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { total: '5', totalValue: '500', status: 'draft' },
          { total: '3', totalValue: '300', status: 'ready' },
        ]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.getDashboardStats(ORG_ID_A);

      expect(result.totalItems).toBe(8);
      expect(result.totalValue).toBe(800);
      expect(result.byStatus).toEqual({
        draft: 5,
        ready: 3,
      });

      // Verify organization filter is applied
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });
    });

    it('should never include stats from other organizations', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.getDashboardStats(ORG_ID_A);

      // Verify organization filter is always applied
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });
    });
  });

  // ==========================================================================
  // buildToolDependencies - getReviewQueueStats
  // ==========================================================================

  describe('buildToolDependencies - getReviewQueueStats', () => {
    it('should only return stats for the specified organization', async () => {
      itemRepo.count.mockResolvedValue(5);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.getReviewQueueStats(ORG_ID_A);

      expect(result.totalPending).toBe(5);
      expect(result.byStatus.pending).toBe(5);

      // Verify organization filter is applied
      expect(itemRepo.count).toHaveBeenCalledWith({
        where: {
          organizationId: ORG_ID_A,
          aiReviewState: 'pending',
        },
      });
    });

    it('should never include stats from other organizations', async () => {
      itemRepo.count.mockResolvedValue(0);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      await deps.getReviewQueueStats(ORG_ID_A);

      // Verify organization filter is always applied
      expect(itemRepo.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: ORG_ID_A,
        }),
      });
    });
  });

  // ==========================================================================
  // Integration Tests - Cross-Org Prevention
  // ==========================================================================

  describe('Cross-Organization Prevention - Integration', () => {
    it('should prevent user from ORG_A accessing item from ORG_B via getItem', async () => {
      // Setup: Item exists but belongs to different org
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.getItem(ORG_ID_A, ITEM_ID_2);

      expect(result).toBeNull();

      // Verify query includes organization filter - this is what prevents cross-org access
      expect(itemRepo.findOne).toHaveBeenCalledWith({
        where: { id: ITEM_ID_2, organizationId: ORG_ID_A },
      });
    });

    it('should prevent user from ORG_A updating item from ORG_B via updateItem', async () => {
      // Setup: Item exists but belongs to different org
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      await expect(
        deps.updateItem(ORG_ID_A, ITEM_ID_2, { title: 'Malicious Update' })
      ).rejects.toThrow(NotFoundException);

      // Verify update was never called
      expect(itemRepo.update).not.toHaveBeenCalled();
    });

    it('should prevent user from ORG_A accessing research from item in ORG_B', async () => {
      // Setup: Item exists but belongs to different org
      itemRepo.findOne.mockResolvedValue(null);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      await expect(deps.getLatestResearch(ITEM_ID_2, ORG_ID_A)).rejects.toThrow(NotFoundException);

      // Verify research service was never called
      expect(researchService.findLatestResearch).not.toHaveBeenCalled();
    });

    it('should prevent cross-org data leakage in search results', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            // Only items from ORG_ID_A should be returned
            {
              id: ITEM_ID_1,
              organizationId: ORG_ID_A,
              title: 'Item from Org A',
              lifecycleStatus: 'draft',
              aiReviewState: 'none',
            },
          ],
          1,
        ]),
      };

      itemRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);
      const result = await deps.searchItems(ORG_ID_A, {});

      // Verify all results belong to correct org
      expect(result.every((item) => item.organizationId === ORG_ID_A)).toBe(true);

      // Verify organization filter is applied
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.organizationId = :orgId', {
        orgId: ORG_ID_A,
      });
    });

    it('should ensure organizationId is always validated before any operation', async () => {
      const deps = (service as any).buildToolDependencies(ORG_ID_A, USER_ID_A);

      // All operations should call verifyOrganizationAccess
      const verifyAccess = jest.spyOn(service as any, 'verifyOrganizationAccess');

      itemRepo.findOne.mockResolvedValue(null);

      await deps.getItem(ORG_ID_A, ITEM_ID_1).catch(() => {});
      expect(verifyAccess).toHaveBeenCalledWith(USER_ID_A, ORG_ID_A);

      verifyAccess.mockClear();
      await deps.updateItem(ORG_ID_A, ITEM_ID_1, {}).catch(() => {});
      expect(verifyAccess).toHaveBeenCalledWith(USER_ID_A, ORG_ID_A);

      verifyAccess.mockClear();
      await deps.getLatestResearch(ITEM_ID_1, ORG_ID_A).catch(() => {});
      expect(verifyAccess).toHaveBeenCalledWith(USER_ID_A, ORG_ID_A);

      verifyAccess.mockClear();
      itemRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      } as any);
      await deps.searchItems(ORG_ID_A, {});
      expect(verifyAccess).toHaveBeenCalledWith(USER_ID_A, ORG_ID_A);
    });
  });
});
