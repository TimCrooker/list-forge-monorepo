import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { Item } from '../items/entities/item.entity';
import { MetaListing } from '../meta-listings/entities/meta-listing.entity';
import { MarketplaceAccount } from '../marketplaces/entities/marketplace-account.entity';
import { WorkflowRun } from '../ai-workflows/entities/workflow-run.entity';
import { QUEUE_AI_WORKFLOW, QUEUE_MARKETPLACE_PUBLISH, QUEUE_MARKETPLACE_SYNC } from '@listforge/queue-types';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      UserOrganization,
      Item,
      MetaListing,
      MarketplaceAccount,
      WorkflowRun,
    ]),
    BullModule.registerQueue(
      { name: QUEUE_AI_WORKFLOW },
      { name: QUEUE_MARKETPLACE_PUBLISH },
      { name: QUEUE_MARKETPLACE_SYNC },
    ),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

