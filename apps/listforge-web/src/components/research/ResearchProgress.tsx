import { useResearchProgress, useResumeResearchMutation, useGetResearchRunQuery } from '@listforge/api-rtk';
import { Card, CardContent, Button } from '@listforge/ui';
import { CheckCircle2, Loader2, Circle, XCircle, RefreshCw } from 'lucide-react';

const RESEARCH_NODES = [
  { id: 'load_context', label: 'Loading item' },
  { id: 'analyze_media', label: 'Analyzing photos' },
  { id: 'identify_product', label: 'Identifying product' },
  { id: 'search_comps', label: 'Finding comparables' },
  { id: 'analyze_comps', label: 'Analyzing prices' },
  { id: 'calculate_price', label: 'Calculating recommendations' },
  { id: 'assess_missing', label: 'Checking for gaps' },
  { id: 'persist_results', label: 'Saving results' },
];

interface ResearchProgressProps {
  researchRunId: string | null;
  className?: string;
  onResume?: () => void;
}

/**
 * ResearchProgress Component
 * Phase 7 Slice 3 + Slice 4
 *
 * Displays real-time step-by-step progress of a research run.
 * Phase 7 Slice 4: Added resume functionality for failed/stalled jobs.
 */
export function ResearchProgress({
  researchRunId,
  className,
  onResume,
}: ResearchProgressProps) {
  const progress = useResearchProgress(researchRunId);
  const { data: runResponse } = useGetResearchRunQuery(researchRunId || '', {
    skip: !researchRunId,
  });
  const [resumeResearch, { isLoading: isResuming }] = useResumeResearchMutation();

  const researchRun = runResponse?.researchRun;
  const canResume =
    researchRun &&
    researchRun.status === 'error' &&
    (researchRun.stepCount ?? 0) > 0 &&
    (researchRun.stepCount ?? 0) < 30; // Max retries

  if (!researchRunId) {
    return null;
  }

  const handleResume = async () => {
    if (!researchRunId) return;
    try {
      await resumeResearch(researchRunId).unwrap();
      onResume?.();
    } catch (error) {
      console.error('Failed to resume research:', error);
    }
  };

  // Show error state if job failed
  if (progress.status === 'error') {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-1">Research Failed</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {progress.error || researchRun?.errorMessage || 'An error occurred during research'}
              </p>
              {canResume && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResume}
                  disabled={isResuming}
                >
                  {isResuming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resume from Last Step
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="py-6">
        <div className="space-y-2">
          {RESEARCH_NODES.map((node) => {
            const isComplete = progress.completedNodes.has(node.id);
            const isCurrent = progress.currentNode === node.id;
            const isPending = !isComplete && !isCurrent;

            return (
              <div
                key={node.id}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                  isComplete ? 'bg-green-50 dark:bg-green-950/20' : ''
                } ${isCurrent ? 'bg-blue-50 dark:bg-blue-950/20' : ''} ${
                  isPending ? 'opacity-50' : ''
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-500 animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>

                {/* Node Label */}
                <span
                  className={`text-sm ${
                    isComplete ? 'text-green-700 dark:text-green-400 font-medium' : ''
                  } ${isCurrent ? 'text-blue-700 dark:text-blue-400 font-medium' : ''} ${
                    isPending ? 'text-muted-foreground' : ''
                  }`}
                >
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status Summary */}
        {progress.status === 'success' && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Research completed successfully</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
