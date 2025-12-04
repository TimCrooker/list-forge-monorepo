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
} from '@listforge/api-types';
import { OrgStatus } from '@listforge/core-types';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { Item } from '../items/entities/item.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { MarketplaceAccount } from '../marketplaces/entities/marketplace-account.entity';
import { WorkflowRun } from '../ai-workflows/entities/workflow-run.entity';
import { QUEUE_AI_WORKFLOW, QUEUE_MARKETPLACE_PUBLISH } from '@listforge/queue-types';

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
      })),
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
      },
    };
  }

  async getSystemMetrics(): Promise<SystemMetricsResponse> {
    // Get queue stats
    const aiWorkflowWaiting = await this.aiWorkflowQueue.getWaitingCount();
    const aiWorkflowActive = await this.aiWorkflowQueue.getActiveCount();
    const aiWorkflowFailed = await this.aiWorkflowQueue.getFailedCount();

    const publishWaiting = await this.marketplacePublishQueue.getWaitingCount();
    const publishActive = await this.marketplacePublishQueue.getActiveCount();
    const publishFailed = await this.marketplacePublishQueue.getFailedCount();

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

