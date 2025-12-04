import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MeResponse,
  SwitchOrgRequest,
  SwitchOrgResponse,
  UserDto,
  OrgDto,
} from '@listforge/api-types';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { OrgRole } from '@listforge/core-types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrgRepo: Repository<UserOrganization>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (user && !user.disabled && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }
    return null;
  }

  async login(req: LoginRequest): Promise<LoginResponse> {
    const user = await this.validateUser(req.email, req.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.loginWithUser(user);
  }

  async loginWithUser(user: User): Promise<LoginResponse> {
    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    // Get first org membership
    const membership = await this.userOrgRepo.findOne({
      where: { userId: user.id },
      relations: ['organization'],
    });

    const currentOrg = membership?.organization || null;

    const token = this.generateToken(user, currentOrg?.id || null);

    return {
      token,
      user: this.toUserDto(user),
      currentOrg: currentOrg ? this.toOrgDto(currentOrg, membership.role) : null,
    };
  }

  async register(req: RegisterRequest): Promise<RegisterResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists
      const existingUser = await this.userRepo.findOne({
        where: { email: req.email },
      });
      if (existingUser) {
        throw new ConflictException('An account with this email already exists');
      }

      // Create user
      const passwordHash = await bcrypt.hash(req.password, 10);
      const user = this.userRepo.create({
        email: req.email,
        name: req.name,
        passwordHash,
        globalRole: 'user',
      });
      const savedUser = await queryRunner.manager.save(user);

      // Create organization
      const org = this.orgRepo.create({
        name: req.orgName,
        status: 'active',
      });
      const savedOrg = await queryRunner.manager.save(org);

      // Create membership
      const membership = this.userOrgRepo.create({
        userId: savedUser.id,
        orgId: savedOrg.id,
        role: 'owner',
      });
      await queryRunner.manager.save(membership);

      await queryRunner.commitTransaction();

      const token = this.generateToken(savedUser, savedOrg.id);

      return {
        token,
        user: this.toUserDto(savedUser),
        org: this.toOrgDto(savedOrg, 'owner'),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async me(userId: string, currentOrgId: string | null): Promise<MeResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const memberships = await this.userOrgRepo.find({
      where: { userId },
      relations: ['organization'],
      order: { organization: { createdAt: 'ASC' } },
    });

    const orgs = memberships.map((m) =>
      this.toOrgDto(m.organization, m.role),
    );

    // Get current org from token, or fallback to first org
    const currentOrg = currentOrgId
      ? orgs.find((o) => o.id === currentOrgId) || orgs[0] || null
      : orgs[0] || null;

    return {
      user: this.toUserDto(user),
      orgs,
      currentOrg,
    };
  }

  async switchOrg(
    userId: string,
    req: SwitchOrgRequest,
  ): Promise<SwitchOrgResponse> {
    const membership = await this.userOrgRepo.findOne({
      where: {
        userId,
        orgId: req.orgId,
      },
      relations: ['organization'],
    });

    if (!membership) {
      throw new UnauthorizedException('Not a member of this organization');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const token = this.generateToken(user, req.orgId);

    return {
      token,
      org: this.toOrgDto(membership.organization, membership.role),
    };
  }

  private generateToken(user: User, orgId: string | null): string {
    const payload = {
      userId: user.id,
      globalRole: user.globalRole,
      currentOrgId: orgId,
    };
    return this.jwtService.sign(payload);
  }

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }

  private toOrgDto(org: Organization, role: OrgRole): OrgDto {
    return {
      id: org.id,
      name: org.name,
      status: org.status,
      createdAt: org.createdAt.toISOString(),
      role,
    };
  }
}

