import { ResearchGraphState } from '../research-graph.state';
import {
  getReadyGoals,
  updateGoalStatus,
  determineResearchPhase,
} from './initialize-goals.node';
import { createNodeLogger } from '../../../utils/node-logger';

const logger = createNodeLogger('goal-router');

/**
 * Goal Router Node
 *
 * Routes to the appropriate next step based on goal state:
 * - If in identification phase, routes to identification nodes
 * - If in parallel phase, routes to parallel goals (metadata/market)
 * - If in assembly phase, routes to assembly
 *
 * Returns the name of the next node to execute.
 */
export function goalRouter(state: ResearchGraphState): string {
  const { goals, completedGoals, activeGoal, identificationConfidence } = state;

  // Determine current phase
  const phase = determineResearchPhase(goals, completedGoals);
  logger.info(`Goal router: phase=${phase}, completedGoals=${completedGoals.length}`);

  // Get the current active goal
  const currentGoal = goals.find((g) => g.id === activeGoal);

  if (currentGoal) {
    logger.info(`Active goal: ${currentGoal.type} (status: ${currentGoal.status})`);
  }

  switch (phase) {
    case 'identification':
      // In identification phase, we must complete IDENTIFY_PRODUCT
      const identifyGoal = goals.find((g) => g.type === 'IDENTIFY_PRODUCT');

      if (!identifyGoal || completedGoals.includes(identifyGoal.id)) {
        // Identification complete, move to parallel phase
        logger.info('Identification phase complete, transitioning to parallel phase');
        return 'transition_to_parallel';
      }

      // Check if we've hit required confidence (0.85)
      if (identificationConfidence >= 0.85) {
        logger.info(`Identification confidence ${identificationConfidence} >= 0.85, completing goal`);
        return 'complete_identification_goal';
      }

      // Continue with identification
      return 'execute_identification';

    case 'parallel':
      // In parallel phase, find ready goals
      const readyGoals = getReadyGoals(goals, completedGoals);
      logger.info(`Parallel phase: ${readyGoals.length} ready goals`);

      // Check if all parallel goals are complete
      const metadataGoal = goals.find((g) => g.type === 'GATHER_METADATA');
      const marketGoal = goals.find((g) => g.type === 'RESEARCH_MARKET');

      const metadataComplete = metadataGoal && completedGoals.includes(metadataGoal.id);
      const marketComplete = marketGoal && completedGoals.includes(marketGoal.id);

      if (metadataComplete && marketComplete) {
        logger.info('Both parallel goals complete, transitioning to assembly');
        return 'transition_to_assembly';
      }

      // Prioritize market research if metadata is complete
      if (metadataComplete && !marketComplete) {
        return 'execute_market_research';
      }

      // Prioritize metadata if market is complete
      if (!metadataComplete && marketComplete) {
        return 'execute_gather_metadata';
      }

      // Both incomplete - prioritize metadata to ensure we have identifiers for comps
      if (readyGoals.find((g) => g.type === 'GATHER_METADATA')) {
        return 'execute_gather_metadata';
      }

      if (readyGoals.find((g) => g.type === 'RESEARCH_MARKET')) {
        return 'execute_market_research';
      }

      // If no ready goals, something went wrong - force to assembly
      logger.warn('No ready goals in parallel phase, forcing assembly');
      return 'transition_to_assembly';

    case 'assembly':
      // In assembly phase, execute final assembly
      const assemblyGoal = goals.find((g) => g.type === 'ASSEMBLE_LISTING');

      if (assemblyGoal && completedGoals.includes(assemblyGoal.id)) {
        logger.info('Assembly complete, persisting results');
        return 'persist_results';
      }

      return 'execute_assembly';

    default:
      logger.error(`Unknown phase: ${phase}`);
      return 'persist_results';
  }
}

/**
 * Identification Phase Router
 *
 * Within identification phase, decides whether to:
 * - Continue with deep identification
 * - Complete the identification goal
 */
export function identificationPhaseRouter(state: ResearchGraphState): string {
  const { identificationConfidence, identificationAttempts, goals } = state;

  const identifyGoal = goals.find((g) => g.type === 'IDENTIFY_PRODUCT');
  const maxAttempts = identifyGoal?.maxAttempts || 3;
  const requiredConfidence = identifyGoal?.requiredConfidence || 0.85;

  // Check if we've hit required confidence
  if (identificationConfidence >= requiredConfidence) {
    logger.info(`Identification confidence ${identificationConfidence} >= ${requiredConfidence}, completing`);
    return 'complete_identification';
  }

  // Check if we've exceeded max attempts
  if (identificationAttempts >= maxAttempts) {
    logger.warn(`Max identification attempts (${maxAttempts}) reached, continuing with best guess`);
    return 'complete_identification';
  }

  // Continue trying to identify
  return 'continue_identification';
}

/**
 * Parallel Phase Router
 *
 * In the parallel phase, routes between:
 * - execute_gather_metadata (if metadata goal incomplete)
 * - execute_market_research (if market goal incomplete)
 * - transition_to_assembly (if both complete)
 */
