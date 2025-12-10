import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

/**
 * ChatMessage Entity - Phase 7 Slice 5
 *
 * Represents a single message in a chat session.
 * Messages can be from user, assistant, or system.
 */
@Entity('chat_messages')
@Index(['sessionId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sessionId: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @Column('varchar', { length: 20 })
  role: 'user' | 'assistant' | 'system';

  @Column('text')
  content: string;

  @Column('jsonb', { nullable: true })
  toolCalls?: Array<{
    tool: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;

  @Column('jsonb', { nullable: true })
  actions?: Array<{
    type: string;
    field?: string;
    value?: unknown;
    label: string;
    applied: boolean;
    description?: string;
    priority?: 'low' | 'normal' | 'high';
    autoExecute?: boolean;
    payload?: Record<string, unknown>;
  }>;

  @CreateDateColumn()
  createdAt: Date;
}
