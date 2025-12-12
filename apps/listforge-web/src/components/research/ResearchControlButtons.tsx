import { useState } from 'react';
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@listforge/ui';
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
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error && typeof error === 'object' && 'data' in error) {
      const data = (error as { data?: { message?: string } }).data;
      if (data?.message) return data.message;
    }
    return fallback;
  };

  const handlePause = async () => {
    try {
      await pauseResearch(researchRunId).unwrap();
      showSuccess('Research paused');
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to pause research'));
    }
  };

  const handleResume = async () => {
    try {
      await resumeResearch(researchRunId).unwrap();
      showSuccess('Research resumed');
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to resume research'));
    }
  };

  const handleStop = async () => {
    try {
      await stopResearch(researchRunId).unwrap();
      showSuccess('Research stopped');
      setIsStopDialogOpen(false);
    } catch (error) {
      showError(getErrorMessage(error, 'Failed to stop research'));
    }
  };

  const isLoading = isPausing || isResuming || isStopping;

  const StopButton = ({ onClick }: { onClick: () => void }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
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
  );

  const StopConfirmDialog = () => (
    <AlertDialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stop Research Run?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to stop this research run? This action cannot be undone.
            Any progress will be saved, but the research will not continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleStop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Stop Research
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Show controls based on status
  if (status === 'running') {
    return (
      <>
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
          <StopButton onClick={() => setIsStopDialogOpen(true)} />
        </div>
        <StopConfirmDialog />
      </>
    );
  }

  if (status === 'paused') {
    return (
      <>
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
          <StopButton onClick={() => setIsStopDialogOpen(true)} />
        </div>
        <StopConfirmDialog />
      </>
    );
  }

  if (status === 'error' || status === 'pending') {
    return (
      <>
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
          <StopButton onClick={() => setIsStopDialogOpen(true)} />
        </div>
        <StopConfirmDialog />
      </>
    );
  }

  // Success or cancelled - no controls
  return null;
}



