/**
 * Research Goal Types
 *
 * Defines the goal-driven architecture for the research agent.
 * Goals represent discrete objectives that can be worked on in parallel
 * or sequentially based on dependencies.
 */

/**
 * Status of a research goal
 */
export type GoalStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | 'skipped';

/**
 * Priority level for goals
 */
export type GoalPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Category of research goals
 */
export type GoalCategory =
  | 'identification' // Identify what the product is
  | 'pricing' // Determine optimal price
  | 'listing' // Generate listing content
  | 'compliance' // Ensure marketplace requirements
  | 'validation' // Validate data quality
  | 'enrichment'; // Add additional context

/**
 * Definition of a research goal
 */
export interface ResearchGoal {
  id: string;
  category: GoalCategory;
  name: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;

  /** Goals that must complete before this one can start */
  dependencies: string[];

  /** Data this goal expects as input */
  requiredInputs: string[];

  /** Data this goal produces */
  produces: string[];

  /** Whether this goal can run in parallel with others (with no dependency conflicts) */
  parallelizable: boolean;

  /** Maximum time to allow for this goal (ms) */
  timeoutMs: number;

  /** Number of retry attempts allowed */
  maxRetries: number;

  /** Current retry count */
  retryCount: number;

  /** Result of the goal execution */
  result?: GoalResult;

  /** Timestamp when goal started */
  startedAt?: Date;

