import { Injectable, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection()
    @Optional()
    private dbConnection?: Connection,
  ) {}

  async check(): Promise<{
    status: 'ok' | 'degraded';
    timestamp: string;
    services: {
      database: { status: 'ok' | 'error' | 'not_configured'; message?: string };
    };
  }> {
    const services = {
      database: await this.checkDatabase(),
    };

    // If any critical service is down, mark overall status as degraded
    const allHealthy = services.database.status === 'ok';

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'error' | 'not_configured';
    message?: string;
  }> {
    if (!this.dbConnection) {
      return { status: 'not_configured', message: 'Database not configured' };
    }

    try {
      await this.dbConnection.query('SELECT 1');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }
}
