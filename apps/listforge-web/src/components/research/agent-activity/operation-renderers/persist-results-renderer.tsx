import { Database, FileStack, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react'
import type { OperationRendererProps } from './index'

/**
 * Renderer for persist_results operations
 * Shows what was saved to the database
 */
export default function PersistResultsRenderer({ operation }: OperationRendererProps) {
  const completedEvent = operation.events.find((e) => e.eventType === 'completed')
  const data = completedEvent?.data || {}

  const researchId = data.researchId as string | undefined
  const bundleId = data.bundleId as string | undefined
  const evidenceCount = data.evidenceCount as number | undefined
  const priceBandsCount = data.priceBandsCount as number | undefined
  const demandSignalsCount = data.demandSignalsCount as number | undefined

  return (
    <div className="space-y-3 text-sm">
      {/* Research data saved */}
      {researchId && (
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-muted-foreground">
            Research data saved
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        </div>
      )}

      {/* Evidence bundle */}
      {(bundleId || typeof evidenceCount === 'number') && (
        <div className="flex items-center gap-2">
          <FileStack className="h-4 w-4 text-purple-500 shrink-0" />
          <span className="text-muted-foreground">
            {typeof evidenceCount === 'number' ? (
              <>
                {evidenceCount} evidence records saved
              </>
            ) : (
              'Evidence bundle saved'
            )}
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        </div>
      )}

      {/* Summary counts */}
      {(typeof priceBandsCount === 'number' || typeof demandSignalsCount === 'number') && (
        <div className="border-t pt-2 mt-2">
          <div className="text-xs uppercase text-muted-foreground mb-1.5">
            Saved Data
          </div>
          <div className="flex gap-4">
            {typeof priceBandsCount === 'number' && priceBandsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>
                  {priceBandsCount} price {priceBandsCount === 1 ? 'band' : 'bands'}
                </span>
              </div>
            )}
            {typeof demandSignalsCount === 'number' && demandSignalsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span>
                  {demandSignalsCount} demand {demandSignalsCount === 1 ? 'signal' : 'signals'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
