import { FileText, Image, History } from 'lucide-react'
import type { OperationRendererProps } from './index'

/**
 * Renderer for load_context operations
 * Shows what item data and context was loaded
 */
export default function LoadContextRenderer({ operation }: OperationRendererProps) {
  const completedEvent = operation.events.find((e) => e.eventType === 'completed')
  const data = completedEvent?.data || {}

  const title = data.title as string | undefined
  const mediaCount = data.mediaCount as number | undefined
  const hasExistingResearch = data.hasExistingResearch as boolean | undefined

  return (
    <div className="space-y-3 text-sm">
      {/* Item info */}
      {title && (
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Item:</span>{' '}
            <span className="text-muted-foreground">{title}</span>
          </div>
        </div>
      )}

      {/* Media count */}
      {typeof mediaCount === 'number' && (
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            {mediaCount} {mediaCount === 1 ? 'photo' : 'photos'} available
          </span>
        </div>
      )}

      {/* Existing research */}
      {hasExistingResearch && (
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-blue-600 dark:text-blue-400">
            Found existing research data
          </span>
        </div>
      )}
    </div>
  )
}
