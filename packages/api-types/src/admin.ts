import { GlobalRole, OrgStatus } from '@listforge/core-types';

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

