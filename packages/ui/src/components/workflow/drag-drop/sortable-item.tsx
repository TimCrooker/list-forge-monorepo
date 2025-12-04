import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

export interface SortableItemProps {
  id: string
  children: React.ReactNode
  handle?: boolean
  disabled?: boolean
  className?: string
  handleClassName?: string
}

export const SortableItem = ({
  id,
  children,
  handle = false,
  disabled = false,
  className,
  handleClassName,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      className={cn('relative', isDragging && 'z-50', className)}
      style={style}
      {...(handle ? {} : { ...listeners, ...attributes })}
    >
      {handle && (
        <div
          ref={setActivatorNodeRef}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded touch-none',
            handleClassName,
          )}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {children}
    </div>
  )
}
