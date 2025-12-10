import {
  Search,
  Scan,
  Image,
  Barcode,
  Database,
  Globe,
  Eye,
  DollarSign,
  Info,
  AlertCircle,
} from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface PlanNextResearchData {
  taskPlanned?: boolean
  tool?: string
  targetFields?: string[]
  estimatedCost?: number
  reasoning?: string
  priority?: number
  reason?: string // Alternative field for "no task" reason
}

/**
 * Get icon for a tool type
 */
function getToolIcon(tool: string): React.ElementType {
  const toolLower = tool.toLowerCase()
  if (toolLower.includes('ocr')) return Scan
  if (toolLower.includes('vision')) return Eye
  if (toolLower.includes('image')) return Image
  if (toolLower.includes('upc') || toolLower.includes('barcode')) return Barcode
  if (toolLower.includes('keepa') || toolLower.includes('amazon')) return Database
  if (toolLower.includes('web') || toolLower.includes('search')) return Globe
  return Search
}

/**
 * Get priority badge config
 */
function getPriorityConfig(priority: number): {
  label: string
  variant: 'default' | 'secondary' | 'outline'
} {
  if (priority >= 90) return { label: 'High', variant: 'default' }
  if (priority >= 70) return { label: 'Medium', variant: 'secondary' }
  return { label: 'Low', variant: 'outline' }
}

/**
 * Format tool name for display
 */
function formatToolName(tool: string): string {
  return tool
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Renderer for plan_next_research operations
 * Shows planned research task selection
 */
export default function PlanNextResearchRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as PlanNextResearchData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No planning data available
      </div>
    )
  }

  // Handle "no task planned" case
  if (data.taskPlanned === false || !data.tool) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <span className="text-xs text-yellow-700 dark:text-yellow-300">
            No suitable research task found
          </span>
        </div>
        {data.reason && (
          <p className="text-xs text-muted-foreground">{data.reason}</p>
        )}
      </div>
    )
  }

  const ToolIcon = getToolIcon(data.tool)
  const priorityConfig = data.priority
    ? getPriorityConfig(data.priority)
    : undefined

  return (
    <div className="space-y-3 text-sm">
      {/* Tool header with priority */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <ToolIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {formatToolName(data.tool)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {priorityConfig && (
            <Badge variant={priorityConfig.variant} className="text-[10px]">
              {priorityConfig.label} Priority
            </Badge>
          )}
        </div>
      </div>

      {/* Target fields */}
      {data.targetFields && data.targetFields.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Target Fields
          </div>
          <div className="flex flex-wrap gap-1">
            {data.targetFields.map((field) => (
              <Badge key={field} variant="secondary" className="text-[10px]">
                {field.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {data.reasoning && (
        <div className="flex items-start gap-2 p-2 bg-muted/30 rounded">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">{data.reasoning}</p>
        </div>
      )}

      {/* Estimated cost */}
      {data.estimatedCost !== undefined && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          <span>Estimated cost: ${data.estimatedCost.toFixed(4)}</span>
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
