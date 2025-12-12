import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import type {
  ItemFieldStates,
  FieldState,
  ResearchTask,
  ResearchConstraints,
  ResearchToolType,
  ResearchToolMetadata,
  FieldEvaluationResult,
  RESEARCH_TOOLS,
  RESEARCH_MODE_CONSTRAINTS,
  ResearchTaskHistory,
} from '@listforge/core-types';
import {
  RESEARCH_TOOLS as ResearchToolsData,
  RESEARCH_MODE_CONSTRAINTS as ResearchModeConstraintsData,
  MAX_ATTEMPTS_PER_TOOL,
  MAX_CONSECUTIVE_NO_PROGRESS,
} from '@listforge/core-types';

/**
 * Context about what data is available for research
 */
export interface ResearchContext {
  hasUpc: boolean;
  hasBrand: boolean;
  hasModel: boolean;
  hasCategory: boolean;
  hasImages: boolean;
  imageCount: number;
  keepaConfigured: boolean;
  amazonConfigured: boolean;
  upcDatabaseConfigured: boolean;
}

/**
 * Result of should continue check
 */
export interface ContinueDecision {
  shouldContinue: boolean;
  reason: string;
  fieldsNeedingWork: number;
  budgetRemaining: number;
  iterationsRemaining: number;
}

/**
 * ResearchPlannerService
 *
 * Dynamically plans research tasks based on current field states,
 * available tools, and budget constraints.
 *
 * Key responsibilities:
 * - Select the best research tool for each field gap
 * - Prioritize research based on field importance and confidence
 * - Track budget and iteration limits
 * - Determine when to stop researching
 */
@Injectable()
export class ResearchPlannerService {
  private readonly logger = new Logger(ResearchPlannerService.name);

  /**
   * Tool registry with metadata
   */
  private readonly tools: Map<ResearchToolType, ResearchToolMetadata>;

  constructor(private readonly configService: ConfigService) {
    // Initialize tool registry
    this.tools = new Map();
    for (const tool of ResearchToolsData) {
      this.tools.set(tool.type, tool);
    }
  }

  /**
   * Get default constraints for a research mode
   */
  getDefaultConstraints(mode: 'fast' | 'balanced' | 'thorough'): ResearchConstraints {
    return {
      ...ResearchModeConstraintsData[mode],
      mode,
    };
  }

  /**
   * Check if we should continue researching or stop
   */
  shouldContinueResearch(
    fieldStates: ItemFieldStates,
    constraints: ResearchConstraints,
    currentCost: number,
    currentIterations: number,
  ): ContinueDecision {
    // Check budget
    const budgetRemaining = constraints.maxCostUsd - currentCost;
    if (budgetRemaining <= 0.001) {
      return {
        shouldContinue: false,
        reason: 'Budget exhausted',
        fieldsNeedingWork: this.countFieldsNeedingWork(fieldStates, constraints),
        budgetRemaining: 0,
        iterationsRemaining: constraints.maxIterations - currentIterations,
      };
    }

    // Check iterations
    const iterationsRemaining = constraints.maxIterations - currentIterations;
    if (iterationsRemaining <= 0) {
      return {
        shouldContinue: false,
        reason: 'Maximum iterations reached',
        fieldsNeedingWork: this.countFieldsNeedingWork(fieldStates, constraints),
        budgetRemaining,
        iterationsRemaining: 0,
      };
    }

    // Check if all required fields are complete
    if (fieldStates.readyToPublish) {
      return {
        shouldContinue: false,
        reason: 'All required fields complete',
        fieldsNeedingWork: 0,
        budgetRemaining,
        iterationsRemaining,
      };
    }

    // Check if there are any fields that can still be researched
    const fieldsNeedingWork = this.getResearchableFields(fieldStates, constraints);
    if (fieldsNeedingWork.length === 0) {
      return {
        shouldContinue: false,
        reason: 'No researchable fields remaining',
        fieldsNeedingWork: 0,
        budgetRemaining,
        iterationsRemaining,
      };
    }

    return {
      shouldContinue: true,
      reason: `${fieldsNeedingWork.length} fields need research`,
      fieldsNeedingWork: fieldsNeedingWork.length,
      budgetRemaining,
      iterationsRemaining,
    };
  }

