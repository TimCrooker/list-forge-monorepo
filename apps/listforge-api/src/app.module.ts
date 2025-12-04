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
import { HealthModule } from './health/health.module';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

/**
 * Parse Redis URL into connection options
 * Supports formats:
 *   redis://host:port
 *   redis://:password@host:port
 *   redis://password@host:port
 *   redis://host:port/db
 *   redis://:password@host:port/db
 */
function parseRedisUrl(url: string): {
  host: string;
  port: number;
  password?: string;
  db?: number;
} {
  try {
    const parsedUrl = new URL(url);
    // Redis URLs can have password in username field (redis://password@host) or password field (redis://:password@host)
    const password = parsedUrl.password || parsedUrl.username || undefined;
    const db = parsedUrl.pathname && parsedUrl.pathname.length > 1
      ? parseInt(parsedUrl.pathname.slice(1), 10)
      : undefined;

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 6379,
      password,
      db,
    };
  } catch {
    // If URL parsing fails, return defaults
    return {
      host: 'localhost',
      port: 6379,
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? (() => {
            // Parse DATABASE_URL to extract connection params
            const url = new URL(process.env.DATABASE_URL);
            const isProduction = process.env.NODE_ENV === 'production';
            const sslEnabled = process.env.DB_SSL !== 'false' && (isProduction || process.env.DB_SSL === 'true');

            return {
              host: url.hostname,
              port: parseInt(url.port || '5432', 10),
              username: url.username,
              password: url.password,
              database: url.pathname.slice(1), // Remove leading '/'
              // SSL configuration - required for Supabase and most cloud providers
              ssl: sslEnabled
                ? {
                    // For Supabase and similar services, we may need to accept their certificates
                    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
                  }
                : false,
            };
          })()
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USER || 'listforge',
            password: process.env.DB_PASSWORD || 'listforge',
            database: process.env.DB_NAME || 'listforge_dev',
            ssl: process.env.DB_SSL === 'true'
              ? {
                  rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
                }
              : false,
          }),
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      // Retry connection on failure (useful for serverless cold starts)
      retryAttempts: 3,
      retryDelay: 3000,
      // Don't fail immediately if connection fails - let health endpoint handle it
      keepConnectionAlive: true,
    }),
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? parseRedisUrl(process.env.REDIS_URL)
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
          },
    }),
    CommonModule,
    StorageModule,
    HealthModule,
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

