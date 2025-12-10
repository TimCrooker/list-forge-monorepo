import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { DeviceToken } from '../entities/device-token.entity';

/**
 * Push Notification Service
 *
 * Handles sending push notifications to mobile devices using Expo Push API.
 * Manages device tokens and handles errors/invalid tokens.
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private expo: Expo;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
  ) {
    this.expo = new Expo();
  }

  /**
   * Register a new device token for a user
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    // Check if token is valid
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Invalid Expo push token');
    }

    // Check if token already exists
    const existing = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (existing) {
      // Update existing token
      existing.userId = userId;
      existing.platform = platform;
      existing.active = true;
      existing.updatedAt = new Date();
      await this.deviceTokenRepository.save(existing);
    } else {
      // Create new token
      const deviceToken = this.deviceTokenRepository.create({
        userId,
        token,
        platform,
        active: true,
      });
      await this.deviceTokenRepository.save(deviceToken);
    }

    this.logger.log(`Registered device token for user ${userId}`);
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      sound?: string;
      badge?: number;
      channelId?: string;
    },
  ): Promise<void> {
    // Get all active tokens for user
    const tokens = await this.deviceTokenRepository.find({
      where: { userId, active: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No active device tokens for user ${userId}`);
      return;
    }

    // Create push messages
    const messages: ExpoPushMessage[] = tokens.map((deviceToken) => ({
      to: deviceToken.token,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      badge: notification.badge,
      channelId: notification.channelId || 'default',
      priority: 'high',
    }));

    // Send notifications in chunks
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        await this.handleTickets(tickets, tokens);
      } catch (error) {
        this.logger.error('Error sending push notifications:', error);
      }
    }
  }

  /**
   * Send research completion notification
   */
  async sendResearchCompletedNotification(
    userId: string,
    itemId: string,
    itemTitle: string,
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Research Complete',
      body: `${itemTitle} has been researched and is ready for review!`,
      data: {
        type: 'research_completed',
        itemId,
      },
      channelId: 'research',
    });
  }

  /**
   * Handle push notification tickets and mark invalid tokens
   */
  private async handleTickets(
    tickets: ExpoPushTicket[],
    tokens: DeviceToken[],
  ): Promise<void> {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = tokens[i];

      if (ticket.status === 'error') {
        this.logger.error(
          `Error sending notification to ${token.token}: ${ticket.message}`,
        );

        // Mark token as inactive if it's invalid
        if (
          ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials'
        ) {
          token.active = false;
          await this.deviceTokenRepository.save(token);
          this.logger.log(`Marked token ${token.id} as inactive`);
        }
      } else {
        // Update last used timestamp
        token.lastUsedAt = new Date();
        await this.deviceTokenRepository.save(token);
      }
    }
  }

  /**
   * Remove device token (e.g., on logout)
   */
  async removeDeviceToken(token: string): Promise<void> {
    await this.deviceTokenRepository.delete({ token });
    this.logger.log(`Removed device token: ${token}`);
  }

  /**
   * Remove all device tokens for a user
   */
  async removeUserDeviceTokens(userId: string): Promise<void> {
    await this.deviceTokenRepository.delete({ userId });
    this.logger.log(`Removed all device tokens for user ${userId}`);
  }

  /**
   * Clean up old inactive tokens (run periodically)
   */
  async cleanupInactiveTokens(daysOld: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deviceTokenRepository
      .createQueryBuilder()
      .delete()
      .where('active = :active', { active: false })
      .andWhere('updatedAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(
      `Cleaned up ${result.affected || 0} inactive device tokens`,
    );
  }
}
