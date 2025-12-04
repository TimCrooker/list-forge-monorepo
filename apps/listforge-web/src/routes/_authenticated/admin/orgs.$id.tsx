import { createFileRoute, useNavigate, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useGetOrgAdminQuery,
  useUpdateOrgStatusMutation,
} from '@listforge/api-rtk';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  DataTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@listforge/ui';
import {
  ArrowLeft,
  Loader2,
  Users,
  Package,
  Store,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminOrgMemberDto } from '@listforge/api-types';
import type { OrgStatus } from '@listforge/core-types';

export const Route = createFileRoute('/_authenticated/admin/orgs/$id')({
  component: AdminOrgDetailPage,
});

function AdminOrgDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading, error } = useGetOrgAdminQuery(id);
  const [updateStatus] = useUpdateOrgStatusMutation();
  const [newStatus, setNewStatus] = useState<OrgStatus>('active');

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const handleStatusChange = async () => {
    if (!confirm(`Are you sure you want to change this organization's status to ${newStatus}?`))
      return;
    try {
      await updateStatus({ orgId: id, data: { status: newStatus } }).unwrap();
      showSuccess('Organization status updated successfully');
    } catch (err) {
      // Error toast shown automatically
    }
  };

  const memberColumns: ColumnDef<AdminOrgMemberDto>[] = [
    {
      accessorKey: 'userName',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.userName}</div>
          <div className="text-sm text-muted-foreground">{row.original.userEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'joinedAt',
      header: 'Joined',
      cell: ({ row }) =>
        new Date(row.original.joinedAt).toLocaleDateString(),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.org) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading organization</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: '/admin/orgs' })}
        >
          Back to Organizations
        </Button>
      </div>
    );
  }

  const orgData = data.org;

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/admin/orgs' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{orgData.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant={orgData.status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {orgData.status}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{orgData.memberCount}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{orgData.itemCount}</p>
                <p className="text-sm text-muted-foreground">Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{orgData.marketplaceAccountCount}</p>
                <p className="text-sm text-muted-foreground">Marketplace Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg">{orgData.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge
                  variant={orgData.status === 'active' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {orgData.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(orgData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Change Status
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as OrgStatus)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusChange}
                  disabled={newStatus === orgData.status}
                  variant={newStatus === 'suspended' ? 'destructive' : 'default'}
                >
                  {newStatus === 'suspended' ? (
                    <XCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({orgData.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgData.members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No members in this organization
            </p>
          ) : (
            <DataTable columns={memberColumns} data={orgData.members} loading={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
