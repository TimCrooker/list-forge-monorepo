import { evaluateFieldsNode, EvaluateFieldsTools } from '../evaluate-fields.node';
import { ResearchGraphState } from '../../research-graph.state';
import {
  ItemFieldStates,
  FieldState,
  FieldEvaluationResult,
  ResearchTaskHistory,
  ResearchConstraints,
  MAX_CONSECUTIVE_NO_PROGRESS,
} from '@listforge/core-types';
import { createHash } from 'crypto';

/**
 * Unit tests for stuck detection logic in evaluate-fields node.
 * These are critical circuit-breaker tests - wrong behavior causes:
 * - Infinite loops (premature termination detection)
 * - Premature termination (false positive stuck detection)
 */
describe('evaluateFieldsNode - Stuck Detection', () => {
  // Helper to create a minimal FieldState
  const createFieldState = (
    name: string,
    value: unknown,
    confidence: number,
  ): FieldState => ({
    name,
    displayName: name,
    value,
    confidence: {
      value: confidence,
      sources: [],
      lastUpdated: new Date().toISOString(),
    },
    required: true,
    requiredBy: ['ebay'],
    dataType: 'string',
    attempts: 0,
    status: 'pending',
  });

  // Helper to create ItemFieldStates
  const createFieldStates = (fields: Record<string, FieldState>): ItemFieldStates => ({
    fields,
    requiredFieldsComplete: 0,
    requiredFieldsTotal: Object.keys(fields).length,
    recommendedFieldsComplete: 0,
    recommendedFieldsTotal: 0,
    completionScore: 0,
    readyToPublish: false,
    totalCost: 0,
    totalTimeMs: 0,
    iterations: 0,
    version: '1.0.0',
  });

  // Helper to compute hash (mirrors the implementation)
  const hashFieldStates = (fieldStates: ItemFieldStates): string => {
    const hashInput = Object.entries(fieldStates.fields)
      .map(([name, field]) => `${name}:${JSON.stringify(field.value)}:${field.confidence.value}`)
      .sort()
      .join('|');
    return createHash('md5').update(hashInput).digest('hex');
  };

  // Mock tools
  const createMockTools = (
    evaluationResult: Partial<FieldEvaluationResult> = {},
  ): EvaluateFieldsTools => ({
    researchPlanner: {
      evaluateFieldStates: jest.fn().mockReturnValue({
        decision: 'continue',
        reason: 'Fields need more research',
        fieldsNeedingResearch: ['brand'],
        budgetRemaining: 0.5,
        iterationsRemaining: 5,
        ...evaluationResult,
      }),
    } as any,
    fieldStateManager: {
      getSummary: jest.fn().mockReturnValue({
        completionScore: 0.5,
        requiredFieldsComplete: 1,
        requiredFieldsTotal: 2,
      }),
    } as any,
  });

  const mockConstraints: ResearchConstraints = {
    maxCostUsd: 1.0,
    maxTimeMs: 60000,
    maxIterations: 10,
    requiredConfidence: 0.8,
    recommendedConfidence: 0.7,
    mode: 'balanced',
  };

  const createBaseState = (
    fieldStates: ItemFieldStates,
    taskHistory?: Partial<ResearchTaskHistory>,
  ): Partial<ResearchGraphState> => ({
    itemId: 'item-123',
    researchRunId: 'run-123',
    organizationId: 'org-123',
    fieldStates,
    researchConstraints: mockConstraints,
    currentResearchCost: 0.1,
    iteration: 1,
    taskHistory: {
      attemptsByTool: {},
      failedTools: [],
      consecutiveNoProgress: 0,
      lastFieldStatesHash: null,
      ...taskHistory,
    },
  });

  describe('hashFieldStates', () => {
    it('should produce consistent hashes for same input', () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
        model: createFieldState('model', 'Air Max', 0.5),
      });

      const hash1 = hashFieldStates(fieldStates);
      const hash2 = hashFieldStates(fieldStates);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
      expect(hash1.length).toBe(32); // MD5 hex digest length
    });

    it('should produce different hashes when field values change', () => {
      const fieldStates1 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const fieldStates2 = createFieldStates({
        brand: createFieldState('brand', 'Adidas', 0.7),
      });

      const hash1 = hashFieldStates(fieldStates1);
      const hash2 = hashFieldStates(fieldStates2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes when confidence changes', () => {
      const fieldStates1 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const fieldStates2 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.8),
      });

      const hash1 = hashFieldStates(fieldStates1);
      const hash2 = hashFieldStates(fieldStates2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty field states', () => {
      const fieldStates = createFieldStates({});

      const hash = hashFieldStates(fieldStates);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(32);
    });

    it('should handle null values', () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', null, 0.0),
      });

      const hash = hashFieldStates(fieldStates);

      expect(hash).toBeTruthy();
      expect(hash.length).toBe(32);
    });

    it('should be order-independent (sorted fields)', () => {
      const fieldStates1 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
        model: createFieldState('model', 'Air Max', 0.5),
      });

      const fieldStates2 = createFieldStates({
        model: createFieldState('model', 'Air Max', 0.5),
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const hash1 = hashFieldStates(fieldStates1);
      const hash2 = hashFieldStates(fieldStates2);

      expect(hash1).toBe(hash2);
    });

    it('should change hash when fields are added', () => {
      const fieldStates1 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const fieldStates2 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
        model: createFieldState('model', 'Air Max', 0.5),
      });

      const hash1 = hashFieldStates(fieldStates1);
      const hash2 = hashFieldStates(fieldStates2);

      expect(hash1).not.toBe(hash2);
    });

    it('should change hash when fields are removed', () => {
      const fieldStates1 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
        model: createFieldState('model', 'Air Max', 0.5),
      });

      const fieldStates2 = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const hash1 = hashFieldStates(fieldStates1);
      const hash2 = hashFieldStates(fieldStates2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('stuck detection - hash updates', () => {
    it('should update lastFieldStatesHash in taskHistory', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const state = createBaseState(fieldStates);
      const tools = createMockTools();
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      expect(result.taskHistory).toBeDefined();
      expect(result.taskHistory?.lastFieldStatesHash).toBeTruthy();
      expect(result.taskHistory?.lastFieldStatesHash?.length).toBe(32); // MD5 hex
    });

    it('should detect no progress when hash matches previous hash', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const currentHash = hashFieldStates(fieldStates);

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: currentHash,
        consecutiveNoProgress: 1, // Below threshold
      });

      const tools = createMockTools();
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should continue normally (not stuck yet)
      expect(result.fieldEvaluation?.decision).toBe('continue');
    });

    it('should detect progress when hash changes', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const differentHash = 'different-hash-from-previous-iteration';

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: differentHash,
        consecutiveNoProgress: 2,
      });

      const tools = createMockTools();
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Hash changed, so we made progress - should continue normally
      expect(result.fieldEvaluation?.decision).toBe('continue');
    });
  });

  describe('stuck detection - threshold triggering', () => {
    it('should trigger stuck detection at MAX_CONSECUTIVE_NO_PROGRESS', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const currentHash = hashFieldStates(fieldStates);

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: currentHash,
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS,
      });

      const tools = createMockTools({ decision: 'continue' });
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should override 'continue' to 'stop_with_warnings' due to stuck detection
      expect(result.fieldEvaluation?.decision).toBe('stop_with_warnings');
      expect(result.fieldEvaluation?.reason).toContain('Research stuck');
      expect(result.fieldEvaluation?.reason).toContain(
        `${MAX_CONSECUTIVE_NO_PROGRESS} consecutive iterations`,
      );
    });

    it('should NOT trigger stuck detection when consecutiveNoProgress is below threshold', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const currentHash = hashFieldStates(fieldStates);

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: currentHash,
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS - 1,
      });

      const tools = createMockTools({ decision: 'continue' });
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should NOT trigger stuck detection (just below threshold)
      expect(result.fieldEvaluation?.decision).toBe('continue');
    });

    it('should NOT trigger stuck detection when hash differs (even if count is high)', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const currentHash = hashFieldStates(fieldStates);
      const differentHash = 'different-hash';

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: differentHash, // Hash changed
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS + 5, // High count
      });

      const tools = createMockTools({ decision: 'continue' });
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should NOT trigger stuck detection (hash changed = progress made)
      expect(result.fieldEvaluation?.decision).toBe('continue');
    });

    it('should only override "continue" decision, not "complete" or "stop_with_warnings"', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.9),
      });

      const currentHash = hashFieldStates(fieldStates);

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: currentHash,
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS,
      });

      // Test with 'complete' decision
      const toolsComplete = createMockTools({ decision: 'complete' });
      const configComplete = { configurable: { tools: toolsComplete } };

      const resultComplete = await evaluateFieldsNode(
        state as ResearchGraphState,
        configComplete,
      );

      // Should NOT override 'complete' decision
      expect(resultComplete.fieldEvaluation?.decision).toBe('complete');

      // Test with 'stop_with_warnings' decision
      const toolsStop = createMockTools({ decision: 'stop_with_warnings' });
      const configStop = { configurable: { tools: toolsStop } };

      const resultStop = await evaluateFieldsNode(state as ResearchGraphState, configStop);

      // Should NOT override 'stop_with_warnings' decision
      expect(resultStop.fieldEvaluation?.decision).toBe('stop_with_warnings');
    });
  });

  describe('stuck detection - edge cases', () => {
    it('should handle null lastFieldStatesHash (first iteration)', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: null,
        consecutiveNoProgress: 0,
      });

      const tools = createMockTools();
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // First iteration - should not be stuck
      expect(result.fieldEvaluation?.decision).toBe('continue');
      expect(result.taskHistory?.lastFieldStatesHash).toBeTruthy();
    });

    it('should handle undefined taskHistory', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        fieldStates,
        researchConstraints: mockConstraints,
        currentResearchCost: 0.1,
        iteration: 1,
        taskHistory: undefined, // No task history
      };

      const tools = createMockTools();
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should initialize taskHistory
      expect(result.taskHistory).toBeDefined();
      expect(result.taskHistory?.consecutiveNoProgress).toBe(0);
      expect(result.taskHistory?.lastFieldStatesHash).toBeTruthy();
    });

    it('should handle complex field values (objects, arrays)', () => {
      const fieldStates = createFieldStates({
        tags: createFieldState('tags', ['tag1', 'tag2', 'tag3'], 0.8),
        metadata: createFieldState('metadata', { key: 'value', nested: { deep: true } }, 0.9),
      });

      const hash1 = hashFieldStates(fieldStates);

      // Change array order
      const fieldStates2 = createFieldStates({
        tags: createFieldState('tags', ['tag1', 'tag3', 'tag2'], 0.8),
        metadata: createFieldState('metadata', { key: 'value', nested: { deep: true } }, 0.9),
      });

      const hash2 = hashFieldStates(fieldStates2);

      // Hash should be different (array order matters in JSON.stringify)
      expect(hash1).not.toBe(hash2);
    });

    it('should set done=true when stuck detection triggers', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const currentHash = hashFieldStates(fieldStates);

      const state = createBaseState(fieldStates, {
        lastFieldStatesHash: currentHash,
        consecutiveNoProgress: MAX_CONSECUTIVE_NO_PROGRESS,
      });

      const tools = createMockTools({ decision: 'continue' });
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should set done=true when stuck
      expect(result.done).toBe(true);
      expect(result.fieldEvaluation?.decision).toBe('stop_with_warnings');
    });

    it('should increment iteration counter', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const state = createBaseState(fieldStates);
      const tools = createMockTools();
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should increment iteration (started at 1, should be 2)
      expect(result.iteration).toBe(2);
    });

    it('should preserve existing taskHistory fields', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const state = createBaseState(fieldStates, {
        attemptsByTool: { web_search_targeted: 5 },
        failedTools: ['web_search_general', 'upc_lookup'],
        consecutiveNoProgress: 1,
      });

      const tools = createMockTools();
      const config = { configurable: { tools } };

      const result = await evaluateFieldsNode(state as ResearchGraphState, config);

      // Should preserve existing fields
      expect(result.taskHistory?.attemptsByTool).toEqual({ web_search_targeted: 5 });
      expect(result.taskHistory?.failedTools).toEqual(['web_search_general', 'upc_lookup']);
      expect(result.taskHistory?.consecutiveNoProgress).toBe(1);
      expect(result.taskHistory?.lastFieldStatesHash).toBeTruthy();
    });
  });

  describe('critical circuit-breaker scenarios', () => {
    it('CRITICAL: should prevent infinite loops by forcing stop after MAX_CONSECUTIVE_NO_PROGRESS', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const currentHash = hashFieldStates(fieldStates);

      // Simulate exactly at threshold
      for (let noProgressCount = MAX_CONSECUTIVE_NO_PROGRESS; noProgressCount <= MAX_CONSECUTIVE_NO_PROGRESS + 2; noProgressCount++) {
        const state = createBaseState(fieldStates, {
          lastFieldStatesHash: currentHash,
          consecutiveNoProgress: noProgressCount,
        });

        const tools = createMockTools({ decision: 'continue' });
        const config = { configurable: { tools } };

        const result = await evaluateFieldsNode(state as ResearchGraphState, config);

        // Should ALWAYS stop when at or above threshold
        expect(result.fieldEvaluation?.decision).toBe('stop_with_warnings');
        expect(result.done).toBe(true);
      }
    });

    it('CRITICAL: should NOT prematurely terminate when making progress', async () => {
      // Simulate multiple iterations with changing hashes (progress)
      const iterations = [
        { value: 'Nike', confidence: 0.5 },
        { value: 'Nike', confidence: 0.6 },
        { value: 'Nike', confidence: 0.7 },
      ];

      for (const iter of iterations) {
        const fieldStates = createFieldStates({
          brand: createFieldState('brand', iter.value, iter.confidence),
        });

        const currentHash = hashFieldStates(fieldStates);
        const previousHash = 'different-hash-' + iter.confidence;

        const state = createBaseState(fieldStates, {
          lastFieldStatesHash: previousHash, // Different hash = progress
          consecutiveNoProgress: 5, // Even with high count
        });

        const tools = createMockTools({ decision: 'continue' });
        const config = { configurable: { tools } };

        const result = await evaluateFieldsNode(state as ResearchGraphState, config);

        // Should continue when hash changes (progress made)
        expect(result.fieldEvaluation?.decision).toBe('continue');
        expect(result.done).toBe(false);
      }
    });
  });

  describe('error handling', () => {
    it('should throw error if tools not provided', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const state = createBaseState(fieldStates);

      await expect(
        evaluateFieldsNode(state as ResearchGraphState, {}),
      ).rejects.toThrow('ResearchPlannerService and FieldStateManagerService are required');
    });

    it('should throw error if fieldStates not provided', async () => {
      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        fieldStates: undefined,
        researchConstraints: mockConstraints,
      };

      const tools = createMockTools();
      const config = { configurable: { tools } };

      await expect(
        evaluateFieldsNode(state as ResearchGraphState, config),
      ).rejects.toThrow('fieldStates and researchConstraints are required');
    });

    it('should throw error if researchConstraints not provided', async () => {
      const fieldStates = createFieldStates({
        brand: createFieldState('brand', 'Nike', 0.7),
      });

      const state: Partial<ResearchGraphState> = {
        itemId: 'item-123',
        researchRunId: 'run-123',
        organizationId: 'org-123',
        fieldStates,
        researchConstraints: undefined,
      };

      const tools = createMockTools();
      const config = { configurable: { tools } };

      await expect(
        evaluateFieldsNode(state as ResearchGraphState, config),
      ).rejects.toThrow('fieldStates and researchConstraints are required');
    });
  });
});
