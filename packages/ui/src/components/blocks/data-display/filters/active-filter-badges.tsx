import { Badge } from '../../../ui/badge'
import { X } from 'lucide-react'

export interface FilterBadge {
  id: string
  label: string
  value: string
}

export interface ActiveFilterBadgesProps {
  filters: FilterBadge[]
  onRemove: (id: string) => void
  className?: string
}

export function ActiveFilterBadges({ filters, onRemove, className = '' }: ActiveFilterBadgesProps) {
  if (filters.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map(filter => (
        <Badge key={filter.id} variant="secondary" className="gap-1">
          {filter.label}: {filter.value}
          <button
            onClick={() => onRemove(filter.id)}
            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
