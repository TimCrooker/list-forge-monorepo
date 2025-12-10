import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { GeneralChatController } from './general-chat.controller';
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
 * Chat Module - General Purpose Chat
 *
 * Module for managing chat sessions and messages.
 * Supports both item-specific and general-purpose conversations.
 * Updated to include GeneralChatController for /chat REST API endpoints.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, Item, User]),
    JwtModule.register({}),
    ConfigModule,
    forwardRef(() => AiWorkflowsModule), // Handle circular dependency with AiWorkflowsModule
    EventsModule,
    forwardRef(() => ItemsModule), // Handle circular dependency with ItemsModule
  ],
  controllers: [ChatController, GeneralChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway], // Export ChatGateway for ResearchGraphService
})
export class ChatModule {}
