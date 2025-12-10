import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetOrgQuery,
  useAddOrgMemberMutation,
  useUpdateOrgMemberMutation,
  useMeQuery,
  useGetAutoPublishSettingsQuery,
  useUpdateAutoPublishSettingsMutation,
} from '@listforge/api-rtk';
import { RootState } from '@/store/store';
import {
  Users,
  Plus,
  Shield,
  Loader2,
  Crown,
  UserCircle,
  MoreVertical,
  Zap,
  Settings,
} from 'lucide-react';
import {
  WorkflowSettingsCard,
  NotificationSettingsCard,
  TeamSettingsCard,
  InventorySettingsCard,
  MarketplaceDefaultsCard,
  BillingSettingsCard,
  SecuritySettingsCard,
  EnableOrganization,
  DisableOrganization,
} from '@/components/settings';
import { useOrgFeatures } from '@/hooks';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Switch,
  Slider,
  AppContent,
  Separator,
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';
import type { OrgRole } from '@listforge/core-types';

export const Route = createFileRoute('/_authenticated/settings/organization')({
  component: OrganizationPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: search.id as string | undefined,
  }),
});

function OrganizationPage() {
  const search = useSearch({ from: '/_authenticated/settings/organization' });
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { data: meData } = useMeQuery();
  const { isPersonal, isTeam } = useOrgFeatures();

  // Use the ID from search params, or fall back to current org
  const orgId = search.id || currentOrg?.id;

  const { data, isLoading, refetch } = useGetOrgQuery(orgId!, {
    skip: !orgId,
  });
  const [addMember, { isLoading: isAddingMember }] = useAddOrgMemberMutation();
  const [updateMember, { isLoading: isUpdatingMember }] =
    useUpdateOrgMemberMutation();

  // Invite member state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');

  // Edit role state
  const [editingMember, setEditingMember] = useState<{
    userId: string;
    role: OrgRole;
  } | null>(null);

  // Auto-publish settings (Slice 7)
  const { data: autoPublishData, isLoading: isLoadingAutoPublish } =
    useGetAutoPublishSettingsQuery(orgId!, { skip: !orgId });
  const [updateAutoPublish, { isLoading: isUpdatingAutoPublish }] =
    useUpdateAutoPublishSettingsMutation();

  // Local state for auto-publish settings form
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoPublishConfidence, setAutoPublishConfidence] = useState(90);
  const [autoPublishMinComps, setAutoPublishMinComps] = useState(5);
  const [autoPublishMaxPrice, setAutoPublishMaxPrice] = useState<string>('');

  // Sync local state with server data
  useEffect(() => {
    if (autoPublishData?.settings) {
      setAutoPublishEnabled(autoPublishData.settings.enabled);
      setAutoPublishConfidence(Math.round(autoPublishData.settings.minConfidenceScore * 100));
      setAutoPublishMinComps(autoPublishData.settings.minValidatedComps);
      setAutoPublishMaxPrice(
        autoPublishData.settings.maxPriceThreshold !== null
          ? String(autoPublishData.settings.maxPriceThreshold)
          : ''
      );
    }
  }, [autoPublishData]);

  const handleSaveAutoPublishSettings = async () => {
    if (!orgId) return;

    try {
      await updateAutoPublish({
        orgId,
        data: {
          enabled: autoPublishEnabled,
          minConfidenceScore: autoPublishConfidence / 100,
          minValidatedComps: autoPublishMinComps,
          maxPriceThreshold: autoPublishMaxPrice ? Number(autoPublishMaxPrice) : null,
        },
      }).unwrap();
      showSuccess('Auto-publish settings saved');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save auto-publish settings');
      console.error('Failed to save auto-publish settings:', err);
    }
  };

  const handleInviteMember = async () => {
    if (!orgId || !inviteEmail.trim()) return;

    try {
      await addMember({
        orgId,
        data: {
          email: inviteEmail.trim(),
          role: inviteRole,
        },
      }).unwrap();

      await refetch();
      showSuccess('Member invited successfully');
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to invite member');
      console.error('Failed to invite member:', err);
    }
  };

  const handleUpdateRole = async () => {
    if (!orgId || !editingMember) return;

    try {
      await updateMember({
        orgId,
        userId: editingMember.userId,
        data: { role: editingMember.role },
      }).unwrap();

      await refetch();
      showSuccess('Member role updated');
      setEditingMember(null);
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to update role');
      console.error('Failed to update role:', err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const isOwnerOrAdmin = data?.members.some(
    (m) =>
      m.userId === meData?.user?.id && (m.role === 'owner' || m.role === 'admin'),
  );

  if (!orgId) {
    return (
      <AppContent
        title="Organization Settings"
        description="No organization selected"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please select an organization</p>
          </CardContent>
        </Card>
      </AppContent>
    );
  }

  if (isLoading) {
    return (
      <AppContent
        title="Loading..."
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Organization', href: '/settings/organization' },
        ]}
      >
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </AppContent>
    );
  }

  return (
    <AppContent
      title={data?.org.name || 'Organization'}
      description="Manage organization members and roles"
      actions={
        isOwnerOrAdmin && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )
      }
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: data?.org.name || 'Organization', href: '/settings/organization' },
      ]}
    >
      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({data?.members.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.user.name}</p>
                      {member.userId === meData?.user?.id && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                  {isOwnerOrAdmin &&
                    member.role !== 'owner' &&
                    member.userId !== meData?.user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingMember({
                                userId: member.userId,
                                role: member.role as OrgRole,
                              })
                            }
                          >
                            Change Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Publish Settings (Slice 7) */}
      {isOwnerOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto-Publish Settings
            </CardTitle>
            <CardDescription>
              Automatically publish high-confidence items after research completes.
              Items must meet all criteria to be auto-published.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingAutoPublish ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-publish-enabled" className="text-base">
                      Enable Auto-Publish
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically publish items that meet all criteria below
                    </p>
                  </div>
                  <Switch
                    id="auto-publish-enabled"
                    checked={autoPublishEnabled}
                    onCheckedChange={setAutoPublishEnabled}
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  {/* Confidence Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="confidence-threshold">
                        Minimum Confidence
                      </Label>
                      <span className="text-sm font-medium">
                        {autoPublishConfidence}%
                      </span>
                    </div>
                    <Slider
                      id="confidence-threshold"
                      min={70}
                      max={100}
                      step={5}
                      value={[autoPublishConfidence]}
                      onValueChange={([value]) => setAutoPublishConfidence(value)}
                      disabled={!autoPublishEnabled}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Items must have at least this confidence score to auto-publish
                    </p>
                  </div>

                  {/* Minimum Comps */}
                  <div className="space-y-2">
                    <Label htmlFor="min-comps">Minimum Validated Comps</Label>
                    <Input
                      id="min-comps"
                      type="number"
                      min={1}
                      max={20}
                      value={autoPublishMinComps}
                      onChange={(e) =>
                        setAutoPublishMinComps(Number(e.target.value) || 1)
                      }
                      disabled={!autoPublishEnabled}
                      className="w-32"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of validated comparable listings required
                    </p>
                  </div>

                  {/* Max Price Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor="max-price">
                      Maximum Price Threshold (Optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="max-price"
                        type="number"
                        min={0}
                        step={0.01}
                        value={autoPublishMaxPrice}
                        onChange={(e) => setAutoPublishMaxPrice(e.target.value)}
                        disabled={!autoPublishEnabled}
                        placeholder="No limit"
                        className="w-32"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave empty for no price limit. Items above this price will
                      require manual review.
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSaveAutoPublishSettings}
                    disabled={isUpdatingAutoPublish}
                  >
                    {isUpdatingAutoPublish ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Organization Type Management */}
      {isOwnerOrAdmin && (
        <>
          <Separator className="my-6" />
          {isPersonal ? (
            <EnableOrganization />
          ) : (
            <DisableOrganization />
          )}
        </>
      )}

      {/* Additional Settings Sections (Owner/Admin Only) */}
      {isOwnerOrAdmin && isTeam && orgId && (
        <>
          <Separator className="my-6" />
          <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>

          <div className="space-y-6">
            {/* Workflow Settings */}
            <WorkflowSettingsCard orgId={orgId} />

            {/* Notification Settings */}
            <NotificationSettingsCard orgId={orgId} />

            {/* Team Settings */}
            <TeamSettingsCard orgId={orgId} />

            {/* Inventory Settings */}
            <InventorySettingsCard orgId={orgId} />

            {/* Marketplace Defaults */}
            <MarketplaceDefaultsCard orgId={orgId} />

            {/* Billing Settings */}
            <BillingSettingsCard orgId={orgId} />

            {/* Security Settings (Admin/Owner only) */}
            <SecuritySettingsCard orgId={orgId} isAdmin={isOwnerOrAdmin} />
          </div>
        </>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Invite a new member to your organization by email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as OrgRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admins can invite members and manage settings
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={isAddingMember || !inviteEmail.trim()}
            >
              {isAddingMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inviting...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the member's role in this organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newRole">Role</Label>
              <Select
                value={editingMember?.role}
                onValueChange={(val) =>
                  editingMember &&
                  setEditingMember({ ...editingMember, role: val as OrgRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdatingMember}>
              {isUpdatingMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppContent>
  );
}
