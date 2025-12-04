import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useListMarketplaceAccountsAdminQuery,
  useDisableMarketplaceAccountMutation,
} from '@listforge/api-rtk';
import {
  Button,
  Badge,
  DataTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
} from '@listforge/ui';
import { ShieldOff, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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
  const user = useSelector((state: RootState) => state.auth.user);
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MarketplaceAccountStatus | 'all'>('all');
  const [orgIdFilter, setOrgIdFilter] = useState<string>('');

  const queryParams = useMemo(() => {
    const params: {
      marketplace?: MarketplaceType;
      status?: MarketplaceAccountStatus;
      orgId?: string;
    } = {};
    if (marketplaceFilter !== 'all') {
      params.marketplace = marketplaceFilter;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    if (orgIdFilter) {
      params.orgId = orgIdFilter;
    }
    return params;
  }, [marketplaceFilter, statusFilter, orgIdFilter]);

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

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Marketplace Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Manage marketplace connections across all organizations
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marketplace-filter">Marketplace</Label>
          <Select
            value={marketplaceFilter}
            onValueChange={(value) =>
              setMarketplaceFilter(value as MarketplaceType | 'all')
            }
          >
            <SelectTrigger id="marketplace-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="EBAY">eBay</SelectItem>
              <SelectItem value="AMAZON">Amazon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as MarketplaceAccountStatus | 'all')
            }
          >
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-id-filter">Organization ID</Label>
          <Input
            id="org-id-filter"
            placeholder="Filter by org ID"
            value={orgIdFilter}
            onChange={(e) => setOrgIdFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.accounts || []}
          loading={isLoading}
          title="All Marketplace Accounts"
          description="View and manage marketplace connections across organizations"
        />
      )}
    </div>
  );
}

