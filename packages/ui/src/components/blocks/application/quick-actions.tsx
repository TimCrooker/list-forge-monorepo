import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Upload,
  Download,
  Send,
  FileText,
  Users,
  Settings,
  Calendar,
  Mail,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Share2,
  Copy,
  Trash2,
  Edit,
  Save,
  X,
  Check,
} from 'lucide-react'

export interface QuickAction {
  id: string
  label: string
  icon?: React.ReactNode
  description?: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  disabled?: boolean
}

export interface QuickActionsProps {
  actions: QuickAction[]
  title?: string
  description?: string
  layout?: 'grid' | 'list' | 'compact'
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export interface ActionButtonProps {
  action: QuickAction
  size?: 'default' | 'sm' | 'lg'
  showDescription?: boolean
  className?: string
}

export interface FloatingActionButtonProps {
  onClick: () => void
  icon?: React.ReactNode
  label?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

export const QuickActions = ({
  actions,
  title = 'Quick Actions',
  description,
  layout = 'grid',
  columns = 2,
  className,
}: QuickActionsProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  if (layout === 'compact') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {actions.map(action => (
              <Button
                key={action.id}
                disabled={action.disabled}
                size="sm"
                variant={action.variant || 'outline'}
                onClick={action.onClick}
              >
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (layout === 'list') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.map(action => (
            <Button
              key={action.id}
              className="w-full justify-start"
              disabled={action.disabled}
              variant={action.variant || 'ghost'}
              onClick={action.onClick}
            >
              {action.icon}
              <div className="ml-3 text-left">
                <div className="font-medium">{action.label}</div>
                {action.description && (
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                )}
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={cn(`grid gap-4 ${gridCols[columns]}`)}>
          {actions.map(action => (
            <ActionButton key={action.id} showDescription action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const ActionButton = ({
  action,
  size = 'default',
  showDescription = false,
  className = '',
}: ActionButtonProps) => {
  return (
    <Button
      className={cn('flex flex-col items-center justify-center gap-2 h-auto p-4', className)}
      disabled={action.disabled}
      size={size}
      variant={action.variant || 'outline'}
      onClick={action.onClick}
    >
      {action.icon && <div className="text-lg">{action.icon}</div>}
      <div className="text-center">
        <div className="font-medium">{action.label}</div>
        {showDescription && action.description && (
          <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
        )}
      </div>
    </Button>
  )
}

export const FloatingActionButton = ({
  onClick,
  icon = <Plus className="h-5 w-5" />,
  label = '',
  position = 'bottom-right',
  className,
}: FloatingActionButtonProps) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  return (
    <Button
      className={cn(
        'fixed z-50 h-14 w-14 rounded-full shadow-lg',
        positionClasses[position],
        className,
      )}
      size="icon"
      onClick={onClick}
    >
      {icon}
      {label && <span className="sr-only">{label}</span>}
    </Button>
  )
}

export interface ActionGroupProps {
  title: string
  actions: QuickAction[]
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export const ActionGroup = ({
  title,
  actions,
  collapsible = true,
  defaultExpanded = true,
  className,
}: ActionGroupProps) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        {collapsible && (
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Hide' : 'Show'}
          </Button>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-2">
          {actions.map(action => (
            <Button
              key={action.id}
              className="justify-start"
              disabled={action.disabled}
              size="sm"
              variant={action.variant || 'outline'}
              onClick={action.onClick}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export interface CommandPaletteProps {
  actions: QuickAction[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  className?: string
}

export const CommandPalette = ({
  actions,
  open = false,
  onOpenChange = () => {},
  placeholder = 'Type a command or search...',
  className,
}: CommandPaletteProps) => {
  const [search, setSearch] = React.useState('')

  const filteredActions = React.useMemo(() => {
    if (!search) return actions
    return actions.filter(
      action =>
        action.label.toLowerCase().includes(search.toLowerCase()) ||
        action.description?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [actions, search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm">
      <Card className={cn('w-full max-w-lg', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder={placeholder}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Button size="sm" variant="ghost" onClick={() => onOpenChange?.(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No actions found</p>
          ) : (
            <div className="space-y-1">
              {filteredActions.map(action => (
                <Button
                  key={action.id}
                  className="w-full justify-start"
                  disabled={action.disabled}
                  variant="ghost"
                  onClick={() => {
                    action.onClick()
                    onOpenChange?.(false)
                  }}
                >
                  {action.icon}
                  <div className="ml-3 text-left">
                    <div className="font-medium">{action.label}</div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
