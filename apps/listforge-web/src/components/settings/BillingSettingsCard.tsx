import { useState, useEffect } from 'react';
import {
  useGetBillingSettingsQuery,
  useUpdateBillingSettingsMutation,
} from '@listforge/api-rtk';
import { BillingSettings } from '@listforge/core-types';
import { Loader2, CreditCard, Save } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input,
  Badge,
  Skeleton,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

interface BillingSettingsCardProps {
  orgId: string;
}

export function BillingSettingsCard({ orgId }: BillingSettingsCardProps) {
  const { data, isLoading } = useGetBillingSettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateBillingSettingsMutation();

  const [billingEmail, setBillingEmail] = useState('');

  useEffect(() => {
    if (data?.settings) {
      setBillingEmail(data.settings.billingEmail || '');
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSettings({
        orgId,
        data: {
          billingEmail: billingEmail || null,
        },
      }).unwrap();
      showSuccess('Billing settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save billing settings');
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'default' as const;
      case 'professional':
        return 'secondary' as const;
      case 'starter':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const settings = data?.settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing Settings
        </CardTitle>
        <CardDescription>
          View your current plan and manage billing preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="space-y-2">
          <Label>Current Plan</Label>
          <div className="flex items-center gap-2">
            <Badge variant={getPlanBadgeVariant(settings?.plan || 'free')} className="text-sm">
              {settings?.plan?.charAt(0).toUpperCase()}{settings?.plan?.slice(1) || 'Free'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Contact support to upgrade or change your plan
          </p>
        </div>

        {/* Usage Limits */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-base">Plan Limits</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">Max Items</p>
              <p className="text-2xl font-semibold">
                {settings?.limits.maxItems === -1 ? 'Unlimited' : settings?.limits.maxItems}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">Marketplace Accounts</p>
              <p className="text-2xl font-semibold">
                {settings?.limits.maxMarketplaceAccounts === -1
                  ? 'Unlimited'
                  : settings?.limits.maxMarketplaceAccounts}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-2xl font-semibold">
                {settings?.limits.maxTeamMembers === -1
                  ? 'Unlimited'
                  : settings?.limits.maxTeamMembers}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">Monthly Research</p>
              <p className="text-2xl font-semibold">
                {settings?.limits.maxMonthlyResearch === -1
                  ? 'Unlimited'
                  : settings?.limits.maxMonthlyResearch}
              </p>
            </div>
          </div>
        </div>

        {/* Billing Email */}
        <div className="space-y-2 border-t pt-4">
          <Label>Billing Email</Label>
          <Input
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder="billing@yourcompany.com"
          />
          <p className="text-xs text-muted-foreground">
            Invoices and billing notifications will be sent to this address
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
