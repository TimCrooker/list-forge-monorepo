import { GlobalRole, OrgRole } from '@listforge/core-types';

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
  orgName: string;
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
  status: string;
  createdAt: string;
  role?: OrgRole;
}

