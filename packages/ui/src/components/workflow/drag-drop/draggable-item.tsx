import * as React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

export interface DraggableItemProps {
  id: string
  data?: any
  disabled?: boolean
  handle?: boolean
  children: React.ReactNode
  className?: string
  handleClassName?: string
}

export const DraggableItem = ({
  id,
  data,
  disabled = false,
  handle = false,
  children,
  className,
  handleClassName,
}: DraggableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging, setActivatorNodeRef } =
    useDraggable({
      id,
      data,
      disabled,
    })

  const style = {
    transform: CSS.Translate.toString(transform),
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
            'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded',
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
