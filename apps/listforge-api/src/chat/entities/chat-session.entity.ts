import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { ChatMessage } from './chat-message.entity';

/**
 * ChatSession Entity - General Purpose Chat
 *
 * Represents a chat session that can be:
 * - Item-specific (scoped to a single item)
 * - General conversation (not tied to any item)
 * - Dashboard-focused (inventory queries)
 * - Review queue-focused
 *
 * Sessions persist across page refreshes and maintain conversation history.
 */
@Entity('chat_sessions')
@Index(['itemId', 'userId'])
@Index(['organizationId', 'createdAt'])
@Index(['userId', 'organizationId', 'conversationType'])
@Index(['userId', 'organizationId', 'lastActivityAt'])
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  itemId: string | null;

  @ManyToOne(() => Item, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'itemId' })
  item: Item | null;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  organizationId: string;

  @Column('varchar', { length: 50, default: 'general' })
  conversationType: 'item_scoped' | 'general' | 'dashboard' | 'review_queue' | 'custom';

  @Column('varchar', { length: 200, nullable: true })
  title: string | null;

  @Column('jsonb', { nullable: true })
  contextSnapshot?: {
    pageType?: string;
    lastRoute?: string;
    createdFromPage?: string;
    metadata?: Record<string, unknown>;
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivityAt: Date;

  @OneToMany(() => ChatMessage, (message) => message.session, { cascade: true })
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
