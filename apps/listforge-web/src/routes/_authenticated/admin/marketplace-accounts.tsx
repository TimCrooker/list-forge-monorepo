import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useListMarketplaceAccountsAdminQuery,
  useDisableMarketplaceAccountMutation,
} from '@listforge/api-rtk';
import {
  AppContent,
  SearchFilters,
  Button,
  Badge,
  DataTable,
  EmptyState,
} from '@listforge/ui';
import { ShieldOff, CheckCircle2, XCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  AdminMarketplaceAccountDto,
  MarketplaceType,
  MarketplaceAccountStatus,
} from '@listforge/api-types';

export const Route = createFileRoute('/_authenticated/admin/marketplace-accounts')({
  component: AdminMarketplaceAccountsPage,
});

function AdminMarketplaceAccountsPage() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const queryParams = useMemo(() => {
    const params: {
      marketplace?: MarketplaceType;
      status?: MarketplaceAccountStatus;
      orgId?: string;
    } = {};
    if (filters.marketplace && filters.marketplace !== 'all') {
      params.marketplace = filters.marketplace as MarketplaceType;
    }
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      params.status = filters.status[0] as MarketplaceAccountStatus;
    }
    if (filters.orgId) {
      params.orgId = filters.orgId;
    }
    return params;
  }, [filters]);

  const { data, isLoading, refetch } = useListMarketplaceAccountsAdminQuery(queryParams);
  const [disableAccount] = useDisableMarketplaceAccountMutation();

  // Check admin access
  if (user?.globalRole !== 'superadmin' && user?.globalRole !== 'staff') {
    return <Navigate to="/" />;
  }

  const handleDisable = useCallback(async (accountId: string) => {
    if (
      !confirm(
        'Are you sure you want to disable this marketplace account? This will revoke access.',
      )
    )
      return;
    try {
      await disableAccount(accountId).unwrap();
      showSuccess('Marketplace account disabled successfully');
      refetch();
    } catch (err) {
      // Error toast shown automatically
    }
  }, [disableAccount, refetch]);

  const getStatusIcon = (status: MarketplaceAccountStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'revoked':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: MarketplaceAccountStatus) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'expired':
        return 'secondary' as const;
      case 'revoked':
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const columns: ColumnDef<AdminMarketplaceAccountDto>[] = useMemo(
    () => [
      {
        accessorKey: 'orgName',
        header: 'Organization',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.orgName}</div>
        ),
      },
      {
        accessorKey: 'userName',
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">{row.original.userId}</div>
          </div>
        ),
      },
      {
        accessorKey: 'marketplace',
        header: 'Marketplace',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.marketplace}</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const account = row.original;
          return (
            <div className="flex items-center gap-2">
              {getStatusIcon(account.status)}
              <Badge variant={getStatusBadgeVariant(account.status)}>
                {account.status}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'remoteAccountId',
        header: 'Remote Account ID',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.remoteAccountId || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const account = row.original;
          if (account.status === 'revoked') {
            return <span className="text-sm text-muted-foreground">Already disabled</span>;
          }
          return (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDisable(account.id)}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Disable
            </Button>
          );
        },
      },
    ],
    [handleDisable],
  );

  const accounts = data?.accounts || [];

  return (
    <AppContent
      title="Marketplace Accounts"
      description="Manage marketplace connections across all organizations"
      breadcrumbs={[
        { label: 'Admin', onClick: () => navigate({ to: '/admin' }) },
        { label: 'Marketplace Accounts' },
      ]}
      headerContent={
        <SearchFilters
          variant="inline"
          showSearch={false}
          filterGroups={[
            {
              id: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: [
                { value: 'all', label: 'All' },
                { value: 'EBAY', label: 'eBay' },
                { value: 'AMAZON', label: 'Amazon' },
              ],
            },
            {
              id: 'status',
              label: 'Status',
              type: 'multiselect',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'revoked', label: 'Revoked' },
                { value: 'error', label: 'Error' },
              ],
            },
            {
              id: 'orgId',
              label: 'Organization ID',
              type: 'search',
            },
          ]}
          onFilterChange={setFilters}
        />
      }
      maxWidth="full"
      padding="md"
    >
      {accounts.length === 0 && !isLoading ? (
        <EmptyState
          icon={ShoppingCart}
          title="No marketplace accounts found"
          description="Marketplace accounts will appear here once organizations connect their accounts"
        />
      ) : (
        <DataTable
          columns={columns}
          data={accounts}
          loading={isLoading}
        />
      )}
    </AppContent>
  );
}

