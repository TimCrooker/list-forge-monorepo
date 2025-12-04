import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useListOrgsAdminQuery } from '@listforge/api-rtk';
import { DataTable, Badge } from '@listforge/ui';
import { Building2, Users } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminOrgDto } from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/admin/orgs')({
  component: AdminOrgsPage,
});

function AdminOrgsPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading } = useListOrgsAdminQuery();

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const columns: ColumnDef<AdminOrgDto>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Organization',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => navigate({ to: '/admin/orgs/$id', params: { id: row.original.id } })}
              className="font-medium hover:underline text-left"
            >
              {row.original.name}
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'active' ? 'default' : 'secondary'
            }
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'memberCount',
        header: 'Members',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.memberCount}</span>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    [navigate]
  );

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p className="text-muted-foreground mt-1">
          Manage organizations and memberships
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.orgs || []}
        loading={isLoading}
        title="All Organizations"
        description="View and manage organizations"
      />
    </div>
  );
}

