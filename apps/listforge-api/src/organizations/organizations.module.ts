import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrganizationSettingsService } from './services/organization-settings.service';
import { SettingsAuditService } from './services/settings-audit.service';
import { SettingsVersionService } from './services/settings-version.service';
import { Organization } from './entities/organization.entity';
import { UserOrganization } from './entities/user-organization.entity';
import { SettingsVersion } from './entities/settings-version.entity';
import { SettingsAuditLog } from './entities/settings-audit-log.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { MarketplacesModule } from '../marketplaces/marketplaces.module';
import { TeamOrgGuard } from '../common/guards/team-org.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      UserOrganization,
      User,
      SettingsVersion,
      SettingsAuditLog,
    ]),
    UsersModule,
    forwardRef(() => MarketplacesModule), // For AutoPublishService
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationSettingsService,
    SettingsAuditService,
    SettingsVersionService,
    TeamOrgGuard,
  ],
  exports: [
    OrganizationsService,
    OrganizationSettingsService,
    SettingsAuditService,
    SettingsVersionService,
    TeamOrgGuard,
  ],
})
export class OrganizationsModule {}
