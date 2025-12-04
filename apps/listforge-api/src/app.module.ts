import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { ItemsModule } from './items/items.module';
import { MetaListingsModule } from './meta-listings/meta-listings.module';
import { AiWorkflowsModule } from './ai-workflows/ai-workflows.module';
import { StorageModule } from './storage/storage.module';
import { MarketplacesModule } from './marketplaces/marketplaces.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USER || 'listforge',
            password: process.env.DB_PASSWORD || 'listforge',
            database: process.env.DB_NAME || 'listforge_dev',
          }),
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    CommonModule,
    StorageModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ItemsModule,
    MetaListingsModule,
    AiWorkflowsModule,
    MarketplacesModule,
    AdminModule,
  ],
})
export class AppModule {}

