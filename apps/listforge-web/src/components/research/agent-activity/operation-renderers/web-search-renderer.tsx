import { ExternalLink, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@listforge/ui'
import type { OperationRendererProps } from './index'

interface WebSearchQuery {
  query: string
  resultCount?: number
  success?: boolean
  error?: string
}

interface WebSearchData {
  queries?: string[]
  totalResults?: number
  successfulResults?: number
  sources?: string[]
  searchParams?: Record<string, unknown>
}

/**
 * Renderer for web search operations
 * Shows queries executed, results found, and sources
 */
export default function WebSearchRenderer({
  operation,
}: OperationRendererProps) {
  // Extract data from progress and completed events
  const progressData = operation.events
    .filter((e) => e.eventType === 'progress' && e.data)
    .map((e) => e.data as Record<string, unknown>)

  const completedEvent = operation.events.find(
    (e) => e.eventType === 'completed'
  )
  const completedData = completedEvent?.data as WebSearchData | undefined

  // Collect all queries from progress events
  const queries: WebSearchQuery[] = []
  for (const data of progressData) {
    if (data.query) {
      queries.push({
        query: data.query as string,
        resultCount: data.resultCount as number | undefined,
        success: data.success !== false,
        error: data.error as string | undefined,
      })
    }
    if (data.queries && Array.isArray(data.queries)) {
      for (const q of data.queries) {
        queries.push({
          query: typeof q === 'string' ? q : (q as WebSearchQuery).query,
          resultCount:
            typeof q === 'object' ? (q as WebSearchQuery).resultCount : undefined,
          success: typeof q === 'object' ? (q as WebSearchQuery).success : true,
        })
      }
    }
  }

  // Also get queries from completed data
  if (completedData?.queries) {
    for (const q of completedData.queries) {
      if (!queries.find((existing) => existing.query === q)) {
        queries.push({ query: q, success: true })
      }
    }
  }

  const totalResults = completedData?.totalResults || completedData?.successfulResults
  const sources = completedData?.sources || []

  return (
    <div className="space-y-3 text-sm">
      {/* Queries section */}
      {queries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Queries ({queries.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {queries.map((q, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs"
              >
                {q.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <span className="flex-1 break-words">{q.query}</span>
                {q.resultCount !== undefined && (
                  <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                    {q.resultCount} results
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results summary */}
      {totalResults !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Total results found:</span>
          <Badge variant="outline">{totalResults}</Badge>
        </div>
      )}

      {/* Sources section */}
      {sources.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sources ({sources.length})
            </span>
          </div>
          <div className="space-y-1">
            {sources.slice(0, 5).map((source, index) => (
              <a
                key={index}
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
              >
                {source}
              </a>
            ))}
            {sources.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{sources.length - 5} more sources
              </span>
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
