import { useState, useEffect } from 'react';
import {
  useGetMarketplaceDefaultSettingsQuery,
  useUpdateMarketplaceDefaultSettingsMutation,
} from '@listforge/api-rtk';
import { MarketplaceDefaultSettings } from '@listforge/core-types';
import { Loader2, Store, Save } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

interface MarketplaceDefaultsCardProps {
  orgId: string;
}

export function MarketplaceDefaultsCard({ orgId }: MarketplaceDefaultsCardProps) {
  const { data, isLoading } = useGetMarketplaceDefaultSettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateMarketplaceDefaultSettingsMutation();

  const [formData, setFormData] = useState<MarketplaceDefaultSettings>({
    ebay: {
      listingDurationDays: 7,
      defaultShippingService: 'USPSPriority',
      defaultReturnPolicy: '30DayReturns',
      enableBestOffer: true,
    },
    amazon: {
      fulfillmentChannel: 'FBM',
      defaultCondition: 'New',
    },
  });

  useEffect(() => {
    if (data?.settings) {
      setFormData(data.settings);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSettings({
        orgId,
        data: {
          ebay: formData.ebay,
          amazon: formData.amazon,
        },
      }).unwrap();
      showSuccess('Marketplace default settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save marketplace settings');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Marketplace Defaults
        </CardTitle>
        <CardDescription>
          Configure default settings for each marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ebay" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="ebay">eBay</TabsTrigger>
            <TabsTrigger value="amazon">Amazon</TabsTrigger>
          </TabsList>

          {/* eBay Settings */}
          <TabsContent value="ebay" className="space-y-6">
            <div className="space-y-2">
              <Label>Listing Duration</Label>
              <Select
                value={String(formData.ebay.listingDurationDays)}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    ebay: { ...formData.ebay, listingDurationDays: Number(value) },
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="10">10 days</SelectItem>
                  <SelectItem value="30">30 days (GTC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Shipping Service</Label>
              <Input
                value={formData.ebay.defaultShippingService}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ebay: { ...formData.ebay, defaultShippingService: e.target.value },
                  })
                }
                placeholder="USPSPriority"
              />
            </div>

            <div className="space-y-2">
              <Label>Default Return Policy</Label>
              <Select
                value={formData.ebay.defaultReturnPolicy}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    ebay: { ...formData.ebay, defaultReturnPolicy: value },
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NoReturns">No Returns</SelectItem>
                  <SelectItem value="14DayReturns">14 Day Returns</SelectItem>
                  <SelectItem value="30DayReturns">30 Day Returns</SelectItem>
                  <SelectItem value="60DayReturns">60 Day Returns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Best Offer</Label>
                <p className="text-xs text-muted-foreground">
                  Allow buyers to make offers on listings
                </p>
              </div>
              <Switch
                checked={formData.ebay.enableBestOffer}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    ebay: { ...formData.ebay, enableBestOffer: checked },
                  })
                }
              />
            </div>
          </TabsContent>

          {/* Amazon Settings */}
          <TabsContent value="amazon" className="space-y-6">
            <div className="space-y-2">
              <Label>Fulfillment Channel</Label>
              <Select
                value={formData.amazon.fulfillmentChannel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    amazon: { ...formData.amazon, fulfillmentChannel: value as 'FBA' | 'FBM' },
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FBM">Fulfilled by Merchant (FBM)</SelectItem>
                  <SelectItem value="FBA">Fulfilled by Amazon (FBA)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How orders will be fulfilled by default
              </p>
            </div>

            <div className="space-y-2">
              <Label>Default Condition</Label>
              <Select
                value={formData.amazon.defaultCondition}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    amazon: { ...formData.amazon, defaultCondition: value },
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Refurbished">Refurbished</SelectItem>
                  <SelectItem value="UsedLikeNew">Used - Like New</SelectItem>
                  <SelectItem value="UsedVeryGood">Used - Very Good</SelectItem>
                  <SelectItem value="UsedGood">Used - Good</SelectItem>
                  <SelectItem value="UsedAcceptable">Used - Acceptable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t mt-6">
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
