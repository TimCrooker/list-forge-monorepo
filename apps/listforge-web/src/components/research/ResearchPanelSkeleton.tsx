import { Card, CardContent, CardHeader, Skeleton } from '@listforge/ui';

/**
 * ResearchPanelSkeleton Component
 * Phase 7 Slice 8
 *
 * Skeleton loader for the research panel showing loading state
 * while research data is being fetched.
 */
export function ResearchPanelSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Product Identification Card Skeleton */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Bands Card Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demand Signals Card Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Missing Info Card Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full mb-3" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-lg border bg-background">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
