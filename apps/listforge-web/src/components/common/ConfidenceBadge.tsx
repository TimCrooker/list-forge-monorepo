import { Badge } from '@listforge/ui';
import { cn } from '@listforge/ui';
import { formatPercentage } from '../../utils/formatters';

interface ConfidenceBadgeProps {
  /** Confidence value between 0 and 1 */
  confidence: number;
  /** Whether to show the percentage value */
  showPercentage?: boolean;
  /** Size variant */
  size?: 'sm' | 'default';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get confidence color based on value
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-green-300 dark:border-green-700';
  }
  if (confidence >= 0.6) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
  }
  if (confidence >= 0.4) {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 border-orange-300 dark:border-orange-700';
  }
  return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-red-300 dark:border-red-700';
}

/**
 * Get confidence label
 */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}

/**
 * ConfidenceBadge component for displaying AI confidence levels
 *
 * @example
 * ```tsx
 * <ConfidenceBadge confidence={0.85} showPercentage />
 * // Shows "High (85%)"
 * ```
 */
export function ConfidenceBadge({
  confidence,
  showPercentage = true,
  size = 'default',
  className,
}: ConfidenceBadgeProps) {
  const colorClass = getConfidenceColor(confidence);
  const label = getConfidenceLabel(confidence);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        colorClass,
        size === 'sm' && 'text-xs px-2 py-0.5',
        className
      )}
    >
      {label}
      {showPercentage && (
        <span className="ml-1 opacity-80">
          ({formatPercentage(confidence)})
        </span>
      )}
    </Badge>
  );
}
