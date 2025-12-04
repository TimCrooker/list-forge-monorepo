import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserOrganization } from './user-organization.entity';

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

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UserOrganization, (uo) => uo.organization)
  members: UserOrganization[];
}

