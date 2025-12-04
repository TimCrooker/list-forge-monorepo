import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UpdateUserRequest,
  UpdateUserResponse,
  UserDto,
} from '@listforge/api-types';
import { User } from './entities/user.entity';
import { RequestContext } from '../common/interfaces/request-context.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    ctx: RequestContext,
    userId: string,
    data: UpdateUserRequest,
  ): Promise<UpdateUserResponse> {
    // Users can only update themselves unless they're admin
    if (userId !== ctx.userId && ctx.globalRole === 'user') {
      throw new ForbiddenException('Cannot update other users');
    }

    const user = await this.findOne(userId);

    if (data.name) {
      user.name = data.name;
    }
    if (data.email) {
      // Check if email is already taken
      const existing = await this.userRepo.findOne({
        where: { email: data.email },
      });
      if (existing && existing.id !== userId) {
        throw new ForbiddenException('Email already in use');
      }
      user.email = data.email;
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

  toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }
}

