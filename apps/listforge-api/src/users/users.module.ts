import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PushNotificationService } from './services/push-notification.service';
import { User } from './entities/user.entity';
import { DeviceToken } from './entities/device-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, DeviceToken])],
  controllers: [UsersController],
  providers: [UsersService, PushNotificationService],
  exports: [UsersService, PushNotificationService],
})
export class UsersModule {}

