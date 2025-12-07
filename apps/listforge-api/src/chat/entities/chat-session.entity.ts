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
 * ChatSession Entity - Phase 7 Slice 5
 *
 * Represents a chat session for a user conversing about a specific item.
 * Sessions persist across page refreshes and allow conversation history.
 */
@Entity('chat_sessions')
@Index(['itemId', 'userId'])
@Index(['organizationId', 'createdAt'])
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  organizationId: string;

  @OneToMany(() => ChatMessage, (message) => message.session, { cascade: true })
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
