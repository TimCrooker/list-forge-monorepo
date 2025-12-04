import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrgRole } from '@listforge/core-types';
import { User } from '../../users/entities/user.entity';
import { Organization } from './organization.entity';

@Entity('user_organizations')
export class UserOrganization {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  orgId: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'admin', 'member'],
  })
  role: OrgRole;

  @ManyToOne(() => User, (user) => user.memberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Organization, (org) => org.members)
  @JoinColumn({ name: 'orgId' })
  organization: Organization;
}

