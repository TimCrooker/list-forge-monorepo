import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Check for required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    logger.warn(
      `Missing environment variables: ${missingVars.join(', ')}. ` +
      'The application may fail to start if database/Redis connections are not configured.'
    );
  }

  let app;
  try {
    app = await NestFactory.create(AppModule);
  } catch (error) {
    logger.error('Failed to create NestJS application:', error);
    // Log helpful error message
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
        logger.error(
          'Connection error detected. Please check:\n' +
          '1. DATABASE_URL or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD are set correctly\n' +
          '2. REDIS_URL or REDIS_HOST/REDIS_PORT are set correctly\n' +
          '3. Database and Redis services are accessible from this environment'
        );
      }
    }
    throw error;
  }

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global exception filter for standardized error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();

