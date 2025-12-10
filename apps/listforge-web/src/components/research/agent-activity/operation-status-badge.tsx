import * as React from 'react'
import { Check, X, Loader2, Circle } from 'lucide-react'
import { cn } from '@listforge/ui'
import type { OperationStatus } from '@listforge/core-types'

interface OperationStatusBadgeProps {
  status: OperationStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const statusConfig: Record<
  OperationStatus,
  {
    icon: React.ElementType
    className: string
    animate?: boolean
  }
> = {
  pending: {
    icon: Circle,
    className: 'text-muted-foreground/50',
  },
  in_progress: {
    icon: Loader2,
    className: 'text-blue-500',
    animate: true,
  },
  completed: {
    icon: Check,
    className: 'text-green-500',
  },
  failed: {
    icon: X,
    className: 'text-red-500',
  },
}

export function OperationStatusBadge({
  status,
  size = 'md',
  className,
}: OperationStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex-shrink-0 flex items-center justify-center',
        className
      )}
    >
      <Icon
        className={cn(
          sizeClasses[size],
          config.className,
          config.animate && 'animate-spin'
        )}
      />
    </div>
  )
}

OperationStatusBadge.displayName = 'OperationStatusBadge'
