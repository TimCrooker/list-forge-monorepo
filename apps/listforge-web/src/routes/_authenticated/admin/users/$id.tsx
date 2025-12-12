import { createFileRoute, useNavigate, Navigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useGetUserAdminQuery,
  useDisableUserMutation,
  useEnableUserMutation,
} from '@listforge/api-rtk';
import {
  AppContent,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  DataTable,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  EmptyState,
} from '@listforge/ui';
import { Loader2, Shield, ShieldOff, Users, Building2, Info, Activity } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminUserOrgMembershipDto } from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/admin/users/$id')({
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading, error } = useGetUserAdminQuery(id);
  const [disableUser] = useDisableUserMutation();
  const [enableUser] = useEnableUserMutation();

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable this user?')) return;
    try {
      await disableUser(id).unwrap();
      showSuccess('User disabled successfully');
    } catch (err) {
      // Error toast shown automatically
    }
  };

  const handleEnable = async () => {
    try {
      await enableUser(id).unwrap();
      showSuccess('User enabled successfully');
    } catch (err) {
      // Error toast shown automatically
    }
  };

  const membershipColumns: ColumnDef<AdminUserOrgMembershipDto>[] = [
    {
      accessorKey: 'orgName',
      header: 'Organization',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.orgName}</span>
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
      accessorKey: 'orgStatus',
      header: 'Org Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.orgStatus === 'active' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {row.original.orgStatus}
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
      <AppContent maxWidth="full" padding="md">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppContent>
    );
  }

  if (error || !data?.user) {
    return (
      <AppContent maxWidth="full" padding="md">
        <div className="text-center py-12">
          <p className="text-destructive">Error loading user</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate({ to: '/admin/users' })}
          >
            Back to Users
          </Button>
        </div>
      </AppContent>
    );
  }

  const userData = data.user;

  return (
    <AppContent
      title={userData.name}
      description={userData.email}
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Users', onClick: () => navigate({ to: '/admin/users' }) },
        { label: userData.name },
      ]}
      actions={
        userData.disabled ? (
          <Button onClick={handleEnable} variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Enable User
          </Button>
        ) : (
          <Button onClick={handleDisable} variant="destructive">
            <ShieldOff className="mr-2 h-4 w-4" />
            Disable User
          </Button>
        )
      }
      maxWidth="full"
      padding="md"
    >
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">
            <Info className="mr-2 h-4 w-4" />
            Information
          </TabsTrigger>
          <TabsTrigger value="orgs">
            <Building2 className="mr-2 h-4 w-4" />
            Organizations ({userData.orgMemberships.length})
          </TabsTrigger>
          <TabsTrigger value="activity" disabled>
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{userData.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Global Role</p>
                  <Badge variant="outline" className="capitalize">
                    {userData.globalRole}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={userData.disabled ? 'destructive' : 'default'}>
                    {userData.disabled ? 'Disabled' : 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {userData.lastLoginAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                    <p className="text-sm">
                      {new Date(userData.lastLoginAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orgs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Memberships
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userData.orgMemberships.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No organizations"
                  description="User is not a member of any organizations"
                />
              ) : (
                <DataTable
                  columns={membershipColumns}
                  data={userData.orgMemberships}
                  loading={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Activity log coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppContent>
  );
}

