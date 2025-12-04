import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useListUsersQuery, useUpdateUserAdminMutation } from '@listforge/api-rtk';
import { DataTable } from '@listforge/ui';
import { Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@listforge/ui';
import { Edit, Check, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminUserDto } from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading } = useListUsersQuery();
  const [updateUser] = useUpdateUserAdminMutation();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

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

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage users and their roles
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.users || []}
        loading={isLoading}
        title="All Users"
        description="View and manage user accounts"
      />
    </div>
  );
}

