import { Injectable, Logger } from '@nestjs/common';
import {
  ResearchGoal,
  GoalExecutionContext,
  GoalResult,
  createDefaultGoals,
  getReadyGoals,
  getParallelizableGoals,
  areCriticalGoalsComplete,
  getIncompleteGoals,
} from './research-goal.types';
import { withSpan, ResearchMetrics, startTiming } from '../utils/telemetry';

/**
 * Goal executor function type
 */
export type GoalExecutor = (
  goal: ResearchGoal,
  context: GoalExecutionContext,
) => Promise<GoalResult>;

/**
 * Registry of goal executors
 */
export type GoalExecutorRegistry = Map<string, GoalExecutor>;

/**
 * Orchestration result
 */
export interface OrchestrationResult {
  success: boolean;
  goals: ResearchGoal[];
  sharedState: Record<string, unknown>;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  totalDurationMs: number;
}

/**
 * Goal Orchestrator Service
 *
 * Manages the execution of research goals with support for:
 * - Parallel execution of independent goals
 * - Dependency management
 * - Retry logic
 * - Timeout handling
 * - Progress tracking
 */
@Injectable()
export class GoalOrchestratorService {
  private readonly logger = new Logger(GoalOrchestratorService.name);
  private executors: GoalExecutorRegistry = new Map();

  /**
   * Register a goal executor
   */
  registerExecutor(goalName: string, executor: GoalExecutor): void {
    this.executors.set(goalName, executor);
    this.logger.debug(`Registered executor for goal: ${goalName}`);
  }

  /**
   * Register multiple executors at once
   */
  registerExecutors(executors: Record<string, GoalExecutor>): void {
    for (const [name, executor] of Object.entries(executors)) {
      this.registerExecutor(name, executor);
    }
  }

  /**
   * Get registered executor count
   */
  getExecutorCount(): number {
    return this.executors.size;
  }

  /**
   * Execute all research goals with orchestration
   */
  async orchestrate(context: GoalExecutionContext): Promise<OrchestrationResult> {
    const timing = startTiming();
    const goals = createDefaultGoals();
    const completedGoalNames = new Set<string>();

    this.logger.log(`Starting goal orchestration for research run: ${context.researchRunId}`);
    ResearchMetrics.researchRunsStarted({ organization_id: context.organizationId });

    let iteration = 0;
    const maxIterations = 50; // Safety limit

    while (iteration < maxIterations && !context.cancelled) {
      iteration++;

      // Get goals that are ready to execute
      const readyGoals = getReadyGoals(goals, completedGoalNames);

      if (readyGoals.length === 0) {
        // Check if we're done or stuck
        const incomplete = getIncompleteGoals(goals);
        if (incomplete.length === 0) {
          this.logger.log('All goals completed');
          break;
        }

        // Check if remaining goals are blocked
        const allBlocked = incomplete.every(g =>
          g.dependencies.some(dep => {
            const depGoal = goals.find(gg => gg.name === dep);
            return depGoal?.status === 'failed';
          })
        );

        if (allBlocked) {
          this.logger.warn('Remaining goals are blocked due to failed dependencies');
          incomplete.forEach(g => {
            g.status = 'blocked';
          });
          break;
        }

        this.logger.warn('No ready goals but still have incomplete goals - possible cyclic dependency');
        break;
      }

      // Get goals that can run in parallel
      const parallelGoals = getParallelizableGoals(readyGoals);

      this.logger.debug(`Iteration ${iteration}: ${parallelGoals.length} goals ready for parallel execution`);

      // Execute goals in parallel
      const results = await this.executeGoalsParallel(parallelGoals, context);

      // Process results
      for (const { goal, result } of results) {
        if (result.success) {
          goal.status = 'completed';
          goal.result = result;
          completedGoalNames.add(goal.name);

          // Merge produced data into shared state
          for (const key of goal.produces) {
            if (result.data[key] !== undefined) {
              context.sharedState[key] = result.data[key];
            }
          }

          this.logger.debug(`Goal completed: ${goal.name} (confidence: ${result.confidence})`);
        } else {
          // Check if we should retry
          if (goal.retryCount < goal.maxRetries) {
            goal.retryCount++;
            goal.status = 'pending';
            this.logger.warn(`Goal failed, will retry (${goal.retryCount}/${goal.maxRetries}): ${goal.name}`);
          } else {
            goal.status = 'failed';
            goal.result = result;
            goal.errorMessage = result.data.error as string || 'Unknown error';
            this.logger.error(`Goal failed permanently: ${goal.name} - ${goal.errorMessage}`);
          }
        }
      }

      // Check if critical goals are complete
      if (areCriticalGoalsComplete(goals)) {
        this.logger.log('All critical goals completed');
        // Continue with remaining goals but could early-exit here if needed
      }
    }

    // Calculate final statistics
    const completedCount = goals.filter(g => g.status === 'completed').length;
    const failedCount = goals.filter(g => g.status === 'failed').length;
    const skippedCount = goals.filter(g => g.status === 'skipped' || g.status === 'blocked').length;
    const totalDurationMs = timing.stop();

    const success = failedCount === 0 && completedCount > 0;

    // Record metrics
    ResearchMetrics.researchRunsCompleted({
      organization_id: context.organizationId,
      status: success ? 'success' : 'error'
    });
    ResearchMetrics.researchRunDuration(totalDurationMs, {
      organization_id: context.organizationId,
      status: success ? 'success' : 'error'
    });

    this.logger.log(
      `Orchestration complete: ${completedCount} completed, ${failedCount} failed, ${skippedCount} skipped in ${totalDurationMs}ms`
    );

    return {
      success,
      goals,
      sharedState: context.sharedState,
      completedCount,
      failedCount,
      skippedCount,
      totalDurationMs,
    };
  }

