import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { type NodeTemplate } from '../types'
import { DraggableItem } from '../drag-drop/draggable-item'
import { Search } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export interface NodePaletteProps {
  templates: NodeTemplate[]
  className?: string
  onNodeDragStart?: (template: NodeTemplate) => void
  onNodeDragEnd?: () => void
}

export const NodePalette = ({
  templates,
  className,
  onNodeDragStart,
  onNodeDragEnd,
}: NodePaletteProps) => {
  const [searchQuery, setSearchQuery] = React.useState('')

  // Group templates by category
  const groupedTemplates = React.useMemo(() => {
    const filtered = templates.filter(
      template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return filtered.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    }, {} as Record<string, NodeTemplate[]>)
  }, [templates, searchQuery])

  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    console.debug('NodePalette: Starting drag with template:', template)

    // Set the drag data
    e.dataTransfer.effectAllowed = 'copy'
    const dragData = JSON.stringify({
      type: 'new-node',
      nodeType: template.type,
      template,
    })
    e.dataTransfer.setData('application/reactflow', dragData)

    console.debug('NodePalette: Drag data set:', dragData)

    onNodeDragStart?.(template)
  }

  return (
    <Card className={cn('w-64 h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Node Library</CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 h-9"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full overflow-auto px-3">
          {Object.keys(groupedTemplates).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No nodes found</div>
          ) : (
            <Accordion defaultValue={Object.keys(groupedTemplates)} type="multiple">
              {Object.entries(groupedTemplates).map(([category, items]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-sm">
                    {category}
                    <Badge className="ml-auto mr-2" variant="secondary">
                      {items.length}
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-2">
                    {items.map(template => (
                      <NodePaletteItem
                        key={`${template.type}-${template.title}`}
                        template={template}
                        onDragEnd={onNodeDragEnd}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface NodePaletteItemProps {
  template: NodeTemplate
  onDragStart: (e: React.DragEvent, template: NodeTemplate) => void
  onDragEnd?: () => void
}

const NodePaletteItem = ({ template, onDragStart, onDragEnd }: NodePaletteItemProps) => {
  const Icon = template.icon

  return (
    <div
      draggable
      className={cn(
        'flex items-start gap-2 p-2 rounded-md cursor-grab active:cursor-grabbing',
        'hover:bg-accent transition-colors border border-transparent hover:border-border',
      )}
      onDragEnd={onDragEnd}
      onDragStart={e => onDragStart(e, template)}
    >
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm leading-none">{template.title}</div>
        {template.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
        )}
      </div>
    </div>
  )
}
