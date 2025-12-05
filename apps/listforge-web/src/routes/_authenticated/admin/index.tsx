import { createFileRoute, useNavigate, Navigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetSystemMetricsQuery } from '@listforge/api-rtk';
import {
  OverviewCards,
  MetricsDashboard,
  type MetricData,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@listforge/ui';
import { Loader2, Users, Building2, Package, FileText, ShoppingCart, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: metricsData, isLoading } = useGetSystemMetricsQuery();

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const overviewCards = metricsData
    ? [
        {
          title: 'Users',
          value: metricsData.counts.users,
          description: 'Total users',
          icon: <Users className="h-4 w-4" />,
          href: '/admin/users',
        },
        {
          title: 'Organizations',
          value: metricsData.counts.organizations,
          description: 'Total organizations',
          icon: <Building2 className="h-4 w-4" />,
          href: '/admin/orgs',
        },
        {
          title: 'Items',
          value: metricsData.counts.items,
          description: 'Total items',
          icon: <Package className="h-4 w-4" />,
        },
        {
          title: 'Meta Listings',
          value: metricsData.counts.metaListings,
          description: 'AI-generated listings',
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: 'Marketplace Accounts',
          value: metricsData.counts.marketplaceAccounts,
          description: 'Connected accounts',
          icon: <ShoppingCart className="h-4 w-4" />,
          href: '/admin/marketplace-accounts',
        },
      ]
    : [];

  const queueMetrics: MetricData[] = metricsData
    ? [
        {
          id: 'ai-workflow',
          label: 'AI Workflow Queue',
          value: metricsData.queues.aiWorkflow.active,
          description: `${metricsData.queues.aiWorkflow.waiting} waiting, ${metricsData.queues.aiWorkflow.failed} failed`,
          status:
            metricsData.queues.aiWorkflow.failed > 0
              ? 'error'
              : metricsData.queues.aiWorkflow.waiting > 10
                ? 'warning'
                : 'success',
          icon: Activity,
        },
        {
          id: 'marketplace-publish',
          label: 'Marketplace Publish Queue',
          value: metricsData.queues.marketplacePublish.active,
          description: `${metricsData.queues.marketplacePublish.waiting} waiting, ${metricsData.queues.marketplacePublish.failed} failed`,
          status:
            metricsData.queues.marketplacePublish.failed > 0
              ? 'error'
              : metricsData.queues.marketplacePublish.waiting > 10
                ? 'warning'
                : 'success',
          icon: Activity,
        },
        {
          id: 'marketplace-sync',
          label: 'Marketplace Sync Queue',
          value: metricsData.queues.marketplaceSync.active,
          description: `${metricsData.queues.marketplaceSync.waiting} waiting, ${metricsData.queues.marketplaceSync.failed} failed`,
          status:
            metricsData.queues.marketplaceSync.failed > 0
              ? 'error'
              : metricsData.queues.marketplaceSync.waiting > 10
                ? 'warning'
                : 'success',
          icon: Activity,
        },
      ]
    : [];

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System overview and management tools
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : metricsData ? (
        <>
          <OverviewCards cards={overviewCards} columns={5} />

          <MetricsDashboard metrics={queueMetrics} columns={3} />

          {/* Management Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage users and permissions
                </p>
                <Button variant="outline" onClick={() => navigate({ to: '/admin/users' })}>
                  View Users →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage organizations and memberships
                </p>
                <Button variant="outline" onClick={() => navigate({ to: '/admin/orgs' })}>
                  View Organizations →
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Marketplace Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage marketplace connections across all organizations
                </p>
                <Button variant="outline" onClick={() => navigate({ to: '/admin/marketplace-accounts' })}>
                  View Accounts →
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Workflow Runs */}
          {metricsData.recentWorkflowRuns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Workflow Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metricsData.recentWorkflowRuns.slice(0, 5).map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {run.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : run.status === 'failed' ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{run.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {run.startedAt
                              ? new Date(run.startedAt).toLocaleString()
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
                        {run.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

