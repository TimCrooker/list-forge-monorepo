import { Barcode, Package, CheckCircle2, XCircle, Database } from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface UPCLookupData {
  found?: boolean
  upc?: string
  brand?: string
  name?: string
  category?: string
  imageUrl?: string
  cached?: boolean
}

/**
 * Renderer for UPC lookup operations
 * Slice 2: Shows product data retrieved from UPC database
 */
export default function UPCLookupRenderer({ operation }: OperationRendererProps) {
  // Extract data from completed event
  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const data = completedEvent?.data as UPCLookupData | undefined

  // Get UPC from started event if not in completed
  const startedEvent = operation.events.find((e) => e.eventType === 'started')
  const upc = data?.upc || (startedEvent?.data as { upc?: string })?.upc

  if (!data) {
    return (
      <div className="text-xs text-muted-foreground">
        Looking up product data...
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      {/* UPC Code */}
      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
        <Barcode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground">UPC:</span>
        <span className="text-xs font-mono font-medium">{upc}</span>
        {data.cached && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            <Database className="h-2.5 w-2.5 mr-1" />
            Cached
          </Badge>
        )}
      </div>

      {/* Found product */}
      {data.found ? (
        <div className="space-y-2">
          {/* Success indicator */}
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-medium">Product found in database</span>
          </div>

          {/* Product info card */}
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-900 space-y-2">
            {/* Product image and name */}
            <div className="flex gap-3">
              {data.imageUrl && (
                <img
                  src={data.imageUrl}
                  alt={data.name || 'Product'}
                  className="w-12 h-12 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                {data.brand && (
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {data.brand}
                  </div>
                )}
                {data.name && (
                  <div className="text-xs font-medium line-clamp-2">
                    {data.name}
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            {data.category && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                <span>{data.category}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Not found */
        <div className="p-3 bg-muted/50 rounded border border-muted">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <XCircle className="h-3.5 w-3.5" />
            <span>No product found for this UPC in database</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 ml-5">
            Web search will be used to identify the product
          </p>
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
