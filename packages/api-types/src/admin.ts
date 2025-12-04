import { GlobalRole, OrgStatus, OrgRole } from '@listforge/core-types';
import { MarketplaceType, MarketplaceAccountStatus } from './marketplaces';

/**
 * Admin view of a user (includes more details than public UserDto)
 */
export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  createdAt: string;
  lastLoginAt: string | null;
  disabled: boolean;
}

/**
 * Admin view of an organization with stats
 */
export interface AdminOrgDto {
  id: string;
  name: string;
  status: OrgStatus;
  createdAt: string;
  memberCount: number;
}

/**
 * User organization membership (for admin detail view)
 */
export interface AdminUserOrgMembershipDto {
  orgId: string;
  orgName: string;
  role: OrgRole;
  orgStatus: OrgStatus;
  joinedAt: string;
}

/**
 * Admin view of user with org memberships
 */
export interface AdminUserDetailDto extends AdminUserDto {
  orgMemberships: AdminUserOrgMembershipDto[];
}

/**
 * Organization member (for admin org detail view)
 */
export interface AdminOrgMemberDto {
  userId: string;
  userName: string;
  userEmail: string;
  role: OrgRole;
  joinedAt: string;
}

/**
 * Admin view of organization with full details
 */
export interface AdminOrgDetailDto {
  id: string;
  name: string;
  status: OrgStatus;
  createdAt: string;
  memberCount: number;
  itemCount: number;
  marketplaceAccountCount: number;
  members: AdminOrgMemberDto[];
}

/**
 * Admin view of marketplace account (cross-org)
 */
export interface AdminMarketplaceAccountDto {
  id: string;
  orgId: string;
  orgName: string;
  userId: string;
  userName: string;
  marketplace: MarketplaceType;
  status: MarketplaceAccountStatus;
  remoteAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response for listing all users (admin)
 */
export interface AdminListUsersResponse {
  users: AdminUserDto[];
}

/**
 * Response for listing all organizations (admin)
 */
export interface AdminListOrgsResponse {
  orgs: AdminOrgDto[];
}

/**
 * Response for getting user detail (admin)
 */
export interface AdminGetUserDetailResponse {
  user: AdminUserDetailDto;
}

/**
 * Request to update org status
 */
export interface AdminUpdateOrgStatusRequest {
  status: OrgStatus;
}

/**
 * Response for updating org status
 */
export interface AdminUpdateOrgStatusResponse {
  org: AdminOrgDetailDto;
}

/**
 * Response for getting org detail (admin)
 */
export interface AdminGetOrgDetailResponse {
  org: AdminOrgDetailDto;
}

/**
 * Query params for listing marketplace accounts (admin)
 */
export interface AdminListMarketplaceAccountsQuery {
  marketplace?: MarketplaceType;
  status?: MarketplaceAccountStatus;
  orgId?: string;
}

/**
 * Response for listing marketplace accounts (admin)
 */
export interface AdminListMarketplaceAccountsResponse {
  accounts: AdminMarketplaceAccountDto[];
}

