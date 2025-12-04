import { GlobalRole } from '@listforge/core-types';
import { UserDto } from './auth';
import { AdminUserDto } from './admin';

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface UpdateUserResponse {
  user: UserDto;
}

export interface AdminUpdateUserRequest {
  globalRole?: GlobalRole;
}

export interface AdminUpdateUserResponse {
  user: AdminUserDto;
}

