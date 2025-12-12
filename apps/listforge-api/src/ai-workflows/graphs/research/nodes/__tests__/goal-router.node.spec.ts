import {
  goalRouter,
  identificationPhaseRouter,
  parallelPhaseRouter,
  isIdentificationComplete,
  completeIdentificationGoalNode,
  completeMetadataGoalNode,
  completeMarketGoalNode,
  completeAssemblyGoalNode,
} from '../goal-router.node';
import { ResearchGraphState } from '../../research-graph.state';
import { ResearchGoal, GoalType } from '@listforge/core-types';
import { v4 as uuidv4 } from 'uuid';

describe('goalRouter', () => {
  // Helper to create a mock goal
  const createMockGoal = (
    type: GoalType,
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' = 'pending',
    dependencies: string[] = [],
    id?: string,
  ): ResearchGoal => ({
    id: id || uuidv4(),
    type,
    status,
    confidence: 0,
    dependencies,
    attempts: 0,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  });

  // Helper to create minimal state
  const createMockState = (
    goals: ResearchGoal[],
    completedGoals: string[] = [],
    identificationConfidence: number = 0,
    activeGoal: string | null = null,
  ): Partial<ResearchGraphState> => ({
    goals,
    completedGoals,
    identificationConfidence,
    activeGoal,
    researchPhase: 'identification',
  });

  describe('identification phase', () => {
    it('should route to execute_identification when IDENTIFY_PRODUCT is pending and confidence < 0.85', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'pending');
      const state = createMockState([identifyGoal], [], 0.5);

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_identification');
    });

    it('should route to complete_identification_goal when confidence >= 0.85', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'pending');
      const state = createMockState([identifyGoal], [], 0.85);

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('complete_identification_goal');
    });

    it('should route to complete_identification_goal when confidence > 0.85', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'pending');
      const state = createMockState([identifyGoal], [], 0.92);

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('complete_identification_goal');
    });

    it('should route to parallel phase execution when IDENTIFY_PRODUCT is complete', () => {
      const identifyGoalId = uuidv4();
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'pending', [identifyGoalId]);
      const state = createMockState([identifyGoal, metadataGoal], [identifyGoalId], 0.85);

      const result = goalRouter(state as ResearchGraphState);

      // When identify goal is complete, phase is 'parallel' and it routes to execute metadata
      expect(result).toBe('execute_gather_metadata');
    });

    it('should route to parallel phase when IDENTIFY_PRODUCT goal is not found', () => {
      // Edge case: missing identification goal should not deadlock
      const metadataGoal = createMockGoal('GATHER_METADATA', 'pending');
      const state = createMockState([metadataGoal], [], 0.5);

      const result = goalRouter(state as ResearchGraphState);

      // When no identify goal exists, phase is 'parallel' and routes to metadata
      expect(result).toBe('execute_gather_metadata');
    });

    it('should stay in identification when confidence is just below threshold', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'pending');
      const state = createMockState([identifyGoal], [], 0.849);

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_identification');
    });
  });

  describe('parallel phase', () => {
    let identifyGoalId: string;
    let metadataGoalId: string;
    let marketGoalId: string;

    beforeEach(() => {
      identifyGoalId = uuidv4();
      metadataGoalId = uuidv4();
      marketGoalId = uuidv4();
    });

    it('should prioritize metadata when both goals are incomplete', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'pending', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'pending', [identifyGoalId], marketGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal],
        [identifyGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_gather_metadata');
    });

    it('should route to market research when metadata is complete', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'pending', [identifyGoalId], marketGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal],
        [identifyGoalId, metadataGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_market_research');
    });

    it('should route to metadata when market is complete', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'pending', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', [identifyGoalId], marketGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal],
        [identifyGoalId, marketGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_gather_metadata');
    });

    it('should route to assembly phase execution when both parallel goals are complete', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', [identifyGoalId], marketGoalId);
      const assemblyGoal = createMockGoal('ASSEMBLE_LISTING', 'pending', [metadataGoalId, marketGoalId]);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal, assemblyGoal],
        [identifyGoalId, metadataGoalId, marketGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      // When both parallel goals complete, phase is 'assembly' and routes to execute assembly
      expect(result).toBe('execute_assembly');
    });

    it('should force transition to assembly when no ready goals exist (deadlock prevention)', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      // Both goals marked as in_progress but not completed (edge case)
      const metadataGoal = createMockGoal('GATHER_METADATA', 'in_progress', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'in_progress', [identifyGoalId], marketGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal],
        [identifyGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('transition_to_assembly');
    });

    it('should handle missing metadata goal gracefully', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'pending', [identifyGoalId], marketGoalId);

      const state = createMockState(
        [identifyGoal, marketGoal],
        [identifyGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_market_research');
    });

    it('should handle missing market goal gracefully', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'pending', [identifyGoalId], metadataGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal],
        [identifyGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_gather_metadata');
    });
  });

  describe('assembly phase', () => {
    let identifyGoalId: string;
    let metadataGoalId: string;
    let marketGoalId: string;
    let assemblyGoalId: string;

    beforeEach(() => {
      identifyGoalId = uuidv4();
      metadataGoalId = uuidv4();
      marketGoalId = uuidv4();
      assemblyGoalId = uuidv4();
    });

    it('should route to execute_assembly when assembly goal is pending', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', [identifyGoalId], marketGoalId);
      const assemblyGoal = createMockGoal('ASSEMBLE_LISTING', 'pending', [metadataGoalId, marketGoalId], assemblyGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal, assemblyGoal],
        [identifyGoalId, metadataGoalId, marketGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_assembly');
    });

    it('should route to persist_results when assembly is complete', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', [identifyGoalId], marketGoalId);
      const assemblyGoal = createMockGoal('ASSEMBLE_LISTING', 'completed', [metadataGoalId, marketGoalId], assemblyGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal, assemblyGoal],
        [identifyGoalId, metadataGoalId, marketGoalId, assemblyGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('persist_results');
    });

    it('should route to execute_assembly when assembly goal is missing', () => {
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', [identifyGoalId], marketGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal],
        [identifyGoalId, metadataGoalId, marketGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_assembly');
    });
  });

  describe('edge cases', () => {
    it('should handle empty goals array', () => {
      const state = createMockState([], [], 0.5);

      const result = goalRouter(state as ResearchGraphState);

      // Should not deadlock - when no goals exist, phase is 'parallel' and forces to assembly
      expect(result).toBe('transition_to_assembly');
    });

    it('should handle state with active goal tracking', () => {
      const identifyGoalId = uuidv4();
      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'in_progress', [], identifyGoalId);
      const state = createMockState([identifyGoal], [], 0.5, identifyGoalId);

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('execute_identification');
    });

    it('should handle partially complete parallel phase', () => {
      // Test that when one parallel goal is complete but the other is not,
      // it routes to the incomplete goal
      const identifyGoalId = uuidv4();
      const metadataGoalId = uuidv4();
      const marketGoalId = uuidv4();

      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'pending', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', [identifyGoalId], marketGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal],
        [identifyGoalId, marketGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      // When market is complete but metadata isn't, routes to metadata
      expect(result).toBe('execute_gather_metadata');
    });

    it('should handle all goals completed scenario', () => {
      const identifyGoalId = uuidv4();
      const metadataGoalId = uuidv4();
      const marketGoalId = uuidv4();
      const assemblyGoalId = uuidv4();

      const identifyGoal = createMockGoal('IDENTIFY_PRODUCT', 'completed', [], identifyGoalId);
      const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', [identifyGoalId], metadataGoalId);
      const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', [identifyGoalId], marketGoalId);
      const assemblyGoal = createMockGoal('ASSEMBLE_LISTING', 'completed', [metadataGoalId, marketGoalId], assemblyGoalId);

      const state = createMockState(
        [identifyGoal, metadataGoal, marketGoal, assemblyGoal],
        [identifyGoalId, metadataGoalId, marketGoalId, assemblyGoalId],
        0.85,
      );

      const result = goalRouter(state as ResearchGraphState);

      expect(result).toBe('persist_results');
    });
  });
});

