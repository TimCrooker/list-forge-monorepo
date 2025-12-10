import { Tag, Percent, Package, Barcode, Eye, Globe, Scan, User } from 'lucide-react'
import { Badge, Progress } from '@listforge/ui'
import type { OperationRendererProps } from './index'

// Slice 2: Field with confidence and source tracking
interface FieldWithConfidence<T> {
  value: T
  confidence: number
  source: 'ocr' | 'upc_lookup' | 'web_search' | 'vision' | 'user'
}

interface ProductIdData {
  confidence?: number
  brand?: string | FieldWithConfidence<string> | null
  model?: string | FieldWithConfidence<string> | null
  mpn?: string | FieldWithConfidence<string> | null
  upc?: string | FieldWithConfidence<string> | null
  // Slice 2: Variant fields
  color?: string | null
  size?: string | null
  edition?: string | null
  category?: string[]
  attributes?: Record<string, string | number | boolean | FieldWithConfidence<string | number | boolean>>
  specifications?: Record<string, string | number | boolean>
  specCount?: number
  title?: string | null
  sources?: string[]
  thresholdReached?: boolean
}

// Source icon mapping
const sourceIcons: Record<string, React.ElementType> = {
  ocr: Scan,
  upc_lookup: Barcode,
  web_search: Globe,
  vision: Eye,
  user: User,
}

// Source label mapping
const sourceLabels: Record<string, string> = {
  ocr: 'OCR',
  upc_lookup: 'UPC',
  web_search: 'Web',
  vision: 'Vision',
  user: 'User',
}

// Helper to extract value and confidence from field
function getFieldData<T>(field: T | FieldWithConfidence<T> | null | undefined): {
  value: T | null
  confidence: number | null
  source: string | null
} {
  if (field === null || field === undefined) {
    return { value: null, confidence: null, source: null }
  }
  if (typeof field === 'object' && 'value' in (field as any) && 'confidence' in (field as any)) {
    const f = field as FieldWithConfidence<T>
    return { value: f.value, confidence: f.confidence, source: f.source }
  }
  return { value: field as T, confidence: null, source: null }
}

/**
 * Renderer for product identification operations
 * Slice 2: Enhanced with per-field confidence indicators and source badges
 */
export default function ProductIdRenderer({
  operation,
}: OperationRendererProps) {
  // Extract data from completed event or progress events
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = (completedEvent?.data || getLatestProgressData(operation)) as
    | ProductIdData
    | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No product data available
      </div>
    )
  }

  const confidence = data.confidence ? Math.round(data.confidence * 100) : null
  const attributes = data.attributes || data.specifications || {}
  const attributeEntries = Object.entries(attributes).filter(
    ([_, v]) => v !== null && v !== undefined && v !== ''
  )

  // Extract field data with confidence
  const brandData = getFieldData(data.brand)
  const modelData = getFieldData(data.model)
  const mpnData = getFieldData(data.mpn)
  const upcData = getFieldData(data.upc)

  return (
    <div className="space-y-3 text-sm">
      {/* Overall confidence score */}
      {confidence !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Percent className="h-3.5 w-3.5" />
              <span>Overall Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              {data.thresholdReached && (
                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                  Threshold Met
                </Badge>
              )}
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
          </div>
          <Progress
            value={confidence}
            className="h-1.5"
          />
        </div>
      )}

      {/* Product details with per-field confidence */}
      <div className="grid grid-cols-2 gap-2">
        {brandData.value && (
          <FieldCard
            label="Brand"
            value={brandData.value}
            confidence={brandData.confidence}
            source={brandData.source}
          />
        )}
        {modelData.value && (
          <FieldCard
            label="Model"
            value={modelData.value}
            confidence={modelData.confidence}
            source={modelData.source}
          />
        )}
        {mpnData.value && (
          <FieldCard
            label="MPN"
            value={mpnData.value}
            confidence={mpnData.confidence}
            source={mpnData.source}
            mono
          />
        )}
        {upcData.value && (
          <FieldCard
            label="UPC"
            value={upcData.value}
            confidence={upcData.confidence}
            source={upcData.source}
            icon={Barcode}
            mono
          />
        )}
      </div>

      {/* Slice 2: Variant fields */}
      {(data.color || data.size || data.edition) && (
        <div className="flex flex-wrap gap-2">
          {data.color && (
            <Badge variant="secondary" className="text-[10px]">
              <span className="text-muted-foreground">Color:</span>{' '}
              <span className="font-medium">{data.color}</span>
            </Badge>
          )}
          {data.size && (
            <Badge variant="secondary" className="text-[10px]">
              <span className="text-muted-foreground">Size:</span>{' '}
              <span className="font-medium">{data.size}</span>
            </Badge>
          )}
          {data.edition && (
            <Badge variant="secondary" className="text-[10px]">
              <span className="text-muted-foreground">Edition:</span>{' '}
              <span className="font-medium">{data.edition}</span>
            </Badge>
          )}
        </div>
      )}

      {/* Category */}
      {data.category && data.category.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            <Package className="h-3 w-3" />
            Category
          </div>
          <div className="text-xs">
            {data.category.join(' > ')}
          </div>
        </div>
      )}

      {/* Attributes/Specifications */}
      {attributeEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
            <Tag className="h-3 w-3" />
            Specifications ({attributeEntries.length})
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

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          Data from {data.sources.length} source(s)
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

function getLatestProgressData(
  operation: OperationRendererProps['operation']
): Record<string, unknown> | undefined {
  const progressEvents = operation.events.filter(
    (e) => e.eventType === 'progress' && e.data
  )
  return progressEvents.length > 0
    ? progressEvents[progressEvents.length - 1].data
    : undefined
}

/**
 * Slice 2: Field card with optional confidence indicator and source badge
 */
function FieldCard({
  label,
  value,
  confidence,
  source,
  icon: Icon,
  mono,
}: {
  label: string
  value: string
  confidence: number | null
  source: string | null
  icon?: React.ElementType
  mono?: boolean
}) {
  const confidencePercent = confidence ? Math.round(confidence * 100) : null
  const SourceIcon = source ? sourceIcons[source] : null

  return (
    <div className="p-2 bg-muted/30 rounded space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </div>
        {source && SourceIcon && (
          <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
            <SourceIcon className="h-2.5 w-2.5 mr-0.5" />
            {sourceLabels[source]}
          </Badge>
        )}
      </div>
      <div className={`text-xs font-medium ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
      {confidencePercent !== null && (
        <div className="flex items-center gap-1">
          <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
            <div
              className={`h-full ${
                confidencePercent >= 80
                  ? 'bg-green-500'
                  : confidencePercent >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground">
            {confidencePercent}%
          </span>
        </div>
      )}
    </div>
  )
}
