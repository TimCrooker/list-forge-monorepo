import {
  Play,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Clock,
  DollarSign,
  Search,
  Scan,
  Image,
  Barcode,
  Database,
  Globe,
  Eye,
} from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface ExecuteResearchData {
  success?: boolean
  tool?: string
  updatedFields?: string[]
  failedFields?: string[]
  cost?: number
  timeMs?: number
  totalCost?: number
  error?: string
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
 * Format tool name for display
 */
function formatToolName(tool: string): string {
  return tool
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Format milliseconds to human readable
 */
function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Renderer for execute_research operations
 * Shows research task execution results
 */
export default function ExecuteResearchRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as ExecuteResearchData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No execution data available
      </div>
    )
  }

  const success = data.success !== false
  const ToolIcon = data.tool ? getToolIcon(data.tool) : Play

  return (
    <div className="space-y-3 text-sm">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded border ${
            success
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          }`}
        >
          {success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-xs font-medium ${
              success
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}
          >
            {success ? 'Completed' : 'Failed'}
          </span>
        </div>
        {data.tool && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ToolIcon className="h-3.5 w-3.5" />
            <span>{formatToolName(data.tool)}</span>
          </div>
        )}
      </div>

      {/* Updated fields */}
      {data.updatedFields && data.updatedFields.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Updated Fields
          </div>
          <div className="flex flex-wrap gap-1">
            {data.updatedFields.map((field) => (
              <Badge
                key={field}
                variant="secondary"
                className="text-[10px] bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
              >
                <Check className="h-2.5 w-2.5 mr-1" />
                {field.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Failed fields */}
      {data.failedFields && data.failedFields.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Failed Fields
          </div>
          <div className="flex flex-wrap gap-1">
            {data.failedFields.map((field) => (
              <Badge
                key={field}
                variant="secondary"
                className="text-[10px] bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              >
                <X className="h-2.5 w-2.5 mr-1" />
                {field.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Execution error */}
      {data.error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-600 dark:text-red-400">{data.error}</p>
        </div>
      )}

      {/* Execution stats */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        {data.timeMs !== undefined && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(data.timeMs)}</span>
          </div>
        )}
        {data.cost !== undefined && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>Cost: ${data.cost.toFixed(4)}</span>
          </div>
        )}
        {data.totalCost !== undefined && (
          <div className="flex items-center gap-1">
            <span>Total: ${data.totalCost.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Operation-level error state */}
      {operation.error && !data.error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-600 dark:text-red-400">
            {operation.error}
          </p>
        </div>
      )}
    </div>
  )
}
