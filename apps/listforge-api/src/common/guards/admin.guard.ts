import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GlobalRole } from '@listforge/core-types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ctx = request.context;

    if (!ctx) {
      throw new ForbiddenException('No request context');
    }

    const allowedRoles: GlobalRole[] = ['staff', 'superadmin'];
    if (!allowedRoles.includes(ctx.globalRole)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

