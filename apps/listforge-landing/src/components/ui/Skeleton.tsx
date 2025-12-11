'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/50',
        className
      )}
    />
  )
}

// Pre-built skeleton patterns
export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function TestimonialSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-4 h-4" />
        ))}
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  )
}

export function PricingSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <Skeleton className="h-5 w-20 mb-2" />
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-10 w-24 mb-6" />
      <Skeleton className="h-10 w-full mb-6 rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="text-center py-20">
      <Skeleton className="h-6 w-48 mx-auto mb-6 rounded-full" />
      <Skeleton className="h-12 w-96 mx-auto mb-4" />
      <Skeleton className="h-12 w-72 mx-auto mb-6" />
      <Skeleton className="h-6 w-80 mx-auto mb-8" />
      <div className="flex gap-4 justify-center">
        <Skeleton className="h-12 w-36 rounded-lg" />
        <Skeleton className="h-12 w-28 rounded-lg" />
      </div>
    </div>
  )
}
