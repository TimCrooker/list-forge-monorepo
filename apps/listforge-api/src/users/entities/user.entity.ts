import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { GlobalRole } from '@listforge/core-types';
import { UserOrganization } from '../../organizations/entities/user-organization.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ['user', 'staff', 'superadmin'],
    default: 'user',
  })
  globalRole: GlobalRole;

  @Column({ default: false })
  disabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @OneToMany(() => UserOrganization, (uo) => uo.user)
  memberships: UserOrganization[];
}

