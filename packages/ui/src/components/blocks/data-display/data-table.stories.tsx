import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DataTable } from './data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'
import { TooltipProvider } from '../../ui/tooltip'
import { Tabs } from '../../ui/tabs'

// Sample data type
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'editor'
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
}

// Sample data
const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-03-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-03-14T15:45:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'editor',
    status: 'inactive',
    lastLogin: '2024-03-13T09:15:00Z',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'user',
    status: 'pending',
    lastLogin: '2024-03-12T14:20:00Z',
  },
]

// Column definitions
const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      return <Badge variant={role === 'admin' ? 'destructive' : 'secondary'}>{role}</Badge>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge
          variant={
            status === 'active' ? 'default' : status === 'inactive' ? 'destructive' : 'secondary'
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Login',
    cell: ({ row }) => {
      const date = new Date(row.getValue('lastLogin'))
      return date.toLocaleString()
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original
      return (
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      )
    },
  },
]

const meta: Meta<typeof DataTable> = {
  title: 'Blocks/DataDisplay/DataTable',
  component: DataTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Tabs defaultValue="table">
        <TooltipProvider>
          <div className="w-[1000px]">
            <Story />
          </div>
        </TooltipProvider>
      </Tabs>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Manage your users and their permissions',
  },
}

export const WithSelection: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Select users to perform bulk actions',
    bulkActions: [
      {
        label: 'Delete Selected',
        onClick: selectedRows => {
          // Delete: selectedRows
        },
        variant: 'destructive',
      },
      {
        label: 'Export Selected',
        onClick: selectedRows => {
          // Export: selectedRows
        },
        variant: 'outline',
      },
    ],
  },
}

export const WithExport: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Export your user data',
    onExport: data => {
      // Exporting: data
    },
  },
}

export const WithoutGlobalFilter: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Table without global search',
    showGlobalFilter: false,
  },
}

export const WithoutColumnVisibility: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Table without column visibility toggle',
    showColumnVisibility: false,
  },
}

export const WithoutPagination: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Table without pagination',
    showPagination: false,
  },
}

export const WithStickyHeader: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Table with sticky header',
    stickyHeader: true,
  },
}

export const Loading: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: [],
    title: 'Users',
    description: 'Loading user data...',
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: [],
    title: 'Users',
    description: 'No users found',
  },
}

export const CustomClassName: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Table with custom styling',
    className: 'bg-gray-50',
  },
}

// Server-side examples
export const ServerSidePagination: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Server-side pagination example',
    pageCount: 10,
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex: 0,
          pageSize: 10,
        })
        // Pagination changed: newState
      }
    },
  },
}

export const ServerSideSorting: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Server-side sorting example',
    sorting: [],
    onSortingChange: updater => {
      if (typeof updater === 'function') {
        const newState = updater([])
        // Sorting changed: newState
      }
    },
  },
}

export const ServerSideFiltering: Story = {
  args: {
    columns: columns as ColumnDef<unknown>[],
    data: users,
    title: 'Users',
    description: 'Server-side filtering example',
    columnFilters: [],
    onColumnFiltersChange: updater => {
      if (typeof updater === 'function') {
        const newState = updater([])
        // Filters changed: newState
      }
    },
  },
}
