import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  X,
  Trash2,
  Archive,
  MoreHorizontal,
  User,
  MessageSquare,
  Heart,
  Share2,
  Calendar,
  DollarSign,
  Package,
  Settings,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'comment' | 'like' | 'follow'
  title: string
  description?: string
  timestamp: string
  read?: boolean
  avatar?: string
  avatarFallback?: string
  actionUrl?: string
  actionLabel?: string
}

export interface NotificationsPanelProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
  onAction?: (notification: Notification) => void
  showTabs?: boolean
  showFilters?: boolean
  emptyMessage?: string
  className?: string
}

export interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onAction?: () => void
  selected?: boolean
  onSelect?: () => void
  showCheckbox?: boolean
  className?: string
}

const notificationIcons = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCheck className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
  mention: <MessageSquare className="h-4 w-4 text-primary" />,
  comment: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
  like: <Heart className="h-4 w-4 text-red-500" />,
  follow: <User className="h-4 w-4 text-primary" />,
}

export const NotificationsPanel = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onArchive,
  onAction,
  showTabs = true,
  showFilters = false,
  emptyMessage = 'No notifications',
  className,
}: NotificationsPanelProps) => {
  const [selectedTab, setSelectedTab] = React.useState('all')
  const [selectedNotifications, setSelectedNotifications] = React.useState<string[]>([])

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = React.useMemo(() => {
    switch (selectedTab) {
      case 'unread':
        return notifications.filter(n => !n.read)
      case 'mentions':
        return notifications.filter(n => n.type === 'mention')
      default:
        return notifications
    }
  }, [notifications, selectedTab])

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id],
    )
  }

  const selectAllNotifications = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id))
    }
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <CardDescription>
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showFilters && selectedNotifications.length > 0 && (
              <Badge variant="secondary">{selectedNotifications.length} selected</Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onMarkAllAsRead && unreadCount > 0 && (
                  <DropdownMenuItem onClick={onMarkAllAsRead}>
                    <Check className="mr-2 h-4 w-4" />
                    Mark all as read
                  </DropdownMenuItem>
                )}
                {showFilters && (
                  <>
                    <DropdownMenuItem onClick={selectAllNotifications}>
                      <CheckCheck className="mr-2 h-4 w-4" />
                      {selectedNotifications.length === filteredNotifications.length
                        ? 'Deselect all'
                        : 'Select all'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Notification settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {showTabs && (
        <div className="px-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-1.5 h-5 px-1" variant="secondary">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  selected={selectedNotifications.includes(notification.id)}
                  showCheckbox={showFilters}
                  onAction={() => onAction?.(notification)}
                  onArchive={() => onArchive?.(notification.id)}
                  onDelete={() => onDelete?.(notification.id)}
                  onMarkAsRead={() => onMarkAsRead?.(notification.id)}
                  onSelect={() => toggleSelectNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {selectedNotifications.length > 0 && (
        <CardFooter className="border-t">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedNotifications.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selectedNotifications.forEach(id => onMarkAsRead?.(id))
                  setSelectedNotifications([])
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark as read
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selectedNotifications.forEach(id => onDelete?.(id))
                  setSelectedNotifications([])
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onArchive,
  onAction,
  selected = false,
  onSelect,
  showCheckbox = false,
  className,
}: NotificationItemProps) => {
  const timeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 transition-colors hover:bg-muted/50',
        !notification.read && 'bg-muted/30',
        selected && 'bg-muted',
        className,
      )}
    >
      {showCheckbox && <Checkbox checked={selected} className="mt-1" onCheckedChange={onSelect} />}

      <div className="flex-shrink-0">
        {notification.avatar ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={notification.avatar} />
            <AvatarFallback>{notification.avatarFallback}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            {notificationIcons[notification.type]}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className={cn('text-sm', !notification.read && 'font-medium')}>
              {notification.title}
            </p>
            {notification.description && (
              <p className="text-xs text-muted-foreground">{notification.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{timeAgo(notification.timestamp)}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8" size="icon" variant="ghost">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.read && onMarkAsRead && (
                <DropdownMenuItem onClick={onMarkAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as read
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {notification.actionUrl && onAction && (
          <Button className="h-auto p-0 text-xs" size="sm" variant="link" onClick={onAction}>
            {notification.actionLabel || 'View'}
          </Button>
        )}
      </div>
    </div>
  )
}

export interface NotificationBellProps {
  count?: number
  onClick?: () => void
  className?: string
}

export const NotificationBell = ({ count = 0, onClick, className }: NotificationBellProps) => {
  return (
    <Button className={cn('relative', className)} size="icon" variant="ghost" onClick={onClick}>
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <Badge
          className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
          variant="destructive"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  )
}