describe('identificationPhaseRouter', () => {
  const createMockState = (
    identificationConfidence: number,
    identificationAttempts: number,
    goals: ResearchGoal[] = [],
  ): Partial<ResearchGraphState> => ({
    identificationConfidence,
    identificationAttempts,
    goals,
  });

  const createIdentifyGoal = (maxAttempts = 3, requiredConfidence = 0.85): ResearchGoal => ({
    id: uuidv4(),
    type: 'IDENTIFY_PRODUCT',
    status: 'in_progress',
    confidence: 0,
    dependencies: [],
    attempts: 0,
    maxAttempts,
    requiredConfidence,
  });

  it('should complete when confidence meets required threshold', () => {
    const goal = createIdentifyGoal(3, 0.85);
    const state = createMockState(0.85, 1, [goal]);

    const result = identificationPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('complete_identification');
  });

  it('should complete when confidence exceeds required threshold', () => {
    const goal = createIdentifyGoal(3, 0.85);
    const state = createMockState(0.92, 1, [goal]);

    const result = identificationPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('complete_identification');
  });

  it('should continue when confidence is below threshold', () => {
    const goal = createIdentifyGoal(3, 0.85);
    const state = createMockState(0.70, 1, [goal]);

    const result = identificationPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('continue_identification');
  });

  it('should complete when max attempts reached even with low confidence', () => {
    const goal = createIdentifyGoal(3, 0.85);
    const state = createMockState(0.50, 3, [goal]);

    const result = identificationPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('complete_identification');
  });

  it('should continue when attempts not exhausted', () => {
    const goal = createIdentifyGoal(3, 0.85);
    const state = createMockState(0.60, 2, [goal]);

    const result = identificationPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('continue_identification');
  });

  it('should use default values when goal not found', () => {
    const state = createMockState(0.90, 1, []);

    const result = identificationPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('complete_identification');
  });
});

