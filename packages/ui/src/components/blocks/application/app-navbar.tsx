import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Laptop,
  Menu,
  X,
  ChevronDown,
  Command,
} from 'lucide-react'

export interface AppNavbarProps {
  logo?: React.ReactNode
  title?: string
  user?: {
    name: string
    email: string
    avatar?: string
  }
  notifications?: {
    count: number
    items?: Array<{
      id: string
      title: string
      description?: string
      timestamp: string
      read?: boolean
    }>
  }
  search?: {
    placeholder?: string
    onSearch?: (query: string) => void
    showCommandKey?: boolean
  }
  actions?: React.ReactNode
  navigation?: Array<{
    label: string
    href?: string
    onClick?: () => void
    active?: boolean
  }>
  userMenu?: {
    onProfile?: () => void
    onSettings?: () => void
    onHelp?: () => void
    onLogout?: () => void
    additionalItems?: Array<{
      label: string
      icon?: React.ReactNode
      onClick: () => void
      shortcut?: string
    }>
  }
  theme?: {
    current: 'light' | 'dark' | 'system'
    onChange?: (theme: 'light' | 'dark' | 'system') => void
  }
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
  className?: string
  sticky?: boolean
  chatButton?: React.ReactNode // Chat toggle button to render in actions area
}

export const AppNavbar = ({
  logo,
  title,
  user,
  notifications,
  search,
  actions,
  navigation,
  userMenu,
  theme,
  mobileMenuOpen = false,
  onMobileMenuToggle,
  className,
  sticky = true,
  chatButton,
}: AppNavbarProps) => {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearchFocused, setIsSearchFocused] = React.useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    search?.onSearch?.(searchQuery)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const ThemeIcon = theme?.current === 'light' ? Sun : theme?.current === 'dark' ? Moon : Laptop

  return (
    <header
      className={cn(
        'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        sticky && 'sticky top-0 z-50',
        className,
      )}
    >
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile Menu Toggle & Logo */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />

          {logo ? (
            <div className="flex items-center">{logo}</div>
          ) : title ? (
            <h1 className="font-semibold text-lg">{title}</h1>
          ) : null}
        </div>

        {/* Desktop Navigation */}
        {navigation && navigation.length > 0 && (
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item, index) => (
              <Button
                key={index}
                asChild={!!item.href}
                size="sm"
                variant={item.active ? 'secondary' : 'ghost'}
                onClick={item.onClick}
              >
                {item.href ? <a href={item.href}>{item.label}</a> : item.label}
              </Button>
            ))}
          </nav>
        )}

        {/* Search */}
        {search && (
          <form className="hidden md:flex flex-1 max-w-md mx-auto" onSubmit={handleSearch}>
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 pr-12"
                placeholder={search.placeholder || 'Search...'}
                type="search"
                value={searchQuery}
                onBlur={() => setIsSearchFocused(false)}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {search.showCommandKey && (
                <kbd className="absolute right-2.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>
          </form>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Custom Actions */}
          {actions}

          {/* Chat Button */}
          {chatButton}

          {/* Theme Toggle */}
          {theme && theme.onChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8" size="icon" variant="ghost">
                  <ThemeIcon className="h-4 w-4" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => theme.onChange?.('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => theme.onChange?.('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => theme.onChange?.('system')}>
                  <Laptop className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          {notifications && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="relative h-8 w-8" size="icon" variant="ghost">
                  <Bell className="h-4 w-4" />
                  {notifications.count > 0 && (
                    <Badge
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                      variant="destructive"
                    >
                      {notifications.count > 9 ? '9+' : notifications.count}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.items && notifications.items.length > 0 ? (
                  <>
                    {notifications.items.slice(0, 5).map(item => (
                      <DropdownMenuItem key={item.id} className="flex flex-col items-start p-3">
                        <div className="flex w-full items-start justify-between">
                          <p className="text-sm font-medium">{item.title}</p>
                          {!item.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{item.timestamp}</p>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-center text-sm">
                      View all notifications
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="relative h-8 gap-2 px-2" variant="ghost">
                  <Avatar className="h-7 w-7">
                    <AvatarImage alt={user.name} src={user.avatar} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start text-xs">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {userMenu?.onProfile && (
                    <DropdownMenuItem onClick={userMenu.onProfile}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  )}
                  {userMenu?.onSettings && (
                    <DropdownMenuItem onClick={userMenu.onSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  )}
                  {userMenu?.additionalItems?.map((item, index) => (
                    <DropdownMenuItem key={index} onClick={item.onClick}>
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                      {item.shortcut && (
                        <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {userMenu?.onHelp && (
                  <DropdownMenuItem onClick={userMenu.onHelp}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                )}
                {userMenu?.onLogout && (
                  <DropdownMenuItem onClick={userMenu.onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Button */}
          {navigation && navigation.length > 0 && (
            <Button
              className="md:hidden h-8 w-8"
              size="icon"
              variant="ghost"
              onClick={onMobileMenuToggle}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {navigation && navigation.length > 0 && mobileMenuOpen && (
        <nav className="md:hidden border-t px-4 py-2">
          {navigation.map((item, index) => (
            <Button
              key={index}
              asChild={!!item.href}
              className="w-full justify-start"
              size="sm"
              variant={item.active ? 'secondary' : 'ghost'}
              onClick={() => {
                item.onClick?.()
                onMobileMenuToggle?.()
              }}
            >
              {item.href ? <a href={item.href}>{item.label}</a> : item.label}
            </Button>
          ))}
        </nav>
      )}
    </header>
  )
}
