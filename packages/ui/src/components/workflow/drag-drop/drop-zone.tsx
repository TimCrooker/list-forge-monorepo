import * as React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export interface DropZoneProps {
  id: string
  data?: any
  disabled?: boolean
  children: React.ReactNode
  className?: string
  activeClassName?: string
  acceptsData?: (data: any) => boolean
  placeholder?: React.ReactNode
}

export const DropZone = ({
  id,
  data,
  disabled = false,
  children,
  className,
  activeClassName,
  acceptsData,
  placeholder,
}: DropZoneProps) => {
  const { isOver, setNodeRef, active } = useDroppable({
    id,
    data,
    disabled,
  })

  const isValidDrop = React.useMemo(() => {
    if (!active || !acceptsData) return true
    return acceptsData(active.data.current)
  }, [active, acceptsData])

  const showPlaceholder = isOver && isValidDrop && placeholder

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-colors',
        isOver && isValidDrop && 'ring-2 ring-primary ring-offset-2',
        isOver && !isValidDrop && 'ring-2 ring-destructive ring-offset-2',
        isOver && activeClassName,
        className,
      )}
    >
      {children}
      {showPlaceholder && <div className="absolute inset-0 pointer-events-none">{placeholder}</div>}
    </div>
  )
}
