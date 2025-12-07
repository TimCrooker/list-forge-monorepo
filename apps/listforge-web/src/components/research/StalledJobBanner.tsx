import { useResumeResearchMutation, useGetResearchRunQuery } from '@listforge/api-rtk';
import { Button, Card, CardContent } from '@listforge/ui';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface StalledJobBannerProps {
  researchRunId: string;
  onResume?: () => void;
  className?: string;
}

/**
 * StalledJobBanner Component
 * Phase 7 Slice 4
 *
 * Displays a banner when a research run has failed or stalled,
 * with an option to resume if possible.
 */
export function StalledJobBanner({
  researchRunId,
  onResume,
  className,
}: StalledJobBannerProps) {
  const { data: runResponse } = useGetResearchRunQuery(researchRunId);
  const [resumeResearch, { isLoading: isResuming }] = useResumeResearchMutation();
  const [dismissed, setDismissed] = useState(false);

  const researchRun = runResponse?.researchRun;

  if (!researchRun || dismissed) {
    return null;
  }

  // Show banner if:
  // 1. Status is 'error' OR
  // 2. Status is 'running' but stepCount > 0 (stalled)
  const isStalled =
    researchRun.status === 'error' ||
    (researchRun.status === 'running' && (researchRun.stepCount ?? 0) > 0);

  if (!isStalled) {
    return null;
  }

  const canResume =
    researchRun.status === 'error' &&
    (researchRun.stepCount ?? 0) > 0 &&
    (researchRun.stepCount ?? 0) < 30; // Max retries

  const lastStep = researchRun.stepHistory?.[researchRun.stepHistory.length - 1];
  const retryCount = Math.floor((researchRun.stepCount ?? 0) / 10) + 1;
  const maxRetries = 3;

  const handleResume = async () => {
    try {
      await resumeResearch(researchRunId).unwrap();
      onResume?.();
    } catch (error) {
      console.error('Failed to resume research:', error);
    }
  };

  return (
    <Card className={`border-amber-200 bg-amber-50 dark:bg-amber-950/20 ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  {researchRun.status === 'error' ? 'Research Failed' : 'Research Stalled'}
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  {researchRun.status === 'error'
                    ? researchRun.errorMessage || 'An error occurred during research'
                    : 'Research appears to have stalled. You can resume from the last checkpoint.'}
                </p>
                {lastStep && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                    Last completed step: <strong>{lastStep.node}</strong>
                    {lastStep.completedAt &&
                      ` at ${new Date(lastStep.completedAt).toLocaleTimeString()}`}
                  </p>
                )}
                {researchRun.stepCount !== undefined && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Attempt {retryCount} of {maxRetries} • {researchRun.stepCount} steps executed
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {canResume && (
                  <Button
                    size="sm"
                    variant="default"
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
                        Resume
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                  className="text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
