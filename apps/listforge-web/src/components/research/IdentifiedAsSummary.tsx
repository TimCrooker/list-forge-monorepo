import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@listforge/ui'
import { Tag, Barcode, Hash, CheckCircle2, AlertCircle, Eye, Globe, Scan } from 'lucide-react'

/**
 * Source of identification data
 */
type FieldSource = 'ocr' | 'upc_lookup' | 'web_search' | 'vision' | 'user'

/**
 * Props for the IdentifiedAsSummary component
 */
interface IdentifiedAsSummaryProps {
  /** Overall confidence score 0-1 */
  confidence: number
  /** Canonical product name/title */
  canonicalName?: string | null
  /** Brand name */
  brand?: string | null
  /** Model number */
  model?: string | null
  /** UPC/EAN barcode */
  upc?: string | null
  /** Manufacturer Part Number */
  mpn?: string | null
  /** Color variant */
  color?: string | null
  /** Size variant */
  size?: string | null
  /** Edition/version */
  edition?: string | null
  /** Category path */
  category?: string[]
  /** Sources used for identification */
  sources?: FieldSource[]
  /** Whether the confidence threshold was met */
  thresholdReached?: boolean
  /** Compact mode for smaller displays */
  compact?: boolean
}

// Source icons and labels
const sourceConfig: Record<FieldSource, { icon: React.ElementType; label: string; color: string }> = {
  ocr: { icon: Scan, label: 'OCR', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  upc_lookup: { icon: Barcode, label: 'UPC Database', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  web_search: { icon: Globe, label: 'Web Search', color: 'bg-green-100 text-green-700 border-green-200' },
  vision: { icon: Eye, label: 'AI Vision', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  user: { icon: Tag, label: 'User Input', color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

/**
 * IdentifiedAsSummary - Slice 2: Enhanced Product Identification
 *
 * Displays a summary card showing the canonical product identity from research.
 * Shows the main product name, key identifiers, overall confidence, and sources used.
 *
 * Use in:
 * - Item detail Research tab
 * - Research run detail page
 * - Inline in activity feed (compact mode)
 */
export function IdentifiedAsSummary({
  confidence,
  canonicalName,
  brand,
  model,
  upc,
  mpn,
  color,
  size,
  edition,
  category,
  sources = [],
  thresholdReached,
  compact = false,
}: IdentifiedAsSummaryProps) {
  const confidencePercent = Math.round(confidence * 100)

  // Build canonical name if not provided
  const displayName = canonicalName || [brand, model].filter(Boolean).join(' ') || 'Unknown Product'

  // Collect identifiers
  const identifiers: Array<{ label: string; value: string; icon: React.ElementType }> = []
  if (upc) identifiers.push({ label: 'UPC', value: upc, icon: Barcode })
  if (mpn) identifiers.push({ label: 'MPN', value: mpn, icon: Hash })
  if (model && !canonicalName?.includes(model)) {
    identifiers.push({ label: 'Model', value: model, icon: Tag })
  }

  // Collect variants
  const variants: string[] = []
  if (color) variants.push(color)
  if (size) variants.push(size)
  if (edition) variants.push(edition)

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
        {/* Confidence indicator */}
        <div className="flex-shrink-0">
          {thresholdReached ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : confidencePercent >= 50 ? (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground">
            {confidencePercent}% confidence
            {variants.length > 0 && ` · ${variants.join(', ')}`}
          </div>
        </div>

        {/* Key identifier */}
        {identifiers[0] && (
          <Badge variant="outline" className="text-[10px] flex-shrink-0">
            {identifiers[0].label}: {identifiers[0].value}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Identified As
          </CardTitle>
          {thresholdReached && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main product name */}
        <div>
          <h3 className="text-lg font-semibold">{displayName}</h3>
          {brand && !canonicalName?.startsWith(brand) && (
            <p className="text-sm text-muted-foreground">by {brand}</p>
          )}
          {category && category.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {category.join(' > ')}
            </p>
          )}
        </div>

        {/* Confidence bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Identification Confidence</span>
            <span
              className={
                confidencePercent >= 80
                  ? 'text-green-600 font-medium'
                  : confidencePercent >= 50
                    ? 'text-yellow-600 font-medium'
                    : 'text-red-600 font-medium'
              }
            >
              {confidencePercent}%
            </span>
          </div>
          <Progress value={confidencePercent} className="h-2" />
        </div>

        {/* Identifiers */}
        {identifiers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Identifiers
            </p>
            <div className="flex flex-wrap gap-2">
              {identifiers.map(({ label, value, icon: Icon }) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  <Icon className="h-3 w-3 mr-1 text-muted-foreground" />
                  {label}: <span className="font-mono ml-1">{value}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Variant
            </p>
            <div className="flex flex-wrap gap-2">
              {color && (
                <Badge variant="secondary" className="text-xs">
                  Color: {color}
                </Badge>
              )}
              {size && (
                <Badge variant="secondary" className="text-xs">
                  Size: {size}
                </Badge>
              )}
              {edition && (
                <Badge variant="secondary" className="text-xs">
                  Edition: {edition}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Sources used */}
        {sources.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Data Sources
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source) => {
                const config = sourceConfig[source]
                const Icon = config.icon
                return (
                  <Badge
                    key={source}
                    variant="outline"
                    className={`text-[10px] ${config.color}`}
                  >
                    <Icon className="h-2.5 w-2.5 mr-1" />
                    {config.label}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default IdentifiedAsSummary
