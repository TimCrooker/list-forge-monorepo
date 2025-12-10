import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { RequestContext } from '../interfaces/request-context.interface';

/**
 * Guard that ensures the organization is in team mode.
 * Use this guard on endpoints that are only available for team organizations,
 * such as adding members or accessing team-specific features.
 *
 * Must be used after OrgGuard to ensure request.context is populated.
 */
@Injectable()
export class TeamOrgGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ctx: RequestContext = request.context;

    if (!ctx || !ctx.currentOrgId) {
      throw new ForbiddenException('Organization context required');
    }

    const org = await this.orgRepo.findOne({
      where: { id: ctx.currentOrgId },
    });

    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    if (org.type !== 'team') {
      throw new ForbiddenException(
        'This feature requires organization mode. Enable it in settings to invite team members and access collaboration features.',
      );
    }

    return true;
  }
}
