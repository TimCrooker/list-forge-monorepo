import { Card, CardContent } from '@listforge/ui';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import type { ChecklistStepStatus } from '@listforge/api-rtk';

interface ResearchChecklistProps {
  steps: ChecklistStepStatus[];
  className?: string;
}

/**
 * ResearchChecklist - Static sidebar showing research step completion status
 *
 * Displays a vertical checklist of research steps with their current status.
 * Updates automatically based on activity log events.
 */
export function ResearchChecklist({ steps, className }: ResearchChecklistProps) {
  return (
    <Card className={className}>
      <CardContent className="py-4 px-3">
        <h3 className="text-sm font-semibold mb-3 px-2">Research Steps</h3>
        <div className="space-y-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                step.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-950/20'
                  : step.status === 'processing'
                  ? 'bg-blue-50 dark:bg-blue-950/20'
                  : step.status === 'error'
                  ? 'bg-red-50 dark:bg-red-950/20'
                  : ''
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                ) : step.status === 'processing' ? (
                  <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-500 animate-spin" />
                ) : step.status === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs ${
                  step.status === 'completed'
                    ? 'text-green-700 dark:text-green-400 font-medium'
                    : step.status === 'processing'
                    ? 'text-blue-700 dark:text-blue-400 font-medium'
                    : step.status === 'error'
                    ? 'text-red-700 dark:text-red-400 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