  /**
   * Evaluate current field states and decide next action
   */
  evaluateFieldStates(
    fieldStates: ItemFieldStates,
    constraints: ResearchConstraints,
    currentCost: number,
    currentIterations: number,
  ): FieldEvaluationResult {
    const continueDecision = this.shouldContinueResearch(
      fieldStates,
      constraints,
      currentCost,
      currentIterations,
    );

    if (continueDecision.shouldContinue) {
      return {
        decision: 'continue',
        reason: continueDecision.reason,
        fieldsNeedingResearch: this.getResearchableFields(fieldStates, constraints),
        currentCompletionScore: fieldStates.completionScore,
        budgetRemaining: continueDecision.budgetRemaining,
        iterationsRemaining: continueDecision.iterationsRemaining,
      };
    }

    // Not continuing - determine if complete or stopped with warnings
    if (fieldStates.readyToPublish) {
      return {
        decision: 'complete',
        reason: 'All required fields complete with sufficient confidence',
        fieldsNeedingResearch: [],
        currentCompletionScore: fieldStates.completionScore,
        budgetRemaining: continueDecision.budgetRemaining,
        iterationsRemaining: continueDecision.iterationsRemaining,
      };
    }

    return {
      decision: 'stop_with_warnings',
      reason: continueDecision.reason,
      fieldsNeedingResearch: this.getResearchableFields(fieldStates, constraints),
      currentCompletionScore: fieldStates.completionScore,
      budgetRemaining: continueDecision.budgetRemaining,
      iterationsRemaining: continueDecision.iterationsRemaining,
    };
  }

  /**
   * Plan the next research task based on current state
   * Returns null if no more research is needed/possible
   *
   * @param fieldStates - Current field states with confidence tracking
   * @param constraints - Budget, time, and iteration limits
   * @param context - Available data sources and identifiers
   * @param currentCost - Cost spent so far
   * @param existingCompsCount - Number of comps already found (unused, comps handled by Core Operations)
   * @param currentIteration - Current iteration number for limit checking
   * @param taskHistory - History of tool attempts and failures to prevent loops
   */
  planNextTask(
    fieldStates: ItemFieldStates,
    constraints: ResearchConstraints,
    context: ResearchContext,
    currentCost: number,
    existingCompsCount: number = 0,
    currentIteration: number = 0,
    taskHistory?: ResearchTaskHistory,
  ): ResearchTask | null {
    // ========================================================================
    // BULLETPROOFING: Hard limits to prevent infinite loops
    // ========================================================================

    // Check iteration limit
    if (currentIteration >= constraints.maxIterations) {
      this.logger.debug(`Max iterations reached (${currentIteration}/${constraints.maxIterations})`);
      return null;
    }

    // Check for stuck state (consecutive iterations with no progress)
    if (taskHistory?.consecutiveNoProgress >= MAX_CONSECUTIVE_NO_PROGRESS) {
      this.logger.warn(
        `Stopping: ${taskHistory.consecutiveNoProgress} consecutive iterations without progress`,
      );
      return null;
    }

    // Check remaining budget
    const budgetRemaining = constraints.maxCostUsd - currentCost;
    if (budgetRemaining <= 0.001) {
      this.logger.debug('Budget exhausted');
      return null;
    }

    // NOTE: ebay_comps is handled by the search_comps node in Core Operations phase,
    // NOT in the adaptive field research loop. See buildFieldDrivenResearchGraph().

    // Get fields that need research
    const fieldsNeedingWork = this.getResearchableFields(fieldStates, constraints);

    if (fieldsNeedingWork.length === 0) {
      this.logger.debug('No fields need research');
      return null;
    }

    // Find the best tool for the highest priority field
    const targetField = fieldsNeedingWork[0]; // Already sorted by priority
    const { tool, score, reasoning } = this.selectBestTool(
      targetField,
      fieldStates,
      context,
      budgetRemaining,
      undefined, // excludeTools
      taskHistory, // Pass task history for failed/exhausted tool checking
    );

    if (!tool) {
      this.logger.debug(`No suitable tool found for field: ${targetField.name}`);
      return null;
    }

    // Determine which fields this tool might help with
    const targetFields = this.getFieldsToolCanHelp(tool, fieldsNeedingWork);

    return {
      id: uuidv4(),
      targetFields: targetFields.map(f => f.name),
      tool: tool.type,
      priority: score,
      estimatedCost: tool.baseCost,
      estimatedTimeMs: tool.baseTimeMs,
      reasoning,
    };
  }

  /**
   * Plan multiple tasks for parallel execution
   * Used for fast extraction phase
   */
  planParallelTasks(
    fieldStates: ItemFieldStates,
    constraints: ResearchConstraints,
    context: ResearchContext,
    currentCost: number,
    maxTasks: number = 3,
  ): ResearchTask[] {
    const tasks: ResearchTask[] = [];
    const usedTools = new Set<ResearchToolType>();
    const budgetRemaining = constraints.maxCostUsd - currentCost;
    let costAllocated = 0;

    // Get all fields needing work
    const fieldsNeedingWork = this.getResearchableFields(fieldStates, constraints);
    if (fieldsNeedingWork.length === 0) return [];

    // Try to plan tasks using different tools
    for (const field of fieldsNeedingWork) {
      if (tasks.length >= maxTasks) break;
      if (costAllocated >= budgetRemaining) break;

      const { tool, score, reasoning } = this.selectBestTool(
        field,
        fieldStates,
        context,
        budgetRemaining - costAllocated,
        usedTools,
      );

      if (tool && !usedTools.has(tool.type)) {
        usedTools.add(tool.type);
        costAllocated += tool.baseCost;

        const targetFields = this.getFieldsToolCanHelp(tool, fieldsNeedingWork);

        tasks.push({
          id: uuidv4(),
          targetFields: targetFields.map(f => f.name),
          tool: tool.type,
          priority: score,
          estimatedCost: tool.baseCost,
          estimatedTimeMs: tool.baseTimeMs,
          reasoning,
        });
      }
    }

    return tasks;
  }