  /**
   * Execute multiple goals in parallel
   */
  private async executeGoalsParallel(
    goals: ResearchGoal[],
    context: GoalExecutionContext,
  ): Promise<Array<{ goal: ResearchGoal; result: GoalResult }>> {
    const promises = goals.map(async (goal) => {
      const result = await this.executeGoal(goal, context);
      return { goal, result };
    });

    return Promise.all(promises);
  }

  /**
   * Execute a single goal with timeout and error handling
   */
  private async executeGoal(
    goal: ResearchGoal,
    context: GoalExecutionContext,
  ): Promise<GoalResult> {
    const timing = startTiming();
    goal.status = 'in_progress';
    goal.startedAt = new Date();

    return withSpan(
      `research.goal.${goal.name}`,
      goal.category as any,
      async (span) => {
        span.setAttribute('goal.name', goal.name);
        span.setAttribute('goal.category', goal.category);
        span.setAttribute('goal.priority', goal.priority);
        span.setAttribute('research.run_id', context.researchRunId);

        const executor = this.executors.get(goal.name);

        if (!executor) {
          this.logger.warn(`No executor registered for goal: ${goal.name}`);
          // Return a pass-through result for unimplemented goals
          return {
            success: true,
            confidence: 0.5,
            data: {},
            warnings: [`No executor implemented for ${goal.name}`],
          };
        }

        try {
          // Execute with timeout
          const result = await Promise.race([
            executor(goal, context),
            this.createTimeout(goal.timeoutMs, goal.name),
          ]);

          goal.completedAt = new Date();
          const duration = timing.stop();

          ResearchMetrics.nodeDuration(duration, { node: goal.name });
          ResearchMetrics.nodeExecuted({
            node: goal.name,
            status: result.success ? 'success' : 'error'
          });

          return result;
        } catch (error) {
          const duration = timing.stop();
          goal.completedAt = new Date();

          ResearchMetrics.nodeDuration(duration, { node: goal.name });
          ResearchMetrics.nodeExecuted({ node: goal.name, status: 'error' });

          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Goal execution error for ${goal.name}: ${errorMessage}`);

          return {
            success: false,
            confidence: 0,
            data: { error: errorMessage },
          };
        }
      },
      { 'research.run_id': context.researchRunId },
    );
  }

  /**
   * Create a timeout promise that rejects after the specified duration
   */
  private createTimeout(ms: number, goalName: string): Promise<GoalResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Goal ${goalName} timed out after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Create a cancellable orchestration context
   */
  createContext(
    researchRunId: string,
    itemId: string,
    organizationId: string,
    initialState: Record<string, unknown> = {},
  ): GoalExecutionContext {
    return {
      researchRunId,
      itemId,
      organizationId,
      sharedState: { ...initialState },
      cancelled: false,
    };
  }

  /**
   * Cancel an ongoing orchestration
   */
  cancelContext(context: GoalExecutionContext): void {
    context.cancelled = true;
    this.logger.log(`Orchestration cancelled for research run: ${context.researchRunId}`);
  }
}
