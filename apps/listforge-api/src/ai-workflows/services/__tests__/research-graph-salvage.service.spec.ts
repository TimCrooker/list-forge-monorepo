import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResearchGraphService } from '../research-graph.service';
import { Item } from '../../../items/entities/item.entity';
import { ItemResearchRun } from '../../../research/entities/item-research-run.entity';
import { ResearchService } from '../../../research/research.service';
import { EvidenceService } from '../../../evidence/evidence.service';
import { ResearchActivityLoggerService } from '../../../research/services/research-activity-logger.service';
import { MarketplaceAccountService } from '../../../marketplaces/services/marketplace-account.service';
import { AutoPublishService } from '../../../marketplaces/services/auto-publish.service';
import { EventsService } from '../../../events/events.service';
import { PostgresCheckpointerService } from '../../checkpointers/postgres.checkpointer';
import { LLMConfigService } from '../../config/llm.config';
import { WebSearchService } from '../web-search.service';
import { OCRService } from '../ocr.service';
import { UPCLookupService } from '../upc-lookup.service';
import { MarketplaceSchemaService } from '../marketplace-schema.service';
import { PricingStrategyService } from '../pricing-strategy.service';
import { ListingAssemblyService } from '../listing-assembly.service';
import { AmazonCatalogService } from '../amazon-catalog.service';
import { KeepaService } from '../keepa.service';
import { ImageComparisonService } from '../image-comparison.service';
import { IdentificationValidatorService } from '../identification-validator.service';
import { FieldStateManagerService } from '../field-state-manager.service';
import { ResearchPlannerService } from '../research-planner.service';
import { FieldResearchService } from '../field-research.service';
import { OrganizationSettingsService } from '../../../organizations/services/organization-settings.service';
import { ItemResearchData } from '@listforge/core-types';
import { EvidenceBundle } from '../../../evidence/entities/evidence-bundle.entity';

/**
 * Unit tests for salvagePartialResults in ResearchGraphService
 *
 * CRITICAL: These tests ensure that partial work is never lost unnecessarily.
 * When a research graph crashes or hits recursion limits, we should salvage
 * whatever data we've collected rather than throwing away 90% of completed work.
 *
 * Tests cover:
 * 1. Success cases - enough comps to salvage
 * 2. Low-confidence cases - few comps but still salvageable with warning
 * 3. Edge cases - missing research entity but evidence exists
 * 4. Failure cases - truly insufficient data
 * 5. Checkpoint preservation for resume capability
 */
