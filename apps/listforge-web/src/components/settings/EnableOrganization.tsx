import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useEnableTeamMutation } from '@listforge/api-rtk';
import { RootState } from '@/store/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  LoadingButton,
} from '@listforge/ui';
import { Users, CheckCircle, Zap, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Component that allows users to enable team/organization mode
 * from their personal workspace.
 *
 * Displays:
 * - Benefits of team mode
 * - Dialog to enter organization name
 * - Success state after enabling
 */
export function EnableOrganization() {
  const [showDialog, setShowDialog] = useState(false);
  const [orgName, setOrgName] = useState('');
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const [enableTeam, { isLoading }] = useEnableTeamMutation();

  const handleEnable = async () => {
    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    if (!currentOrg?.id) {
      toast.error('No organization found');
      return;
    }

    try {
      await enableTeam({
        orgId: currentOrg.id,
        data: { name: orgName },
      }).unwrap();

      toast.success('Organization enabled! You can now invite team members.');
      setShowDialog(false);
      setOrgName('');
    } catch (error: any) {
      console.error('Failed to enable organization:', error);
      toast.error(
        error?.data?.message || 'Failed to enable organization. Please try again.',
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enable Organization
          </CardTitle>
          <CardDescription>
            Working alone? Keep it simple. Need a team? Enable organization mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-medium mb-3">With organizations you can:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">
                    <strong>Invite team members</strong> to collaborate on items
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">
                    <strong>Assign items</strong> to specific team members
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">
                    <strong>Review workflows</strong> with dual approval
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">
                    <strong>Track team activity</strong> and performance
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">
                    <strong>Shared workflows</strong> and automation
                  </span>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Your items and data stay the same - you just unlock new features!
              </p>
            </div>

            {/* CTA */}
            <Button onClick={() => setShowDialog(true)} size="lg" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enable Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Enter a name for your organization. You can change this later in settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="org-name" className="text-sm font-medium">
                Organization Name
              </label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Resale Co."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && orgName.trim()) {
                    handleEnable();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Current: {currentOrg?.name}
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                What happens next:
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground ml-6 list-disc">
                <li>Your organization name will be updated</li>
                <li>Team features will become available</li>
                <li>You can invite members from settings</li>
                <li>All your items will be preserved</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleEnable}
              isLoading={isLoading}
              loadingText="Enabling..."
              disabled={!orgName.trim()}
            >
              Enable Organization
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
