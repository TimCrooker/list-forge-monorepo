import { GlobalRole, OrgRole } from '@listforge/core-types';

export interface RequestContext {
  userId: string;
  globalRole: GlobalRole;
  currentOrgId: string;
  orgRole: OrgRole;
}

