import { Button } from '@listforge/ui';
import { Pause, Play, Square, Loader2 } from 'lucide-react';
import { usePauseResearchMutation, useStopResearchMutation, useResumeResearchMutation } from '@listforge/api-rtk';
import { showSuccess, showError } from '@/utils/toast';
import type { ResearchRunStatus } from '@listforge/core-types';

interface ResearchControlButtonsProps {
  researchRunId: string;
  status: ResearchRunStatus;
  disabled?: boolean;
}

export function ResearchControlButtons({
  researchRunId,
  status,
  disabled = false,
}: ResearchControlButtonsProps) {
  const [pauseResearch, { isLoading: isPausing }] = usePauseResearchMutation();
  const [resumeResearch, { isLoading: isResuming }] = useResumeResearchMutation();
  const [stopResearch, { isLoading: isStopping }] = useStopResearchMutation();

  const handlePause = async () => {
    try {
      await pauseResearch(researchRunId).unwrap();
      showSuccess('Research paused');
    } catch (error: any) {
      showError(error?.data?.message || 'Failed to pause research');
    }
  };

  const handleResume = async () => {
    try {
      await resumeResearch(researchRunId).unwrap();
      showSuccess('Research resumed');
    } catch (error: any) {
      showError(error?.data?.message || 'Failed to resume research');
    }
  };

  const handleStop = async () => {
    if (!confirm('Are you sure you want to stop this research run? This cannot be undone.')) {
      return;
    }
    try {
      await stopResearch(researchRunId).unwrap();
      showSuccess('Research stopped');
    } catch (error: any) {
      showError(error?.data?.message || 'Failed to stop research');
    }
  };

  const isLoading = isPausing || isResuming || isStopping;

  // Show controls based on status
  if (status === 'running') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePause}
          disabled={disabled || isLoading}
        >
          {isPausing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Pausing...
            </>
          ) : (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          disabled={disabled || isLoading}
        >
          {isStopping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Stopping...
            </>
          ) : (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </>
          )}
        </Button>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResume}
          disabled={disabled || isLoading}
        >
          {isResuming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resuming...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          disabled={disabled || isLoading}
        >
          {isStopping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Stopping...
            </>
          ) : (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </>
          )}
        </Button>
      </div>
    );
  }

  if (status === 'error' || status === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResume}
          disabled={disabled || isLoading}
        >
          {isResuming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resuming...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          disabled={disabled || isLoading}
        >
          {isStopping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Stopping...
            </>
          ) : (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </>
          )}
        </Button>
      </div>
    );
  }

  // Success or cancelled - no controls
  return null;
}



