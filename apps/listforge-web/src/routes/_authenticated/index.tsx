import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  OverviewCards,
  OverviewMetricCard,
  QuickActions,
  AppContent,
} from '@listforge/ui';
import {
  useListItemsQuery,
  useListMarketplaceAccountsQuery,
} from '@listforge/api-rtk';
import { Package, Store, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { useOrgFeatures } from '@/hooks';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { isTeam, dashboardTitle, itemsLabel } = useOrgFeatures();

  const { data: itemsData, isLoading: itemsLoading } = useListItemsQuery({
    page: 1,
    pageSize: 100,
  });

  const { data: accountsData, isLoading: accountsLoading } =
    useListMarketplaceAccountsQuery();

  // Calculate stats
  const totalItems = itemsData?.total || 0;
  const activeAccounts = accountsData?.accounts?.filter(
    (acc) => acc.status === 'active'
  ).length || 0;
  const expiredAccounts = accountsData?.accounts?.filter(
    (acc) => acc.status === 'expired' || acc.status === 'error'
  ).length || 0;

  // Count items by status
  const readyItems =
    itemsData?.items?.filter((item) => item.lifecycleStatus === 'ready').length || 0;
  const listedItems =
    itemsData?.items?.filter((item) => item.lifecycleStatus === 'listed').length || 0;
  const pendingReviewItems =
    itemsData?.items?.filter(
      (item) => item.lifecycleStatus === 'draft' && item.aiReviewState === 'pending',
    ).length || 0;

  const overviewCards = [
    {
      title: `Total ${itemsLabel}`,
      value: totalItems,
      description: isTeam ? 'Items in your inventory' : 'Items in your collection',
      icon: <Package className="h-4 w-4" />,
      href: '/items',
    },
    {
      title: 'Ready to List',
      value: readyItems,
      description: 'Inventory-ready items',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      href: '/items',
    },
    {
      title: 'Listed',
      value: listedItems,
      description: 'Currently listed items',
      icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
      href: '/items',
    },
    // Pending Review card only for team orgs (dual approval workflow)
    ...(isTeam ? [{
      title: 'Pending Review',
      value: pendingReviewItems,
      description: 'Awaiting AI review',
      icon: <Loader2 className="h-4 w-4 text-yellow-600" />,
      href: '/review',
    }] : []),
    {
      title: 'Marketplace Accounts',
      value: activeAccounts,
      description: `${expiredAccounts > 0 ? `${expiredAccounts} need attention` : 'All active'}`,
      icon: <Store className="h-4 w-4" />,
      href: '/settings/marketplaces',
      trend: expiredAccounts > 0 ? ('down' as const) : ('neutral' as const),
    },
  ];

  const quickActions = [
    {
      id: 'new-item',
      label: 'New Item',
      description: isTeam ? 'Add a new item to inventory' : 'Add a new item',
      icon: <Package className="h-5 w-5" />,
      onClick: () => navigate({ to: '/items/new' }),
      variant: 'default' as const,
    },
    {
      id: 'connect-marketplace',
      label: 'Connect Marketplace',
      description: 'Link your eBay account',
      icon: <Store className="h-5 w-5" />,
      onClick: () => navigate({ to: '/settings/marketplaces', search: { code: undefined, state: undefined, spapi_oauth_code: undefined, selling_partner_id: undefined } }),
      variant: expiredAccounts > 0 ? ('destructive' as const) : ('outline' as const),
    },
    {
      id: 'view-inventory',
      label: `View ${itemsLabel}`,
      description: 'Browse all items',
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => navigate({ to: '/items' }),
      variant: 'outline' as const,
    },
  ];

  return (
    <AppContent
      title={dashboardTitle}
      description={`Welcome back, ${user?.name}!${isTeam ? ` Managing ${currentOrg?.name}.` : ''}`}
      maxWidth="full"
    >
      <OverviewCards cards={overviewCards} columns={isTeam ? 5 : 4} />

      <QuickActions actions={quickActions} />

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className={`grid grid-cols-1 md:grid-cols-${isTeam ? '3' : '2'} gap-4`}>
          {itemsLoading || accountsLoading ? (
            <div className={`col-span-${isTeam ? '3' : '2'} flex items-center justify-center py-8`}>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <OverviewMetricCard
                title={`${itemsLabel} Status`}
                value={`${readyItems + listedItems}/${totalItems}`}
                description="Ready or listed"
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <OverviewMetricCard
                title="Marketplace Status"
                value={activeAccounts}
                description={`${expiredAccounts > 0 ? `${expiredAccounts} expired` : 'All connected'}`}
                icon={<Store className="h-4 w-4" />}
                trend={expiredAccounts > 0 ? 'down' : 'neutral'}
              />
              {/* Pending Review metric only for team orgs */}
              {isTeam && (
                <OverviewMetricCard
                  title="Pending Review"
                  value={pendingReviewItems}
                  description="Awaiting AI approval"
                  icon={<Loader2 className="h-4 w-4" />}
                />
              )}
            </>
          )}
        </div>
      </div>
    </AppContent>
  );
}

