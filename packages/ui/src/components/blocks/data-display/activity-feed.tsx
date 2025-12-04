import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistance } from 'date-fns'
import { MessageSquare, Heart, Share2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface ActivityItem {
  id: string
  user: {
    name: string
    avatar?: string
    role?: string
  }
  action: string
  target?: string
  timestamp: Date | string
  content?: string
  attachments?: Array<{
    type: 'image' | 'file' | 'link'
    url: string
    name: string
    size?: string
  }>
  reactions?: {
    likes: number
    comments: number
    shares: number
  }
  liked?: boolean
}

export interface ActivityFeedProps {
  activities: ActivityItem[]
  className?: string
  onLike?: (id: string) => void
  onComment?: (id: string) => void
  onShare?: (id: string) => void
  showActions?: boolean
}

export const ActivityFeed = ({
  activities,
  className,
  onLike,
  onComment,
  onShare,
  showActions = true,
}: ActivityFeedProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {activities.map(activity => {
        const timestamp =
          typeof activity.timestamp === 'string' ? new Date(activity.timestamp) : activity.timestamp

        return (
          <Card key={activity.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage alt={activity.user.name} src={activity.user.avatar} />
                    <AvatarFallback>
                      {activity.user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{activity.user.name}</span>
                      {activity.user.role && (
                        <Badge className="text-xs" variant="secondary">
                          {activity.user.role}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                      {activity.target && (
                        <span className="font-medium text-foreground"> {activity.target}</span>
                      )}
                    </p>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={timestamp.toISOString()}
                    >
                      {formatDistance(timestamp, new Date(), { addSuffix: true })}
                    </time>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 w-8" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View details</DropdownMenuItem>
                    <DropdownMenuItem>Copy link</DropdownMenuItem>
                    <DropdownMenuItem>Report</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            {(activity.content || activity.attachments) && (
              <CardContent className="pt-0">
                {activity.content && (
                  <p className="text-sm text-muted-foreground mb-3">{activity.content}</p>
                )}
                {activity.attachments && (
                  <div className="space-y-2">
                    {activity.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md border bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{attachment.name}</p>
                          {attachment.size && (
                            <p className="text-xs text-muted-foreground">{attachment.size}</p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
            {showActions && activity.reactions && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 border-t pt-3">
                  <Button
                    className={cn('gap-2', activity.liked && 'text-red-600')}
                    size="sm"
                    variant="ghost"
                    onClick={() => onLike?.(activity.id)}
                  >
                    <Heart className={cn('h-4 w-4', activity.liked && 'fill-current')} />
                    {activity.reactions.likes}
                  </Button>
                  <Button
                    className="gap-2"
                    size="sm"
                    variant="ghost"
                    onClick={() => onComment?.(activity.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {activity.reactions.comments}
                  </Button>
                  <Button
                    className="gap-2"
                    size="sm"
                    variant="ghost"
                    onClick={() => onShare?.(activity.id)}
                  >
                    <Share2 className="h-4 w-4" />
                    {activity.reactions.shares}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
