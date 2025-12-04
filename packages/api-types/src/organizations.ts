import { OrgRole } from '@listforge/core-types';
import { OrgDto } from './auth';

export interface CreateOrgRequest {
  name: string;
}

export interface CreateOrgResponse {
  org: OrgDto;
}

export interface OrgMemberDto {
  userId: string;
  orgId: string;
  role: OrgRole;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface OrgDetailResponse {
  org: OrgDto;
  members: OrgMemberDto[];
}

export interface AddOrgMemberRequest {
  email: string;
  role: OrgRole;
}

export interface AddOrgMemberResponse {
  member: OrgMemberDto;
}

export interface UpdateOrgMemberRequest {
  role: OrgRole;
}

export interface UpdateOrgMemberResponse {
  member: OrgMemberDto;
}

