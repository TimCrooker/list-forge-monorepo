import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronLeft, type LucideIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export interface NavItem {
  id: string
  label: string
  href?: string
  onClick?: () => void
  icon?: LucideIcon | React.ReactNode
  badge?: string | number
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  badgeSize?: 'default' | 'small' // Control badge size (defaults to 'default' for parent items, 'small' for child items)
  active?: boolean
  disabled?: boolean
  children?: NavItem[]
  noWrap?: boolean // Control text wrapping for this item's label
  defaultOpen?: boolean // Control whether collapsible items with children are open by default
}

export interface NavGroup {
  id: string
  label?: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

export interface AppSidebarProps {
  logo?: React.ReactNode
  collapsedLogo?: React.ReactNode // Logo to show when collapsed (icon logo)
  navigation: NavGroup[]
  footer?: React.ReactNode
  onNavigate?: (item: NavItem) => void
  className?: string
  collapsible?: boolean
  variant?: 'default' | 'floating' | 'inset'
  childItemsNoWrap?: boolean // Default no-wrap behavior for child items (defaults to true)
  childItemsBadgeSize?: 'default' | 'small' // Default badge size for child items (defaults to 'small')
}

export const AppSidebar = ({
  logo,
  collapsedLogo,
  navigation,
  footer,
  onNavigate,
  className,
  collapsible = true,
  variant = 'default',
  childItemsNoWrap = true,
  childItemsBadgeSize = 'small',
}: AppSidebarProps) => {
  const sidebarVariants = {
    default: '',
    floating: 'm-2 rounded-lg shadow-lg',
    inset: 'm-2',
  }

  return (
    <Sidebar
      className={cn(sidebarVariants[variant], className)}
      collapsible={collapsible ? 'icon' : 'none'}
    >
      {(logo || collapsedLogo) && (
        <SidebarHeader className="group-hover/sidebar-wrapper:relative">
          <div className="flex items-center px-2 py-1.5">
            <SidebarLogo logo={logo} collapsedLogo={collapsedLogo} />
          </div>
          {/* Collapse toggle button - appears on hover when expanded */}
          {collapsible && (
            <div className="absolute right-2 top-2 opacity-0 group-hover/sidebar-wrapper:opacity-100 transition-opacity">
              <SidebarTrigger className="h-7 w-7" />
            </div>
          )}
        </SidebarHeader>
      )}

      <SidebarContent>
        <ScrollArea className="flex-1">
          {navigation.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && <SidebarSeparator />}
              <SidebarGroup>
                {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(item => (
                      <NavMenuItem
                        key={item.id}
                        item={item}
                        onNavigate={onNavigate}
                        childItemsNoWrap={childItemsNoWrap}
                        childItemsBadgeSize={childItemsBadgeSize}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </React.Fragment>
          ))}
        </ScrollArea>
      </SidebarContent>

      {footer && <SidebarFooter>{footer}</SidebarFooter>}
    </Sidebar>
  )
}

// Component to handle logo switching based on collapsed state
function SidebarLogo({
  logo,
  collapsedLogo,
}: {
  logo?: React.ReactNode
  collapsedLogo?: React.ReactNode
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  if (isCollapsed && collapsedLogo) {
    return <>{collapsedLogo}</>
  }

  return <>{logo}</>
}

function renderNavIcon(icon: LucideIcon | React.ReactNode | undefined) {
  if (!icon) return null

  if (React.isValidElement(icon)) {
    return icon
  }

  const Icon = icon as LucideIcon
  return <Icon className="h-4 w-4" />
}

const NavMenuItem = ({
  item,
  onNavigate,
  childItemsNoWrap = true,
  childItemsBadgeSize = 'small',
}: {
  item: NavItem
  onNavigate?: (item: NavItem) => void
  childItemsNoWrap?: boolean
  childItemsBadgeSize?: 'default' | 'small'
}) => {
  const [isOpen, setIsOpen] = React.useState(item.defaultOpen ?? false)
  const hasChildren = item.children && item.children.length > 0

  const handleClick = () => {
    if (!hasChildren && !item.disabled) {
      onNavigate?.(item)
      item.onClick?.()
    }
  }

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'w-full',
                item.active && 'bg-accent text-accent-foreground',
                item.disabled && 'opacity-50 cursor-not-allowed',
              )}
              disabled={item.disabled}
            >
              {renderNavIcon(item.icon)}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge className="ml-auto" variant={item.badgeVariant || 'secondary'}>
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children?.map(child => (
                <SidebarMenuSubItem key={child.id}>
                  {child.href ? (
                    <SidebarMenuSubButton
                      asChild
                      className={cn(
                        child.active && 'bg-accent text-accent-foreground',
                        child.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                      )}
                    >
                      <a
                        aria-disabled={child.disabled}
                        href={child.href}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault() // Prevent default anchor navigation for SPA routing
                          if (child.disabled) {
                            return
                          }
                          onNavigate?.(child)
                          child.onClick?.()
                        }}
                      >
                        {renderNavIcon(child.icon)}
                        <span
                          className={cn(
                            child.noWrap !== undefined
                              ? child.noWrap
                                ? 'whitespace-nowrap'
                                : ''
                              : childItemsNoWrap
                              ? 'whitespace-nowrap'
                              : '',
                          )}
                        >
                          {child.label}
                        </span>
                        {child.badge && (
                          <Badge
                            className={cn(
                              'ml-auto',
                              (child.badgeSize || childItemsBadgeSize) === 'small'
                                ? 'text-xs px-1.5 py-0 h-5'
                                : '',
                            )}
                            variant={child.badgeVariant || 'secondary'}
                          >
                            {child.badge}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuSubButton>
                  ) : (
                    <SidebarMenuSubButton
                      className={cn(
                        child.active && 'bg-accent text-accent-foreground',
                        child.disabled && 'opacity-50 cursor-not-allowed',
                      )}
                      disabled={child.disabled}
                      onClick={() => {
                        if (!child.disabled) {
                          onNavigate?.(child)
                          child.onClick?.()
                        }
                      }}
                    >
                      {renderNavIcon(child.icon)}
                      <span
                        className={cn(
                          child.noWrap !== undefined
                            ? child.noWrap
                              ? 'whitespace-nowrap'
                              : ''
                            : childItemsNoWrap
                            ? 'whitespace-nowrap'
                            : '',
                        )}
                      >
                        {child.label}
                      </span>
                      {child.badge && (
                        <Badge
                          className={cn(
                            'ml-auto',
                            (child.badgeSize || childItemsBadgeSize) === 'small'
                              ? 'text-xs px-1.5 py-0 h-5'
                              : '',
                          )}
                          variant={child.badgeVariant || 'secondary'}
                        >
                          {child.badge}
                        </Badge>
                      )}
                    </SidebarMenuSubButton>
                  )}
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      {item.href ? (
        <SidebarMenuButton
          asChild
          className={cn(
            item.active && 'bg-accent text-accent-foreground',
            item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          )}
        >
          <a
            aria-disabled={item.disabled}
            href={item.href}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault() // Prevent default anchor navigation for SPA routing
              if (item.disabled) {
                return
              }
              handleClick()
            }}
          >
            {renderNavIcon(item.icon)}
            <span>{item.label}</span>
            {item.badge && (
              <Badge className="ml-auto" variant={item.badgeVariant || 'secondary'}>
                {item.badge}
              </Badge>
            )}
          </a>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          className={cn(
            item.active && 'bg-accent text-accent-foreground',
            item.disabled && 'opacity-50 cursor-not-allowed',
          )}
          disabled={item.disabled}
          onClick={handleClick}
        >
          {renderNavIcon(item.icon)}
          <span>{item.label}</span>
          {item.badge && (
            <Badge className="ml-auto" variant={item.badgeVariant || 'secondary'}>
              {item.badge}
            </Badge>
          )}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}
