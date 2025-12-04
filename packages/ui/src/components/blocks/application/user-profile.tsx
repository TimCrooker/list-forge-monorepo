import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Edit,
  MoreVertical,
  Shield,
  CheckCircle,
  Clock,
  Link as LinkIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface UserProfileProps {
  user: {
    name: string
    email: string
    avatar?: string
    role?: string
    department?: string
    location?: string
    phone?: string
    website?: string
    bio?: string
    joinDate?: string
    status?: 'active' | 'inactive' | 'pending'
    verified?: boolean
  }
  showActions?: boolean
  onEdit?: () => void
  onMessage?: () => void
  onViewActivity?: () => void
  className?: string
}

export interface ProfileFieldProps {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
  className?: string
}

export interface ProfileStatsProps {
  stats: {
    label: string
    value: string | number
  }[]
  className?: string
}

export const UserProfile = ({
  user,
  showActions = true,
  onEdit,
  onMessage,
  onViewActivity,
  className,
}: UserProfileProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    pending: 'bg-yellow-500',
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10" />

      <CardHeader className="relative pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-background -mt-10">
              <AvatarImage alt={user.name} src={user.avatar} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{user.name}</CardTitle>
                {user.verified && <CheckCircle className="h-4 w-4 text-primary" />}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {user.role && <span>{user.role}</span>}
                {user.department && (
                  <>
                    <span>•</span>
                    <span>{user.department}</span>
                  </>
                )}
              </div>

              {user.status && (
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', statusColors[user.status])} />
                  <span className="text-xs capitalize">{user.status}</span>
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </DropdownMenuItem>
                )}
                {onMessage && (
                  <DropdownMenuItem onClick={onMessage}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </DropdownMenuItem>
                )}
                {onViewActivity && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onViewActivity}>
                      <Clock className="mr-2 h-4 w-4" />
                      View Activity
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}

        <div className="space-y-3">
          {user.email && (
            <ProfileField
              href={`mailto:${user.email}`}
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={user.email}
            />
          )}

          {user.phone && (
            <ProfileField
              href={`tel:${user.phone}`}
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={user.phone}
            />
          )}

          {user.location && (
            <ProfileField
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={user.location}
            />
          )}

          {user.website && (
            <ProfileField
              href={user.website}
              icon={<Globe className="h-4 w-4" />}
              label="Website"
              value={user.website}
            />
          )}

          {user.joinDate && (
            <ProfileField
              icon={<Calendar className="h-4 w-4" />}
              label="Joined"
              value={new Date(user.joinDate).toLocaleDateString()}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const ProfileField = ({ icon, label, value, href, className }: ProfileFieldProps) => {
  const content = (
    <div className={cn('flex items-center gap-3 text-sm', className)}>
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <span className="text-muted-foreground">{label}:</span>{' '}
        <span className={href ? 'text-primary hover:underline' : ''}>{value}</span>
      </div>
      {href && <LinkIcon className="h-3 w-3 text-muted-foreground" />}
    </div>
  )

  if (href) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {content}
      </a>
    )
  }

  return content
}

export const ProfileStats = ({ stats, className }: ProfileStatsProps) => {
  return (
    <div className={cn('grid grid-cols-3 gap-4 text-center', className)}>
      {stats.map((stat, index) => (
        <div key={index} className="space-y-1">
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export interface UserListItemProps {
  user: {
    name: string
    email: string
    avatar?: string
    role?: string
    status?: 'online' | 'offline' | 'away' | 'busy'
  }
  onSelect?: () => void
  selected?: boolean
  showStatus?: boolean
  className?: string
}

export const UserListItem = ({
  user,
  onSelect,
  selected = false,
  showStatus = true,
  className,
}: UserListItemProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        selected ? 'bg-muted' : 'hover:bg-muted/50',
        className,
      )}
      onClick={onSelect}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage alt={user.name} src={user.avatar} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        {showStatus && user.status && (
          <div
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
              statusColors[user.status],
            )}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.role || user.email}</p>
      </div>
    </div>
  )
}

export interface TeamMembersProps {
  members: UserListItemProps['user'][]
  title?: string
  description?: string
  onSelectMember?: (index: number) => void
  showViewAll?: boolean
  onViewAll?: () => void
  className?: string
}

export const TeamMembers = ({
  members,
  title = 'Team Members',
  description,
  onSelectMember,
  showViewAll = true,
  onViewAll,
  className,
}: TeamMembersProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge variant="secondary">{members.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((member, index) => (
          <UserListItem key={index} user={member} onSelect={() => onSelectMember?.(index)} />
        ))}
      </CardContent>
      {showViewAll && onViewAll && (
        <CardFooter>
          <Button className="w-full" variant="outline" onClick={onViewAll}>
            View All Members
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