  /**
   * Estimate total remaining cost to complete research
   */
  estimateRemainingCost(
    fieldStates: ItemFieldStates,
    constraints: ResearchConstraints,
    context: ResearchContext,
  ): { estimatedCost: number; estimatedIterations: number; fieldsCovered: string[] } {
    const fieldsNeedingWork = this.getResearchableFields(fieldStates, constraints);

    if (fieldsNeedingWork.length === 0) {
      return { estimatedCost: 0, estimatedIterations: 0, fieldsCovered: [] };
    }

    // Simple estimation: assume each field needs one tool
    let totalCost = 0;
    const fieldsCovered: string[] = [];
    const usedTools = new Set<ResearchToolType>();

    for (const field of fieldsNeedingWork) {
      const { tool } = this.selectBestTool(field, fieldStates, context, Infinity, usedTools);
      if (tool) {
        if (!usedTools.has(tool.type)) {
          totalCost += tool.baseCost;
          usedTools.add(tool.type);
        }
        fieldsCovered.push(field.name);
      }
    }

    // Estimate iterations based on fields and tools
    const estimatedIterations = Math.ceil(fieldsNeedingWork.length / 3);

    return {
      estimatedCost: Math.min(totalCost, constraints.maxCostUsd),
      estimatedIterations: Math.min(estimatedIterations, constraints.maxIterations),
      fieldsCovered,
    };
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Get fields that can be researched (not complete, not failed, not user_required)
   */
  private getResearchableFields(
    fieldStates: ItemFieldStates,
    constraints: ResearchConstraints,
  ): FieldState[] {
    const researchable: FieldState[] = [];

    for (const field of Object.values(fieldStates.fields)) {
      const threshold = field.required
        ? constraints.requiredConfidence
        : constraints.recommendedConfidence;

      // Skip if already complete
      if (field.status === 'complete' && field.confidence.value >= threshold) {
        continue;
      }

      // Skip if failed or user required
      if (field.status === 'failed' || field.status === 'user_required') {
        continue;
      }

      // Skip if too many attempts (diminishing returns)
      if (field.attempts >= 3 && field.confidence.value < 0.3) {
        continue;
      }

      researchable.push(field);
    }

    // Sort by priority
    return researchable.sort((a, b) => {
      // Required first
      if (a.required !== b.required) return a.required ? -1 : 1;
      // Lower confidence first
      if (a.confidence.value !== b.confidence.value) {
        return a.confidence.value - b.confidence.value;
      }
      // Fewer attempts first
      return a.attempts - b.attempts;
    });
  }

  /**
   * Count fields needing work
   */
  private countFieldsNeedingWork(
    fieldStates: ItemFieldStates,
    constraints: ResearchConstraints,
  ): number {
    return this.getResearchableFields(fieldStates, constraints).length;
  }

  /**
   * Select best research tool for a specific field
   *
   * @param field - The field to research
   * @param fieldStates - All field states
   * @param context - Research context
   * @param budgetRemaining - Remaining budget
   * @param excludeTools - Tools to exclude from selection
   * @param taskHistory - Task history for skipping failed/exhausted tools
   */
  private selectBestTool(
    field: FieldState,
    fieldStates: ItemFieldStates,
    context: ResearchContext,
    budgetRemaining: number,
    excludeTools?: Set<ResearchToolType>,
    taskHistory?: ResearchTaskHistory,
  ): { tool: ResearchToolMetadata | null; score: number; reasoning: string } {
    let bestTool: ResearchToolMetadata | null = null;
    let bestScore = -1;
    let bestReasoning = '';

    for (const tool of this.tools.values()) {
      // Skip excluded tools
      if (excludeTools?.has(tool.type)) continue;

      // ========================================================================
      // BULLETPROOFING: Skip failed and exhausted tools
      // ========================================================================

      // Skip tools that have previously failed (produced no results)
      if (taskHistory?.failedTools?.includes(tool.type)) {
        this.logger.debug(`Skipping failed tool: ${tool.type}`);
        continue;
      }

      // Skip tools that have reached max attempts
      const attempts = taskHistory?.attemptsByTool?.[tool.type] || 0;
      if (attempts >= MAX_ATTEMPTS_PER_TOOL) {
        this.logger.debug(
          `Skipping exhausted tool: ${tool.type} (${attempts}/${MAX_ATTEMPTS_PER_TOOL} attempts)`,
        );
        continue;
      }

      // Skip if over budget
      if (tool.baseCost > budgetRemaining) continue;

      // Check if tool can provide this field
      if (!this.canToolProvideField(tool, field.name)) continue;

      // Check if tool prerequisites are met
      if (!this.areToolPrerequisitesMet(tool, fieldStates, context)) continue;

      // Score the tool
      const score = this.scoreToolForField(tool, field, context);

      if (score > bestScore) {
        bestScore = score;
        bestTool = tool;
        bestReasoning = this.generateReasoning(tool, field, context, score);
      }
    }

    return { tool: bestTool, score: bestScore, reasoning: bestReasoning };
  }

  /**
   * Check if a tool can provide data for a field
   */
  private canToolProvideField(tool: ResearchToolMetadata, fieldName: string): boolean {
    if (tool.canProvideFields.includes('*')) return true;
    return tool.canProvideFields.includes(fieldName);
  }

  /**
   * Check if tool prerequisites are met
   */
  private areToolPrerequisitesMet(
    tool: ResearchToolMetadata,
    fieldStates: ItemFieldStates,
    context: ResearchContext,
  ): boolean {
    // Check service configuration
    switch (tool.type) {
      case 'keepa_lookup':
        if (!context.keepaConfigured) return false;
        break;
      case 'amazon_catalog':
        if (!context.amazonConfigured) return false;
        break;
      case 'upc_lookup':
        if (!context.upcDatabaseConfigured) return false;
        break;
      case 'vision_analysis':
      case 'ocr_extraction':
        if (!context.hasImages || context.imageCount === 0) return false;
        break;
    }

    // Check required fields
    if (!tool.requiresFields) return true;

    for (const reqField of tool.requiresFields) {
      const field = fieldStates.fields[reqField];
      // At least one required field should have a value
      if (field?.value !== null && field?.value !== undefined && field?.value !== '') {
        return true;
      }
    }

    // None of the required fields have values
    return tool.requiresFields.length === 0;
  }

  /**
   * Score a tool for a specific field
   * Higher score = better choice
   */
  private scoreToolForField(
    tool: ResearchToolMetadata,
    field: FieldState,
    context: ResearchContext,
  ): number {
    // Base score from tool priority
    let score = tool.priority;

    // Boost for field-specific tools (not wildcard)
    if (tool.canProvideFields.includes(field.name)) {
      score += 20;
    }

    // Boost for high confidence tools
    score += tool.confidenceWeight * 30;

    // Penalty for expensive tools
    score -= tool.baseCost * 50;

    // Penalty for slow tools
    score -= tool.baseTimeMs / 1000;

    // Boost for tools that match available context
    if (tool.type === 'upc_lookup' && context.hasUpc) score += 50;
    if (tool.type === 'keepa_lookup' && context.hasUpc) score += 40;
    if (tool.type === 'vision_analysis' && context.imageCount > 1) score += 15;
    if (tool.type === 'web_search_targeted' && context.hasBrand && context.hasModel) score += 25;

    // Penalty if field has many attempts already
    score -= field.attempts * 10;

    return score;
  }

  /**
   * Get all fields a tool can help with from the list of fields needing work
   */
  private getFieldsToolCanHelp(
    tool: ResearchToolMetadata,
    fieldsNeedingWork: FieldState[],
  ): FieldState[] {
    if (tool.canProvideFields.includes('*')) {
      // Wildcard tool can help with all fields, but limit to top 5
      return fieldsNeedingWork.slice(0, 5);
    }

    return fieldsNeedingWork.filter(f => tool.canProvideFields.includes(f.name));
  }

  /**
   * Generate human-readable reasoning for tool selection
   */
  private generateReasoning(
    tool: ResearchToolMetadata,
    field: FieldState,
    context: ResearchContext,
    score: number,
  ): string {
    const reasons: string[] = [];

    reasons.push(`Using ${tool.displayName} for "${field.displayName}"`);

    if (field.required) {
      reasons.push('(required field)');
    }

    if (field.confidence.value > 0) {
      reasons.push(`Current confidence: ${Math.round(field.confidence.value * 100)}%`);
    }

    if (tool.type === 'upc_lookup' && context.hasUpc) {
      reasons.push('UPC available for lookup');
    }

    if (tool.type === 'keepa_lookup') {
      reasons.push('Using Amazon historical data');
    }

    if (field.attempts > 0) {
      reasons.push(`Attempt ${field.attempts + 1}`);
    }

    return reasons.join(' - ');
  }
}
