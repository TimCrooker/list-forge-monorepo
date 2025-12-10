import { useState, useEffect } from 'react';
import {
  useGetTeamSettingsQuery,
  useUpdateTeamSettingsMutation,
} from '@listforge/api-rtk';
import { TeamSettings } from '@listforge/core-types';
import { Loader2, Users, Save, History } from 'lucide-react';
import { SettingsVersionHistory } from './SettingsVersionHistory';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Skeleton,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

interface TeamSettingsCardProps {
  orgId: string;
}

export function TeamSettingsCard({ orgId }: TeamSettingsCardProps) {
  const { data, isLoading } = useGetTeamSettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateTeamSettingsMutation();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [formData, setFormData] = useState<TeamSettings>({
    autoAssignReviewer: true,
    reviewerRotation: 'round_robin',
    requireDualReview: false,
    allowMembersToPublish: true,
    requireAdminApproval: false,
    allowBulkOperations: true,
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
      showSuccess('Team settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save team settings');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
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
                <Users className="h-5 w-5" />
                Team Settings
              </CardTitle>
              <CardDescription>
                Configure team collaboration and review workflow settings.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Reviewer Rotation */}
        <div className="space-y-2">
          <Label>Reviewer Rotation</Label>
          <Select
            value={formData.reviewerRotation}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                reviewerRotation: value as 'round_robin' | 'manual' | 'least_busy',
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Round Robin</SelectItem>
              <SelectItem value="manual">Manual Assignment</SelectItem>
              <SelectItem value="least_busy">Least Busy</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How items are assigned to reviewers
          </p>
        </div>

        {/* Toggles */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Assign Reviewer</Label>
              <p className="text-xs text-muted-foreground">
                Automatically assign reviewers to new items
              </p>
            </div>
            <Switch
              checked={formData.autoAssignReviewer}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, autoAssignReviewer: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Dual Review</Label>
              <p className="text-xs text-muted-foreground">
                Require two reviewers to approve items
              </p>
            </div>
            <Switch
              checked={formData.requireDualReview}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requireDualReview: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Members to Publish</Label>
              <p className="text-xs text-muted-foreground">
                Non-admin members can publish listings
              </p>
            </div>
            <Switch
              checked={formData.allowMembersToPublish}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowMembersToPublish: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Admin Approval</Label>
              <p className="text-xs text-muted-foreground">
                Admin must approve all items before publishing
              </p>
            </div>
            <Switch
              checked={formData.requireAdminApproval}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requireAdminApproval: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Bulk Operations</Label>
              <p className="text-xs text-muted-foreground">
                Enable bulk approve, reject, and publish
              </p>
            </div>
            <Switch
              checked={formData.allowBulkOperations}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowBulkOperations: checked })
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
        settingsType="team"
      />
    </>
  );
}