describe('parallelPhaseRouter', () => {
  const createMockState = (
    goals: ResearchGoal[],
    completedGoals: string[],
  ): Partial<ResearchGraphState> => ({
    goals,
    completedGoals,
  });

  const createMockGoal = (
    type: GoalType,
    status: 'pending' | 'in_progress' | 'completed',
    id?: string,
  ): ResearchGoal => ({
    id: id || uuidv4(),
    type,
    status,
    confidence: 0,
    dependencies: [],
    attempts: 0,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  });

  it('should route to assembly when both goals complete', () => {
    const metadataGoalId = uuidv4();
    const marketGoalId = uuidv4();

    const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', metadataGoalId);
    const marketGoal = createMockGoal('RESEARCH_MARKET', 'completed', marketGoalId);

    const state = createMockState(
      [metadataGoal, marketGoal],
      [metadataGoalId, marketGoalId],
    );

    const result = parallelPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('transition_to_assembly');
  });

  it('should prioritize metadata when both incomplete', () => {
    const metadataGoal = createMockGoal('GATHER_METADATA', 'pending');
    const marketGoal = createMockGoal('RESEARCH_MARKET', 'pending');

    const state = createMockState([metadataGoal, marketGoal], []);

    const result = parallelPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('execute_gather_metadata');
  });

  it('should route to market when metadata complete', () => {
    const metadataGoalId = uuidv4();
    const metadataGoal = createMockGoal('GATHER_METADATA', 'completed', metadataGoalId);
    const marketGoal = createMockGoal('RESEARCH_MARKET', 'pending');

    const state = createMockState(
      [metadataGoal, marketGoal],
      [metadataGoalId],
    );

    const result = parallelPhaseRouter(state as ResearchGraphState);

    expect(result).toBe('execute_market_research');
  });
});

