import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useMeQuery,
  useSwitchOrgMutation,
  useListOrgsQuery,
  useUpdateUserMutation,
  useCreateOrgMutation,
} from '@listforge/api-rtk';
import { setCurrentOrg, logout, setUser } from '@/store/authSlice';
import { RootState } from '@/store/store';
import { UserProfile } from '@listforge/ui';
import {
  Store,
  Users,
  LogOut,
  Shield,
  Plus,
  Pencil,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
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
} from '@listforge/ui';
import { showSuccess, showError } from '@/utils/toast';

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { data: meData, refetch: refetchMe } = useMeQuery();
  const { data: orgsData, refetch: refetchOrgs } = useListOrgsQuery();
  const [switchOrg] = useSwitchOrgMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  const [createOrg, { isLoading: isCreatingOrg }] = useCreateOrgMutation();

  // Profile edit state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Create org state
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const handleSwitchOrg = async (orgId: string) => {
    try {
      const result = await switchOrg({ orgId }).unwrap();
      dispatch(
        setCurrentOrg({
          org: result.org,
          token: result.token,
        }),
      );
      showSuccess('Organization switched successfully');
    } catch (err) {
      console.error('Failed to switch org:', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate({ to: '/login' });
  };

  const handleEditProfile = () => {
    if (meData?.user) {
      setEditName(meData.user.name);
      setEditEmail(meData.user.email);
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!meData?.user) return;

    try {
      const result = await updateUser({
        userId: meData.user.id,
        data: {
          name: editName,
          email: editEmail,
        },
      }).unwrap();

      // Update local state
      dispatch(setUser(result.user));
      await refetchMe();

      showSuccess('Profile updated successfully');
      setIsEditProfileOpen(false);
    } catch (err) {
      showError('Failed to update profile');
      console.error('Failed to update profile:', err);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;

    try {
      await createOrg({ name: newOrgName.trim() }).unwrap();
      await refetchOrgs();
      showSuccess('Organization created successfully');
      setIsCreateOrgOpen(false);
      setNewOrgName('');
    } catch (err) {
      showError('Failed to create organization');
      console.error('Failed to create org:', err);
    }
  };

  if (!meData?.user) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleEditProfile}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent>
          <UserProfile
            user={{
              name: meData.user.name,
              email: meData.user.email,
              role: meData.user.globalRole,
              status: 'active',
              verified: true,
              joinDate: meData.user.createdAt,
            }}
          />
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditProfileOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isUpdatingUser}>
              {isUpdatingUser ? (
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

      {/* Marketplace Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Marketplace Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Connect eBay, Amazon, and other marketplace accounts to publish your
            listings
          </p>
          <Link
            to="/settings/marketplaces"
            search={{
              code: undefined,
              state: undefined,
              spapi_oauth_code: undefined,
              selling_partner_id: undefined,
            }}
          >
            <Button variant="outline">
              <Store className="mr-2 h-4 w-4" />
              Manage Connections
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organizations
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateOrgOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orgsData?.orgs.map((org) => (
              <div
                key={org.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  currentOrg?.id === org.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {org.role}
                      </Badge>
                      {org.status === 'active' && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentOrg?.id === org.id ? (
                    <Badge variant="default">Current</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchOrg(org.id)}
                    >
                      Switch
                    </Button>
                  )}
                  <Link to="/settings/organization" search={{ id: org.id }}>
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to collaborate with your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="My Organization"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOrgOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={isCreatingOrg || !newOrgName.trim()}
            >
              {isCreatingOrg ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
