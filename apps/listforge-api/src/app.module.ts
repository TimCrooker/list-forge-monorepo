import { Module, Logger } from '@nestjs/common';
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

const logger = new Logger('AppModule');

/**
 * Parse Redis URL into connection options
 */
function parseRedisUrl(url: string): {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: object;
} {
  try {
    const parsedUrl = new URL(url);
    const password = parsedUrl.password || parsedUrl.username || undefined;
    const db = parsedUrl.pathname && parsedUrl.pathname.length > 1
      ? parseInt(parsedUrl.pathname.slice(1), 10)
      : undefined;

    // Check if TLS is required (rediss:// protocol or upstash URLs)
    const useTls = parsedUrl.protocol === 'rediss:' || parsedUrl.hostname.includes('upstash');

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : (useTls ? 6379 : 6379),
      password,
      db,
      ...(useTls ? { tls: {} } : {}),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

// Get Redis config - required for BullMQ
function getRedisConfig() {
  if (process.env.REDIS_URL) {
    return parseRedisUrl(process.env.REDIS_URL);
  }
  if (process.env.REDIS_HOST) {
    return {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
    };
  }
  throw new Error('Redis configuration required. Set REDIS_URL or REDIS_HOST environment variable.');
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? (() => {
            const url = new URL(process.env.DATABASE_URL);
            const isProduction = process.env.NODE_ENV === 'production';
            const sslEnabled = process.env.DB_SSL !== 'false' && (isProduction || process.env.DB_SSL === 'true');

            return {
              host: url.hostname,
              port: parseInt(url.port || '5432', 10),
              username: url.username,
              password: url.password,
              database: url.pathname.slice(1),
              ssl: sslEnabled
                ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
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
              ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
              : false,
          }),
      autoLoadEntities: true,
      synchronize: true,
      logging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
      retryAttempts: 3,
      retryDelay: 3000,
      keepConnectionAlive: true,
    }),
    BullModule.forRoot({
      connection: getRedisConfig(),
    }),
    ItemsModule,
    MetaListingsModule,
    AiWorkflowsModule,
    MarketplacesModule,
    AdminModule,
    CommonModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