describe('isIdentificationComplete', () => {
  const createMockState = (
    goals: ResearchGoal[],
    completedGoals: string[],
  ): Partial<ResearchGraphState> => ({
    goals,
    completedGoals,
  });

  const createIdentifyGoal = (id?: string): ResearchGoal => ({
    id: id || uuidv4(),
    type: 'IDENTIFY_PRODUCT',
    status: 'pending',
    confidence: 0,
    dependencies: [],
    attempts: 0,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  });

  it('should return true when identification goal is completed', () => {
    const goalId = uuidv4();
    const goal = createIdentifyGoal(goalId);
    const state = createMockState([goal], [goalId]);

    const result = isIdentificationComplete(state as ResearchGraphState);

    expect(result).toBe(true);
  });

  it('should return false when identification goal is not completed', () => {
    const goal = createIdentifyGoal();
    const state = createMockState([goal], []);

    const result = isIdentificationComplete(state as ResearchGraphState);

    expect(result).toBe(false);
  });

  it('should return true when no identification goal exists', () => {
    const state = createMockState([], []);

    const result = isIdentificationComplete(state as ResearchGraphState);

    expect(result).toBe(true);
  });
});

describe('completeIdentificationGoalNode', () => {
  const createIdentifyGoal = (id?: string): ResearchGoal => ({
    id: id || uuidv4(),
    type: 'IDENTIFY_PRODUCT',
    status: 'in_progress',
    confidence: 0,
    dependencies: [],
    attempts: 1,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  });

  it('should mark identification goal as complete and transition to parallel phase', async () => {
    const goalId = uuidv4();
    const goal = createIdentifyGoal(goalId);

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      identificationConfidence: 0.90,
    };

    const result = await completeIdentificationGoalNode(state as ResearchGraphState);

    expect(result.researchPhase).toBe('parallel');
    expect(result.completedGoals).toContain(goalId);
    expect(result.goals).toBeDefined();

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.status).toBe('completed');
    expect(updatedGoal?.confidence).toBe(0.90);
    expect(updatedGoal?.completedAt).toBeDefined();
  });

  it('should handle missing IDENTIFY_PRODUCT goal gracefully', async () => {
    const state: Partial<ResearchGraphState> = {
      goals: [],
      completedGoals: [],
      identificationConfidence: 0.90,
    };

    const result = await completeIdentificationGoalNode(state as ResearchGraphState);

    expect(result.researchPhase).toBe('parallel');
    expect(result.goals).toBeUndefined();
  });
});

describe('completeMetadataGoalNode', () => {
  const createMetadataGoal = (id?: string): ResearchGoal => ({
    id: id || uuidv4(),
    type: 'GATHER_METADATA',
    status: 'in_progress',
    confidence: 0,
    dependencies: [],
    attempts: 1,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  });

  // Helper to create a minimal FieldState
  const createFieldState = (
    name: string,
    status: 'pending' | 'researching' | 'complete' | 'failed' | 'user_required',
    value: unknown,
  ): any => ({
    name,
    displayName: name,
    value,
    confidence: {
      value: 0.8,
      sources: [],
      lastUpdated: new Date().toISOString(),
    },
    required: true,
    requiredBy: ['ebay'],
    dataType: 'string',
    attempts: 0,
    status,
  });

  it('should mark metadata goal as complete with field-based confidence', async () => {
    const goalId = uuidv4();
    const goal = createMetadataGoal(goalId);

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      fieldStates: {
        fields: {
          brand: createFieldState('brand', 'complete', 'TestBrand'),
          model: createFieldState('model', 'complete', 'TestModel'),
          category: createFieldState('category', 'pending', null),
        },
        requiredFieldsComplete: 2,
        requiredFieldsTotal: 3,
        recommendedFieldsComplete: 0,
        recommendedFieldsTotal: 0,
        completionScore: 0.666,
        readyToPublish: false,
        totalCost: 0,
        totalTimeMs: 0,
        iterations: 0,
        version: '1.0.0',
      },
    };

    const result = await completeMetadataGoalNode(state as ResearchGraphState);

    expect(result.completedGoals).toContain(goalId);
    expect(result.goals).toBeDefined();

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.status).toBe('completed');
    // 2 complete fields out of 3 total = 0.66...
    expect(updatedGoal?.confidence).toBeCloseTo(0.666, 2);
  });

  it('should use default confidence when fieldStates is null', async () => {
    const goalId = uuidv4();
    const goal = createMetadataGoal(goalId);

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      fieldStates: null,
    };

    const result = await completeMetadataGoalNode(state as ResearchGraphState);

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.confidence).toBe(0.5);
  });

  it('should handle missing GATHER_METADATA goal gracefully', async () => {
    const state: Partial<ResearchGraphState> = {
      goals: [],
      completedGoals: [],
      fieldStates: null,
    };

    const result = await completeMetadataGoalNode(state as ResearchGraphState);

    expect(result).toEqual({});
  });
});

