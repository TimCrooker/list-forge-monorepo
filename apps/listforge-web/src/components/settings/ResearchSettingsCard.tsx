import { useState, useEffect } from 'react';
import {
  useGetResearchSettingsQuery,
  useUpdateResearchSettingsMutation,
} from '@listforge/api-rtk';
import { ResearchSettings } from '@listforge/core-types';
import { Loader2, Microscope, Save, History, AlertTriangle } from 'lucide-react';
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
  Slider,
  Skeleton,
  Alert,
  AlertDescription,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

const DEFAULT_RESEARCH_SETTINGS: ResearchSettings = {
  enableAutoApproval: false,
  autoApproveThreshold: 0.90,
  spotCheckThreshold: 0.70,
  minCompsForAutoApproval: 5,
  maxAutoApprovalsPerDay: 100,
};

interface ResearchSettingsCardProps {
  orgId: string;
}

export function ResearchSettingsCard({ orgId }: ResearchSettingsCardProps) {
  const { data, isLoading } = useGetResearchSettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateResearchSettingsMutation();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [formData, setFormData] = useState<ResearchSettings>({
    ...DEFAULT_RESEARCH_SETTINGS,
  });

  useEffect(() => {
    if (data?.settings) {
      setFormData(data.settings);
    }
  }, [data]);

  const handleSave = async () => {
    // Validate thresholds
    if (formData.spotCheckThreshold >= formData.autoApproveThreshold) {
      showError('Spot-check threshold must be lower than auto-approve threshold');
      return;
    }

    try {
      await updateSettings({
        orgId,
        data: formData,
      }).unwrap();
      showSuccess('Research settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save research settings');
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                Research & Review Routing
              </CardTitle>
              <CardDescription>
                Configure confidence-based routing for AI research results.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Approval Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto-Approval</Label>
              <p className="text-xs text-muted-foreground">
                Automatically approve high-confidence items without human review
              </p>
            </div>
            <Switch
              checked={formData.enableAutoApproval}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableAutoApproval: checked })
              }
            />
          </div>

          {formData.enableAutoApproval && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Auto-approval is enabled. High-confidence items will skip manual review.
                Review the thresholds below carefully.
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-Approve Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Approve Threshold</Label>
                <p className="text-xs text-muted-foreground">
                  Items above this confidence level may be auto-approved
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {Math.round(formData.autoApproveThreshold * 100)}%
              </span>
            </div>
            <Slider
              min={80}
              max={100}
              step={1}
              value={[Math.round(formData.autoApproveThreshold * 100)]}
              onValueChange={([value]) =>
                setFormData({ ...formData, autoApproveThreshold: value / 100 })
              }
              disabled={!formData.enableAutoApproval}
            />
          </div>

          {/* Spot-Check Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Spot-Check Threshold</Label>
                <p className="text-xs text-muted-foreground">
                  Items above this level get quick spot-check review (recommended approve)
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {Math.round(formData.spotCheckThreshold * 100)}%
              </span>
            </div>
            <Slider
              min={50}
              max={95}
              step={1}
              value={[Math.round(formData.spotCheckThreshold * 100)]}
              onValueChange={([value]) =>
                setFormData({ ...formData, spotCheckThreshold: value / 100 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Items below this threshold require full review
            </p>
          </div>

          {/* Threshold Visualization */}
          <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
            <Label className="text-sm font-medium">Review Routing</Label>
            <div className="flex h-6 rounded overflow-hidden text-xs">
              <div
                className="bg-red-500/80 flex items-center justify-center text-white"
                style={{ width: `${formData.spotCheckThreshold * 100}%` }}
              >
                {Math.round(formData.spotCheckThreshold * 100) > 20 && 'Full Review'}
              </div>
              <div
                className="bg-yellow-500/80 flex items-center justify-center text-white"
                style={{
                  width: `${(formData.autoApproveThreshold - formData.spotCheckThreshold) * 100}%`,
                }}
              >
                {(formData.autoApproveThreshold - formData.spotCheckThreshold) * 100 > 15 &&
                  'Spot-Check'}
              </div>
              {formData.enableAutoApproval && (
                <div
                  className="bg-green-500/80 flex items-center justify-center text-white"
                  style={{ width: `${(1 - formData.autoApproveThreshold) * 100}%` }}
                >
                  {(1 - formData.autoApproveThreshold) * 100 > 8 && 'Auto'}
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{Math.round(formData.spotCheckThreshold * 100)}%</span>
              <span>{Math.round(formData.autoApproveThreshold * 100)}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Auto-Approval Requirements */}
          {formData.enableAutoApproval && (
            <div className="space-y-4 border-t pt-4">
              <Label className="text-sm font-medium">Auto-Approval Requirements</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Validated Comps</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.minCompsForAutoApproval}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minCompsForAutoApproval: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum validated comps required for auto-approval
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Auto-Approvals/Day</Label>
                  <Input
                    type="number"
                    min={10}
                    max={1000}
                    value={formData.maxAutoApprovalsPerDay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxAutoApprovalsPerDay: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Safety limit on daily auto-approvals
                  </p>
                </div>
              </div>
            </div>
          )}

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
        settingsType="research"
      />
    </>
  );
}
