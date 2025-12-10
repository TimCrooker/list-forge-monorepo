import { CheckCircle2, Edit, Tag, FileText, Percent } from 'lucide-react'
import type { OperationRendererProps } from './index'

/**
 * Renderer for item_update operations
 * Shows what fields were updated on the item
 */
export default function ItemUpdateRenderer({ operation }: OperationRendererProps) {
  const completedEvent = operation.events.find((e) => e.eventType === 'completed')
  const data = completedEvent?.data || {}

  const updatedFields = data.updatedFields as string[] | undefined
  const title = data.title as string | undefined
  const brand = data.brand as string | undefined
  const model = data.model as string | undefined
  const attributeCount = data.attributeCount as number | undefined
  const confidence = data.confidence as number | undefined
  const skipped = data.skipped as boolean | undefined

  if (skipped) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No new data discovered - item not modified
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      {/* Updated title */}
      {title && (
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">New Title:</span>{' '}
            <span className="text-muted-foreground">{title}</span>
          </div>
        </div>
      )}

      {/* Brand and Model */}
      {(brand || model) && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-purple-500 shrink-0" />
          <span className="text-muted-foreground">
            {[brand, model].filter(Boolean).join(' ')}
          </span>
        </div>
      )}

      {/* Attributes */}
      {typeof attributeCount === 'number' && attributeCount > 0 && (
        <div className="flex items-center gap-2">
          <Edit className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-muted-foreground">
            {attributeCount} attributes added
          </span>
        </div>
      )}

      {/* Confidence */}
      {typeof confidence === 'number' && confidence > 0 && (
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">
            {(confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
      )}

      {/* Updated fields list */}
      {updatedFields && updatedFields.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <div className="text-xs uppercase text-muted-foreground mb-1.5">
            Fields Updated
          </div>
          <div className="flex flex-wrap gap-1.5">
            {updatedFields.map((field, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs"
              >
                <CheckCircle2 className="h-3 w-3" />
                {field}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
