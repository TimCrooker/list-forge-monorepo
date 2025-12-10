import { ResearchGraphState } from '../research-graph.state';
import { PRICING_THRESHOLDS, FLOW_CONTROL } from '../../../config/research.constants';
import { logNodeDebug } from '../../../utils/node-logger';

/**
 * Should refine node
 * Determines if research should be refined or persisted
 *
 * This is a critical decision point - we must avoid infinite loops
 * while also ensuring we don't give up too early on valuable research.
 */
export function shouldRefineNode(state: ResearchGraphState): 'refine' | 'persist' {
  logNodeDebug('should-refine', 'Evaluating stop conditions', {
    iteration: state.iteration,
    maxIterations: state.maxIterations,
    overallConfidence: state.overallConfidence,
    confidenceThreshold: state.confidenceThreshold,
    missingInfoCount: state.missingInfo?.length || 0,
    listingsCount: state.listings?.length || 0,
    listingStatus: state.listings?.[0]?.status,
    compsCount: state.comps?.length || 0,
  });

  // === HARD STOP CONDITIONS (always persist) ===

  // Max iterations reached - hard limit to prevent runaway loops
  if (state.iteration >= state.maxIterations) {
    logNodeDebug('should-refine', 'Max iterations reached, persisting');
    return 'persist';
  }

  // Confidence threshold met
  if (state.overallConfidence >= state.confidenceThreshold) {
    logNodeDebug('should-refine', 'Confidence threshold met, persisting');
    return 'persist';
  }

  // === LISTING READINESS CHECKS (if listing is ready, no need to refine) ===

  // If we have a listing that's ready to publish, we're done
  const hasReadyListing = state.listings?.some(
    (listing) => listing.status === 'READY_FOR_PUBLISH' || listing.status === 'READY_FOR_REVIEW',
  );
  if (hasReadyListing) {
    logNodeDebug('should-refine', 'Listing is ready/reviewable, persisting');
    return 'persist';
  }

  // If listing confidence is high, we're good enough
  const listingConfidence = state.listings?.[0]?.confidence;
  if (listingConfidence && listingConfidence >= FLOW_CONTROL.HIGH_CONFIDENCE_THRESHOLD) {
    logNodeDebug('should-refine', `High listing confidence (>=${(FLOW_CONTROL.HIGH_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%), persisting`);
    return 'persist';
  }

  // === DIMINISHING RETURNS CHECKS ===

  // If we have plenty of comps, additional searches are unlikely to help
  if (state.comps.length >= PRICING_THRESHOLDS.SUFFICIENT_COMPS_COUNT) {
    logNodeDebug('should-refine', `Sufficient comps (${PRICING_THRESHOLDS.SUFFICIENT_COMPS_COUNT}+), persisting`);
    return 'persist';
  }

  // === CAN WE ACTUALLY IMPROVE? ===

  // Check if we have actionable refinement paths
  const actionableMissing = state.missingInfo?.filter(
    (m) => m.importance !== 'optional' && m.suggestedPrompt,
  ) || [];

  if (actionableMissing.length === 0) {
    logNodeDebug('should-refine', 'No actionable refinements, persisting');
    return 'persist';
  }

  // Only continue if we have critical missing info (required importance)
  const hasCriticalMissing = actionableMissing.some((m) => m.importance === 'required');
  if (!hasCriticalMissing) {
    logNodeDebug('should-refine', 'No critical missing info, persisting');
    return 'persist';
  }

  logNodeDebug('should-refine', 'Continuing refinement', {
    actionableMissingCount: actionableMissing.length,
    criticalMissing: hasCriticalMissing,
  });
  return 'refine';
}