  /** Timestamp when goal completed */
  completedAt?: Date;

  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Result of a goal execution
 */
export interface GoalResult {
  success: boolean;
  confidence: number;
  data: Record<string, unknown>;
  warnings?: string[];
}

/**
 * Research goal execution context
 */
export interface GoalExecutionContext {
  researchRunId: string;
  itemId: string;
  organizationId: string;
  /** Accumulated data from completed goals */
  sharedState: Record<string, unknown>;
  /** Cancellation token */
  cancelled: boolean;
}

/**
 * Predefined research goals
 */
export const RESEARCH_GOALS: Omit<ResearchGoal, 'id' | 'status' | 'retryCount' | 'result'>[] = [
  // ===== Identification Goals =====
  {
    category: 'identification',
    name: 'analyze_media',
    description: 'Extract product information from photos',
    priority: 'critical',
    dependencies: [],
    requiredInputs: ['mediaUrls'],
    produces: ['mediaAnalysis', 'category', 'brand', 'model', 'condition'],
    parallelizable: true,
    timeoutMs: 30000,
    maxRetries: 2,
  },
  {
    category: 'identification',
    name: 'extract_identifiers',
    description: 'Extract UPC, MPN, and other identifiers from images',
    priority: 'high',
    dependencies: ['analyze_media'],
    requiredInputs: ['mediaUrls', 'mediaAnalysis'],
    produces: ['upc', 'mpn', 'ean', 'ocrText'],
    parallelizable: true,
    timeoutMs: 20000,
    maxRetries: 2,
  },
  {
    category: 'identification',
    name: 'web_search_identify',
    description: 'Search web to verify and enrich product identification',
    priority: 'high',
    dependencies: ['analyze_media'],
    requiredInputs: ['brand', 'model', 'category', 'upc'],
    produces: ['webSearchResults', 'verifiedIdentification'],
    parallelizable: true,
    timeoutMs: 45000,
    maxRetries: 2,
  },

  // ===== Pricing Goals =====
  {
    category: 'pricing',
    name: 'search_sold_comps',
    description: 'Search for sold comparable listings',
    priority: 'high',
    dependencies: ['analyze_media'],
    requiredInputs: ['brand', 'model', 'category', 'condition'],
    produces: ['soldComps'],
    parallelizable: true,
    timeoutMs: 30000,
    maxRetries: 2,
  },
  {
    category: 'pricing',
    name: 'search_active_comps',
    description: 'Search for active listings to understand competition',
    priority: 'medium',
    dependencies: ['analyze_media'],
    requiredInputs: ['brand', 'model', 'category'],
    produces: ['activeComps'],
    parallelizable: true,
    timeoutMs: 30000,
    maxRetries: 2,
  },
  {
    category: 'pricing',
    name: 'search_image_comps',
    description: 'Search for visually similar products',
    priority: 'medium',
    dependencies: ['analyze_media'],
    requiredInputs: ['mediaUrls'],
    produces: ['imageComps'],
    parallelizable: true,
    timeoutMs: 30000,
    maxRetries: 1,
  },
  {
    category: 'validation',
    name: 'validate_comps',
    description: 'Validate and score comparable relevance',
    priority: 'high',
    dependencies: ['search_sold_comps', 'search_active_comps'],
    requiredInputs: ['soldComps', 'activeComps', 'brand', 'model', 'condition'],
    produces: ['validatedComps'],
    parallelizable: false,
    timeoutMs: 20000,
    maxRetries: 1,
  },
  {
    category: 'pricing',
    name: 'calculate_price',
    description: 'Calculate optimal pricing based on validated comps',
    priority: 'critical',
    dependencies: ['validate_comps'],
    requiredInputs: ['validatedComps', 'condition'],
    produces: ['priceBands', 'pricingStrategies', 'suggestedPrice'],
    parallelizable: false,
    timeoutMs: 15000,
    maxRetries: 1,
  },

  // ===== Compliance Goals =====
  {
    category: 'compliance',
    name: 'detect_category',
    description: 'Detect appropriate marketplace category',
    priority: 'high',
    dependencies: ['analyze_media'],
    requiredInputs: ['brand', 'model', 'category'],
    produces: ['marketplaceCategory', 'categoryId'],
    parallelizable: true,
    timeoutMs: 15000,
    maxRetries: 2,
  },
  {
    category: 'compliance',
    name: 'get_required_fields',
    description: 'Get required fields for the category',
    priority: 'high',
    dependencies: ['detect_category'],
    requiredInputs: ['categoryId'],
    produces: ['requiredFields', 'recommendedFields'],
    parallelizable: false,
    timeoutMs: 10000,
    maxRetries: 2,
  },

  // ===== Listing Goals =====
  {
    category: 'listing',
    name: 'generate_content',
    description: 'Generate listing title and description',
    priority: 'critical',
    dependencies: ['analyze_media', 'web_search_identify', 'calculate_price'],
    requiredInputs: ['brand', 'model', 'condition', 'attributes', 'suggestedPrice'],
    produces: ['title', 'description', 'bulletPoints'],
    parallelizable: false,
    timeoutMs: 20000,
    maxRetries: 2,
  },
  {
    category: 'listing',
    name: 'map_attributes',
    description: 'Map product attributes to marketplace fields',
    priority: 'high',
    dependencies: ['get_required_fields', 'analyze_media'],
    requiredInputs: ['requiredFields', 'attributes', 'mediaAnalysis'],
    produces: ['mappedAttributes'],
    parallelizable: false,
    timeoutMs: 15000,
    maxRetries: 1,
  },
  {
    category: 'listing',
    name: 'assemble_listing',
    description: 'Assemble final listing package',
    priority: 'critical',
    dependencies: ['generate_content', 'map_attributes', 'calculate_price'],
    requiredInputs: ['title', 'description', 'mappedAttributes', 'suggestedPrice', 'mediaUrls'],
    produces: ['listingPackage'],
    parallelizable: false,
    timeoutMs: 10000,
    maxRetries: 1,
  },

  // ===== Validation Goals =====
  {
    category: 'validation',
    name: 'assess_completeness',
    description: 'Assess data completeness and identify gaps',
    priority: 'high',
    dependencies: ['assemble_listing'],
    requiredInputs: ['listingPackage', 'requiredFields'],
    produces: ['completenessScore', 'missingFields'],
    parallelizable: false,
    timeoutMs: 10000,
    maxRetries: 1,
  },
  {
    category: 'validation',
    name: 'calculate_confidence',
    description: 'Calculate overall research confidence score',
    priority: 'high',
    dependencies: ['assemble_listing', 'validate_comps'],
    requiredInputs: ['listingPackage', 'validatedComps', 'completenessScore'],
    produces: ['overallConfidence', 'confidenceBreakdown'],
    parallelizable: false,
    timeoutMs: 5000,
    maxRetries: 1,
  },
];

/**
 * Create a goal instance from a template
 */
export function createGoal(template: typeof RESEARCH_GOALS[number]): ResearchGoal {
  return {
    ...template,
    id: `${template.name}_${Date.now()}`,
    status: 'pending',
    retryCount: 0,
  };
}

/**
 * Create all default research goals
 */
export function createDefaultGoals(): ResearchGoal[] {
  return RESEARCH_GOALS.map(createGoal);
}

/**
 * Get goals that are ready to execute (all dependencies met)
 */
export function getReadyGoals(
  goals: ResearchGoal[],
  completedGoalNames: Set<string>,
): ResearchGoal[] {
  return goals.filter(goal => {
    if (goal.status !== 'pending') return false;

    // Check if all dependencies are completed
    return goal.dependencies.every(dep => {
      // Find the goal with this name
      const depGoal = goals.find(g => g.name === dep);
      return depGoal?.status === 'completed' || completedGoalNames.has(dep);
    });
  });
}

/**
 * Get goals that can run in parallel
 */
export function getParallelizableGoals(readyGoals: ResearchGoal[]): ResearchGoal[] {
  // Start with all parallelizable goals
  const parallelizable = readyGoals.filter(g => g.parallelizable);

  // Also include non-parallelizable goals if there are no parallelizable ones
  if (parallelizable.length === 0 && readyGoals.length > 0) {
    return [readyGoals[0]]; // Just run the first one
  }

  return parallelizable;
}

/**
 * Check if all critical goals are completed
 */
export function areCriticalGoalsComplete(goals: ResearchGoal[]): boolean {
  return goals
    .filter(g => g.priority === 'critical')
    .every(g => g.status === 'completed');
}

/**
 * Get incomplete goals sorted by priority
 */
export function getIncompleteGoals(goals: ResearchGoal[]): ResearchGoal[] {
  const priorityOrder: Record<GoalPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return goals
    .filter(g => g.status !== 'completed' && g.status !== 'skipped')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
