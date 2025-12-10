import { GlobalRole, OrgRole, OrgType } from '@listforge/core-types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
  currentOrg: OrgDto | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  orgName?: string; // Optional - defaults to "{name}'s Workspace"
}

export interface RegisterResponse {
  token: string;
  user: UserDto;
  org: OrgDto;
}

export interface MeResponse {
  user: UserDto;
  orgs: OrgDto[];
  currentOrg: OrgDto | null;
}

export interface SwitchOrgRequest {
  orgId: string;
}

export interface SwitchOrgResponse {
  token: string;
  org: OrgDto;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface OrgDto {
  id: string;
  name: string;
  type: OrgType;
  status: string;
  createdAt: string;
  role?: OrgRole;
}

