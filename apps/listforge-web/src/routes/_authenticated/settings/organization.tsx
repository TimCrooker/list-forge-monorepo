import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetOrgQuery,
  useAddOrgMemberMutation,
  useUpdateOrgMemberMutation,
  useMeQuery,
} from '@listforge/api-rtk';
import { RootState } from '@/store/store';
import {
  ArrowLeft,
  Users,
  Plus,
  Shield,
  Loader2,
  Crown,
  UserCircle,
  MoreVertical,
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
  const navigate = useNavigate();
  const search = useSearch({ from: '/_authenticated/settings/organization' });
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { data: meData } = useMeQuery();

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
      <div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-6">
        <p className="text-muted-foreground">No organization selected</p>
        <Button onClick={() => navigate({ to: '/settings' })}>
          Back to Settings
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/settings' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{data?.org.name}</h1>
          <p className="text-muted-foreground mt-1">
            Manage organization members and roles
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

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
    </div>
  );
}
