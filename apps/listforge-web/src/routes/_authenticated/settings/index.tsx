import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useDispatch, useSelector } from 'react-redux';
import { useMeQuery, useSwitchOrgMutation, useListOrgsQuery } from '@listforge/api-rtk';
import { setCurrentOrg, logout } from '@/store/authSlice';
import { RootState } from '@/store/store';
import { UserProfile } from '@listforge/ui';
import { Store, Users, LogOut, Shield } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@listforge/ui';
import { showSuccess } from '@/utils/toast';

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { data: meData } = useMeQuery();
  const { data: orgsData } = useListOrgsQuery();
  const [switchOrg] = useSwitchOrgMutation();

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
      // Error toast shown automatically
      console.error('Failed to switch org:', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate({ to: '/login' });
  };

  if (!meData?.user) {
    return null;
  }

  return (
    <div className="w-full max-w-none space-y-6 py-6 px-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* User Profile */}
      <UserProfile
        user={{
          name: meData.user.name,
          email: meData.user.email,
          role: meData.user.globalRole,
          status: 'active',
          verified: true,
          joinDate: meData.user.createdAt,
        }}
        onEdit={() => {
          // TODO: Implement edit profile
        }}
      />

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
            Connect eBay, Amazon, and other marketplace accounts to publish your listings
          </p>
          <Link to="/settings/marketplaces" search={{ code: undefined, state: undefined, spapi_oauth_code: undefined, selling_partner_id: undefined }}>
            <Button variant="outline">
              <Store className="mr-2 h-4 w-4" />
              Manage Connections
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organizations
          </CardTitle>
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
                {currentOrg?.id !== org.id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchOrg(org.id)}
                  >
                    Switch
                  </Button>
                ) : (
                  <Badge variant="default">Current</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

