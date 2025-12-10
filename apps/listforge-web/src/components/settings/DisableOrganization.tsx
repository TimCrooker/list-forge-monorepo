import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDisableTeamMutation, useGetOrgQuery } from '@listforge/api-rtk';
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
  LoadingButton,
  Alert,
  AlertDescription,
} from '@listforge/ui';
import { AlertTriangle, UserMinus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Component that allows organization owners to disable team mode
 * and return to personal workspace mode.
 *
 * Requirements:
 * - Must be organization owner
 * - Must have exactly 1 member (remove others first)
 * - Shows warning about what will happen
 */
export function DisableOrganization() {
  const [showDialog, setShowDialog] = useState(false);
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const [disableTeam, { isLoading }] = useDisableTeamMutation();

  // Get full org details to check member count
  const { data: orgDetail, isLoading: isLoadingOrg } = useGetOrgQuery(
    currentOrg?.id!,
    { skip: !currentOrg?.id },
  );

  const memberCount = orgDetail?.members?.length || 0;
  const canDisable = memberCount === 1;

  const handleDisable = async () => {
    if (!currentOrg?.id) {
      toast.error('No organization found');
      return;
    }

    try {
      await disableTeam({ orgId: currentOrg.id }).unwrap();

      toast.success('Switched to personal workspace mode');
      setShowDialog(false);
    } catch (error: any) {
      console.error('Failed to disable organization:', error);
      toast.error(
        error?.data?.message ||
          'Failed to disable organization. Please try again.',
      );
    }
  };

  if (isLoadingOrg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disable Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Disable Organization
          </CardTitle>
          <CardDescription>
            Switch back to personal workspace mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!canDisable && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You must remove all other team members before disabling organization mode.
                  Currently {memberCount} member{memberCount !== 1 ? 's' : ''} in this organization.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-medium">What happens when you disable:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc ml-4">
                <li>Organization will switch to personal workspace mode</li>
                <li>Name will change to "{currentOrg?.name?.replace(/.*/, (name) => name.split(' ')[0])}'s Workspace"</li>
                <li>Team features will be hidden</li>
                <li>All items and data will be preserved</li>
                <li>You can re-enable organization mode anytime</li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowDialog(true)}
              disabled={!canDisable}
              className="w-full"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Disable Organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Disable Organization Mode?
            </DialogTitle>
            <DialogDescription>
              This will switch your organization back to a personal workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">This action will:</p>
                  <ul className="list-disc ml-4 space-y-1 text-sm">
                    <li>Hide all team features</li>
                    <li>Change organization name to personal workspace</li>
                    <li>Keep all your items and data safe</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              You can enable organization mode again at any time from settings.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={handleDisable}
              isLoading={isLoading}
              loadingText="Disabling..."
            >
              Disable Organization
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
