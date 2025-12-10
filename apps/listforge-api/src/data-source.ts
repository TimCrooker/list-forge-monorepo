import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Build database connection options
function getDatabaseOptions(): DataSourceOptions {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    const isProduction = process.env.NODE_ENV === 'production';
    const sslEnabled = process.env.DB_SSL !== 'false' && (isProduction || process.env.DB_SSL === 'true');

    return {
      type: 'postgres',
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: sslEnabled
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
        : false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'listforge',
    password: process.env.DB_PASSWORD || 'listforge',
    database: process.env.DB_NAME || 'listforge_dev',
    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  };
}

export const AppDataSource = new DataSource({
  ...getDatabaseOptions(),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // Never synchronize in migrations
  logging: process.env.DB_LOGGING === 'true' ? true : ['error'],
});
