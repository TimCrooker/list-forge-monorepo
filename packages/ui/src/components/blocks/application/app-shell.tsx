import * as React from 'react'
import { cn } from '@/lib/utils'
import { SidebarProvider } from '@/components/ui/sidebar'

export interface AppShellProps {
  children: React.ReactNode
  navbar?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  sidebarCollapsible?: boolean
  sidebarDefaultOpen?: boolean
  contentClassName?: string
}

export const AppShell = ({
  children,
  navbar,
  sidebar,
  footer,
  className,
  sidebarCollapsible = true,
  sidebarDefaultOpen = true,
  contentClassName,
}: AppShellProps) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(sidebarDefaultOpen)

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <div className={cn('flex h-screen overflow-hidden bg-background w-full', className)}>
        {/* Sidebar */}
        {sidebar && <div className="hidden md:flex">{sidebar}</div>}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          {navbar}

          {/* Page Content */}
          <main className={cn('flex-1 overflow-y-auto', contentClassName)}>{children}</main>

          {/* Footer */}
          {footer}
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebar && (
          <div className="md:hidden">
            {/* This will be handled by the Sidebar component's mobile behavior */}
          </div>
        )}
      </div>
    </SidebarProvider>
  )
}
