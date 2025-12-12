import { createFileRoute, useNavigate, Navigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetSystemMetricsQuery } from '@listforge/api-rtk';
import {
  AppContent,
  OverviewCards,
  QuickActions,
  MetricsDashboard,
  ActivityWidget,
  type MetricData,
  type ActivityWidgetItem,
} from '@listforge/ui';
import { Loader2, Users, Building2, Package, ShoppingCart, Activity, BookOpen, History, Brain } from 'lucide-react';

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
          title: 'Marketplace Accounts',
          value: metricsData.counts.marketplaceAccounts,
          description: 'Connected accounts',
          icon: <ShoppingCart className="h-4 w-4" />,
          href: '/admin/marketplace-accounts',
        },
      ]
    : [];

  const quickActions = [
    {
      id: 'view-users',
      label: 'View Users',
      icon: <Users className="h-4 w-4" />,
      onClick: () => navigate({ to: '/admin/users' }),
    },
    {
      id: 'view-orgs',
      label: 'View Organizations',
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => navigate({ to: '/admin/orgs' }),
    },
    {
      id: 'view-marketplace',
      label: 'Marketplace Accounts',
      icon: <ShoppingCart className="h-4 w-4" />,
      onClick: () => navigate({ to: '/admin/marketplace-accounts' }),
    },
    {
      id: 'view-domain',
      label: 'Domain Expertise',
      icon: <BookOpen className="h-4 w-4" />,
      onClick: () => navigate({ to: '/admin/domain-expertise' }),
    },
    {
      id: 'view-logs',
      label: 'Audit Logs',
      icon: <History className="h-4 w-4" />,
      onClick: () => navigate({ to: '/admin/settings-audit' }),
    },
    {
      id: 'view-learning',
      label: 'Learning Dashboard',
      icon: <Brain className="h-4 w-4" />,
      onClick: () => navigate({ to: '/admin/learning' }),
    },
  ];

  const activityItems: ActivityWidgetItem[] = metricsData
    ? metricsData.recentWorkflowRuns.slice(0, 5).map((run) => ({
        id: run.id,
        type: run.status === 'completed' ? 'status' : run.status === 'failed' ? 'alert' : 'action',
        title: run.type,
        timestamp: run.startedAt || new Date().toISOString(),
        status: run.status === 'completed' ? 'success' : run.status === 'failed' ? 'error' : 'info',
      }))
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
    <AppContent
      title="Admin Dashboard"
      description="System overview and management tools"
      maxWidth="full"
      padding="md"
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : metricsData ? (
        <div className="space-y-6">
          <OverviewCards cards={overviewCards} columns={4} />

          <MetricsDashboard metrics={queueMetrics} columns={3} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activityItems.length > 0 && (
                <ActivityWidget
                  title="Recent Workflow Runs"
                  activities={activityItems}
                  maxItems={5}
                />
              )}
            </div>
            <div>
              <QuickActions
                title="Quick Actions"
                layout="list"
                actions={quickActions}
              />
            </div>
          </div>
        </div>
      ) : null}
    </AppContent>
  );
}

