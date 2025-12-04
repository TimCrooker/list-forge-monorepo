import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, Search, X, Filter, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterGroup {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'daterange' | 'range' | 'toggle' | 'search'
  options?: FilterOption[]
  min?: number
  max?: number
  step?: number
  defaultValue?: any
}

export interface SearchFiltersProps {
  filterGroups: FilterGroup[]
  onFilterChange: (filters: Record<string, any>) => void
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  variant?: 'inline' | 'sidebar' | 'popover'
  className?: string
}

export const SearchFilters = ({
  filterGroups,
  onFilterChange,
  onSearch,
  searchPlaceholder = 'Search...',
  showSearch = true,
  variant = 'inline',
  className,
}: SearchFiltersProps) => {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  const handleFilterChange = (groupId: string, value: any) => {
    const newFilters = { ...filters, [groupId]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setDateRange({ from: undefined, to: undefined })
    onFilterChange({})
    onSearch?.('')
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key] !== undefined && filters[key] !== '',
  ).length

  const renderFilterControl = (group: FilterGroup) => {
    switch (group.type) {
      case 'select':
        return (
          <Select
            value={filters[group.id] || ''}
            onValueChange={value => handleFilterChange(group.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${group.label}`} />
            </SelectTrigger>
            <SelectContent>
              {group.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2">({option.count})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const selectedValues = (filters[group.id] as string[]) || []
        return (
          <div className="space-y-2">
            {group.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedValues.includes(option.value)}
                  id={`${group.id}-${option.value}`}
                  onCheckedChange={checked => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value)
                    handleFilterChange(group.id, newValues)
                  }}
                />
                <Label
                  className="text-sm font-normal cursor-pointer flex-1"
                  htmlFor={`${group.id}-${option.value}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">({option.count})</span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        )

      case 'daterange':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  'justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground',
                )}
                variant="outline"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                initialFocus
                mode="range"
                numberOfMonths={2}
                selected={dateRange}
                onSelect={(range: any) => {
                  setDateRange(range || { from: undefined, to: undefined })
                  handleFilterChange(group.id, range)
                }}
              />
            </PopoverContent>
          </Popover>
        )

      case 'range':
        const rangeValue = filters[group.id] || [group.min || 0, group.max || 100]
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{rangeValue[0]}</span>
              <span>{rangeValue[1]}</span>
            </div>
            <Slider
              className="w-full"
              max={group.max || 100}
              min={group.min || 0}
              step={group.step || 1}
              value={rangeValue}
              onValueChange={value => handleFilterChange(group.id, value)}
            />
          </div>
        )

      case 'toggle':
        return (
          <Switch
            checked={filters[group.id] || false}
            onCheckedChange={checked => handleFilterChange(group.id, checked)}
          />
        )

      case 'search':
        return (
          <Input
            placeholder={`Search ${group.label}...`}
            value={filters[group.id] || ''}
            onChange={e => handleFilterChange(group.id, e.target.value)}
          />
        )

      default:
        return null
    }
  }

  if (variant === 'sidebar') {
    return (
      <Card className={cn('w-64', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          {activeFiltersCount > 0 && (
            <Button className="ml-auto" size="sm" variant="ghost" onClick={clearFilters}>
              Clear all ({activeFiltersCount})
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showSearch && (
            <form className="space-y-2" onSubmit={handleSearch}>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          )}
          <Accordion className="w-full" type="multiple">
            {filterGroups.map(group => (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="text-sm">
                  {group.label}
                  {filters[group.id] && (
                    <Badge className="ml-2" variant="secondary">
                      {Array.isArray(filters[group.id]) ? filters[group.id].length : 1}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>{renderFilterControl(group)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'popover') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showSearch && (
          <form className="flex-1 max-w-sm" onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button className="gap-2" variant="outline">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>
              {filterGroups.map(group => (
                <div key={group.id} className="space-y-2">
                  <Label>{group.label}</Label>
                  {renderFilterControl(group)}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // Default inline variant
  return (
    <div className={cn('space-y-4', className)}>
      {showSearch && (
        <form className="flex gap-2" onSubmit={handleSearch}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      )}
      <div className="flex flex-wrap gap-2">
        {filterGroups.map(group => (
          <div key={group.id} className="min-w-[200px]">
            {renderFilterControl(group)}
          </div>
        ))}
        {activeFiltersCount > 0 && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null
            const group = filterGroups.find(g => g.id === key)
            return (
              <Badge key={key} className="gap-1" variant="secondary">
                {group?.label}: {Array.isArray(value) ? value.length : value.toString()}
                <button
                  className="ml-1 hover:text-destructive"
                  onClick={() => handleFilterChange(key, undefined)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
