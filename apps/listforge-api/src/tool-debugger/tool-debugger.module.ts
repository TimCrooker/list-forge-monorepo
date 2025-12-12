import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_AI_WORKFLOW } from '@listforge/queue-types';
import { Item } from '../items/entities/item.entity';
import { ResearchModule } from '../research/research.module';
import { AiWorkflowsModule } from '../ai-workflows/ai-workflows.module';
import { ToolDebuggerController } from './tool-debugger.controller';
import { ToolDebuggerService } from './tool-debugger.service';
import { ToolDebuggerAuditLog } from './entities/tool-debugger-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ToolDebuggerAuditLog]),
    BullModule.registerQueue({ name: QUEUE_AI_WORKFLOW }),
    ResearchModule,
    forwardRef(() => AiWorkflowsModule),
  ],
  controllers: [ToolDebuggerController],
  providers: [ToolDebuggerService],
})
export class ToolDebuggerModule {}
