import { GlobalRole } from './roles';

export interface User {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  createdAt: Date;
  lastLoginAt: Date | null;
}

