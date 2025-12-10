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
  AutoPublishSettings,
  DEFAULT_AUTO_PUBLISH_SETTINGS,
  WorkflowSettings,
  DEFAULT_WORKFLOW_SETTINGS,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  TeamSettings,
  DEFAULT_TEAM_SETTINGS,
  InventorySettings,
  DEFAULT_INVENTORY_SETTINGS,
  MarketplaceDefaultSettings,
  DEFAULT_MARKETPLACE_SETTINGS,
  BillingSettings,
  DEFAULT_BILLING_SETTINGS,
  SecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
} from '@listforge/core-types';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['personal', 'team'],
    default: 'team',
  })
  type: 'personal' | 'team';

  @Column({
    type: 'enum',
    enum: ['active', 'suspended'],
    default: 'active',
  })
  status: string;

  // ============================================================================
  // Auto Settings (Legacy)
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_AUTO_APPROVAL_SETTINGS),
  })
  autoApprovalSettings: AutoApprovalSettings;

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_AUTO_PUBLISH_SETTINGS),
  })
  autoPublishSettings: AutoPublishSettings;

  // ============================================================================
  // Workflow Settings
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_WORKFLOW_SETTINGS),
  })
  workflowSettings: WorkflowSettings;

  // ============================================================================
  // Notification Settings
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS),
  })
  notificationSettings: NotificationSettings;

  // ============================================================================
  // Team Settings
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_TEAM_SETTINGS),
  })
  teamSettings: TeamSettings;

  // ============================================================================
  // Inventory Settings
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_INVENTORY_SETTINGS),
  })
  inventorySettings: InventorySettings;

  // ============================================================================
  // Marketplace Default Settings
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_MARKETPLACE_SETTINGS),
  })
  marketplaceDefaultSettings: MarketplaceDefaultSettings;

  // ============================================================================
  // Billing Settings
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_BILLING_SETTINGS),
  })
  billingSettings: BillingSettings;

  // ============================================================================
  // Security Settings
  // ============================================================================

  @Column({
    type: 'jsonb',
    default: JSON.stringify(DEFAULT_SECURITY_SETTINGS),
  })
  securitySettings: SecuritySettings;

  // ============================================================================
  // Timestamps & Relations
  // ============================================================================

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UserOrganization, (uo) => uo.organization)
  members: UserOrganization[];
}

