import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface KanbanCard {
  id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
  assignees?: Array<{
    name: string
    avatar?: string
  }>
  dueDate?: Date | string
  attachments?: number
  comments?: number
  coverImage?: string
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
  color?: string
  limit?: number
}

export interface KanbanBoardProps {
  columns: KanbanColumn[]
  className?: string
  onCardClick?: (card: KanbanCard, columnId: string) => void
  onAddCard?: (columnId: string) => void
  onMoveCard?: (cardId: string, fromColumn: string, toColumn: string) => void
  showColumnActions?: boolean
  draggable?: boolean
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export const KanbanBoard = ({
  columns,
  className,
  onCardClick,
  onAddCard,
  onMoveCard,
  showColumnActions = true,
  draggable = true,
}: KanbanBoardProps) => {
  const [draggedCard, setDraggedCard] = React.useState<{
    card: KanbanCard
    columnId: string
  } | null>(null)

  const handleDragStart = (e: React.DragEvent, card: KanbanCard, columnId: string) => {
    if (!draggable) return
    setDraggedCard({ card, columnId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    if (!draggedCard || !onMoveCard) return

    if (draggedCard.columnId !== targetColumnId) {
      onMoveCard(draggedCard.card.id, draggedCard.columnId, targetColumnId)
    }
    setDraggedCard(null)
  }

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {columns.map(column => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={e => handleDrop(e, column.id)}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{column.title}</h3>
              <Badge className="text-xs" variant="secondary">
                {column.cards.length}
                {column.limit && ` / ${column.limit}`}
              </Badge>
            </div>
            {showColumnActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-6 w-6" size="icon" variant="ghost">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Rename column</DropdownMenuItem>
                  <DropdownMenuItem>Set limit</DropdownMenuItem>
                  <DropdownMenuItem>Clear cards</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete column</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3 pr-4">
              {column.cards.map(card => (
                <Card
                  key={card.id}
                  className={cn(
                    'cursor-pointer transition-shadow hover:shadow-md',
                    draggable && 'cursor-move',
                  )}
                  draggable={draggable}
                  onClick={() => onCardClick?.(card, column.id)}
                  onDragEnd={handleDragEnd}
                  onDragStart={e => handleDragStart(e, card, column.id)}
                >
                  {card.coverImage && (
                    <div className="h-32 w-full overflow-hidden rounded-t-lg">
                      <img
                        alt={card.title}
                        className="h-full w-full object-cover"
                        src={card.coverImage}
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {card.title}
                      </CardTitle>
                      {card.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {card.description}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {card.tags.map(tag => (
                            <Badge key={tag} className="text-xs" variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {card.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {card.comments !== undefined && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{card.comments}</span>
                            </div>
                          )}
                          {card.attachments !== undefined && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              <span>{card.attachments}</span>
                            </div>
                          )}
                        </div>

                        {card.assignees && card.assignees.length > 0 && (
                          <div className="flex -space-x-2">
                            {card.assignees.slice(0, 3).map((assignee, index) => (
                              <Avatar key={index} className="h-6 w-6 border-2 border-background">
                                <AvatarImage alt={assignee.name} src={assignee.avatar} />
                                <AvatarFallback className="text-xs">
                                  {assignee.name
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {card.assignees.length > 3 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                                +{card.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {card.priority && (
                        <Badge className={cn('text-xs', priorityColors[card.priority])}>
                          {card.priority}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {onAddCard && (
                <Button
                  className="w-full justify-start gap-2 text-muted-foreground"
                  variant="outline"
                  onClick={() => onAddCard(column.id)}
                >
                  <Plus className="h-4 w-4" />
                  Add card
                </Button>
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
