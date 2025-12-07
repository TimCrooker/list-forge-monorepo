import { Card, CardContent, CardHeader, Skeleton } from '@listforge/ui';

/**
 * ChatPanelSkeleton Component
 * Phase 7 Slice 8
 *
 * Skeleton loader for the chat panel showing loading state
 * while chat session is being initialized or messages are loading.
 */
export function ChatPanelSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col space-y-4 pt-0 flex-1 overflow-hidden">
        {/* Messages Skeleton */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
          {/* User message skeleton */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-lg px-4 py-2 bg-primary/10">
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
          </div>

          {/* Assistant message skeleton */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-4 py-2 bg-muted">
              <Skeleton className="h-4 w-56 mb-1" />
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
          </div>

          {/* Another user message skeleton */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-lg px-4 py-2 bg-primary/10">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
          </div>

          {/* Another assistant message skeleton */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-4 py-2 bg-muted">
              <Skeleton className="h-4 w-52 mb-1" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
          </div>
        </div>

        {/* Input Area Skeleton */}
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="flex-1 h-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
