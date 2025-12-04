import * as React from 'react'
import { type Column } from '@tanstack/react-table'
import { ChevronsUpDown, ChevronUp, ChevronDown, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export const DataTableColumnHeader = <TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) => {
  if (!column.getCanSort() && !column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>
  }

  const sorted = column.getIsSorted()
  const filtered = column.getFilterValue() !== undefined

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="-ml-3 h-8 data-[state=open]:bg-accent" size="sm" variant="ghost">
            <span>{title}</span>
            {sorted === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : sorted === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ChevronUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ChevronDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Desc
              </DropdownMenuItem>
              {sorted && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => column.clearSorting()}>
                    <X className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                    Clear sort
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
          {column.getCanFilter() && (
            <>
              {column.getCanSort() && <DropdownMenuSeparator />}
              <div className="p-2">
                <div className="flex items-center space-x-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <Input
                    className="h-8 w-[150px]"
                    placeholder="Filter..."
                    value={(column.getFilterValue() ?? '') as string}
                    onChange={e => column.setFilterValue(e.target.value)}
                  />
                </div>
              </div>
              {filtered && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => column.setFilterValue(undefined)}>
                    <X className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                    Clear filter
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {filtered && (
        <Badge className="h-5 px-1" variant="secondary">
          <Filter className="h-3 w-3" />
        </Badge>
      )}
    </div>
  )
}
