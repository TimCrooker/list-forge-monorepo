import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { OrgGuard } from './guards/org.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserOrganization])],
  providers: [OrgGuard, JwtAuthGuard],
  exports: [OrgGuard, JwtAuthGuard, TypeOrmModule],
})
export class CommonModule {}

