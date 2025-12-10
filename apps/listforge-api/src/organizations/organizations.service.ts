import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateOrgRequest,
  CreateOrgResponse,
  OrgDetailResponse,
  AddOrgMemberRequest,
  AddOrgMemberResponse,
  UpdateOrgMemberRequest,
  UpdateOrgMemberResponse,
  OrgMemberDto,
  EnableTeamRequest,
  EnableTeamResponse,
  DisableTeamResponse,
} from '@listforge/api-types';
import { Organization } from './entities/organization.entity';
import { UserOrganization } from './entities/user-organization.entity';
import { User } from '../users/entities/user.entity';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { OrgRole } from '@listforge/core-types';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrgRepo: Repository<UserOrganization>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findUserOrgs(userId: string): Promise<Organization[]> {
    const memberships = await this.userOrgRepo.find({
      where: { userId },
      relations: ['organization'],
    });
    return memberships.map((m) => m.organization);
  }

  async create(
    ctx: RequestContext,
    data: CreateOrgRequest,
  ): Promise<CreateOrgResponse> {
    const org = this.orgRepo.create({
      name: data.name,
      type: 'team', // Explicitly created orgs are team orgs
      status: 'active',
    });
    const savedOrg = await this.orgRepo.save(org);

    // Add creator as owner
    const membership = this.userOrgRepo.create({
      userId: ctx.userId,
      orgId: savedOrg.id,
      role: 'owner',
    });
    await this.userOrgRepo.save(membership);

    return {
      org: {
        id: savedOrg.id,
        name: savedOrg.name,
        type: savedOrg.type,
        status: savedOrg.status,
        createdAt: savedOrg.createdAt.toISOString(),
        role: 'owner',
      },
    };
  }

  async findOne(id: string, ctx: RequestContext): Promise<Organization> {
    // Verify user is a member
    const membership = await this.userOrgRepo.findOne({
      where: { userId: ctx.userId, orgId: id },
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const org = await this.orgRepo.findOne({
      where: { id },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async getDetail(
    id: string,
    ctx: RequestContext,
  ): Promise<OrgDetailResponse> {
    const org = await this.findOne(id, ctx);

    const memberships = await this.userOrgRepo.find({
      where: { orgId: id },
      relations: ['user'],
    });

    const members: OrgMemberDto[] = memberships.map((m) => ({
      userId: m.userId,
      orgId: m.orgId,
      role: m.role,
      user: {
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
      },
    }));

    const userMembership = memberships.find((m) => m.userId === ctx.userId);

    return {
      org: {
        id: org.id,
        name: org.name,
        type: org.type,
        status: org.status,
        createdAt: org.createdAt.toISOString(),
        role: userMembership?.role,
      },
      members,
    };
  }

  async addMember(
    orgId: string,
    ctx: RequestContext,
    data: AddOrgMemberRequest,
  ): Promise<AddOrgMemberResponse> {
    // Verify user has permission (owner or admin)
    const userMembership = await this.userOrgRepo.findOne({
      where: { userId: ctx.userId, orgId },
    });
    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const user = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existing = await this.userOrgRepo.findOne({
      where: { userId: user.id, orgId },
    });
    if (existing) {
      throw new ForbiddenException('User is already a member');
    }

    const membership = this.userOrgRepo.create({
      userId: user.id,
      orgId,
      role: data.role,
    });
    const saved = await this.userOrgRepo.save(membership);

    return {
      member: {
        userId: saved.userId,
        orgId: saved.orgId,
        role: saved.role,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    };
  }

  async updateMember(
    orgId: string,
    userId: string,
    ctx: RequestContext,
    data: UpdateOrgMemberRequest,
  ): Promise<UpdateOrgMemberResponse> {
    // Verify user has permission (owner or admin)
    const userMembership = await this.userOrgRepo.findOne({
      where: { userId: ctx.userId, orgId },
    });
    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Cannot change owner role unless you're the owner
    if (data.role !== 'owner' && userMembership.role !== 'owner') {
      throw new ForbiddenException('Only owners can change roles');
    }

    const membership = await this.userOrgRepo.findOne({
      where: { userId, orgId },
      relations: ['user'],
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    membership.role = data.role;
    const saved = await this.userOrgRepo.save(membership);

    return {
      member: {
        userId: saved.userId,
        orgId: saved.orgId,
        role: saved.role,
        user: {
          id: membership.user.id,
          email: membership.user.email,
          name: membership.user.name,
        },
      },
    };
  }

  // ============================================================================
  // Organization Type Management (Personal vs Team)
  // ============================================================================

  async enableTeam(
    orgId: string,
    ctx: RequestContext,
    data: EnableTeamRequest,
  ): Promise<EnableTeamResponse> {
    // Verify user is owner
    const membership = await this.userOrgRepo.findOne({
      where: { userId: ctx.userId, orgId },
    });
    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only owner can enable team mode');
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (org.type === 'team') {
      throw new BadRequestException('Organization is already in team mode');
    }

    // Update to team type
    org.type = 'team';
    org.name = data.name;
    const savedOrg = await this.orgRepo.save(org);

    return {
      org: {
        id: savedOrg.id,
        name: savedOrg.name,
        type: savedOrg.type,
        status: savedOrg.status,
        createdAt: savedOrg.createdAt.toISOString(),
        role: 'owner',
      },
    };
  }

  async disableTeam(
    orgId: string,
    ctx: RequestContext,
  ): Promise<DisableTeamResponse> {
    // Verify user is owner
    const membership = await this.userOrgRepo.findOne({
      where: { userId: ctx.userId, orgId },
    });
    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only owner can disable team mode');
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (org.type === 'personal') {
      throw new BadRequestException('Organization is already in personal mode');
    }

    // Check only 1 member remains
    const memberCount = await this.getMemberCount(orgId);
    if (memberCount > 1) {
      throw new BadRequestException(
        'Remove all other members before disabling team mode',
      );
    }

    // Get user for generating workspace name
    const user = await this.userRepo.findOne({ where: { id: ctx.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update to personal type
    org.type = 'personal';
    org.name = `${user.name}'s Workspace`;
    const savedOrg = await this.orgRepo.save(org);

    return {
      org: {
        id: savedOrg.id,
        name: savedOrg.name,
        type: savedOrg.type,
        status: savedOrg.status,
        createdAt: savedOrg.createdAt.toISOString(),
        role: 'owner',
      },
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  async getMemberCount(orgId: string): Promise<number> {
    return this.userOrgRepo.count({ where: { orgId } });
  }

  async isPersonalOrg(orgId: string): Promise<boolean> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    return org?.type === 'personal';
  }

  async canAddMembers(orgId: string): Promise<boolean> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    return org?.type === 'team';
  }
}

