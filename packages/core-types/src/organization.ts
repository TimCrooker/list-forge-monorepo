import { OrgRole } from './roles';

export type OrgStatus = 'active' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  status: OrgStatus;
  createdAt: Date;
}

export interface UserOrganization {
  userId: string;
  orgId: string;
  role: OrgRole;
}