describe('completeMarketGoalNode', () => {
  const createMarketGoal = (id?: string): ResearchGoal => ({
    id: id || uuidv4(),
    type: 'RESEARCH_MARKET',
    status: 'in_progress',
    confidence: 0,
    dependencies: [],
    attempts: 1,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  });

  it('should mark market goal as complete with high confidence for 10+ comps', async () => {
    const goalId = uuidv4();
    const goal = createMarketGoal(goalId);

    const mockComps = Array(12).fill(null).map((_, i) => ({
      id: `comp-${i}`,
      confidenceScore: 0.8,
    }));

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      validatedComps: mockComps as any,
    };

    const result = await completeMarketGoalNode(state as ResearchGraphState);

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.confidence).toBe(0.9);
  });

  it('should use medium confidence for 5-9 comps', async () => {
    const goalId = uuidv4();
    const goal = createMarketGoal(goalId);

    const mockComps = Array(7).fill(null).map((_, i) => ({
      id: `comp-${i}`,
      confidenceScore: 0.8,
    }));

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      validatedComps: mockComps as any,
    };

    const result = await completeMarketGoalNode(state as ResearchGraphState);

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.confidence).toBe(0.75);
  });

  it('should use lower confidence for 3-4 comps', async () => {
    const goalId = uuidv4();
    const goal = createMarketGoal(goalId);

    const mockComps = Array(3).fill(null).map((_, i) => ({
      id: `comp-${i}`,
      confidenceScore: 0.8,
    }));

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      validatedComps: mockComps as any,
    };

    const result = await completeMarketGoalNode(state as ResearchGraphState);

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.confidence).toBe(0.6);
  });

  it('should use low confidence for < 3 comps', async () => {
    const goalId = uuidv4();
    const goal = createMarketGoal(goalId);

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      validatedComps: [],
    };

    const result = await completeMarketGoalNode(state as ResearchGraphState);

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.confidence).toBe(0.3);
  });
});

describe('completeAssemblyGoalNode', () => {
  const createAssemblyGoal = (id?: string): ResearchGoal => ({
    id: id || uuidv4(),
    type: 'ASSEMBLE_LISTING',
    status: 'in_progress',
    confidence: 0,
    dependencies: [],
    attempts: 1,
    maxAttempts: 3,
    requiredConfidence: 0.85,
  });

  it('should mark assembly goal as complete with high confidence when listings exist', async () => {
    const goalId = uuidv4();
    const goal = createAssemblyGoal(goalId);

    const mockListing = {
      marketplace: 'ebay',
      title: 'Test Listing',
    };

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      listings: [mockListing as any],
    };

    const result = await completeAssemblyGoalNode(state as ResearchGraphState);

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.confidence).toBe(0.85);
  });

  it('should use default confidence when no listings exist', async () => {
    const goalId = uuidv4();
    const goal = createAssemblyGoal(goalId);

    const state: Partial<ResearchGraphState> = {
      goals: [goal],
      completedGoals: [],
      listings: [],
    };

    const result = await completeAssemblyGoalNode(state as ResearchGraphState);

    const updatedGoal = result.goals?.find(g => g.id === goalId);
    expect(updatedGoal?.confidence).toBe(0.5);
  });

  it('should handle missing ASSEMBLE_LISTING goal gracefully', async () => {
    const state: Partial<ResearchGraphState> = {
      goals: [],
      completedGoals: [],
      listings: [],
    };

    const result = await completeAssemblyGoalNode(state as ResearchGraphState);

    expect(result).toEqual({});
  });
});
