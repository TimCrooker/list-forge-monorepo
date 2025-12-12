import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useListOrgsAdminQuery } from '@listforge/api-rtk';
import { AppContent, DataTable, Badge, EmptyState } from '@listforge/ui';
import { Building2, Users } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminOrgDto } from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/admin/orgs/')({
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

  const orgs = data?.orgs || [];

  return (
    <AppContent
      title="Organizations"
      description="Manage organizations and memberships"
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Organizations' },
      ]}
      maxWidth="full"
      padding="md"
    >
      {orgs.length === 0 && !isLoading ? (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description="Organizations will appear here once they are created"
        />
      ) : (
        <DataTable
          columns={columns}
          data={orgs}
          loading={isLoading}
        />
      )}
    </AppContent>
  );
}

