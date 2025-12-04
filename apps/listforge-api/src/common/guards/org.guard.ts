import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrganization } from '../../organizations/entities/user-organization.entity';
import { RequestContext } from '../interfaces/request-context.interface';

@Injectable()
export class OrgGuard implements CanActivate {
  constructor(
    @InjectRepository(UserOrganization)
    private userOrgRepo: Repository<UserOrganization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.currentOrgId) {
      throw new UnauthorizedException('No organization context');
    }

    const membership = await this.userOrgRepo.findOne({
      where: {
        userId: user.userId,
        orgId: user.currentOrgId,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Not a member of this organization');
    }

    const ctx: RequestContext = {
      userId: user.userId,
      globalRole: user.globalRole,
      currentOrgId: user.currentOrgId,
      orgRole: membership.role,
    };

    request.context = ctx;
    return true;
  }
}

