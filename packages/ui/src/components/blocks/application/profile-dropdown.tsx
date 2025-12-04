import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, type LucideIcon } from 'lucide-react'

export interface ProfileDropdownUser {
  name: string
  email: string
  avatar?: string
  roles?: Array<{
    entityId: string
    entityName: string
  }>
  personas?: Array<{
    entityId: string
    entityName: string
  }>
}

export interface ProfileDropdownMenuItem {
  id: string
  label: string
  icon?: LucideIcon | React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
  separator?: boolean // Show separator above this item
}

export interface ProfileDropdownProps {
  user: ProfileDropdownUser
  menuItems?: ProfileDropdownMenuItem[]
  showRoleBadges?: boolean
  showPersonaBadges?: boolean
  compact?: boolean // Compact mode for sidebar
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export const ProfileDropdown = ({
  user,
  menuItems = [],
  showRoleBadges = false,
  showPersonaBadges = false,
  compact = false,
  side = 'top',
  align = 'end',
  className,
}: ProfileDropdownProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const renderIcon = (icon: LucideIcon | React.ReactNode | undefined) => {
    if (!icon) return null
    if (React.isValidElement(icon)) {
      return icon
    }
    const Icon = icon as LucideIcon
    return <Icon className="h-4 w-4" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn('gap-2 px-2', compact && 'w-full justify-start', className)}
          variant="ghost"
        >
          <Avatar className={cn('h-8 w-8', compact && 'h-9 w-9')}>
            <AvatarImage alt={user.name} src={user.avatar} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          {!compact && (
            <>
              <div className="hidden text-left lg:block flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64" side={side}>
        {/* User Info Header */}
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage alt={user.name} src={user.avatar} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Role Badges */}
          {showRoleBadges && user.roles && user.roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roles.map(role => (
                <Badge key={role.entityId} className="text-xs" variant="secondary">
                  {role.entityName}
                </Badge>
              ))}
            </div>
          )}

          {/* Persona Badges */}
          {showPersonaBadges && user.personas && user.personas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.personas.map(persona => (
                <Badge key={persona.entityId} className="text-xs" variant="outline">
                  {persona.entityName}
                </Badge>
              ))}
            </div>
          )}
        </DropdownMenuLabel>

        {/* Menu Items */}
        {menuItems.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {item.separator && index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={cn(
                    item.variant === 'destructive' && 'text-destructive focus:text-destructive',
                  )}
                  onClick={item.onClick}
                >
                  {renderIcon(item.icon)}
                  <span className={cn(item.icon && 'ml-2')}>{item.label}</span>
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
