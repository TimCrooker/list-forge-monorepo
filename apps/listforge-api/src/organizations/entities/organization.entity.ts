import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserOrganization } from './user-organization.entity';
import {
  AutoApprovalSettings,
  DEFAULT_AUTO_APPROVAL_SETTINGS,
} from '@listforge/core-types';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended'],
    default: 'active',
  })
  status: string;

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_AUTO_APPROVAL_SETTINGS),
  })
  autoApprovalSettings: AutoApprovalSettings;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UserOrganization, (uo) => uo.organization)
  members: UserOrganization[];
}

