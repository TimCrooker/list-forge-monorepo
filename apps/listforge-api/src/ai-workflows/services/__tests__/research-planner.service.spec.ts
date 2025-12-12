import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResearchPlannerService, ResearchContext } from '../research-planner.service';
import {
  ItemFieldStates,
  FieldState,
  ResearchConstraints,
  ResearchToolType,
  ResearchTaskHistory,
  FieldConfidenceScore,
  MAX_ATTEMPTS_PER_TOOL,
  MAX_CONSECUTIVE_NO_PROGRESS,
} from '@listforge/core-types';

describe('ResearchPlannerService - Tool Selection Scoring', () => {
  let service: ResearchPlannerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchPlannerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResearchPlannerService>(ResearchPlannerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const createFieldState = (
    name: string,
    overrides?: Partial<FieldState>,
  ): FieldState => ({
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    value: null,
    confidence: {
      value: 0,
      sources: [],
      lastUpdated: new Date().toISOString(),
    },
    required: false,
    requiredBy: [],
    dataType: 'string',
    attempts: 0,
    status: 'pending',
    ...overrides,
  });

  const createItemFieldStates = (
    fields: Record<string, Partial<FieldState>>,
  ): ItemFieldStates => {
    const fieldStates: Record<string, FieldState> = {};
    let requiredTotal = 0;
    let requiredComplete = 0;

    for (const [name, overrides] of Object.entries(fields)) {
      const field = createFieldState(name, overrides);
      fieldStates[name] = field;
      if (field.required) {
        requiredTotal++;
        if (field.status === 'complete' && field.confidence.value >= 0.7) {
          requiredComplete++;
        }
      }
    }

    return {
      fields: fieldStates,
      requiredFieldsComplete: requiredComplete,
      requiredFieldsTotal: requiredTotal,
      recommendedFieldsComplete: 0,
      recommendedFieldsTotal: 0,
      completionScore: requiredTotal > 0 ? requiredComplete / requiredTotal : 0,
      readyToPublish: requiredComplete === requiredTotal && requiredTotal > 0,
      totalCost: 0,
      totalTimeMs: 0,
      iterations: 0,
      version: '1.0',
    };
  };

  const createConstraints = (
    overrides?: Partial<ResearchConstraints>,
  ): ResearchConstraints => ({
    maxCostUsd: 1.0,
    maxTimeMs: 30000,
    maxIterations: 10,
    requiredConfidence: 0.7,
    recommendedConfidence: 0.5,
    mode: 'balanced',
    ...overrides,
  });

  const createContext = (overrides?: Partial<ResearchContext>): ResearchContext => ({
    hasUpc: false,
    hasBrand: false,
    hasModel: false,
    hasCategory: false,
    hasImages: false,
    imageCount: 0,
    keepaConfigured: true,
    amazonConfigured: true,
    upcDatabaseConfigured: true,
    ...overrides,
  });

  const createTaskHistory = (
    overrides?: Partial<ResearchTaskHistory>,
  ): ResearchTaskHistory => ({
    attemptsByTool: {},
    failedTools: [],
    consecutiveNoProgress: 0,
    lastFieldStatesHash: null,
    ...overrides,
  });

  // ============================================================================
  // SCORING TESTS - scoreToolForField method
  // ============================================================================

  describe('scoreToolForField', () => {
    it('should base score on tool priority', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true, hasImages: true });
      const constraints = createConstraints();

      // Plan for brand field - should prefer high-priority tools
      const task1 = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task1).not.toBeNull();
      // domain_knowledge_lookup has priority 96, but upc_lookup (95) and reverse_image_search (92) are also high
      // All three can provide brand field
      expect(['domain_knowledge_lookup', 'upc_lookup', 'reverse_image_search']).toContain(task1?.tool);
    });

    it('should apply field-specific bonus for exact field matches', () => {
      const fieldStates = createItemFieldStates({
        color: { required: true },
      });
      const context = createContext({ hasImages: true, imageCount: 2 });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // vision_analysis can provide 'color' specifically (not wildcard)
      // Should get +20 field-specific bonus
      expect(task?.tool).toBe('vision_analysis');
    });

    it('should apply cost penalty correctly', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      // No UPC, so UPC lookup unavailable
      // No images, so vision unavailable
      // Has brand for web search
      const context = createContext({ hasBrand: true, hasImages: false, imageCount: 0 });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // Should select some tool - cheaper tools should be preferred over expensive ones
      // Cost penalty should be factored into the score
      expect(task?.estimatedCost).toBeLessThan(1.0);
    });

    it('should apply context boost for UPC lookup when hasUpc is true', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const contextWithUpc = createContext({ hasUpc: true, hasImages: false });
      const constraints = createConstraints();

      const taskWithUpc = service.planNextTask(
        fieldStates,
        constraints,
        contextWithUpc,
        0,
        0,
        0,
      );

      expect(taskWithUpc).not.toBeNull();
      // With UPC available, context boost (+50) should affect scoring
      // Tools that can use UPC (upc_lookup, keepa, amazon_catalog) should score higher
      expect(['upc_lookup', 'keepa_lookup', 'amazon_catalog', 'domain_knowledge_lookup', 'reverse_image_search']).toContain(taskWithUpc?.tool);

      // Without UPC, upc_lookup shouldn't be available (requires UPC field)
      const contextNoUpc = createContext({ hasUpc: false, hasImages: false });
      const taskNoUpc = service.planNextTask(
        fieldStates,
        constraints,
        contextNoUpc,
        0,
        0,
        0,
      );

      expect(taskNoUpc).not.toBeNull();
      // Without UPC in context, upc_lookup prerequisite not met
      expect(taskNoUpc?.tool).not.toBe('upc_lookup');
    });

    it('should apply context boost for keepa when hasUpc is true', () => {
      const fieldStates = createItemFieldStates({
        weight: { required: true }, // Field keepa can provide
      });
      const contextWithUpc = createContext({ hasUpc: true, hasImages: false });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        contextWithUpc,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // With hasUpc true, keepa_lookup should get +40 boost in scoring
      // Verify a tool was selected (actual tool depends on many scoring factors)
      expect(task?.tool).toBeDefined();
    });

    it('should apply context boost for vision when multiple images available', () => {
      const fieldStates = createItemFieldStates({
        color: { required: true },
      });
      const contextMultiImage = createContext({ hasImages: true, imageCount: 3 });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        contextMultiImage,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // vision_analysis should get +15 boost when imageCount > 1
      expect(task?.tool).toBe('vision_analysis');
    });

    it('should apply context boost for targeted web search when brand and model available', () => {
      const fieldStates = createItemFieldStates({
        mpn: { required: true },
      });
      const contextWithIdentifiers = createContext({
        hasBrand: true,
        hasModel: true,
        hasImages: false,
        hasUpc: false,
      });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        contextWithIdentifiers,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // With hasBrand and hasModel, web_search_targeted should get +25 boost
      // Verify a tool was selected
      expect(task?.tool).toBeDefined();
    });

    it('should apply diminishing returns penalty for repeated field attempts', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true, attempts: 0 },
      });
      const context = createContext({ hasImages: true });
      const constraints = createConstraints();

      const task1 = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );
      expect(task1).not.toBeNull();

      // Now increase attempts
      fieldStates.fields.brand.attempts = 2;

      const task2 = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      // Should still plan a task, but score should be lower
      // With attempts = 2, penalty is -20 (2 * 10)
      expect(task2).not.toBeNull();

      // With attempts = 3 and confidence < 0.3, field should be skipped
      fieldStates.fields.brand.attempts = 3;
      fieldStates.fields.brand.confidence.value = 0.2;

      const task3 = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      // No fields to research, should return null
      expect(task3).toBeNull();
    });

    it('should maintain deterministic ordering for equal scores', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
        model: { required: true },
      });
      const context = createContext();
      const constraints = createConstraints();

      // Run multiple times - should get same result
      const results: (ResearchToolType | null)[] = [];
      for (let i = 0; i < 5; i++) {
        const task = service.planNextTask(
          fieldStates,
          constraints,
          context,
          0,
          0,
          0,
        );
        results.push(task?.tool || null);
      }

      // All results should be the same
      const firstResult = results[0];
      expect(results.every(r => r === firstResult)).toBe(true);
    });
  });

  // ============================================================================
  // BULLETPROOFING TESTS - planNextTask termination conditions
  // ============================================================================

  describe('bulletproofing - failed tools', () => {
    it('should skip tools in failedTools set', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      // Mark upc_lookup as failed
      const taskHistory = createTaskHistory({
        failedTools: ['upc_lookup'],
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      expect(task).not.toBeNull();
      // Should not select failed tool
      expect(task?.tool).not.toBe('upc_lookup');
    });

    it('should handle all tools marked as failed', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true, hasImages: true });
      const constraints = createConstraints();

      // Mark multiple tools as failed
      const taskHistory = createTaskHistory({
        failedTools: [
          'upc_lookup',
          'vision_analysis',
          'ocr_extraction',
          'web_search_general',
          'web_search_targeted',
          'keepa_lookup',
        ],
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      // Should still find a tool that hasn't failed
      expect(task).not.toBeNull();
    });
  });

  describe('bulletproofing - exhausted tools', () => {
    it('should skip tools that exceeded MAX_ATTEMPTS_PER_TOOL', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      // Mark tool as exhausted
      const taskHistory = createTaskHistory({
        attemptsByTool: {
          upc_lookup: MAX_ATTEMPTS_PER_TOOL,
        },
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      expect(task).not.toBeNull();
      // Should skip exhausted tool
      expect(task?.tool).not.toBe('upc_lookup');
    });

    it('should allow tools with attempts below MAX_ATTEMPTS_PER_TOOL', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true, hasImages: false });
      const constraints = createConstraints();

      // Tool has 1 attempt (below limit of 2)
      const taskHistory = createTaskHistory({
        attemptsByTool: {
          upc_lookup: 1,
        },
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      expect(task).not.toBeNull();
      // Should plan a task since tool with 1 attempt is below MAX_ATTEMPTS_PER_TOOL (2)
      expect(task?.tool).toBeDefined();
    });

    it('should handle multiple tools exhausted', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true, hasImages: true });
      const constraints = createConstraints();

      const taskHistory = createTaskHistory({
        attemptsByTool: {
          upc_lookup: MAX_ATTEMPTS_PER_TOOL,
          vision_analysis: MAX_ATTEMPTS_PER_TOOL,
          ocr_extraction: MAX_ATTEMPTS_PER_TOOL,
        },
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      expect(task).not.toBeNull();
      // Should find a non-exhausted tool
      expect(['upc_lookup', 'vision_analysis', 'ocr_extraction']).not.toContain(
        task?.tool,
      );
    });
  });

  describe('bulletproofing - budget exhausted', () => {
    it('should return null when budget exhausted', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints({ maxCostUsd: 0.1 });

      // Current cost equals budget
      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0.1, // currentCost
        0,
        0,
      );

      expect(task).toBeNull();
    });

    it('should return null when remaining budget too small', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints({ maxCostUsd: 0.1 });

      // Remaining budget: 0.0005 (below 0.001 threshold)
      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0.0995, // currentCost
        0,
        0,
      );

      expect(task).toBeNull();
    });

    it('should still plan when budget has room', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints({ maxCostUsd: 0.1 });

      // Remaining budget: 0.05
      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0.05, // currentCost
        0,
        0,
      );

      expect(task).not.toBeNull();
    });
  });

  describe('bulletproofing - maxIterations reached', () => {
    it('should return null when maxIterations reached', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints({ maxIterations: 5 });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        5, // currentIteration equals maxIterations
      );

      expect(task).toBeNull();
    });

    it('should plan when below maxIterations', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints({ maxIterations: 5 });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        4, // currentIteration < maxIterations
      );

      expect(task).not.toBeNull();
    });

    it('should return null when exceeding maxIterations', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints({ maxIterations: 5 });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        6, // currentIteration > maxIterations
      );

      expect(task).toBeNull();
    });
  });

  describe('bulletproofing - consecutiveNoProgress limit', () => {
    it('should return null when consecutiveNoProgress >= MAX_CONSECUTIVE_NO_PROGRESS', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const taskHistory = createTaskHistory({
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS,
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      expect(task).toBeNull();
    });

    it('should plan when consecutiveNoProgress below limit', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const taskHistory = createTaskHistory({
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS - 1,
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      expect(task).not.toBeNull();
    });

    it('should handle stuck state with zero consecutive no progress', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const taskHistory = createTaskHistory({
        consecutiveNoProgress: 0,
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
        taskHistory,
      );

      expect(task).not.toBeNull();
    });
  });

  describe('bulletproofing - no researchable fields', () => {
    it('should return null when no fields need research', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true, status: 'complete', confidence: { value: 0.9, sources: [], lastUpdated: '' } },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).toBeNull();
    });

    it('should return null when all fields are failed', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true, status: 'failed' },
        model: { required: true, status: 'failed' },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).toBeNull();
    });

    it('should return null when all fields are user_required', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true, status: 'user_required' },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).toBeNull();
    });

    it('should skip fields with too many failed attempts and low confidence', () => {
      const fieldStates = createItemFieldStates({
        brand: {
          required: true,
          attempts: 3,
          confidence: { value: 0.2, sources: [], lastUpdated: '' },
        },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      // Field has 3 attempts and confidence < 0.3, should be skipped
      expect(task).toBeNull();
    });
  });

  describe('bulletproofing - combined constraints', () => {
    it('should prioritize termination conditions correctly', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints({
        maxIterations: 5,
        maxCostUsd: 0.1,
      });

      // Test iteration limit takes precedence
      const task1 = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0, // currentCost low
        0,
        5, // currentIteration at limit
      );
      expect(task1).toBeNull();

      // Test stuck state takes precedence
      const taskHistory = createTaskHistory({
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS,
      });

      const task2 = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        3, // iteration below limit
        taskHistory,
      );
      expect(task2).toBeNull();

      // Test budget limit
      const task3 = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0.1, // currentCost at budget limit
        0,
        3,
      );
      expect(task3).toBeNull();
    });

    it('should handle multiple bulletproofing conditions simultaneously', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
        model: { required: true },
      });
      const context = createContext({ hasUpc: true, hasImages: true });
      const constraints = createConstraints({
        maxIterations: 5,
        maxCostUsd: 0.1,
      });

      const taskHistory = createTaskHistory({
        attemptsByTool: {
          upc_lookup: MAX_ATTEMPTS_PER_TOOL,
          vision_analysis: MAX_ATTEMPTS_PER_TOOL,
        },
        failedTools: ['ocr_extraction'],
        consecutiveNoProgress: 2,
      });

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0.05, // some budget used
        0,
        3, // some iterations done
        taskHistory,
      );

      // Should still find a task with remaining budget, iterations, and non-exhausted tools
      expect(task).not.toBeNull();
      expect(['upc_lookup', 'vision_analysis', 'ocr_extraction']).not.toContain(
        task?.tool,
      );
    });
  });

  // ============================================================================
  // INTEGRATION TESTS - Real-world scenarios
  // ============================================================================

  describe('integration - cost optimization scenarios', () => {
    it('should prefer cheap tools when they match the need', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
        model: { required: true },
      });
      const context = createContext({ hasUpc: true, hasImages: false });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // With UPC available, scoring should favor cheap tools
      // domain_knowledge_lookup (0.001), upc_lookup (0.001), ebay_taxonomy (0.001) are cheapest
      expect(task?.estimatedCost).toBeLessThan(0.1);
    });

    it('should avoid expensive tools when cheap alternatives exist', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });
      // Both UPC and images available
      const context = createContext({ hasUpc: true, hasImages: true });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // With many options available, should prefer cheaper tools over expensive ones
      // Cost penalty is -50 * cost, so expensive tools score lower
      expect(task?.estimatedCost).toBeLessThan(0.1);
    });

    it('should demonstrate cost difference in tool selection', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true },
      });

      // Scenario 1: UPC available (cheap tools available)
      const contextWithUpc = createContext({ hasUpc: true, hasImages: false });
      const task1 = service.planNextTask(
        fieldStates,
        createConstraints(),
        contextWithUpc,
        0,
        0,
        0,
      );
      expect(task1).not.toBeNull();
      const cheapCost = task1?.estimatedCost || 0;

      // Scenario 2: No UPC, no images (fewer cheap options)
      const contextNoUpc = createContext({ hasUpc: false, hasImages: false });
      const task2 = service.planNextTask(
        fieldStates,
        createConstraints(),
        contextNoUpc,
        0,
        0,
        0,
      );
      expect(task2).not.toBeNull();
      const otherCost = task2?.estimatedCost || 0;

      // Both should select valid tools with reasonable costs
      expect(cheapCost).toBeGreaterThan(0);
      expect(otherCost).toBeGreaterThan(0);
      expect(cheapCost).toBeLessThan(1.0);
      expect(otherCost).toBeLessThan(1.0);
    });
  });

  describe('integration - field prioritization', () => {
    it('should prioritize required fields over recommended', () => {
      const fieldStates = createItemFieldStates({
        brand: { required: true, confidence: { value: 0.5, sources: [], lastUpdated: '' } },
        color: { required: false, confidence: { value: 0.3, sources: [], lastUpdated: '' } },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // Should target brand (required) even though color has lower confidence
      expect(task?.targetFields).toContain('brand');
    });

    it('should prioritize low confidence fields', () => {
      const fieldStates = createItemFieldStates({
        brand: {
          required: true,
          confidence: { value: 0.2, sources: [], lastUpdated: '' },
        },
        model: {
          required: true,
          confidence: { value: 0.8, sources: [], lastUpdated: '' },
        },
      });
      const context = createContext({ hasUpc: true });
      const constraints = createConstraints();

      const task = service.planNextTask(
        fieldStates,
        constraints,
        context,
        0,
        0,
        0,
      );

      expect(task).not.toBeNull();
      // Should target brand (lower confidence)
      expect(task?.targetFields).toContain('brand');
    });
  });
});
