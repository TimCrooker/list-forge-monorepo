import { GlobalRole } from '@listforge/core-types';
import { UserDto } from './auth';

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
  user: UserDto;
}

