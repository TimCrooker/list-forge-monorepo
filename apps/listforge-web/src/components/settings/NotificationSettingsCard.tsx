import { useState, useEffect } from 'react';
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from '@listforge/api-rtk';
import { NotificationSettings } from '@listforge/core-types';
import { Loader2, Bell, Save } from 'lucide-react';
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
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

interface NotificationSettingsCardProps {
  orgId: string;
}

export function NotificationSettingsCard({ orgId }: NotificationSettingsCardProps) {
  const { data, isLoading } = useGetNotificationSettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateNotificationSettingsMutation();

  const [formData, setFormData] = useState<NotificationSettings>({
    emailNotifications: {
      enabled: true,
      onItemReady: true,
      onPublishSuccess: true,
      onPublishFailure: true,
      onLowConfidence: true,
    },
    webhooks: {
      enabled: false,
      url: null,
      events: [],
      secret: null,
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
          emailNotifications: formData.emailNotifications,
          webhooks: formData.webhooks,
        },
      }).unwrap();
      showSuccess('Notification settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save notification settings');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
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
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how you receive notifications about your listings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for important events
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications.enabled}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  emailNotifications: { ...formData.emailNotifications, enabled: checked },
                })
              }
            />
          </div>

          {formData.emailNotifications.enabled && (
            <div className="ml-6 space-y-3 border-l pl-4">
              <div className="flex items-center justify-between">
                <Label>Item Ready for Review</Label>
                <Switch
                  checked={formData.emailNotifications.onItemReady}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      emailNotifications: { ...formData.emailNotifications, onItemReady: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Publish Success</Label>
                <Switch
                  checked={formData.emailNotifications.onPublishSuccess}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      emailNotifications: { ...formData.emailNotifications, onPublishSuccess: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Publish Failure</Label>
                <Switch
                  checked={formData.emailNotifications.onPublishFailure}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      emailNotifications: { ...formData.emailNotifications, onPublishFailure: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Low Confidence Warning</Label>
                <Switch
                  checked={formData.emailNotifications.onLowConfidence}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      emailNotifications: { ...formData.emailNotifications, onLowConfidence: checked },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Webhooks Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                Send event data to external services
              </p>
            </div>
            <Switch
              checked={formData.webhooks.enabled}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  webhooks: { ...formData.webhooks, enabled: checked },
                })
              }
            />
          </div>

          {formData.webhooks.enabled && (
            <div className="ml-6 space-y-4 border-l pl-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  type="url"
                  value={formData.webhooks.url || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      webhooks: { ...formData.webhooks, url: e.target.value || null },
                    })
                  }
                  placeholder="https://your-server.com/webhook"
                />
                <p className="text-xs text-muted-foreground">
                  Must use HTTPS (except for localhost)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <Input
                  type="password"
                  value={formData.webhooks.secret || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      webhooks: { ...formData.webhooks, secret: e.target.value || null },
                    })
                  }
                  placeholder="Min 16 characters"
                />
                <p className="text-xs text-muted-foreground">
                  Used to sign webhook payloads for verification
                </p>
              </div>
            </div>
          )}
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