describe('ResearchGraphService - salvagePartialResults', () => {
  let service: ResearchGraphService;
  let researchService: ResearchService;
  let evidenceService: EvidenceService;
  let itemRepo: Repository<Item>;
  let researchRunRepo: Repository<ItemResearchRun>;

  // Test constants matching the service implementation
  const MIN_COMPS_FOR_SALVAGE = 1; // As defined in salvagePartialResults

  // Mock data
  const mockOrgId = 'org-123';
  const mockItemId = 'item-456';
  const mockResearchRunId = 'run-789';

  const createMockResearchRun = (overrides?: Partial<ItemResearchRun>): ItemResearchRun => ({
    id: mockResearchRunId,
    itemId: mockItemId,
    status: 'running',
    currentNode: 'search_comps',
    stepCount: 5,
    stepHistory: [],
    checkpoint: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    pauseRequested: false,
    pausedAt: null,
    summary: null,
    errorMessage: null,
    fieldStates: null,
    researchCostUsd: 0,
    researchMode: 'balanced',
    researchConstraints: null,
    ...overrides,
  } as ItemResearchRun);

  const createMockResearch = (itemId: string): { id: string; data: ItemResearchData } => ({
    id: 'research-001',
    data: {
      productId: {
        confidence: 0.9,
        brand: 'Test Brand',
        model: 'Test Model',
        attributes: {},
      },
      priceBands: [
        { label: 'floor', amount: 10, currency: 'USD', confidence: 0.8, reasoning: 'Test' },
        { label: 'target', amount: 15, currency: 'USD', confidence: 0.9, reasoning: 'Test' },
        { label: 'ceiling', amount: 20, currency: 'USD', confidence: 0.8, reasoning: 'Test' },
      ],
      demandSignals: [],
      missingInfo: [],
      competitorCount: 5,
      recommendedMarketplaces: ['ebay'],
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  });

  const createMockEvidenceBundle = (compCount: number): EvidenceBundle => ({
    id: 'bundle-001',
    itemId: mockItemId,
    researchRunId: mockResearchRunId,
    item: null,
    researchRun: null,
    generatedAt: new Date(),
    items: Array(compCount).fill({
      id: 'evidence-item',
      type: 'marketplace_sold',
      data: { title: 'Test Comp', price: 15 },
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as EvidenceBundle);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchGraphService,
        {
          provide: getRepositoryToken(Item),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ItemResearchRun),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ResearchService,
          useValue: {
            findLatestResearch: jest.fn(),
          },
        },
        {
          provide: EvidenceService,
          useValue: {
            getBundleForResearchRun: jest.fn(),
          },
        },
        {
          provide: ResearchActivityLoggerService,
          useValue: {},
        },
        {
          provide: MarketplaceAccountService,
          useValue: {},
        },
        {
          provide: AutoPublishService,
          useValue: {},
        },
        {
          provide: EventsService,
          useValue: {},
        },
        {
          provide: PostgresCheckpointerService,
          useValue: {},
        },
        {
          provide: LLMConfigService,
          useValue: {},
        },
        {
          provide: WebSearchService,
          useValue: {},
        },
        {
          provide: OCRService,
          useValue: {},
        },
        {
          provide: UPCLookupService,
          useValue: {},
        },
        {
          provide: MarketplaceSchemaService,
          useValue: {},
        },
        {
          provide: PricingStrategyService,
          useValue: {},
        },
        {
          provide: ListingAssemblyService,
          useValue: {},
        },
        {
          provide: AmazonCatalogService,
          useValue: {},
        },
        {
          provide: KeepaService,
          useValue: {},
        },
        {
          provide: ImageComparisonService,
          useValue: {},
        },
        {
          provide: IdentificationValidatorService,
          useValue: {},
        },
        {
          provide: FieldStateManagerService,
          useValue: {},
        },
        {
          provide: ResearchPlannerService,
          useValue: {},
        },
        {
          provide: FieldResearchService,
          useValue: {},
        },
        {
          provide: OrganizationSettingsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ResearchGraphService>(ResearchGraphService);
    researchService = module.get<ResearchService>(ResearchService);
    evidenceService = module.get<EvidenceService>(EvidenceService);
    itemRepo = module.get<Repository<Item>>(getRepositoryToken(Item));
    researchRunRepo = module.get<Repository<ItemResearchRun>>(getRepositoryToken(ItemResearchRun));
  });

  describe('salvagePartialResults - private method testing', () => {
    /**
     * Note: salvagePartialResults is private, so we test it through reflection.
     * This is acceptable for critical business logic that needs comprehensive testing.
     */
    async function invokeSalvagePartialResults(
      researchRunId: string,
      itemId: string,
      orgId: string,
      researchRun: ItemResearchRun,
    ): Promise<void> {
      // Access private method through type assertion
      const privateService = service as any;
      return privateService.salvagePartialResults(researchRunId, itemId, orgId, researchRun);
    }

    // ============================================================================
    // SUCCESS CASES - Sufficient data to salvage
    // ============================================================================

    describe('success - sufficient comps', () => {
      it('should salvage successfully when evidence has >= MIN_COMPS_FOR_SALVAGE comps and research exists', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(5);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should not throw
        expect(researchService.findLatestResearch).toHaveBeenCalledWith(mockItemId, mockOrgId);
        expect(evidenceService.getBundleForResearchRun).toHaveBeenCalledWith(mockResearchRunId);
      });

      it('should salvage successfully when evidence has exactly MIN_COMPS_FOR_SALVAGE comps', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(MIN_COMPS_FOR_SALVAGE);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should not throw
        expect(researchService.findLatestResearch).toHaveBeenCalledWith(mockItemId, mockOrgId);
        expect(evidenceService.getBundleForResearchRun).toHaveBeenCalledWith(mockResearchRunId);
      });

      it('should salvage successfully when evidence has many comps (high confidence)', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(50);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should not throw
        expect(researchService.findLatestResearch).toHaveBeenCalledWith(mockItemId, mockOrgId);
        expect(evidenceService.getBundleForResearchRun).toHaveBeenCalledWith(mockResearchRunId);
      });
    });

    // ============================================================================
    // LOW-CONFIDENCE CASES - Minimal data but still salvageable
    // ============================================================================

    describe('low-confidence salvage', () => {
      it('should still salvage with warning when research exists but comp count is 0', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(0);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should not throw despite low comp count
        // Research entity exists, so we salvage it even without comps
        expect(researchService.findLatestResearch).toHaveBeenCalledWith(mockItemId, mockOrgId);
      });

      it('should log warning for low-confidence salvage', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(0);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should log warning about low confidence
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Salvage with low confidence'),
        );
      });
    });

    // ============================================================================
    // EDGE CASES - Partial state scenarios
    // ============================================================================

    describe('edge cases - partial state', () => {
      it('should handle case where evidence exists but research entity does not', async () => {
        // Arrange - this can happen if persist_results node didn't complete
        const mockEvidence = createMockEvidenceBundle(5);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should salvage evidence bundle even without research entity
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Salvage partial: No research entity'),
        );
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('5 comps in evidence bundle'),
        );
      });

      it('should include evidence bundle ID in warning message', async () => {
        // Arrange
        const mockEvidence = createMockEvidenceBundle(3);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should mention bundle ID for manual review
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Evidence bundle bundle-001'),
        );
      });

      it('should handle null evidence bundle gracefully', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(null);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should handle null evidence (comp count defaults to 0)
        expect(researchService.findLatestResearch).toHaveBeenCalled();
        expect(evidenceService.getBundleForResearchRun).toHaveBeenCalled();
      });

      it('should handle evidence bundle with null items array', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(0);
        mockEvidence.items = null as any; // Edge case
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should handle null items array gracefully
        expect(researchService.findLatestResearch).toHaveBeenCalled();
      });
    });

    // ============================================================================
    // FAILURE CASES - Truly insufficient data
    // ============================================================================

    describe('failure - insufficient data', () => {
      it('should throw when neither evidence nor research exists', async () => {
        // Arrange - complete failure, no data at all
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(null);

        const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

        // Act & Assert - should throw with clear message
        await expect(
          invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun)
        ).rejects.toThrow('Research failed without producing any results');

        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Salvage failed: No research data and no evidence found'),
        );
      });

      it('should throw when evidence exists but has no comps and no research entity', async () => {
        // Arrange - evidence bundle exists but empty, and no research persisted
        const mockEvidence = createMockEvidenceBundle(0);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act & Assert - should throw since neither research nor comps exist
        await expect(
          invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun)
        ).rejects.toThrow('Research failed without producing any results');
      });

      it('should include item ID in failure message', async () => {
        // Arrange
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(null);

        const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

        // Act & Assert
        await expect(
          invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun)
        ).rejects.toThrow();

        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`item ${mockItemId}`),
        );
      });
    });

    // ============================================================================
    // CHECKPOINT PRESERVATION - Resume capability
    // ============================================================================

    describe('checkpoint preservation', () => {
      it('should not modify checkpoint state during salvage', async () => {
        // Arrange - research run has checkpoint for resume
        const mockCheckpoint = { some: 'checkpoint data' };
        const mockResearchRun = createMockResearchRun({
          checkpoint: mockCheckpoint as any,
        });
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(5);

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - checkpoint should remain unchanged
        expect(mockResearchRun.checkpoint).toEqual(mockCheckpoint);
      });

      it('should preserve research run status during salvage', async () => {
        // Arrange
        const mockResearchRun = createMockResearchRun({
          status: 'running',
        });
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(5);

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - status unchanged (will be updated by caller)
        expect(mockResearchRun.status).toBe('running');
      });

      it('should preserve step history during salvage', async () => {
        // Arrange
        const mockStepHistory = [
          { node: 'load_context', status: 'success', startedAt: '2024-01-01', completedAt: '2024-01-01' },
          { node: 'search_comps', status: 'running', startedAt: '2024-01-01' },
        ];
        const mockResearchRun = createMockResearchRun({
          stepHistory: mockStepHistory as any,
        });
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(5);

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - step history preserved
        expect(mockResearchRun.stepHistory).toEqual(mockStepHistory);
      });
    });

    // ============================================================================
    // LOGGING BEHAVIOR - Diagnostic information
    // ============================================================================

    describe('logging behavior', () => {
      it('should log detailed diagnostic info for successful salvage', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(5);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        const loggerLogSpy = jest.spyOn((service as any).logger, 'log');

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should log diagnostic info
        expect(loggerLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Salvage diagnostics'),
        );
        expect(loggerLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('existingResearch=true'),
        );
        expect(loggerLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('compCount=5'),
        );
      });

      it('should log success message when salvage completes with research data', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(10);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        const loggerLogSpy = jest.spyOn((service as any).logger, 'log');

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert
        expect(loggerLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Salvage successful'),
        );
        expect(loggerLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('10 comps'),
        );
      });

      it('should log initial salvage attempt message', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(5);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        const loggerLogSpy = jest.spyOn((service as any).logger, 'log');

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert
        expect(loggerLogSpy).toHaveBeenCalledWith(
          expect.stringContaining(`Salvaging partial results for run ${mockResearchRunId}`),
        );
      });
    });

    // ============================================================================
    // GRACEFUL DEGRADATION - Does not throw when salvage is possible
    // ============================================================================

    describe('graceful degradation', () => {
      it('should not throw when salvage is possible with minimal data', async () => {
        // Arrange - bare minimum: 1 comp, no research entity
        const mockEvidence = createMockEvidenceBundle(MIN_COMPS_FOR_SALVAGE);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act & Assert - should not throw
        await expect(
          invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun)
        ).resolves.toBeUndefined();
      });

      it('should prefer returning partial results over throwing errors', async () => {
        // Arrange - research exists but no evidence
        const mockResearch = createMockResearch(mockItemId);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(null);

        // Act & Assert - should salvage research even without evidence
        await expect(
          invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun)
        ).resolves.toBeUndefined();
      });

      it('should handle service errors gracefully', async () => {
        // Arrange - service throws error
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockRejectedValue(new Error('Database error'));
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(null);

        // Act & Assert - should propagate service errors
        await expect(
          invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun)
        ).rejects.toThrow('Database error');
      });

      it('should handle evidence service errors gracefully', async () => {
        // Arrange
        const mockResearch = createMockResearch(mockItemId);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockRejectedValue(new Error('Evidence error'));

        // Act & Assert - should propagate errors
        await expect(
          invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun)
        ).rejects.toThrow('Evidence error');
      });
    });

    // ============================================================================
    // BUSINESS LOGIC - Ensure 90% work is not lost
    // ============================================================================

    describe('business logic - preventing data loss', () => {
      it('should salvage when graph completed search_comps but failed before persist_results', async () => {
        // Arrange - realistic scenario: graph found comps but crashed before persisting
        const mockEvidence = createMockEvidenceBundle(20);
        const mockResearchRun = createMockResearchRun({
          currentNode: 'search_comps', // Last node before crash
        });

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should salvage the 20 comps
        expect(evidenceService.getBundleForResearchRun).toHaveBeenCalled();
      });

      it('should salvage when graph completed pricing but crashed before final assembly', async () => {
        // Arrange - another realistic scenario
        const mockResearch = createMockResearch(mockItemId);
        const mockEvidence = createMockEvidenceBundle(15);
        const mockResearchRun = createMockResearchRun({
          currentNode: 'calculate_price',
        });

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(mockResearch as any);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should salvage both research and evidence
        expect(researchService.findLatestResearch).toHaveBeenCalled();
        expect(evidenceService.getBundleForResearchRun).toHaveBeenCalled();
      });

      it('should provide actionable guidance in warning messages', async () => {
        // Arrange - evidence exists but no research
        const mockEvidence = createMockEvidenceBundle(5);
        const mockResearchRun = createMockResearchRun();

        jest.spyOn(researchService, 'findLatestResearch').mockResolvedValue(null);
        jest.spyOn(evidenceService, 'getBundleForResearchRun').mockResolvedValue(mockEvidence);

        const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn');

        // Act
        await invokeSalvagePartialResults(mockResearchRunId, mockItemId, mockOrgId, mockResearchRun);

        // Assert - should provide guidance
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('available for manual review or re-research'),
        );
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Consider running research again'),
        );
      });
    });
  });
});
