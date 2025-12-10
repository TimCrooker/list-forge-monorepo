import {
  Barcode,
  Tag,
  Package,
  Image,
  Zap,
  Database,
  Check,
  X,
  Rocket,
  Scale,
  Search,
} from 'lucide-react'
import { Badge, Progress } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface ResearchContext {
  hasUpc?: boolean
  hasBrand?: boolean
  hasModel?: boolean
  hasImages?: boolean
  hasCategory?: boolean
  imageCount?: number
  keepaConfigured?: boolean
  amazonConfigured?: boolean
  upcDatabaseConfigured?: boolean
}

interface InitializeFieldStatesData {
  totalFields?: number
  requiredFieldsComplete?: number
  requiredFieldsTotal?: number
  completionScore?: number
  researchMode?: 'fast' | 'balanced' | 'thorough'
  readyToPublish?: boolean
  fieldsNeedingResearch?: number
  researchContext?: ResearchContext
}

const modeConfig = {
  fast: {
    icon: Rocket,
    label: 'Fast',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900',
  },
  balanced: {
    icon: Scale,
    label: 'Balanced',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
  },
  thorough: {
    icon: Search,
    label: 'Thorough',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900',
  },
}

/**
 * Data availability indicator component
 */
function DataIndicator({
  available,
  label,
  icon: Icon,
  count,
}: {
  available: boolean
  label: string
  icon: React.ElementType
  count?: number
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
        available
          ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
          : 'bg-gray-50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500'
      }`}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
      {count !== undefined && available && (
        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
          {count}
        </Badge>
      )}
      {available ? (
        <Check className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
      ) : (
        <X className="h-2.5 w-2.5 text-gray-400" />
      )}
    </div>
  )
}

/**
 * Service availability indicator
 */
function ServiceIndicator({
  configured,
  label,
}: {
  configured: boolean
  label: string
}) {
  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
        configured
          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
          : 'bg-gray-50 dark:bg-gray-900/30 text-gray-400 line-through'
      }`}
    >
      <Database className="h-2.5 w-2.5" />
      <span>{label}</span>
    </div>
  )
}

/**
 * Renderer for initialize_field_states operations
 * Shows field initialization, research mode, and available data sources
 */
export default function InitializeFieldStatesRenderer({
  operation,
}: OperationRendererProps) {
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as InitializeFieldStatesData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No initialization data available
      </div>
    )
  }

  const mode = data.researchMode || 'balanced'
  const config = modeConfig[mode]
  const ModeIcon = config.icon
  const context = data.researchContext || {}
  const completionPercent = data.completionScore
    ? Math.round(data.completionScore * 100)
    : 0

  return (
    <div className="space-y-3 text-sm">
      {/* Research mode badge */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${config.bg}`}
        >
          <ModeIcon className={`h-4 w-4 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label} Mode
          </span>
        </div>
        {data.totalFields !== undefined && (
          <span className="text-xs text-muted-foreground">
            {data.totalFields} fields tracked
          </span>
        )}
      </div>

      {/* Data availability grid */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Available Data
        </div>
        <div className="flex flex-wrap gap-1.5">
          <DataIndicator
            available={context.hasUpc || false}
            label="UPC"
            icon={Barcode}
          />
          <DataIndicator
            available={context.hasBrand || false}
            label="Brand"
            icon={Tag}
          />
          <DataIndicator
            available={context.hasModel || false}
            label="Model"
            icon={Package}
          />
          <DataIndicator
            available={context.hasImages || false}
            label="Images"
            icon={Image}
            count={context.imageCount}
          />
        </div>
      </div>

      {/* Services availability */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Research Services
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ServiceIndicator
            configured={context.upcDatabaseConfigured ?? true}
            label="UPC DB"
          />
          <ServiceIndicator
            configured={context.keepaConfigured || false}
            label="Keepa"
          />
          <ServiceIndicator
            configured={context.amazonConfigured || false}
            label="Amazon"
          />
        </div>
      </div>

      {/* Initial completion status */}
      {data.requiredFieldsTotal !== undefined && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Initial Completion</span>
            <span className="font-medium">
              {data.requiredFieldsComplete || 0}/{data.requiredFieldsTotal}{' '}
              required
            </span>
          </div>
          <Progress value={completionPercent} className="h-1.5" />
        </div>
      )}

      {/* Fields needing research */}
      {data.fieldsNeedingResearch !== undefined &&
        data.fieldsNeedingResearch > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span>
              Ready to research{' '}
              <span className="font-medium">{data.fieldsNeedingResearch}</span>{' '}
              field{data.fieldsNeedingResearch !== 1 ? 's' : ''}
            </span>
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
