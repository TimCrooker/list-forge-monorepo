import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  UserDto,
} from '@listforge/api-types';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrgRepo: Repository<UserOrganization>,
  ) {}

  async listUsers(): Promise<{ users: UserDto[] }> {
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

  async listOrgs(): Promise<{ orgs: any[] }> {
    const orgs = await this.orgRepo.find({
      order: { createdAt: 'DESC' },
    });

    const orgsWithStats = await Promise.all(
      orgs.map(async (org) => {
        const memberCount = await this.userOrgRepo.count({
          where: { orgId: org.id },
        });
        return {
          id: org.id,
          name: org.name,
          status: org.status,
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
      throw new Error('User not found');
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
}

