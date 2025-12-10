import { IsString, IsEnum, IsNotEmpty, Matches } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^ExponentPushToken\[.+\]$/, {
    message: 'Token must be a valid Expo Push Token',
  })
  token: string;

  @IsEnum(['ios', 'android'])
  platform: 'ios' | 'android';
}

export interface RegisterDeviceTokenResult {
  success: boolean;
  message?: string;
}
