import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection()
    private dbConnection: Connection,
    @InjectQueue(QUEUE_AI_WORKFLOW)
    private aiWorkflowQueue: Queue,
  ) {}

  async check(): Promise<{
    status: 'ok' | 'degraded';
    timestamp: string;
    services: {
      database: { status: 'ok' | 'error'; message?: string };
      redis: { status: 'ok' | 'error'; message?: string };
    };
  }> {
    const services = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };

    // If any service is down, mark overall status as degraded
    const allHealthy = Object.values(services).every(
      (service) => service.status === 'ok',
    );

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
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

  private async checkRedis(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      // Try to get queue count - this will fail if Redis is down
      // This is a simple operation that verifies Redis connectivity
      await this.aiWorkflowQueue.getWaitingCount();
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }
}

