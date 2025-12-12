import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useListUsersQuery, useUpdateUserAdminMutation, useDisableUserMutation } from '@listforge/api-rtk';
import { AppContent, DataTable, EmptyState, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@listforge/ui';
import { Edit, Check, X, ShieldOff, Download, Users } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminUserDto } from '@listforge/api-types';
import type { RowSelectionState } from '@tanstack/react-table';

export const Route = createFileRoute('/_authenticated/admin/users/')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading } = useListUsersQuery();
  const [updateUser] = useUpdateUserAdminMutation();
  const [disableUser] = useDisableUserMutation();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const handleRoleChange = async (userId: string) => {
    try {
      await updateUser({
        userId,
        data: { globalRole: newRole as any },
      }).unwrap();
      setEditingUserId(null);
      showSuccess('User role updated successfully');
    } catch (err) {
      // Error toast shown automatically
      console.error('Failed to update user:', err);
    }
  };

  const handleBulkDisable = async (selectedRows: AdminUserDto[]) => {
    if (!confirm(`Are you sure you want to disable ${selectedRows.length} user(s)?`)) {
      return;
    }
    try {
      await Promise.all(selectedRows.map((row) => disableUser(row.id).unwrap()));
      setRowSelection({});
      showSuccess(`Successfully disabled ${selectedRows.length} user(s)`);
    } catch (err) {
      showError('Failed to disable some users');
      console.error('Failed to disable users:', err);
    }
  };

  const handleExport = (data: AdminUserDto[]) => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Created', 'Last Login'].join(','),
      ...data.map((user) =>
        [
          `"${user.name}"`,
          `"${user.email}"`,
          user.globalRole,
          user.disabled ? 'Disabled' : 'Active',
          new Date(user.createdAt).toLocaleDateString(),
          user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<AdminUserDto>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <button
              onClick={() => navigate({ to: '/admin/users/$id', params: { id: row.original.id } })}
              className="font-medium hover:underline text-left"
            >
              {row.original.name}
            </button>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'disabled',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.disabled ? 'destructive' : 'default'}>
            {row.original.disabled ? 'Disabled' : 'Active'}
          </Badge>
        ),
      },
      {
        accessorKey: 'globalRole',
        header: 'Role',
        cell: ({ row }) => {
          const user = row.original;
          if (editingUserId === user.id) {
            return (
              <div className="flex items-center gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="staff">staff</SelectItem>
                    <SelectItem value="superadmin">superadmin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRoleChange(user.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingUserId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          }
          return (
            <Badge variant="outline" className="capitalize">
              {user.globalRole}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'Last Login',
        cell: ({ row }) =>
          row.original.lastLoginAt
            ? new Date(row.original.lastLoginAt).toLocaleDateString()
            : 'Never',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original;
          if (editingUserId === user.id) {
            return null;
          }
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingUserId(user.id);
                setNewRole(user.globalRole);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </Button>
          );
        },
      },
    ],
    [editingUserId, newRole, updateUser, navigate]
  );

  const users = data?.users || [];
  const selectedRows = Object.keys(rowSelection)
    .map((key) => users.find((u) => u.id === key))
    .filter((u): u is AdminUserDto => u !== undefined);

  return (
    <AppContent
      title="Users"
      description="Manage users and their roles"
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Users' },
      ]}
      actions={
        <Button
          variant="outline"
          onClick={() => handleExport(users)}
          disabled={users.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      }
      maxWidth="full"
      padding="md"
    >
      {users.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Users will appear here once they sign up"
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          loading={isLoading}
          showColumnVisibility
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          bulkActions={
            selectedRows.length > 0
              ? [
                  {
                    label: `Disable Selected (${selectedRows.length})`,
                    icon: ShieldOff,
                    variant: 'destructive' as const,
                    onClick: handleBulkDisable,
                  },
                ]
              : undefined
          }
          getRowId={(row) => row.id}
        />
      )}
    </AppContent>
  );
}

