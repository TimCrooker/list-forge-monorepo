import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * DeviceToken Entity
 *
 * Stores push notification device tokens for users.
 * Each user can have multiple device tokens (one per device).
 */
@Entity('device_tokens')
@Index(['userId', 'platform'])
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Expo Push Token (starts with ExponentPushToken[...]) */
  @Column({ unique: true })
  token: string;

  /** Platform: ios or android */
  @Column({
    type: 'enum',
    enum: ['ios', 'android'],
  })
  platform: 'ios' | 'android';

  /** Whether this token is still active */
  @Column({ default: true })
  active: boolean;

  /** Last time this token was used to send a notification */
  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
