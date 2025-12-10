import { useState, useEffect } from 'react';
import {
  useGetInventorySettingsQuery,
  useUpdateInventorySettingsMutation,
} from '@listforge/api-rtk';
import { InventorySettings } from '@listforge/core-types';
import { Loader2, Package, Save, History } from 'lucide-react';
import { SettingsVersionHistory } from './SettingsVersionHistory';
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
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

interface InventorySettingsCardProps {
  orgId: string;
}

export function InventorySettingsCard({ orgId }: InventorySettingsCardProps) {
  const { data, isLoading } = useGetInventorySettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateInventorySettingsMutation();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [formData, setFormData] = useState<InventorySettings>({
    defaultPricingStrategy: 'competitive',
    defaultMarginPercent: 20,
    minimumMarginPercent: 10,
    enableAutoRelist: true,
    autoRelistDelayDays: 7,
    lowStockThreshold: 5,
    requireConditionNotes: false,
    mandatoryFields: [],
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
        data: formData,
      }).unwrap();
      showSuccess('Inventory settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save inventory settings');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Settings
              </CardTitle>
              <CardDescription>
                Configure default pricing strategy and inventory management rules.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing Strategy */}
        <div className="space-y-2">
          <Label>Default Pricing Strategy</Label>
          <Select
            value={formData.defaultPricingStrategy}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                defaultPricingStrategy: value as 'competitive' | 'premium' | 'quick_sale' | 'custom',
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="competitive">Competitive</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="quick_sale">Quick Sale</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Default strategy for calculating listing prices
          </p>
        </div>

        {/* Margin Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Default Margin %</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.defaultMarginPercent}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMarginPercent: Number(e.target.value) })
                }
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Minimum Margin %</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.minimumMarginPercent}
                onChange={(e) =>
                  setFormData({ ...formData, minimumMarginPercent: Number(e.target.value) })
                }
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Auto-Relist Settings */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto-Relist</Label>
              <p className="text-xs text-muted-foreground">
                Automatically relist expired listings
              </p>
            </div>
            <Switch
              checked={formData.enableAutoRelist}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableAutoRelist: checked })
              }
            />
          </div>

          {formData.enableAutoRelist && (
            <div className="ml-6 space-y-2 border-l pl-4">
              <Label>Auto-Relist Delay (days)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={formData.autoRelistDelayDays}
                onChange={(e) =>
                  setFormData({ ...formData, autoRelistDelayDays: Number(e.target.value) })
                }
                className="w-24"
              />
            </div>
          )}
        </div>

        {/* Other Settings */}
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label>Low Stock Threshold</Label>
            <Input
              type="number"
              min={0}
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })
              }
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Alert when stock falls below this level
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Condition Notes</Label>
              <p className="text-xs text-muted-foreground">
                Require notes for used/refurbished items
              </p>
            </div>
            <Switch
              checked={formData.requireConditionNotes}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requireConditionNotes: checked })
              }
            />
          </div>
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

      <SettingsVersionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        orgId={orgId}
        settingsType="inventory"
      />
    </>
  );
}
