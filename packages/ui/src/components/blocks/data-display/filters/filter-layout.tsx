import { Button } from '../../../ui/button'
import type { ReactNode } from 'react'

export interface FilterLayoutProps {
  children: ReactNode
  hasActiveFilters?: boolean
  onClear?: () => void
  className?: string
}

export function FilterLayout({
  children,
  hasActiveFilters = false,
  onClear,
  className = '',
}: FilterLayoutProps) {
  return (
    <div className={`flex flex-row gap-3 ${className}`}>
      {children}
      {hasActiveFilters && onClear && (
        <div>
          <Button variant="outline" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
