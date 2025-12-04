import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface AppBreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface AppContentProps {
  children: React.ReactNode
  title?: string
  description?: string
  breadcrumbs?: AppBreadcrumbItem[]
  actions?: React.ReactNode
  // New props for enhanced header
  badges?: React.ReactNode
  metadata?: React.ReactNode
  statusIndicator?: React.ReactNode
  headerContent?: React.ReactNode
  className?: string
  contentClassName?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export const AppContent = ({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  badges,
  metadata,
  statusIndicator,
  headerContent,
  className,
  contentClassName,
  maxWidth = '2xl',
  padding = 'md',
}: AppContentProps) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }

  return (
    <div className={cn(className)}>
      {/* Page Header */}
      {(breadcrumbs ||
        title ||
        description ||
        actions ||
        badges ||
        metadata ||
        statusIndicator ||
        headerContent) && (
        <div className={cn('border-b bg-background', paddingClasses[padding])}>
          <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb className="mb-4">
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : item.href ? (
                          <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                        ) : (
                          <BreadcrumbLink className="cursor-pointer" onClick={item.onClick}>
                            {item.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}

            {/* Enhanced Title, Description & Actions */}
            {(title || description || actions || badges || metadata || statusIndicator) && (
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-2">
                  {/* Title row with status indicator */}
                  {(title || statusIndicator) && (
                    <div className="flex items-center gap-3">
                      {statusIndicator}
                      {title && (
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                      )}
                    </div>
                  )}

                  {/* Description and metadata */}
                  {(description || metadata) && (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      {description && <p className="text-muted-foreground">{description}</p>}
                      {description && metadata && (
                        <span className="hidden md:inline text-muted-foreground">•</span>
                      )}
                      {metadata && <div className="flex items-center gap-2">{metadata}</div>}
                    </div>
                  )}

                  {/* Badges */}
                  {badges && <div className="flex items-center gap-2 flex-wrap">{badges}</div>}
                </div>

                {/* Actions */}
                {actions && <div className="flex items-center gap-2 md:self-start">{actions}</div>}
              </div>
            )}

            {/* Additional header content */}
            {headerContent && <div className="mt-4">{headerContent}</div>}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(paddingClasses[padding], contentClassName)}>
        <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>{children}</div>
      </div>
    </div>
  )
}

// Convenience component for page headers
export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: AppBreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export const PageHeader = ({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : item.href ? (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbLink className="cursor-pointer" onClick={item.onClick}>
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
