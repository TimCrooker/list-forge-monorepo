import { ResearchGraphState } from '../research-graph.state';

/**
 * Should refine node
 * Determines if research should be refined or persisted
 */
export function shouldRefineNode(state: ResearchGraphState): 'refine' | 'persist' {
  // Max iterations reached
  if (state.iteration >= state.maxIterations) {
    return 'persist';
  }

  // Confidence threshold met
  if (state.overallConfidence >= state.confidenceThreshold) {
    return 'persist';
  }

  // Check if we have actionable refinement paths
  const canRefine = state.missingInfo.some(
    (m) => m.importance !== 'optional' && m.suggestedPrompt,
  );

  return canRefine ? 'refine' : 'persist';
}
