import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import {
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  AdminUserDto,
  AdminOrgDto,
  AdminListUsersResponse,
  AdminListOrgsResponse,
  SystemMetricsResponse,
  AdminUserDetailDto,
  AdminUserOrgMembershipDto,
  AdminGetUserDetailResponse,
  AdminOrgDetailDto,
  AdminOrgMemberDto,
  AdminGetOrgDetailResponse,
  AdminUpdateOrgStatusRequest,
  AdminUpdateOrgStatusResponse,
  AdminMarketplaceAccountDto,
  AdminListMarketplaceAccountsQuery,
  AdminListMarketplaceAccountsResponse,
} from '@listforge/api-types';
import { OrgStatus } from '@listforge/core-types';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { Item } from '../items/entities/item.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { MarketplaceAccount } from '../marketplaces/entities/marketplace-account.entity';
import { WorkflowRun } from '../ai-workflows/entities/workflow-run.entity';
import { QUEUE_AI_WORKFLOW, QUEUE_MARKETPLACE_PUBLISH, QUEUE_MARKETPLACE_SYNC } from '@listforge/queue-types';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrgRepo: Repository<UserOrganization>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(MetaListing)
    private metaListingRepo: Repository<MetaListing>,
    @InjectRepository(MarketplaceAccount)
    private marketplaceAccountRepo: Repository<MarketplaceAccount>,
    @InjectRepository(WorkflowRun)
    private workflowRunRepo: Repository<WorkflowRun>,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private aiWorkflowQueue: Queue,
    @InjectQueue(QUEUE_MARKETPLACE_PUBLISH)
    private marketplacePublishQueue: Queue,
    @InjectQueue(QUEUE_MARKETPLACE_SYNC)
    private marketplaceSyncQueue: Queue,
  ) {}

  async listUsers(): Promise<AdminListUsersResponse> {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
    });
    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        globalRole: u.globalRole,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() || null,
        disabled: u.disabled || false,
      })),
    };
  }

  async getUserDetail(userId: string): Promise<AdminGetUserDetailResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['memberships', 'memberships.organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberships: AdminUserOrgMembershipDto[] = user.memberships.map((membership) => {
      const org = membership.organization;
      return {
        orgId: membership.orgId,
        orgName: org?.name || 'Unknown',
        role: membership.role,
        orgStatus: (org?.status as OrgStatus) || 'active',
        joinedAt: org?.createdAt?.toISOString() || new Date().toISOString(),
      };
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        disabled: user.disabled || false,
        orgMemberships: memberships,
      },
    };
  }

  async disableUser(userId: string): Promise<AdminUpdateUserResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.disabled = true;
    const updated = await this.userRepo.save(user);

    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        globalRole: updated.globalRole,
        createdAt: updated.createdAt.toISOString(),
        lastLoginAt: updated.lastLoginAt?.toISOString() || null,
        disabled: updated.disabled || false,
      },
    };
  }

  async enableUser(userId: string): Promise<AdminUpdateUserResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.disabled = false;
    const updated = await this.userRepo.save(user);

    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        globalRole: updated.globalRole,
        createdAt: updated.createdAt.toISOString(),
        lastLoginAt: updated.lastLoginAt?.toISOString() || null,
        disabled: updated.disabled || false,
      },
    };
  }

  async listOrgs(): Promise<AdminListOrgsResponse> {
    const orgs = await this.orgRepo.find({
      order: { createdAt: 'DESC' },
    });

    const orgsWithStats: AdminOrgDto[] = await Promise.all(
      orgs.map(async (org) => {
        const memberCount = await this.userOrgRepo.count({
          where: { orgId: org.id },
        });
        return {
          id: org.id,
          name: org.name,
          status: org.status as OrgStatus,
          createdAt: org.createdAt.toISOString(),
          memberCount,
        };
      }),
    );

    return { orgs: orgsWithStats };
  }

  async updateUser(
    userId: string,
    data: AdminUpdateUserRequest,
  ): Promise<AdminUpdateUserResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.globalRole) {
      user.globalRole = data.globalRole;
    }

    const updated = await this.userRepo.save(user);

    return {
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        globalRole: updated.globalRole,
        createdAt: updated.createdAt.toISOString(),
        lastLoginAt: updated.lastLoginAt?.toISOString() || null,
        disabled: updated.disabled || false,
      },
    };
  }

  async getOrgDetail(orgId: string): Promise<AdminGetOrgDetailResponse> {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['members', 'members.user'],
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const memberCount = await this.userOrgRepo.count({
      where: { orgId: org.id },
    });

    const itemCount = await this.itemRepo.count({
      where: { orgId: org.id },
    });

    const marketplaceAccountCount = await this.marketplaceAccountRepo.count({
      where: { orgId: org.id },
    });

    const members: AdminOrgMemberDto[] = org.members.map((membership) => {
      const user = membership.user;
      return {
        userId: membership.userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown',
        role: membership.role,
        joinedAt: org.createdAt.toISOString(),
      };
    });

    return {
      org: {
        id: org.id,
        name: org.name,
        status: org.status as OrgStatus,
        createdAt: org.createdAt.toISOString(),
        memberCount,
        itemCount,
        marketplaceAccountCount,
        members,
      },
    };
  }

  async updateOrgStatus(
    orgId: string,
    data: AdminUpdateOrgStatusRequest,
  ): Promise<AdminUpdateOrgStatusResponse> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    org.status = data.status;
    await this.orgRepo.save(org);

    return this.getOrgDetail(orgId);
  }

  async listMarketplaceAccounts(
    query: AdminListMarketplaceAccountsQuery,
  ): Promise<AdminListMarketplaceAccountsResponse> {
    const queryBuilder = this.marketplaceAccountRepo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.organization', 'org')
      .leftJoinAndSelect('account.user', 'user');

    if (query.marketplace) {
      queryBuilder.andWhere('account.marketplace = :marketplace', {
        marketplace: query.marketplace,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('account.status = :status', {
        status: query.status,
      });
    }

    if (query.orgId) {
      queryBuilder.andWhere('account.orgId = :orgId', { orgId: query.orgId });
    }

    const accounts = await queryBuilder
      .orderBy('account.createdAt', 'DESC')
      .getMany();

    return {
      accounts: accounts.map((acc) => ({
        id: acc.id,
        orgId: acc.orgId,
        orgName: acc.organization?.name || 'Unknown',
        userId: acc.userId,
        userName: acc.user?.name || 'Unknown',
        marketplace: acc.marketplace,
        status: acc.status,
        remoteAccountId: acc.remoteAccountId,
        createdAt: acc.createdAt.toISOString(),
        updatedAt: acc.updatedAt.toISOString(),
      })),
    };
  }

  async disableMarketplaceAccount(
    accountId: string,
  ): Promise<{ success: boolean }> {
    const account = await this.marketplaceAccountRepo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Marketplace account not found');
    }

    account.status = 'revoked';
    await this.marketplaceAccountRepo.save(account);

    return { success: true };
  }

  async getSystemMetrics(): Promise<SystemMetricsResponse> {
    // Get queue stats
    const aiWorkflowWaiting = await this.aiWorkflowQueue.getWaitingCount();
    const aiWorkflowActive = await this.aiWorkflowQueue.getActiveCount();
    const aiWorkflowFailed = await this.aiWorkflowQueue.getFailedCount();

    const publishWaiting = await this.marketplacePublishQueue.getWaitingCount();
    const publishActive = await this.marketplacePublishQueue.getActiveCount();
    const publishFailed = await this.marketplacePublishQueue.getFailedCount();

    const syncWaiting = await this.marketplaceSyncQueue.getWaitingCount();
    const syncActive = await this.marketplaceSyncQueue.getActiveCount();
    const syncFailed = await this.marketplaceSyncQueue.getFailedCount();

    // Get entity counts
    const userCount = await this.userRepo.count();
    const orgCount = await this.orgRepo.count();
    const itemCount = await this.itemRepo.count();
    const metaListingCount = await this.metaListingRepo.count();
    const marketplaceAccountCount = await this.marketplaceAccountRepo.count();

    // Get recent workflow runs
    const recentWorkflowRuns = await this.workflowRunRepo.find({
      take: 10,
      order: { startedAt: 'DESC' },
    });

    return {
      queues: {
        aiWorkflow: {
          waiting: aiWorkflowWaiting,
          active: aiWorkflowActive,
          failed: aiWorkflowFailed,
        },
        marketplacePublish: {
          waiting: publishWaiting,
          active: publishActive,
          failed: publishFailed,
        },
        marketplaceSync: {
          waiting: syncWaiting,
          active: syncActive,
          failed: syncFailed,
        },
      },
      counts: {
        users: userCount,
        organizations: orgCount,
        items: itemCount,
        metaListings: metaListingCount,
        marketplaceAccounts: marketplaceAccountCount,
      },
      recentWorkflowRuns: recentWorkflowRuns.map((run) => ({
        id: run.id,
        type: run.type,
        status: run.status,
        itemId: run.itemId,
        orgId: run.orgId,
        startedAt: run.startedAt?.toISOString(),
        completedAt: run.completedAt?.toISOString(),
        error: run.error,
      })),
    };
  }
}

