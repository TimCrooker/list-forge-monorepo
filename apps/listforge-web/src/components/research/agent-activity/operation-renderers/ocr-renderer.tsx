import { Scan, Barcode, Hash, FileText, CheckCircle2 } from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface OCRData {
  upc?: string
  ean?: string
  modelNumber?: string
  mpn?: string
  serialNumber?: string
  rawTextCount?: number
  rawText?: string[]
  labels?: Record<string, string>
  confidence?: number
}

/**
 * Renderer for OCR extraction operations
 * Slice 2: Shows extracted text, identifiers, and labels from product images
 */
export default function OCRRenderer({ operation }: OperationRendererProps) {
  // Extract data from completed event
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as OCRData | undefined

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        No extraction data available
      </div>
    )
  }

  const confidence = data.confidence ? Math.round(data.confidence * 100) : null

  // Collect found identifiers
  const identifiers: Array<{ label: string; value: string; icon: React.ElementType }> = []
  if (data.upc) {
    identifiers.push({ label: 'UPC', value: data.upc, icon: Barcode })
  }
  if (data.ean && data.ean !== data.upc) {
    identifiers.push({ label: 'EAN', value: data.ean, icon: Barcode })
  }
  if (data.modelNumber) {
    identifiers.push({ label: 'Model', value: data.modelNumber, icon: Hash })
  }
  if (data.mpn) {
    identifiers.push({ label: 'MPN', value: data.mpn, icon: Hash })
  }
  if (data.serialNumber) {
    identifiers.push({ label: 'S/N', value: data.serialNumber, icon: Hash })
  }

  const labelEntries = data.labels ? Object.entries(data.labels) : []

  return (
    <div className="space-y-3 text-sm">
      {/* Confidence indicator */}
      {confidence !== null && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Text clarity</span>
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
      )}

      {/* Found identifiers */}
      {identifiers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scan className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Identifiers Found
            </span>
          </div>
          <div className="space-y-1.5">
            {identifiers.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-900"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{label}:</span>
                <span className="text-xs font-mono font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No identifiers found */}
      {identifiers.length === 0 && (
        <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground">
          No barcodes or model numbers detected
        </div>
      )}

      {/* Labels extracted */}
      {labelEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Labels ({labelEntries.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {labelEntries.slice(0, 6).map(([key, value]) => (
              <Badge
                key={key}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                <span className="text-muted-foreground">{key}:</span>{' '}
                <span className="font-medium">{value}</span>
              </Badge>
            ))}
            {labelEntries.length > 6 && (
              <Badge variant="outline" className="text-[10px]">
                +{labelEntries.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Raw text snippets */}
      {data.rawText && data.rawText.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Extracted Text ({data.rawTextCount || data.rawText.length})
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {data.rawText.slice(0, 5).map((text, index) => (
              <div
                key={index}
                className="text-xs p-1.5 bg-muted/30 rounded font-mono truncate"
              >
                {text}
              </div>
            ))}
            {data.rawText.length > 5 && (
              <div className="text-xs text-muted-foreground text-center">
                +{data.rawText.length - 5} more snippets
              </div>
            )}
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
