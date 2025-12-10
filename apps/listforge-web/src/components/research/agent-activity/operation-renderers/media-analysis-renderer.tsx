import { Image, Eye, Tag, AlertTriangle } from 'lucide-react'
import { Badge, Progress } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface MediaAnalysisData {
  imageCount?: number
  imagesAnalyzed?: number
  category?: string
  brand?: string | null
  model?: string | null
  condition?: number | string
  confidence?: number
  attributes?: Record<string, string | number | boolean>
  extractedText?: Array<{ text: string; confidence: number }>
  detectedObjects?: string[]
  issues?: string[]
}

/**
 * Renderer for media/image analysis operations
 * Shows vision analysis results, detected attributes, and extracted text
 */
export default function MediaAnalysisRenderer({
  operation,
}: OperationRendererProps) {
  // Extract data from completed or progress events
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const progressEvents = operation.events.filter(
    (e) => e.eventType === 'progress'
  )

  const data = (completedEvent?.data ||
    (progressEvents.length > 0
      ? progressEvents[progressEvents.length - 1].data
      : undefined)) as MediaAnalysisData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No analysis data available
      </div>
    )
  }

  const confidence = data.confidence
    ? Math.round(data.confidence * 100)
    : undefined
  const attributes = data.attributes || {}
  const attributeEntries = Object.entries(attributes).filter(
    ([_, v]) => v !== null && v !== undefined && v !== ''
  )

  return (
    <div className="space-y-3 text-sm">
      {/* Images analyzed */}
      {(data.imageCount || data.imagesAnalyzed) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Image className="h-3.5 w-3.5" />
          <span>
            Analyzed {data.imagesAnalyzed || data.imageCount} image
            {(data.imagesAnalyzed || data.imageCount || 0) !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Quick insights */}
      <div className="grid grid-cols-2 gap-2">
        {data.category && (
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Category
            </div>
            <div className="text-xs font-medium">{data.category}</div>
          </div>
        )}
        {data.brand && (
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Brand
            </div>
            <div className="text-xs font-medium">{data.brand}</div>
          </div>
        )}
        {data.model && (
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Model
            </div>
            <div className="text-xs font-medium">{data.model}</div>
          </div>
        )}
        {data.condition && (
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Condition
            </div>
            <div className="text-xs font-medium">
              {typeof data.condition === 'number'
                ? `${data.condition}/5`
                : data.condition}
            </div>
          </div>
        )}
      </div>

      {/* Confidence */}
      {confidence !== undefined && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Analysis Confidence</span>
            <span
              className={
                confidence >= 80
                  ? 'text-green-600 font-medium'
                  : confidence >= 50
                    ? 'text-yellow-600 font-medium'
                    : 'text-red-600 font-medium'
              }
            >
              {confidence}%
            </span>
          </div>
          <Progress value={confidence} className="h-1.5" />
        </div>
      )}

      {/* Detected attributes */}
      {attributeEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            <Tag className="h-3 w-3" />
            Detected Attributes
          </div>
          <div className="flex flex-wrap gap-1.5">
            {attributeEntries.slice(0, 8).map(([key, value]) => (
              <Badge
                key={key}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                <span className="text-muted-foreground">{key}:</span>{' '}
                <span className="font-medium">{String(value)}</span>
              </Badge>
            ))}
            {attributeEntries.length > 8 && (
              <Badge variant="outline" className="text-[10px]">
                +{attributeEntries.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Detected objects */}
      {data.detectedObjects && data.detectedObjects.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            <Eye className="h-3 w-3" />
            Detected Objects
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.detectedObjects.map((obj, index) => (
              <Badge key={index} variant="outline" className="text-[10px]">
                {obj}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Extracted text */}
      {data.extractedText && data.extractedText.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            Extracted Text
          </div>
          <div className="p-2 bg-muted/30 rounded text-xs font-mono space-y-1">
            {data.extractedText.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="truncate">{item.text}</span>
                <Badge variant="secondary" className="text-[10px] ml-2">
                  {Math.round(item.confidence * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues/warnings */}
      {data.issues && data.issues.length > 0 && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-900">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-0.5">
              Issues Detected
            </div>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5">
              {data.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
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
