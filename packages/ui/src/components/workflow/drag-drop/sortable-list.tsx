import * as React from 'react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'

export interface SortableListProps<T = any> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  renderDragOverlay?: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
  direction?: 'vertical' | 'horizontal'
  className?: string
  disabled?: boolean
}

export function SortableList<T = any>({
  items,
  onReorder,
  renderItem,
  renderDragOverlay,
  keyExtractor,
  direction = 'vertical',
  className,
  disabled = false,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const strategy =
    direction === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => keyExtractor(item) === active.id)
      const newIndex = items.findIndex(item => keyExtractor(item) === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(items, oldIndex, newIndex))
      }
    }

    setActiveId(null)
  }

  const activeItem = activeId ? items.find(item => keyExtractor(item) === activeId) : null

  if (disabled) {
    return (
      <div className={cn(direction === 'vertical' ? 'space-y-2' : 'flex space-x-2', className)}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    )
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <SortableContext items={items.map(keyExtractor)} strategy={strategy}>
        <div className={cn(direction === 'vertical' ? 'space-y-2' : 'flex space-x-2', className)}>
          {items.map((item, index) => renderItem(item, index))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem &&
          (renderDragOverlay ? renderDragOverlay(activeItem) : renderItem(activeItem, -1))}
      </DragOverlay>
    </DndContext>
  )
}
