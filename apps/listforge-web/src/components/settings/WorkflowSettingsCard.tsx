import { useState, useEffect } from 'react';
import {
  useGetWorkflowSettingsQuery,
  useUpdateWorkflowSettingsMutation,
} from '@listforge/api-rtk';
import { WorkflowSettings } from '@listforge/core-types';
import { Loader2, Cpu, Save, History } from 'lucide-react';
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
  Slider,
  Skeleton,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

interface WorkflowSettingsCardProps {
  orgId: string;
}

export function WorkflowSettingsCard({ orgId }: WorkflowSettingsCardProps) {
  const { data, isLoading } = useGetWorkflowSettingsQuery(orgId);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateWorkflowSettingsMutation();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [formData, setFormData] = useState<WorkflowSettings>({
    aiProvider: 'openai',
    defaultModel: 'gpt-4o',
    confidenceThreshold: 0.75,
    enableAutoResearch: true,
    maxResearchRetries: 3,
    researchTimeoutMinutes: 30,
    enableOCR: true,
    enableWebSearch: true,
    maxConcurrentWorkflows: 5,
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
      showSuccess('Workflow settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save workflow settings');
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
                <Cpu className="h-5 w-5" />
                Workflow Settings
              </CardTitle>
              <CardDescription>
                Configure AI-powered research and workflow automation settings.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Provider */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select
              value={formData.aiProvider}
              onValueChange={(value) =>
                setFormData({ ...formData, aiProvider: value as 'openai' | 'anthropic' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Model</Label>
            <Input
              value={formData.defaultModel}
              onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
              placeholder="gpt-4o"
            />
          </div>
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Confidence Threshold</Label>
            <span className="text-sm font-medium">
              {Math.round(formData.confidenceThreshold * 100)}%
            </span>
          </div>
          <Slider
            min={50}
            max={100}
            step={5}
            value={[Math.round(formData.confidenceThreshold * 100)]}
            onValueChange={([value]) =>
              setFormData({ ...formData, confidenceThreshold: value / 100 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Minimum confidence score required for auto-approval
          </p>
        </div>

        {/* Research Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Max Research Retries</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={formData.maxResearchRetries}
              onChange={(e) =>
                setFormData({ ...formData, maxResearchRetries: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Research Timeout (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={120}
              value={formData.researchTimeoutMinutes}
              onChange={(e) =>
                setFormData({ ...formData, researchTimeoutMinutes: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Max Concurrent Workflows</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={formData.maxConcurrentWorkflows}
            onChange={(e) =>
              setFormData({ ...formData, maxConcurrentWorkflows: Number(e.target.value) })
            }
            className="w-32"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto Research</Label>
              <p className="text-xs text-muted-foreground">
                Automatically start research when items are created
              </p>
            </div>
            <Switch
              checked={formData.enableAutoResearch}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableAutoResearch: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable OCR</Label>
              <p className="text-xs text-muted-foreground">
                Extract text from images using OCR
              </p>
            </div>
            <Switch
              checked={formData.enableOCR}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableOCR: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Web Search</Label>
              <p className="text-xs text-muted-foreground">
                Search the web for additional product information
              </p>
            </div>
            <Switch
              checked={formData.enableWebSearch}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableWebSearch: checked })
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
        settingsType="workflow"
      />
    </>
  );
}
