import { Lightbulb, ArrowRight } from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface ReasoningData {
  reasoning?: string
  thinking?: string
  decision?: string
  conclusion?: string
  confidence?: number
  factors?: string[]
  alternatives?: Array<{
    option: string
    reason: string
    rejected?: boolean
  }>
}

/**
 * Renderer for AI reasoning/thinking operations
 * Shows the AI's decision-making process, factors considered, and conclusions
 */
export default function ReasoningRenderer({
  operation,
}: OperationRendererProps) {
  // Extract data from events
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as ReasoningData | undefined

  // Also check progress events for streaming reasoning
  const progressData = operation.events
    .filter((e) => e.eventType === 'progress' && e.data)
    .map((e) => e.data as ReasoningData)

  // Combine reasoning text from all events
  const reasoningText =
    data?.reasoning ||
    data?.thinking ||
    progressData.map((p) => p.reasoning || p.thinking).join('\n') ||
    operation.summary

  const decision = data?.decision || data?.conclusion
  const factors = data?.factors || []
  const alternatives = data?.alternatives || []
  const confidence = data?.confidence

  return (
    <div className="space-y-3 text-sm">
      {/* Main reasoning content */}
      {reasoningText && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 to-blue-500/50 rounded-full" />
          <div className="pl-4">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {reasoningText}
            </p>
          </div>
        </div>
      )}

      {/* Factors considered */}
      {factors.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            <Lightbulb className="h-3 w-3" />
            Factors Considered
          </div>
          <ul className="space-y-1">
            {factors.map((factor, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="text-purple-500 mt-1">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives considered */}
      {alternatives.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            Alternatives Evaluated
          </div>
          <div className="space-y-1.5">
            {alternatives.map((alt, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  alt.rejected
                    ? 'bg-muted/30 text-muted-foreground'
                    : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{alt.option}</span>
                  {alt.rejected ? (
                    <Badge variant="outline" className="text-[10px]">
                      Rejected
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    >
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground">{alt.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision/conclusion */}
      {decision && (
        <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900">
          <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">
              Decision
            </div>
            <p className="text-xs font-medium">{decision}</p>
          </div>
        </div>
      )}

      {/* Confidence */}
      {confidence !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Confidence:</span>
          <Badge
            variant={confidence >= 0.8 ? 'default' : 'secondary'}
            className="text-[10px]"
          >
            {Math.round(confidence * 100)}%
          </Badge>
        </div>
      )}

      {/* Error state */}
      {operation.error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-600 dark:text-red-400">
            {operation.error}
          </p>
        </div>
      )}
    </div>
  )
}
