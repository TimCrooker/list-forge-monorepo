import { Request } from 'express';
import { GlobalRole } from '@listforge/core-types';
import { User } from '../../users/entities/user.entity';

/**
 * JWT payload stored in request after authentication
 */
export interface JwtUserPayload {
  userId: string;
  globalRole: GlobalRole;
  currentOrgId: string;
}

/**
 * Express request with JWT authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: JwtUserPayload;
}

/**
 * Express request with local strategy authenticated user (full User entity)
 */
export interface LocalAuthenticatedRequest extends Request {
  user: User;
}

