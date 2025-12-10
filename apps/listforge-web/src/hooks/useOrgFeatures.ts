import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

/**
 * Hook to determine which features are available based on organization type
 *
 * Usage:
 * ```tsx
 * const { isPersonal, isTeam, canInviteMembers } = useOrgFeatures();
 *
 * if (isPersonal) {
 *   return <PersonalDashboard />;
 * }
 *
 * {canInviteMembers && <InviteButton />}
 * ```
 */
export function useOrgFeatures() {
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);

  const isPersonal = currentOrg?.type === 'personal';
  const isTeam = currentOrg?.type === 'team';

  return {
    // Mode flags
    isPersonal,
    isTeam,
    orgType: currentOrg?.type,

    // Feature flags - Team-only features
    canInviteMembers: isTeam,
    canAssignItems: isTeam,
    canAccessReviewQueue: isTeam,
    canViewTeamActivity: isTeam,
    canAccessTeamSettings: isTeam,
    canManageRoles: isTeam,
    canAccessBulkOperations: isTeam,

    // Action flags
    canEnableOrg: isPersonal,
    canDisableOrg: isTeam,

    // Organization data
    orgName: currentOrg?.name || 'Unknown',
    orgId: currentOrg?.id,
    orgStatus: currentOrg?.status,

    // UI helpers
    itemsLabel: isPersonal ? 'My Items' : 'Inventory',
    dashboardTitle: isPersonal ? 'My Dashboard' : 'Team Dashboard',
    settingsLabel: isPersonal ? 'Preferences' : 'Organization Settings',
  };
}
