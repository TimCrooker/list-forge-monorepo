import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Download, Trash2 } from 'lucide-react'
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
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video'
  title?: string
  description?: string
  thumbnail?: string
}

export interface MediaGalleryProps {
  items: MediaItem[]
  onDelete?: (id: string) => void
  onDownload?: (id: string) => void
  onReorder?: (items: MediaItem[]) => void
  className?: string
  view?: 'grid' | 'carousel'
  columns?: number
  aspectRatio?: number
  showControls?: boolean
}

function SortableMediaItem({
  item,
  renderMedia,
  renderControls,
  showControls,
  aspectRatio,
  onDelete,
  onDownload,
}: {
  item: MediaItem
  renderMedia: (item: MediaItem) => React.ReactNode
  renderControls: (item: MediaItem) => React.ReactNode
  showControls: boolean
  aspectRatio: number
  onDelete?: (id: string) => void
  onDownload?: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, aspectRatio }}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border',
        'hover:border-primary/50 transition-colors',
        isDragging && 'z-50',
      )}
    >
      <div
        className="absolute left-2 top-2 z-10 cursor-grab active:cursor-grabbing p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>
      {renderMedia(item)}
      {showControls && renderControls(item)}
    </div>
  )
}

export const MediaGallery = ({
  items,
  onDelete,
  onDownload,
  onReorder,
  className,
  view = 'grid',
  columns = 3,
  aspectRatio = 16 / 9,
  showControls = true,
}: MediaGalleryProps) => {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [localItems, setLocalItems] = React.useState(items)

  React.useEffect(() => {
    setLocalItems(items)
  }, [items])

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = localItems.findIndex(item => item.id === active.id)
      const newIndex = localItems.findIndex(item => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(localItems, oldIndex, newIndex)
        setLocalItems(newItems)
        onReorder(newItems)
      }
    }

    setActiveId(null)
  }

  const activeItem = activeId ? localItems.find(item => item.id === activeId) : null

  const renderMedia = (item: MediaItem) =>
    item.type === 'video' ? (
      <video
        controls
        className="w-full h-full object-cover"
        poster={item.thumbnail}
        src={item.url}
      />
    ) : (
      <img alt={item.title || ''} className="w-full h-full object-cover" src={item.url} />
    )

  const renderControls = (item: MediaItem) => (
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
      <Button
        className="h-8 w-8"
        size="icon"
        variant="secondary"
        onClick={e => {
          e.stopPropagation()
          onDownload?.(item.id)
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        className="h-8 w-8"
        size="icon"
        variant="secondary"
        onClick={e => {
          e.stopPropagation()
          onDelete?.(item.id)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  const renderGrid = () => {
    if (!onReorder) {
      // Non-sortable grid
      return (
        <div className={cn('grid gap-4', `grid-cols-${columns}`)}>
          {localItems.map(item => (
            <Dialog key={item.id}>
              <DialogTrigger asChild>
                <div
                  className={cn(
                    'group relative cursor-pointer overflow-hidden rounded-lg border',
                    'hover:border-primary/50 transition-colors',
                  )}
                  style={{ aspectRatio }}
                >
                  {renderMedia(item)}
                  {showControls && renderControls(item)}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <div className="relative" style={{ aspectRatio }}>
                  {renderMedia(item)}
                </div>
                {(item.title || item.description) && (
                  <div className="mt-4 space-y-2">
                    {item.title && <h3 className="text-lg font-semibold">{item.title}</h3>}
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )
    }

    // Sortable grid
    return (
      <DndContext
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <SortableContext items={localItems.map(item => item.id)} strategy={rectSortingStrategy}>
          <div className={cn('grid gap-4', `grid-cols-${columns}`)}>
            {localItems.map(item => (
              <Dialog key={item.id}>
                <DialogTrigger asChild>
                  <SortableMediaItem
                    item={item}
                    renderMedia={renderMedia}
                    renderControls={renderControls}
                    showControls={showControls}
                    aspectRatio={aspectRatio}
                    onDelete={onDelete}
                    onDownload={onDownload}
                  />
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="relative" style={{ aspectRatio }}>
                    {renderMedia(item)}
                  </div>
                  {(item.title || item.description) && (
                    <div className="mt-4 space-y-2">
                      {item.title && <h3 className="text-lg font-semibold">{item.title}</h3>}
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeItem && (
            <div
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-lg border',
                'hover:border-primary/50 transition-colors',
              )}
              style={{ aspectRatio, width: '200px' }}
            >
              {renderMedia(activeItem)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    )
  }

  const renderCarousel = () => (
    <Carousel className="w-full">
      <CarouselContent>
        {localItems.map(item => (
          <CarouselItem key={item.id}>
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio }}>
                  {renderMedia(item)}
                  {showControls && renderControls(item)}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <div className="relative" style={{ aspectRatio }}>
                  {renderMedia(item)}
                </div>
                {(item.title || item.description) && (
                  <div className="mt-4 space-y-2">
                    {item.title && <h3 className="text-lg font-semibold">{item.title}</h3>}
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {view === 'carousel' ? renderCarousel() : renderGrid()}
    </div>
  )
}
