import { useState, useEffect } from 'react';
import {
  useGetSecuritySettingsQuery,
  useUpdateSecuritySettingsMutation,
} from '@listforge/api-rtk';
import { SecuritySettings } from '@listforge/core-types';
import { Loader2, ShieldCheck, Save, AlertTriangle, History } from 'lucide-react';
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
  Switch,
  Skeleton,
  Alert,
  AlertDescription,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

interface SecuritySettingsCardProps {
  orgId: string;
  isAdmin: boolean;
}

export function SecuritySettingsCard({ orgId, isAdmin }: SecuritySettingsCardProps) {
  const { data, isLoading } = useGetSecuritySettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSecuritySettingsMutation();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [formData, setFormData] = useState<SecuritySettings>({
    mfaRequired: false,
    sessionTimeoutMinutes: 480,
    allowedIPRanges: [],
    apiAccessEnabled: true,
    apiRateLimit: 1000,
  });

  const [ipRangesText, setIpRangesText] = useState('');

  useEffect(() => {
    if (data?.settings) {
      setFormData(data.settings);
      setIpRangesText(data.settings.allowedIPRanges?.join('\n') || '');
    }
  }, [data]);

  const handleSave = async () => {
    try {
      const ipRanges = ipRangesText
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      await updateSettings({
        orgId,
        data: {
          ...formData,
          allowedIPRanges: ipRanges,
        },
      }).unwrap();
      showSuccess('Security settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save security settings');
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
                <ShieldCheck className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies for your organization.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Only organization admins and owners can modify security settings.
            </AlertDescription>
          </Alert>
        )}

        {/* MFA Requirement */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require MFA</Label>
            <p className="text-xs text-muted-foreground">
              Require multi-factor authentication for all members
            </p>
          </div>
          <Switch
            checked={formData.mfaRequired}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, mfaRequired: checked })
            }
            disabled={!isAdmin}
          />
        </div>

        {/* Session Timeout */}
        <div className="space-y-2">
          <Label>Session Timeout (minutes)</Label>
          <Input
            type="number"
            min={15}
            max={10080}
            value={formData.sessionTimeoutMinutes}
            onChange={(e) =>
              setFormData({ ...formData, sessionTimeoutMinutes: Number(e.target.value) })
            }
            disabled={!isAdmin}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Auto-logout after inactivity (15 min to 7 days)
          </p>
        </div>

        {/* API Access */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable API Access</Label>
              <p className="text-xs text-muted-foreground">
                Allow programmatic access via API keys
              </p>
            </div>
            <Switch
              checked={formData.apiAccessEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, apiAccessEnabled: checked })
              }
              disabled={!isAdmin}
            />
          </div>

          {formData.apiAccessEnabled && (
            <div className="ml-6 space-y-2 border-l pl-4">
              <Label>API Rate Limit (requests/hour)</Label>
              <Input
                type="number"
                min={10}
                max={10000}
                value={formData.apiRateLimit}
                onChange={(e) =>
                  setFormData({ ...formData, apiRateLimit: Number(e.target.value) })
                }
                disabled={!isAdmin}
                className="w-32"
              />
            </div>
          )}
        </div>

        {/* IP Allowlist */}
        <div className="space-y-2 border-t pt-4">
          <Label>Allowed IP Ranges (CIDR notation)</Label>
          <textarea
            value={ipRangesText}
            onChange={(e) => setIpRangesText(e.target.value)}
            disabled={!isAdmin}
            placeholder="192.168.1.0/24&#10;10.0.0.0/8"
            className="w-full h-24 px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to allow all IPs. One range per line.
          </p>
        </div>

        {/* Save Button */}
        {isAdmin && (
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
        )}
      </CardContent>
      </Card>

      <SettingsVersionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        orgId={orgId}
        settingsType="security"
      />
    </>
  );
}
