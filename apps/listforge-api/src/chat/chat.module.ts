import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { AiWorkflowsModule } from '../ai-workflows/ai-workflows.module';
import { ItemsModule } from '../items/items.module';
import { EventsModule } from '../events/events.module';

/**
 * Chat Module - Phase 7 Slice 5 + Slice 6
 *
 * Module for managing chat sessions and messages for item Q&A.
 * Phase 7 Slice 6: Added ItemsModule for action handling.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, Item, User]),
    JwtModule.register({}),
    ConfigModule,
    AiWorkflowsModule,
    EventsModule,
    forwardRef(() => ItemsModule), // Use forwardRef to handle circular dependency
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway], // Export ChatGateway for ResearchGraphService
})
export class ChatModule {}
