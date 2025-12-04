import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type OnChangeFn,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Download,
  Filter,
  Search,
  X,
  MoreHorizontal,
  type LucideIcon,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataTableProps<TData, TValue> {
  title?: string
  description?: string
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  // Server-side props
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  // Selection
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  getRowId?: (row: TData) => string
  // Bulk actions
  bulkActions?: Array<{
    label: string
    icon?: LucideIcon
    onClick: (selectedRows: TData[]) => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  }>
  // Export
  onExport?: (data: TData[]) => void
  // Additional features
  showColumnVisibility?: boolean
  showGlobalFilter?: boolean
  showPagination?: boolean
  stickyHeader?: boolean
  // Layout
  variant?: 'card' | 'plain'
  className?: string
}

export const DataTable = <TData, TValue>({
  title,
  description,
  columns,
  data,
  loading = false,
  pageCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  globalFilter = '',
  onGlobalFilterChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  bulkActions = [],
  onExport,
  showColumnVisibility = true,
  showGlobalFilter = true,
  showPagination = true,
  stickyHeader = false,
  variant = 'plain',
  className,
}: DataTableProps<TData, TValue>) => {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [localGlobalFilter, setLocalGlobalFilter] = React.useState(globalFilter)

  // Default pagination state if not provided
  const [localPagination, setLocalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getRowId,
    state: {
      pagination: pagination ?? localPagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: rowSelection ?? {},
      globalFilter: globalFilter || localGlobalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange,
    onPaginationChange: onPaginationChange ?? setLocalPagination,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: onGlobalFilterChange || setLocalGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: !!onPaginationChange,
    manualSorting: !!onSortingChange,
    manualFiltering: !!onColumnFiltersChange || !!onGlobalFilterChange,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const hasToolbar = showGlobalFilter || showColumnVisibility
  const hasHeader = title || description

  // Render content
  const content = (
    <>
      {/* Header */}
      {hasHeader &&
        (variant === 'card' ? (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              <div className="flex items-center gap-2">
                {onExport && (
                  <Button size="sm" variant="outline" onClick={() => onExport(data)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        ) : (
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <p className="text-2xl font-semibold leading-none tracking-tight">{title}</p>
              )}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {onExport && (
                <Button size="sm" variant="outline" onClick={() => onExport(data)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        ))}

      {/* Content wrapper */}
      <div className={cn(variant === 'card' && 'px-6', variant === 'card' && hasToolbar && 'pt-6')}>
        {/* Toolbar */}
        {hasToolbar && (
          <div className="mb-4 space-y-4">
            {/* Global search and column visibility */}
            <div className="flex items-center justify-between">
              {showGlobalFilter && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search all columns..."
                    value={globalFilter || localGlobalFilter}
                    onChange={e => {
                      const { value } = e.target
                      if (onGlobalFilterChange) {
                        onGlobalFilterChange(value)
                      } else {
                        setLocalGlobalFilter(value)
                      }
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                {showColumnVisibility && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Settings2 className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {table
                        .getAllColumns()
                        .filter(
                          column => typeof column.accessorFn !== 'undefined' && column.getCanHide(),
                        )
                        .map(column => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              checked={column.getIsVisible()}
                              className="capitalize"
                              onCheckedChange={value => column.toggleVisibility(!!value)}
                            >
                              {column.id}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Bulk actions */}
            {bulkActions.length > 0 && selectedRows.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <div className="flex-1 text-sm text-muted-foreground">
                  {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
                </div>
                {bulkActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={index}
                      size="sm"
                      variant={action.variant || 'outline'}
                      onClick={() => action.onClick(selectedRows.map(row => row.original))}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader className={cn(stickyHeader && 'sticky top-0 bg-background z-10')}>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan={columns.length}>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {showPagination && (
          <div
            className={cn(
              'flex items-center justify-between',
              variant === 'card' ? 'py-4 pb-6' : 'pt-4',
            )}
          >
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <select
                  className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value))
                  }}
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  className="hidden h-8 w-8 p-0 lg:flex"
                  disabled={!table.getCanPreviousPage()}
                  variant="outline"
                  onClick={() => table.setPageIndex(0)}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="h-8 w-8 p-0"
                  disabled={!table.getCanPreviousPage()}
                  variant="outline"
                  onClick={() => table.previousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="h-8 w-8 p-0"
                  disabled={!table.getCanNextPage()}
                  variant="outline"
                  onClick={() => table.nextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  className="hidden h-8 w-8 p-0 lg:flex"
                  disabled={!table.getCanNextPage()}
                  variant="outline"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  // Render with or without card wrapper based on variant
  if (variant === 'card') {
    return <Card className={cn('w-full', className)}>{content}</Card>
  }

  return <div className={cn('w-full', className)}>{content}</div>
}
