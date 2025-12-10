import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationSettingsService } from './services/organization-settings.service';
import { Organization } from './entities/organization.entity';
import { UserOrganization } from './entities/user-organization.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, UserOrganization, User]),
    UsersModule,
    forwardRef(() => MarketplacesModule), // For AutoPublishService
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationSettingsService],
  exports: [OrganizationsService, OrganizationSettingsService],
})
export class OrganizationsModule {}

