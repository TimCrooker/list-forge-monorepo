import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
// Note: Requires @langchain/langgraph-checkpoint-postgres package
// Install with: npm install @langchain/langgraph-checkpoint-postgres
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

/**
 * Postgres Checkpointer Service
 * Phase 7 Slice 4
 *
 * Provides PostgresSaver instance for LangGraph checkpointing.
 * Uses the app's TypeORM database connection.
 */
@Injectable()
export class PostgresCheckpointerService implements OnModuleInit {
  private readonly logger = new Logger(PostgresCheckpointerService.name);
  private checkpointer: PostgresSaver | null = null;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      // Get connection string from TypeORM DataSource
      const connectionOptions = this.dataSource.options;

      // Build connection string for PostgresSaver
      const connectionString = this.buildConnectionString(connectionOptions);

      // Initialize PostgresSaver
      this.checkpointer = await PostgresSaver.fromConnString(connectionString);

      // Ensure checkpoint tables exist
      await this.checkpointer.setup();

      this.logger.log('PostgresSaver checkpointer initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PostgresSaver checkpointer', error);
      throw error;
    }
  }

  /**
   * Get the checkpointer instance
   */
  getCheckpointer(): PostgresSaver {
    if (!this.checkpointer) {
      throw new Error('PostgresSaver checkpointer not initialized');
    }
    return this.checkpointer;
  }

  /**
   * Clean up old checkpoints for completed or cancelled runs
   * Should be called periodically (e.g., via cron job)
   */
  async cleanupOldCheckpoints(olderThanDays = 7): Promise<number> {
    if (!this.checkpointer) {
      this.logger.warn('Checkpointer not initialized, skipping cleanup');
      return 0;
    }

    try {
      // Get connection from checkpointer
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Direct SQL cleanup since PostgresSaver doesn't expose a cleanup method
      // Note: This queries the checkpoint tables created by PostgresSaver
      const result = await this.dataSource.query(
        `
        DELETE FROM checkpoints
        WHERE thread_id IN (
          SELECT id::text FROM item_research_runs
          WHERE (status = 'success' OR status = 'cancelled')
          AND completed_at < $1
        )
        `,
        [cutoffDate],
      );

      const deletedCount = result?.affectedRows || result?.rowCount || 0;
      this.logger.log(`Cleaned up ${deletedCount} old checkpoints`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to clean up old checkpoints', error);
      return 0;
    }
  }

  /**
   * Build PostgreSQL connection string from TypeORM options
   */
  private buildConnectionString(options: any): string {
    // If DATABASE_URL is set, use it directly
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    // Otherwise build from TypeORM options
    const host = options.host || 'localhost';
    const port = options.port || 5432;
    const username = options.username || 'postgres';
    const password = options.password || '';
    const database = options.database || 'listforge_dev';

    // URL encode password to handle special characters
    const encodedPassword = encodeURIComponent(password);

    return `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;
  }
}