export function parallelPhaseRouter(state: ResearchGraphState): string {
  const { goals, completedGoals } = state;

  const metadataGoal = goals.find((g) => g.type === 'GATHER_METADATA');
  const marketGoal = goals.find((g) => g.type === 'RESEARCH_MARKET');

  const metadataComplete = metadataGoal && completedGoals.includes(metadataGoal.id);
  const marketComplete = marketGoal && completedGoals.includes(marketGoal.id);

  if (metadataComplete && marketComplete) {
    return 'transition_to_assembly';
  }

  // Alternate between goals, starting with metadata
  if (!metadataComplete) {
    return 'execute_gather_metadata';
  }

  return 'execute_market_research';
}

/**
 * Check if identification phase is complete
 */
export function isIdentificationComplete(state: ResearchGraphState): boolean {
  const { goals, completedGoals } = state;
  const identifyGoal = goals.find((g) => g.type === 'IDENTIFY_PRODUCT');
  return identifyGoal ? completedGoals.includes(identifyGoal.id) : true;
}

/**
 * Mark the current identification goal as complete
 */
export async function completeIdentificationGoalNode(
  state: ResearchGraphState,
): Promise<Partial<ResearchGraphState>> {
  const { goals, completedGoals, identificationConfidence } = state;

  const identifyGoal = goals.find((g) => g.type === 'IDENTIFY_PRODUCT');
  if (!identifyGoal) {
    logger.warn('No IDENTIFY_PRODUCT goal found');
    return { researchPhase: 'parallel' };
  }

  // Update the goal status
  const updatedGoals = updateGoalStatus(goals, identifyGoal.id, {
    status: 'completed',
    confidence: identificationConfidence,
    completedAt: new Date().toISOString(),
  });

  logger.info(`Completed IDENTIFY_PRODUCT goal with confidence ${identificationConfidence}`);

  return {
    goals: updatedGoals,
    completedGoals: [...completedGoals, identifyGoal.id],
    researchPhase: 'parallel',
  };
}

/**
 * Mark metadata goal as complete
 */
export async function completeMetadataGoalNode(
  state: ResearchGraphState,
): Promise<Partial<ResearchGraphState>> {
  const { goals, completedGoals, fieldStates } = state;

  const metadataGoal = goals.find((g) => g.type === 'GATHER_METADATA');
  if (!metadataGoal) {
    logger.warn('No GATHER_METADATA goal found');
    return {};
  }

  // Calculate confidence based on field states
  let confidence = 0.5; // Default moderate confidence
  if (fieldStates) {
    const fields = Object.values(fieldStates.fields);
    const completedFields = fields.filter((f) => f.status === 'complete');
    confidence = completedFields.length / Math.max(fields.length, 1);
  }

  const updatedGoals = updateGoalStatus(goals, metadataGoal.id, {
    status: 'completed',
    confidence,
    completedAt: new Date().toISOString(),
  });

  logger.info(`Completed GATHER_METADATA goal with confidence ${confidence}`);

  return {
    goals: updatedGoals,
    completedGoals: [...completedGoals, metadataGoal.id],
  };
}

/**
 * Mark market research goal as complete
 */
export async function completeMarketGoalNode(
  state: ResearchGraphState,
): Promise<Partial<ResearchGraphState>> {
  const { goals, completedGoals, validatedComps } = state;

  const marketGoal = goals.find((g) => g.type === 'RESEARCH_MARKET');
  if (!marketGoal) {
    logger.warn('No RESEARCH_MARKET goal found');
    return {};
  }

  // Calculate confidence based on number and quality of validated comps
  let confidence = 0.3; // Default low confidence
  if (validatedComps.length >= 10) {
    confidence = 0.9;
  } else if (validatedComps.length >= 5) {
    confidence = 0.75;
  } else if (validatedComps.length >= 3) {
    confidence = 0.6;
  }

  const updatedGoals = updateGoalStatus(goals, marketGoal.id, {
    status: 'completed',
    confidence,
    completedAt: new Date().toISOString(),
  });

  logger.info(`Completed RESEARCH_MARKET goal with confidence ${confidence} (${validatedComps.length} validated comps)`);

  return {
    goals: updatedGoals,
    completedGoals: [...completedGoals, marketGoal.id],
  };
}

/**
 * Mark assembly goal as complete
 */
export async function completeAssemblyGoalNode(
  state: ResearchGraphState,
): Promise<Partial<ResearchGraphState>> {
  const { goals, completedGoals, listings } = state;

  const assemblyGoal = goals.find((g) => g.type === 'ASSEMBLE_LISTING');
  if (!assemblyGoal) {
    logger.warn('No ASSEMBLE_LISTING goal found');
    return {};
  }

  // Calculate confidence based on listing completeness
  const confidence = listings.length > 0 ? 0.85 : 0.5;

  const updatedGoals = updateGoalStatus(goals, assemblyGoal.id, {
    status: 'completed',
    confidence,
    completedAt: new Date().toISOString(),
  });

  logger.info(`Completed ASSEMBLE_LISTING goal with confidence ${confidence}`);

  return {
    goals: updatedGoals,
    completedGoals: [...completedGoals, assemblyGoal.id],
  };
}
