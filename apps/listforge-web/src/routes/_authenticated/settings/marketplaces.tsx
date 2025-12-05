import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  useListMarketplaceAccountsQuery,
  useExchangeEbayCodeMutation,
  useExchangeAmazonCodeMutation,
  api,
} from '@listforge/api-rtk';
import { useAppDispatch } from '@/store/store';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@listforge/ui';
import { ArrowLeft, Store, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

export const Route = createFileRoute('/_authenticated/settings/marketplaces')({
  component: MarketplacesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    // eBay OAuth params
    code: search.code as string | undefined,
    state: search.state as string | undefined,
    // Amazon OAuth params
    spapi_oauth_code: search.spapi_oauth_code as string | undefined,
    selling_partner_id: search.selling_partner_id as string | undefined,
  }),
});

function MarketplacesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const search = useSearch({ from: '/_authenticated/settings/marketplaces' });
  const { code, state, spapi_oauth_code, selling_partner_id } = search;

  const { data, isLoading, refetch } = useListMarketplaceAccountsQuery();
  const [exchangeEbayCode, { isLoading: isExchangingEbay }] = useExchangeEbayCodeMutation();
  const [exchangeAmazonCode, { isLoading: isExchangingAmazon }] = useExchangeAmazonCodeMutation();
  const [isGettingEbayUrl, setIsGettingEbayUrl] = useState(false);
  const [isGettingAmazonUrl, setIsGettingAmazonUrl] = useState(false);

  const isExchanging = isExchangingEbay || isExchangingAmazon;

  // Clear URL params helper
  const clearSearchParams = () => {
    navigate({
      to: '/settings/marketplaces',
      search: {
        code: undefined,
        state: undefined,
        spapi_oauth_code: undefined,
        selling_partner_id: undefined,
      },
      replace: true,
    });
  };

  // Handle eBay OAuth callback
  useEffect(() => {
    if (code && state && !spapi_oauth_code) {
      exchangeEbayCode({ code, state })
        .unwrap()
        .then(() => {
          showSuccess('eBay account connected successfully!');
          refetch();
          clearSearchParams();
        })
        .catch((err) => {
          console.error('Failed to exchange eBay code:', err);
          clearSearchParams();
        });
    }
  }, [code, state, spapi_oauth_code, exchangeEbayCode, navigate, refetch]);

  // Handle Amazon OAuth callback
  useEffect(() => {
    if (spapi_oauth_code && state && selling_partner_id) {
      exchangeAmazonCode({
        spapi_oauth_code,
        state,
        selling_partner_id,
      })
        .unwrap()
        .then(() => {
          showSuccess('Amazon account connected successfully!');
          refetch();
          clearSearchParams();
        })
        .catch((err) => {
          console.error('Failed to exchange Amazon code:', err);
          clearSearchParams();
        });
    }
  }, [spapi_oauth_code, state, selling_partner_id, exchangeAmazonCode, navigate, refetch]);

  const handleConnectEbay = async () => {
    try {
      setIsGettingEbayUrl(true);
      const result = await dispatch(
        api.endpoints.getEbayAuthUrl.initiate(undefined)
      ).unwrap();
      if (result?.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (err) {
      console.error('Failed to get eBay auth URL:', err);
    } finally {
      setIsGettingEbayUrl(false);
    }
  };

  const handleConnectAmazon = async () => {
    try {
      setIsGettingAmazonUrl(true);
      const result = await dispatch(
        api.endpoints.getAmazonAuthUrl.initiate(undefined)
      ).unwrap();
      if (result?.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (err) {
      console.error('Failed to get Amazon auth URL:', err);
    } finally {
      setIsGettingAmazonUrl(false);
    }
  };

  const handleReconnect = (marketplace: string) => {
    if (marketplace === 'EBAY') {
      handleConnectEbay();
    } else if (marketplace === 'AMAZON') {
      handleConnectAmazon();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'expired':
        return 'secondary' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getMarketplaceName = (marketplace: string) => {
    switch (marketplace) {
      case 'EBAY':
        return 'eBay';
      case 'AMAZON':
        return 'Amazon';
      default:
        return marketplace;
    }
  };

  if (isExchanging) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isExchangingEbay && 'Connecting your eBay account...'}
            {isExchangingAmazon && 'Connecting your Amazon account...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/settings' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Marketplace Connections</h1>
        <p className="text-muted-foreground mt-1">
          Connect your marketplace accounts to start publishing listings
        </p>
      </div>

      {/* Available Marketplaces */}
      <Card>
        <CardHeader>
          <CardTitle>Available Marketplaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* eBay */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">eBay</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your eBay seller account
                  </p>
                </div>
              </div>
              <Button onClick={handleConnectEbay} disabled={isGettingEbayUrl}>
                {isGettingEbayUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>

            {/* Amazon */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium">Amazon</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Amazon Seller Central account
                  </p>
                </div>
              </div>
              <Button onClick={handleConnectAmazon} disabled={isGettingAmazonUrl}>
                {isGettingAmazonUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.accounts && data.accounts.length > 0 ? (
            <div className="space-y-3">
              {data.accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(account.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{getMarketplaceName(account.marketplace)}</h3>
                        <Badge variant={getStatusBadgeVariant(account.status)}>
                          {account.status}
                        </Badge>
                      </div>
                      {account.remoteAccountId && (
                        <p className="text-sm text-muted-foreground">
                          Account ID: {account.remoteAccountId}
                        </p>
                      )}
                    </div>
                  </div>
                  {account.status === 'expired' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReconnect(account.marketplace)}
                    >
                      Reconnect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No marketplace accounts connected yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect an account above to start publishing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
