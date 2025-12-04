import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_AI_WORKFLOW,
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}

