import { Image, Check, X, Layers, DollarSign } from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface ExtractFromImagesData {
  imageCount?: number
  fieldsUpdated?: number
  updatedFields?: string[]
  targetFields?: string[]
  cost?: number
}

/**
 * Field extraction result indicator
 */
function FieldResult({
  field,
  extracted,
}: {
  field: string
  extracted: boolean
}) {
  const displayName = field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
        extracted
          ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
          : 'bg-gray-50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500'
      }`}
    >
      {extracted ? (
        <Check className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      <span>{displayName}</span>
    </div>
  )
}

/**
 * Renderer for extract_from_images operations
 * Shows OCR + vision extraction results from product images
 */
export default function ExtractFromImagesRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as ExtractFromImagesData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No extraction data available
      </div>
    )
  }

  const updatedSet = new Set(data.updatedFields || [])
  const allFields = data.targetFields || data.updatedFields || []

  // If no images analyzed, show that
  if (data.imageCount === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Image className="h-4 w-4" />
        <span>No images to analyze</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Image count header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30">
            <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {data.imageCount} image{data.imageCount !== 1 ? 's' : ''} analyzed
            </span>
          </div>
        </div>
        {data.fieldsUpdated !== undefined && (
          <Badge
            variant={data.fieldsUpdated > 0 ? 'default' : 'secondary'}
            className="text-[10px]"
          >
            {data.fieldsUpdated} field{data.fieldsUpdated !== 1 ? 's' : ''}{' '}
            extracted
          </Badge>
        )}
      </div>

      {/* Extraction results grid */}
      {allFields.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            <Layers className="h-3 w-3" />
            <span>Extraction Results</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allFields.map((field) => (
              <FieldResult
                key={field}
                field={field}
                extracted={updatedSet.has(field)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Updated fields list (if different from target fields) */}
      {data.updatedFields &&
        data.updatedFields.length > 0 &&
        !data.targetFields && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Extracted Fields
            </div>
            <div className="flex flex-wrap gap-1">
              {data.updatedFields.map((field) => (
                <Badge key={field} variant="secondary" className="text-[10px]">
                  {field.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

      {/* Cost indicator */}
      {data.cost !== undefined && data.cost > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          <span>Cost: ${data.cost.toFixed(4)}</span>
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
