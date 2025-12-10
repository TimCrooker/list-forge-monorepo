import { v4 as uuidv4 } from 'uuid';
import {
  ResearchGoal,
  GoalType,
  DEFAULT_GOAL_CONFIGS,
} from '@listforge/core-types';
import { ResearchGraphState } from '../research-graph.state';
import { createNodeLogger } from '../../../utils/node-logger';

const logger = createNodeLogger('initialize-goals');

/**
 * Initialize Goals Node
 *
 * Creates the goal DAG for the research workflow. The goals are:
 * 1. IDENTIFY_PRODUCT - First phase, no dependencies (must complete before anything else)
 * 2. VALIDATE_IDENTIFICATION - Optional, depends on IDENTIFY_PRODUCT
 * 3. GATHER_METADATA - Parallel phase, depends on IDENTIFY_PRODUCT
 * 4. RESEARCH_MARKET - Parallel phase, depends on IDENTIFY_PRODUCT
 * 5. ASSEMBLE_LISTING - Final phase, depends on GATHER_METADATA and RESEARCH_MARKET
 *
 * The hybrid flow is:
 * - Phase 1 (strict): IDENTIFY_PRODUCT must complete with confidence >= 0.85
 * - Phase 2 (parallel): GATHER_METADATA and RESEARCH_MARKET can run in parallel
 * - Phase 3 (assembly): ASSEMBLE_LISTING brings everything together
 */
export async function initializeGoalsNode(
  state: ResearchGraphState,
): Promise<Partial<ResearchGraphState>> {
  logger.info(`Initializing research goals for item ${state.itemId}`);

  const goals: ResearchGoal[] = [];

  // Create goal IDs upfront so we can set dependencies
  const goalIds: Record<GoalType, string> = {
    IDENTIFY_PRODUCT: uuidv4(),
    VALIDATE_IDENTIFICATION: uuidv4(),
    GATHER_METADATA: uuidv4(),
    RESEARCH_MARKET: uuidv4(),
    ASSEMBLE_LISTING: uuidv4(),
  };

  // 1. IDENTIFY_PRODUCT - No dependencies, must complete first
  goals.push({
    ...DEFAULT_GOAL_CONFIGS.IDENTIFY_PRODUCT,
    id: goalIds.IDENTIFY_PRODUCT,
    status: 'pending',
    confidence: 0,
  });

  // 2. VALIDATE_IDENTIFICATION - Optional, depends on IDENTIFY_PRODUCT
  // This goal is skipped if identification confidence is already high
  goals.push({
    ...DEFAULT_GOAL_CONFIGS.VALIDATE_IDENTIFICATION,
    id: goalIds.VALIDATE_IDENTIFICATION,
    status: 'pending',
    confidence: 0,
    dependencies: [goalIds.IDENTIFY_PRODUCT],
  });

  // 3. GATHER_METADATA - Parallel phase, depends on IDENTIFY_PRODUCT
  goals.push({
    ...DEFAULT_GOAL_CONFIGS.GATHER_METADATA,
    id: goalIds.GATHER_METADATA,
    status: 'pending',
    confidence: 0,
    dependencies: [goalIds.IDENTIFY_PRODUCT],
  });

  // 4. RESEARCH_MARKET - Parallel phase, depends on IDENTIFY_PRODUCT
  goals.push({
    ...DEFAULT_GOAL_CONFIGS.RESEARCH_MARKET,
    id: goalIds.RESEARCH_MARKET,
    status: 'pending',
    confidence: 0,
    dependencies: [goalIds.IDENTIFY_PRODUCT],
  });

  // 5. ASSEMBLE_LISTING - Final phase, depends on metadata and market research
  goals.push({
    ...DEFAULT_GOAL_CONFIGS.ASSEMBLE_LISTING,
    id: goalIds.ASSEMBLE_LISTING,
    status: 'pending',
    confidence: 0,
    dependencies: [goalIds.GATHER_METADATA, goalIds.RESEARCH_MARKET],
  });

  logger.info(`Created ${goals.length} research goals`, {
    goalIds,
    dependencies: goals.map((g) => ({
      type: g.type,
      deps: g.dependencies.length,
    })),
  });

  // Set the first goal as active
  const firstGoal = goals.find((g) => g.type === 'IDENTIFY_PRODUCT');

  return {
    goals,
    activeGoal: firstGoal?.id || null,
    completedGoals: [],
    researchPhase: 'identification',
  };
}

/**
 * Check if a goal's dependencies are satisfied
 */
export function areGoalDependenciesSatisfied(
  goal: ResearchGoal,
  completedGoalIds: string[],
): boolean {
  return goal.dependencies.every((depId) => completedGoalIds.includes(depId));
}

/**
 * Get the next goals that can be started (dependencies satisfied)
 */
export function getReadyGoals(
  goals: ResearchGoal[],
  completedGoalIds: string[],
): ResearchGoal[] {
  return goals.filter(
    (goal) =>
      goal.status === 'pending' &&
      areGoalDependenciesSatisfied(goal, completedGoalIds),
  );
}

/**
 * Update a goal's status and return the updated goals array
 */
export function updateGoalStatus(
  goals: ResearchGoal[],
  goalId: string,
  updates: Partial<ResearchGoal>,
): ResearchGoal[] {
  return goals.map((goal) => {
    if (goal.id === goalId) {
      return { ...goal, ...updates };
    }
    return goal;
  });
}

/**
 * Determine the current research phase based on completed goals
 */
export function determineResearchPhase(
  goals: ResearchGoal[],
  completedGoalIds: string[],
): 'identification' | 'parallel' | 'assembly' {
  const identifyGoal = goals.find((g) => g.type === 'IDENTIFY_PRODUCT');
  const metadataGoal = goals.find((g) => g.type === 'GATHER_METADATA');
  const marketGoal = goals.find((g) => g.type === 'RESEARCH_MARKET');

  // If IDENTIFY_PRODUCT is not complete, we're in identification phase
  if (identifyGoal && !completedGoalIds.includes(identifyGoal.id)) {
    return 'identification';
  }

  // If both metadata and market goals are complete, we're in assembly phase
  if (
    metadataGoal &&
    marketGoal &&
    completedGoalIds.includes(metadataGoal.id) &&
    completedGoalIds.includes(marketGoal.id)
  ) {
    return 'assembly';
  }

  // Otherwise, we're in parallel phase
  return 'parallel';
}
