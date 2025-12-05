import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  OverviewCards,
  OverviewMetricCard,
  QuickActions,
} from '@listforge/ui';
import {
  useListItemsQuery,
  useListMarketplaceAccountsQuery,
} from '@listforge/api-rtk';
import { Package, Store, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);

  const { data: itemsData, isLoading: itemsLoading } = useListItemsQuery({
    page: 1,
    pageSize: 1, // Just need count
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

  // Count items by AI status
  const itemsWithMetaListing = itemsData?.items?.filter(
    (item) => item.metaListing
  ) || [];
  const completedListings = itemsWithMetaListing.filter(
    (item) => item.metaListing?.aiStatus === 'complete'
  ).length;
  const processingListings = itemsWithMetaListing.filter(
    (item) =>
      item.metaListing?.aiStatus === 'pending' ||
      item.metaListing?.aiStatus === 'in_progress'
  ).length;

  const overviewCards = [
    {
      title: 'Total Items',
      value: totalItems,
      description: 'Items in inventory',
      icon: <Package className="h-4 w-4" />,
      href: '/items',
    },
    {
      title: 'Ready to Publish',
      value: completedListings,
      description: 'AI processing complete',
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      href: '/items',
    },
    {
      title: 'Processing',
      value: processingListings,
      description: 'AI workflows running',
      icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
    },
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
      description: 'Add a new item to inventory',
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
      label: 'View Inventory',
      description: 'Browse all items',
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => navigate({ to: '/items' }),
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, {user?.name}! You're in {currentOrg?.name || 'no organization'}.
        </p>
      </div>

      <OverviewCards cards={overviewCards} columns={4} />

      <QuickActions actions={quickActions} />

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {itemsLoading || accountsLoading ? (
            <div className="col-span-3 flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <OverviewMetricCard
                title="Inventory Status"
                value={`${completedListings}/${totalItems}`}
                description="Ready to publish"
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <OverviewMetricCard
                title="Marketplace Status"
                value={activeAccounts}
                description={`${expiredAccounts > 0 ? `${expiredAccounts} expired` : 'All connected'}`}
                icon={<Store className="h-4 w-4" />}
                trend={expiredAccounts > 0 ? 'down' : 'neutral'}
              />
              <OverviewMetricCard
                title="Processing"
                value={processingListings}
                description="AI workflows active"
                icon={<Loader2 className="h-4 w-4 animate-spin" />}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

